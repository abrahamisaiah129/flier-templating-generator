import { NextRequest, NextResponse } from "next/server";

function cleanSvgAttributes(svg: string, isReact: boolean, useCurrentColor: boolean): string {
  let res = svg
    // Strip XML declarations and DOCTYPES
    .replace(/<\?xml[\s\S]*?\?>/gi, "")
    .replace(/<!DOCTYPE[\s\S]*?>/gi, "")
    // Strip comments
    .replace(/<!--[\s\S]*?-->/g, "")
    // Strip editor metadata namespaces
    .replace(/xmlns:sketch="[^"]*"/gi, "")
    .replace(/sketch:type="[^"]*"/gi, "")
    .replace(/xmlns:inkscape="[^"]*"/gi, "")
    .replace(/inkscape:[a-z-]+="[^"]*"/gi, "")
    .replace(/sodipodi:[a-z-]+="[^"]*"/gi, "")
    .replace(/xmlns:serif="[^"]*"/gi, "")
    .replace(/serif:id="[^"]*"/gi, "");

  if (useCurrentColor) {
    res = res.replace(/fill="(?!none|url)[^"]*"/gi, 'fill="currentColor"');
    res = res.replace(/stroke="(?!none|url)[^"]*"/gi, 'stroke="currentColor"');
  }

  if (isReact) {
    const attributeMap: Record<string, string> = {
      "class": "className",
      "stroke-width": "strokeWidth",
      "stroke-linecap": "strokeLinecap",
      "stroke-linejoin": "strokeLinejoin",
      "stroke-miterlimit": "strokeMiterlimit",
      "stroke-dasharray": "strokeDasharray",
      "stroke-dashoffset": "strokeDashoffset",
      "stroke-opacity": "strokeOpacity",
      "fill-rule": "fillRule",
      "clip-rule": "clipRule",
      "clip-path": "clipPath",
      "fill-opacity": "fillOpacity",
      "stop-color": "stopColor",
      "stop-opacity": "stopOpacity",
      "font-family": "fontFamily",
      "font-size": "fontSize",
      "font-weight": "fontWeight",
      "letter-spacing": "letterSpacing",
      "text-anchor": "textAnchor",
      "color-interpolation-filters": "colorInterpolationFilters",
      "flood-opacity": "floodOpacity",
      "flood-color": "floodColor",
      "viewbox": "viewBox",
      "xlink:href": "xlinkHref",
    };

    for (const [kebab, camel] of Object.entries(attributeMap)) {
      const regex = new RegExp(`\\b${kebab}=`, "gi");
      res = res.replace(regex, `${camel}=`);
    }
  }

  return res.trim();
}

function convertSvgLocally(
  rawSvg: string,
  framework: string,
  componentName: string,
  useCurrentColor: boolean
): string {
  const isReact = /React|Next/i.test(framework);
  const cleanedSvg = cleanSvgAttributes(rawSvg, isReact, useCurrentColor);

  const safeName = componentName.replace(/[^a-zA-Z0-9_]/g, "") || "SvgTemplate";

  if (/React.*TSX/i.test(framework) || framework === "React (TSX)") {
    const withProps = cleanedSvg.replace(
      /<svg\b([^>]*)>/i,
      `<svg $1 {...props}>`
    );
    return `import React, { SVGProps } from "react";

export function ${safeName}(props: SVGProps<SVGSVGElement>) {
  return (
    ${withProps}
  );
}

export default ${safeName};`;
  }

  if (/React.*JSX/i.test(framework) || framework === "React (JSX)") {
    const withProps = cleanedSvg.replace(
      /<svg\b([^>]*)>/i,
      `<svg $1 {...props}>`
    );
    return `import React from "react";

export function ${safeName}(props) {
  return (
    ${withProps}
  );
}

export default ${safeName};`;
  }

  if (/Next/i.test(framework)) {
    const withProps = cleanedSvg.replace(
      /<svg\b([^>]*)>/i,
      `<svg $1 {...props}>`
    );
    return `"use client";

import React, { SVGProps } from "react";

export const ${safeName} = (props: SVGProps<SVGSVGElement>) => (
  ${withProps}
);

export default ${safeName};`;
  }

  if (/React Native/i.test(framework)) {
    let nativeSvg = cleanedSvg
      .replace(/<svg\b/gi, "<Svg")
      .replace(/<\/svg>/gi, "</Svg>")
      .replace(/<path\b/gi, "<Path")
      .replace(/<\/path>/gi, "</Path>")
      .replace(/<g\b/gi, "<G")
      .replace(/<\/g>/gi, "</G>")
      .replace(/<rect\b/gi, "<Rect")
      .replace(/<\/rect>/gi, "</Rect>")
      .replace(/<circle\b/gi, "<Circle")
      .replace(/<\/circle>/gi, "</Circle>")
      .replace(/<defs\b/gi, "<Defs")
      .replace(/<\/defs>/gi, "</Defs>")
      .replace(/<line\b/gi, "<Line")
      .replace(/<\/line>/gi, "</Line>");

    nativeSvg = nativeSvg.replace(/<Svg\b([^>]*)>/i, `<Svg $1 {...props}>`);

    return `import React from "react";
import Svg, { Path, G, Rect, Circle, Defs, Line, SvgProps } from "react-native-svg";

export function ${safeName}(props: SvgProps) {
  return (
    ${nativeSvg}
  );
}

export default ${safeName};`;
  }

  if (/Vue/i.test(framework)) {
    return `<template>
  ${cleanedSvg}
</template>

<script setup lang="ts">
// ${safeName} Component
</script>`;
  }

  if (/Svelte/i.test(framework)) {
    return `<!-- ${safeName}.svelte -->
<script lang="ts">
  let { size = 24, class: className = "", ...restProps } = $props();
</script>

${cleanedSvg}`;
  }

  // Raw Clean SVG
  return cleanedSvg;
}

