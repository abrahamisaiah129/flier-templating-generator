/**
 * Utilities for analyzing, validating, and tokenizing SVG markup.
 */

export interface SvgValidationResult {
  isValid: boolean;
  error?: string;
}

export interface SvgDimensions {
  width: number;
  height: number;
  viewBox?: string;
}

/**
 * Validates that the input string contains acceptable SVG markup.
 */
export function validateSvgCode(content: string): SvgValidationResult {
  if (!content || !content.trim()) {
    return { isValid: false, error: "The SVG code is empty." };
  }

  const trimmed = content.trim();
  if (!trimmed.includes("<svg") && !trimmed.includes("<SVG")) {
    return {
      isValid: false,
      error: "The provided markup does not contain an <svg> tag. Please ensure it is valid SVG vector code.",
    };
  }

  return { isValid: true };
}

/**
 * Extracts width, height, and viewBox from an SVG string.
 */
export function extractSvgDimensions(svgMarkup: string): SvgDimensions {
  const widthMatch = svgMarkup.match(/\bwidth=["']([0-9.]+)(?:px)?["']/i);
  const heightMatch = svgMarkup.match(/\bheight=["']([0-9.]+)(?:px)?["']/i);
  const viewBoxMatch = svgMarkup.match(/\bviewBox=["']([0-9.\s-]+)["']/i);

  const width = widthMatch ? parseFloat(widthMatch[1]) : 1080;
  const height = heightMatch ? parseFloat(heightMatch[1]) : 1350;

  return {
    width: isNaN(width) || width <= 0 ? 1080 : width,
    height: isNaN(height) || height <= 0 ? 1350 : height,
    viewBox: viewBoxMatch ? viewBoxMatch[1] : undefined,
  };
}

/**
 * Detects all template tokens like {{price}}, {{title}}, etc. in an SVG.
 */
export function detectSvgTokens(svgMarkup: string): string[] {
  const matches = svgMarkup.match(/\{\{([a-zA-Z0-9_-]+)\}\}/g) || [];
  const unique = Array.from(new Set(matches));
  return unique;
}

/**
 * Sanitizes and cleans SVG markup, ensuring proper attributes for preview and rendering.
 */
export function cleanSvgMarkup(svgMarkup: string): string {
  let cleaned = svgMarkup.trim();

  // Ensure xmlns and xmlns:xlink exist
  if (!cleaned.includes('xmlns="http://www.w3.org/2000/svg"')) {
    cleaned = cleaned.replace(/<svg\b/i, '<svg xmlns="http://www.w3.org/2000/svg"');
  }
  if (!cleaned.includes('xmlns:xlink=')) {
    cleaned = cleaned.replace(/<svg\b/i, '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
  }

  return cleaned;
}
