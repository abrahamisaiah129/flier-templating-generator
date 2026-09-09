/**
 * SVG Text Wrapping Utility
 * Breaks long text strings into multiple lines that fit within a specified SVG box width.
 */
export function wrapSvgText(
  text: string,
  maxWidth: number,
  approxCharWidth: number = 13
): string[] {
  if (!text || text.trim().length === 0) return [];
  const clean = text.trim();
  const maxChars = Math.max(6, Math.floor(maxWidth / approxCharWidth));

  // If text already fits on one line, return directly
  if (clean.length <= maxChars) {
    return [clean];
  }

  const words = clean.split(/\s+/);
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
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

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}