function extractColorsFromSvg(svg: string): { themeColor: string; accentColor: string } {
  const hexMatches = svg.match(/#(?:[0-9a-fA-F]{3}){1,2}\b/g) || [];
  const uniqueHex = Array.from(new Set(hexMatches.map((h) => h.toUpperCase())))
    .filter((h) => h !== "#FFFFFF" && h !== "#000000" && h !== "#FFF" && h !== "#000" && !h.startsWith("#EEE") && !h.startsWith("#DDD"));

  const themeColor = uniqueHex[0] || "#1B494E";
  const accentColor = uniqueHex[1] || (themeColor === "#F26522" ? "#0B2854" : "#F26522");
  return { themeColor, accentColor };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      svgCode,
      framework = "React (TSX)",
      componentName = "PropertyTemplateIcon",
      useCurrentColor = false,
      apiKey: userApiKey,
    } = body;

    if (!svgCode || typeof svgCode !== "string" || !svgCode.trim()) {
      return NextResponse.json(
        { error: "Please provide valid SVG code." },
        { status: 400 }
      );
    }

    const { themeColor: defaultTheme, accentColor: defaultAccent } = extractColorsFromSvg(svgCode);

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
            "X-Title": "PropKit SVG Template Generator",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "openai/gpt-4o",
            messages: [
              {
                role: "system",
                content: `You are an expert utility that turns raw SVG strings into a clean real-estate flyer template component.
The user is non-technical, so you create a clean reusable flyer template.
Strip editor junk (Figma/Sketch/Inkscape metadata, XML declarations, doctypes, comments, sodipodi).
Return a JSON object with:
- "template": clean React component code
- "svgMarkup": clean raw SVG markup with xmlns attributes preserved
- "templateName": clean luxury property template name (e.g. "${componentName || "Signature Luxury Flyer"}")
- "themeColor": dominant hex color (e.g. "${defaultTheme}")
- "accentColor": secondary vibrant hex color (e.g. "${defaultAccent}")
- "badge": short style tag (e.g. "Custom Style", "Minimalist", "Editorial")
- "description": 1-line description of the flyer layout style
Return ONLY valid raw JSON with NO markdown code fences.`,
              },
              {
                role: "user",
                content: svgCode,
              },
            ],
            temperature: 0.1,
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
            if (parsed && (parsed.template || parsed.svgMarkup)) {
              return NextResponse.json({
                template: parsed.template || convertSvgLocally(parsed.svgMarkup || svgCode, framework, componentName, useCurrentColor),
                svgMarkup: parsed.svgMarkup || cleanSvgAttributes(svgCode, false, false),
                templateName: parsed.templateName || componentName || "Custom Luxury Flyer",
                themeColor: parsed.themeColor || defaultTheme,
                accentColor: parsed.accentColor || defaultAccent,
                badge: parsed.badge || "Custom Template",
                description: parsed.description || "Custom SVG flyer template generated and added to library",
                source: "openrouter" as const,
              });
            }
          } catch {
            // Content wasn't JSON, assume it was direct template code
            if (rawContent) {
              return NextResponse.json({
                template: rawContent,
                svgMarkup: cleanSvgAttributes(svgCode, false, false),
                templateName: componentName || "Custom Luxury Flyer",
                themeColor: defaultTheme,
                accentColor: defaultAccent,
                badge: "Custom Template",
                description: "Custom SVG flyer template generated and added to library",
                source: "openrouter" as const,
              });
            }
          }
        } else {
          const errorData = await response.json().catch(() => null);
          console.warn("OpenRouter API returned non-OK status:", response.status, errorData);
        }
      } catch (aiError: unknown) {
        const errorMsg = aiError instanceof Error ? aiError.message : "OpenRouter call failed";
        console.warn("OpenRouter API call failed, using local converter fallback:", errorMsg);
      }
    }

    // High quality local fallback converter
    const template = convertSvgLocally(
      svgCode,
      framework,
      componentName,
      useCurrentColor
    );
    const cleanSvg = cleanSvgAttributes(svgCode, false, false);

    return NextResponse.json({
      template,
      svgMarkup: cleanSvg,
      templateName: componentName || "Custom Luxury Flyer",
      themeColor: defaultTheme,
      accentColor: defaultAccent,
      badge: "Custom Template",
      description: "Custom SVG flyer template generated and added to library",
      source: "local" as const,
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Internal server error";
    console.error("Error in convert-svg POST:", errorMsg);
    return NextResponse.json(
      { error: errorMsg },
      { status: 500 }
    );
  }
}
