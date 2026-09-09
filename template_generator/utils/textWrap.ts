/**
 * SVG Text Auto-Fit, Wrap & Word-Break Utility
 * Emulates CSS overflow-wrap: break-word, dynamic font-size reduction, and scaling
 * to ensure text is fully visible and never clipped or overflowing SVG boundaries.
 */

export interface FitSvgTextOptions {
  maxLines?: number;
  minFontSize?: number;
  charWidthFactor?: number;
  breakWords?: boolean;
  scale?: number;
  lineHeightFactor?: number;
}

export interface FitSvgTextResult {
  lines: string[];
  fontSize: number;
  scale: number;
  lineHeight: number;
  totalHeight: number;
}

/**
 * Wraps SVG text into lines respecting maxWidth and break-word rules.
 */
export function wrapSvgText(
  text: string,
  maxWidth: number,
  approxCharWidth: number = 13,
  breakWords: boolean = true
): string[] {
  if (!text || text.trim().length === 0) return [];
  const clean = text.trim();
  const maxChars = Math.max(4, Math.floor(maxWidth / Math.max(1, approxCharWidth)));

  // If text already fits on one line, return directly
  if (clean.length <= maxChars) {
    return [clean];
  }

  const words = clean.split(/\s+/);
  const lines: string[] = [];
  let currentLine = "";

  for (const rawWord of words) {
    // If a single word is longer than maxChars and breakWords is enabled,
    // break the long word into sub-chunks (overflow-wrap: break-word)
    const wordChunks: string[] = [];
    if (breakWords && rawWord.length > maxChars) {
      let rest = rawWord;
      while (rest.length > maxChars) {
        wordChunks.push(rest.slice(0, maxChars));
        rest = rest.slice(maxChars);
      }
      if (rest.length > 0) wordChunks.push(rest);
    } else {
      wordChunks.push(rawWord);
    }

    for (const word of wordChunks) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      if (testLine.length <= maxChars) {
        currentLine = testLine;
      } else {
        if (currentLine) {
          lines.push(currentLine);
        }
        currentLine = word;
      }
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

/**
 * Dynamically scales down font size and wraps text so it is guaranteed
 * to fit completely within maxWidth and maxLines without clipping or overflowing.
 */
export function fitSvgText(
  text: string,
  maxWidth: number,
  baseFontSize: number = 24,
  options: FitSvgTextOptions = {}
): FitSvgTextResult {
  const {
    maxLines = 3,
    minFontSize = 14,
    charWidthFactor = 0.58,
    breakWords = true,
    scale = 1.0,
    lineHeightFactor = 1.25,
  } = options;

  if (!text || text.trim().length === 0) {
    const fontSize = Math.max(minFontSize, Math.round(baseFontSize * scale));
    const lineHeight = Math.round(fontSize * lineHeightFactor);
    return { lines: [], fontSize, scale, lineHeight, totalHeight: 0 };
  }

  // Start with base font size multiplied by user's scale setting
  let currentFontSize = Math.max(minFontSize, Math.round(baseFontSize * scale));
  let lines: string[] = [];

  // Iteratively reduce font size until text fits within maxLines or minFontSize is reached
  while (currentFontSize >= minFontSize) {
    const approxCharWidth = currentFontSize * charWidthFactor;
    lines = wrapSvgText(text, maxWidth, approxCharWidth, breakWords);

    if (lines.length <= maxLines || currentFontSize <= minFontSize) {
      break;
    }

    // Step down font size to fit within max lines
    currentFontSize = Math.max(minFontSize, currentFontSize - 2);
  }

  const lineHeight = Math.round(currentFontSize * lineHeightFactor);
  const totalHeight = lines.length * lineHeight;

  return {
    lines,
    fontSize: currentFontSize,
    scale,
    lineHeight,
    totalHeight,
  };
}
