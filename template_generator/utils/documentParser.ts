import JSZip from "jszip";

/**
 * Extracts plain text from an uploaded file (.txt, .md, .rtf, .csv, .docx, .pdf)
 */
export async function parseDocumentText(file: File): Promise<string> {
  const extension = file.name.split(".").pop()?.toLowerCase() || "";

  // 1. Plain text, Markdown, CSV, RTF
  if (
    extension === "txt" ||
    extension === "md" ||
    extension === "csv" ||
    file.type.startsWith("text/")
  ) {
    return await file.text();
  }

  // 2. Word documents (.docx) via JSZip
  if (extension === "docx" || file.type.includes("wordprocessingml")) {
    try {
      const zip = await JSZip.loadAsync(file);
      const documentXml = await zip.file("word/document.xml")?.async("text");
      if (documentXml) {
        // Extract all text inside <w:t> tags and preserve line breaks for <w:p>
        const cleanText = documentXml
          .replace(/<w:p[^>]*>/gi, "\n")
          .replace(/<w:tab[^>]*\/>/gi, "\t")
          .replace(/<w:br[^>]*\/>/gi, "\n")
          .replace(/<[^>]+>/g, " ")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/&amp;/g, "&")
          .replace(/&quot;/g, '"')
          .replace(/&apos;/g, "'")
          .replace(/[ \t]+/g, " ")
          .replace(/\n\s*\n/g, "\n\n")
          .trim();
        if (cleanText.length > 0) {
          return cleanText;
        }
      }
    } catch (docxErr) {
      console.warn("Failed to extract text from docx via JSZip, attempting fallback:", docxErr);
    }
  }

  // 3. PDF documents (.pdf) - Basic text extraction from stream / literal blocks
  if (extension === "pdf" || file.type === "application/pdf") {
    try {
      const buffer = await file.arrayBuffer();
      const decoder = new TextDecoder("utf-8", { fatal: false });
      const rawString = decoder.decode(buffer);

      // Search for text tokens inside parentheses in BT...ET blocks
      const textMatches: string[] = [];
      const textBlockRegex = /BT[\s\S]*?ET/g;
      let blockMatch;

      while ((blockMatch = textBlockRegex.exec(rawString)) !== null) {
        const block = blockMatch[0];
        // Match string literals like (Text to extract)
        const literalRegex = /\(([^)]+)\)\s*(?:Tj|'|")/g;
        let litMatch;
        while ((litMatch = literalRegex.exec(block)) !== null) {
          textMatches.push(litMatch[1]);
        }

        // Match array literals like [(Text) 20 (more text)] TJ
        const arrayRegex = /\[([^\]]+)\]\s*TJ/g;
        let arrMatch;
        while ((arrMatch = arrayRegex.exec(block)) !== null) {
          const innerLiterals = arrMatch[1].match(/\(([^)]+)\)/g);
          if (innerLiterals) {
            textMatches.push(innerLiterals.map((s) => s.slice(1, -1)).join(" "));
          }
        }
      }

      const extractedPdf = textMatches
        .join(" ")
        .replace(/\\([()\\])/g, "$1")
        .replace(/\s+/g, " ")
        .trim();

      if (extractedPdf.length > 20) {
        return extractedPdf;
      }
    } catch (pdfErr) {
      console.warn("Failed to extract PDF stream text:", pdfErr);
    }
  }

  // Fallback: Attempt standard text reading
  try {
    const fallbackText = await file.text();
    // Remove null bytes and non-printable control characters
    const sanitized = fallbackText.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "").trim();
    if (sanitized.length > 0) {
      return sanitized;
    }
  } catch {
    // If binary reading fails completely
  }

  throw new Error(
    `Could not extract text from "${file.name}". Please copy and paste the write-up text directly.`
  );
}
