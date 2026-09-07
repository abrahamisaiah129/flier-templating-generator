import { NextRequest, NextResponse } from "next/server";
import { extractDetailsLocally, formatNairaFull } from "../../../utils/extractor";

async function fetchUrlContent(targetUrl: string): Promise<string> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(targetUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });
    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`HTTP status ${response.status}`);
    }

    const html = await response.text();

    // Extract meta title and descriptions
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const metaDescMatch = html.match(
      /<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i
    );
    const ogDescMatch = html.match(
      /<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i
    );
    const ogTitleMatch = html.match(
      /<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i
    );

    const title = ogTitleMatch?.[1] || titleMatch?.[1] || "";
    const description = ogDescMatch?.[1] || metaDescMatch?.[1] || "";

    // Strip scripts, styles, SVG, comments, navigation, footer tags
    const cleanHtml = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
      .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, "")
      .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, "")
      .replace(/<!--[\s\S]*?-->/g, "")
      .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, "")
      .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, "");

    // Extract text from paragraph and header tags
    const bodyText = cleanHtml
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|h1|h2|h3|h4|li|tr)>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'")
      .replace(/\s+/g, " ")
      .trim();

    return `Page Title: ${title}\nMeta Description: ${description}\n\nPage Content:\n${bodyText.slice(0, 4000)}`;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Fetch failed";
    console.warn("Could not fetch page URL directly:", msg);
    return `URL: ${targetUrl}`;
  }
}

function generateLocalBrief(rawText: string): { briefs: string[]; summary: string } {
  const extracted = extractDetailsLocally(rawText);

  const titleParts: string[] = [];
  if (extracted.bedrooms) titleParts.push(`${extracted.bedrooms} Bedroom`);
  if (extracted.propertyType && extracted.propertyType !== "—") {
    titleParts.push(extracted.propertyType);
  }
  if (extracted.location && extracted.location !== "—") {
    titleParts.push(`in ${extracted.location}`);
  }

  const mainTitle = titleParts.length > 0 ? titleParts.join(" ") : "Luxury Property";
  const priceStr = formatNairaFull(extracted.priceNGN);
  const docStr = extracted.documentation !== "—" ? extracted.documentation : null;
  const featuresStr =
    extracted.features && extracted.features.length > 0
      ? extracted.features.slice(0, 4).join(", ")
      : null;

  const briefParts = [
    mainTitle,
    priceStr !== "—" ? priceStr : null,
    docStr,
    featuresStr,
  ].filter(Boolean);

  const brief = briefParts.join(". ") + ".";
  return {
    briefs: [brief],
    summary: mainTitle,
  };
}

export async function POST(req: NextRequest) {
  try {
    const { writeupText, url, userApiKey } = await req.json();

    let contentToProcess = (writeupText || "").trim();

    // If URL is provided, fetch or enrich the content
    if (url && url.trim().length > 0) {
      const urlText = await fetchUrlContent(url.trim());
      contentToProcess = contentToProcess
        ? `${contentToProcess}\n\n[From Listing URL]:\n${urlText}`
        : urlText;
    }

    if (!contentToProcess || contentToProcess.length < 5) {
      return NextResponse.json(
        { error: "Please provide a property write-up or listing URL." },
        { status: 400 }
      );
    }

    const openRouterApiKey =
      userApiKey ||
      process.env.OPENROUTER_API_KEY ||
      process.env.OPENAI_API_KEY;

    if (openRouterApiKey) {
      try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${openRouterApiKey}`,
            "HTTP-Referer": "https://propkit.vercel.app",
            "X-Title": "PropKit Property Brief Creator",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "openai/gpt-4o",
            messages: [
              {
                role: "system",
                content: `You are an expert real estate copywriter specializing in Nigerian property listings (Lagos: Lekki, Ikoyi, Victoria Island, Banana Island, Ikeja; Abuja: Maitama, Guzape, etc.).
Your job is to read raw property write-ups, brochures, WhatsApp broadcasts, or webpage descriptions, and synthesize concise, professional property briefs for marketing flyers.

Rules:
1. Each brief must strictly follow this clean format:
   "[Bedrooms] bedroom [Property Type] in [Location]. [Price]. [Documentation]. [Key Features: e.g. swimming pool, fitted kitchen, BQ, cinema, 24hr power, etc.]"
   Example: "4 bedroom semi-detached duplex in Ikate, Lekki. ₦250M. Governor's Consent. Swimming pool, fitted kitchen, BQ."
2. If the document describes multiple distinct property units (e.g. Option 1: 4 bed terrace, Option 2: 5 bed fully detached), synthesize up to 3 separate briefs.
3. If it is only 1 property, return exactly 1 brief in the "briefs" array.
4. Remove agent phone numbers, broker names, or boilerplate disclaimers from the brief.
5. Return a JSON object with:
   - "briefs": array of 1 to 3 synthesized brief strings.
   - "summary": punchy 5-10 word title (e.g. "4 Bedroom Semi-Detached Duplex in Ikate, Lekki").
Return ONLY valid raw JSON with NO markdown code fences.`,
              },
              {
                role: "user",
                content: contentToProcess.slice(0, 6000),
              },
            ],
            temperature: 0.2,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          let rawContent = data.choices?.[0]?.message?.content || "";
          rawContent = rawContent
            .replace(/^```[a-zA-Z]*\r?\n?/i, "")
            .replace(/\r?\n?```$/i, "")
            .trim();

          try {
            const parsed = JSON.parse(rawContent);
            if (parsed && Array.isArray(parsed.briefs) && parsed.briefs.length > 0) {
              const cleanedBriefs = parsed.briefs
                .map((b: unknown) => (typeof b === "string" ? b.trim() : ""))
                .filter((b: string) => b.length > 0);

              if (cleanedBriefs.length > 0) {
                return NextResponse.json({
                  briefs: cleanedBriefs.slice(0, 3),
                  summary: parsed.summary || "Synthesized Property Brief",
                  source: "openrouter" as const,
                });
              }
            }
          } catch {
            // If response wasn't JSON, treat the text as a direct brief
            if (rawContent.length > 10) {
              return NextResponse.json({
                briefs: [rawContent],
                summary: "Synthesized Property Brief",
                source: "openrouter" as const,
              });
            }
          }
        } else {
          console.warn("OpenRouter API returned non-OK:", response.status);
        }
      } catch (aiErr: unknown) {
        console.warn("OpenRouter brief synthesis failed, falling back to local extractor:", aiErr);
      }
    }

    // Heuristic Local Fallback
    const localResult = generateLocalBrief(contentToProcess);
    return NextResponse.json({
      briefs: localResult.briefs,
      summary: localResult.summary,
      source: "local" as const,
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Internal server error";
    console.error("Error in extract-brief POST:", errorMsg);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
