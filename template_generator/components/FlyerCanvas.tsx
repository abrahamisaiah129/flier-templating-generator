"use client";

import React, { RefObject } from "react";
import { PropertyData, AppSettings } from "../types/propkit";
import { FIXED_CONTACT, EMPTY_FIELD } from "../utils/constants";
import { formatNaira, formatUsd, formatPropertyTypeLines } from "../utils/extractor";

export const CANVAS_W = 1080;
export const CANVAS_H = 1350;

interface FlyerCanvasProps {
  data: PropertyData;
  settings: AppSettings;
  svgRef: RefObject<SVGSVGElement | null>;
  primaryImage: string | null;
  className?: string;
}

export function FlyerCanvas({
  data,
  settings,
  svgRef,
  primaryImage,
  className = "",
}: FlyerCanvasProps) {
  // Formatters & helpers
  const rawPriceNaira = formatNaira(data.priceNGN) || "PRICE ON REQUEST";
  const priceUsd = formatUsd(data.priceNGN, settings.usdRate) || "USD ESTIMATE";
  const bedroomNum = data.bedrooms ? String(data.bedrooms) : "4";
  const locationText = (data.location || EMPTY_FIELD).toUpperCase().trim();
  const docText = (data.documentation || "GOVERNOR'S CONSENT").toUpperCase().trim();

  const { titleLines, highlightLines } = formatPropertyTypeLines(
    data.propertyType,
    data.features
  );

  // Dynamic font sizing
  const locFontSize = locationText.length > 24 ? 19 : locationText.length > 18 ? 22 : 25;
  const priceFontSize = rawPriceNaira.length > 10 ? 46 : rawPriceNaira.length > 7 ? 54 : 62;
  const docFontSize = docText.length > 28 ? 18 : 22;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl shadow-xl border border-slate-200/80 bg-white ${className}`}
    >
      <svg
        ref={svgRef}
        viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
        width="100%"
        xmlns="http://www.w3.org/2000/svg"
        className="block w-full h-auto select-none"
        style={{ background: "#0A1D23" }}
      >
        <defs>
          <style>{`
            .flier-font {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            }
          `}</style>

          <filter id="floatingShadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="12" stdDeviation="16" floodColor="#000000" floodOpacity="0.4" />
          </filter>

          <filter id="cardShadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="8" stdDeviation="10" floodColor="#000000" floodOpacity="0.25" />
          </filter>

          <filter id="badgeShadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#000000" floodOpacity="0.2" />
          </filter>

          <linearGradient id="topVignette" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#000000" stopOpacity="0.55" />
            <stop offset="35%" stopColor="#000000" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </linearGradient>

          <linearGradient id="bottomVignette" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#000000" stopOpacity="0" />
            <stop offset="60%" stopColor="#000000" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.75" />
          </linearGradient>
        </defs>

        {/* 1. BACKGROUND PHOTO (1080 × 1285) */}
        {primaryImage ? (
          <image
            href={primaryImage}
            x="0"
            y="0"
            width={CANVAS_W}
            height="1285"
            preserveAspectRatio="xMidYMid slice"
          />
        ) : (
          <rect x="0" y="0" width={CANVAS_W} height="1285" fill="#1E293B" />
        )}
        <rect x="0" y="0" width={CANVAS_W} height="280" fill="url(#topVignette)" />
        <rect x="0" y="700" width={CANVAS_W} height="585" fill="url(#bottomVignette)" />

        {/* 2. TOP CENTER LOGO BADGE (As seen in Figma BMI Template) */}
        {settings.logoUrl ? (
          <g filter="url(#badgeShadow)">
            <rect
              x="370"
              y="44"
              width="340"
              height="88"
              rx="44"
              fill="#ffffff"
              fillOpacity="0.96"
            />
            <image
              href={settings.logoUrl}
              x="385"
              y="52"
              width="310"
              height="72"
              preserveAspectRatio="xMidYMid meet"
            />
          </g>
        ) : (
          <g filter="url(#badgeShadow)">
            <rect
              x="370"
              y="44"
              width="340"
              height="88"
              rx="44"
              fill="#ffffff"
              fillOpacity="0.96"
            />
            <text
              x="398"
              y="90"
              fontSize="29"
              fontWeight="900"
              fill="#0B2A4A"
              className="flier-font"
            >
              buy'n'move
            </text>
            <circle cx="608" cy="82" r="18" fill="#F26522" />
            <text
              x="599"
              y="89"
              fontSize="18"
              fontWeight="900"
              fill="#ffffff"
              className="flier-font"
            >
              in
            </text>
            <text
              x="399"
              y="114"
              fontSize="13"
              fontWeight="600"
              fontStyle="italic"
              fill="#64748B"
              className="flier-font"
            >
              ...live anywhere
            </text>
          </g>
        )}

        {/* 3. FLOATING COMPOSITE PROPERTY SPEC CARD (Figma BMI Template) */}
        <g filter="url(#floatingShadow)">
          {/* Top-Left Furnished Status Tab */}
          <g filter="url(#badgeShadow)">
            <rect
              x="70"
              y="722"
              width="210"
              height="48"
              rx="10"
              fill="#F26522"
            />
            <text
              x="175"
              y="753"
              textAnchor="middle"
              fontSize="20"
              fontWeight="900"
              fill="#ffffff"
              letterSpacing="2.5"
              className="flier-font"
            >
              {data.furnished === false ? "UNFURNISHED" : "FURNISHED"}
            </text>
          </g>

          {/* LEFT DARK NAVY BLOCK (#0B2A4A) */}
          <rect
            x="70"
            y="770"
            width="455"
            height="325"
            rx="16"
            fill="#0B2A4A"
          />

          {/* Left Block Inner Layout: Giant Orange Bedroom Num + Stacked Details */}
          <g>
            <text
              x="145"
              y="970"
              textAnchor="middle"
              fontSize="145"
              fontWeight="900"
              fill="#F26522"
              className="flier-font"
            >
              {bedroomNum}
            </text>
            <line
              x1="225"
              y1="800"
              x2="225"
              y2="1065"
              stroke="#ffffff"
              strokeOpacity="0.12"
              strokeWidth="2"
            />
            <g transform="translate(245, 835)">
              <text
                x="0"
                y="0"
                fontSize="22"
                fontWeight="900"
                fill="#F26522"
                letterSpacing="2"
                className="flier-font"
              >
                {bedroomNum === "1" ? "BEDROOM" : "BEDROOMS"}
              </text>
              {titleLines.map((line, idx) => (
                <text
                  key={idx}
                  x="0"
                  y={38 + idx * 36}
                  fontSize="27"
                  fontWeight="900"
                  fill="#ffffff"
                  letterSpacing="1.5"
                  className="flier-font"
                >
                  {line}
                </text>
              ))}
              {highlightLines.map((hl, idx) => (
                <text
                  key={idx}
                  x="0"
                  y={130 + idx * 32}
                  fontSize="21"
                  fontWeight="800"
                  fill="#F26522"
                  letterSpacing="1"
                  className="flier-font"
                >
                  {hl}
                </text>
              ))}
            </g>
          </g>

          {/* RIGHT SECTION: Location Pill + White Price Box */}
          {/* 3A. Location Pill */}
          <g filter="url(#cardShadow)">
            <rect
              x="540"
              y="770"
              width="470"
              height="66"
              rx="33"
              fill="#111827"
              stroke="#ffffff"
              strokeOpacity="0.1"
              strokeWidth="1.5"
            />
            {/* Orange Location Pin Vector */}
            <g transform="translate(565, 786)">
              <path
                d="M11 0C4.9 0 0 4.9 0 11C0 19.2 11 31 11 31C11 31 22 19.2 22 11C22 4.9 17.1 0 11 0ZM11 15C8.8 15 7 13.2 7 11C7 8.8 8.8 7 11 7C13.2 7 15 8.8 15 11C15 13.2 13.2 15 11 15Z"
                fill="#F26522"
                transform="scale(1.05)"
              />
            </g>
            <text
              x="598"
              y="811"
              fontSize={locFontSize}
              fontWeight="900"
              fill="#ffffff"
              letterSpacing="1.5"
              className="flier-font"
            >
              {locationText}
            </text>
          </g>

          {/* 3B. White Price Box */}
          <g filter="url(#cardShadow)">
            <rect
              x="540"
              y="848"
              width="470"
              height="247"
              rx="16"
              fill="#ffffff"
            />
            <text
              x="775"
              y="972"
              textAnchor="middle"
              fontSize={priceFontSize}
              fontWeight="900"
              fill="#0B2A4A"
              className="flier-font"
            >
              {rawPriceNaira}
            </text>
            <text
              x="775"
              y="1035"
              textAnchor="middle"
              fontSize="28"
              fontWeight="800"
              fill="#F26522"
              letterSpacing="1.5"
              className="flier-font"
            >
              {priceUsd}
            </text>
          </g>

          {/* 3C. Bottom Documentation Strip Spanning Both Blocks */}
          <g filter="url(#cardShadow)">
            <rect
              x="70"
              y="1108"
              width="940"
              height="65"
              rx="12"
              fill="#DCECEE"
            />
            <text
              x="540"
              y="1148"
              textAnchor="middle"
              fontSize={docFontSize}
              fontWeight="900"
              fill="#1B494E"
              letterSpacing="3"
              className="flier-font"
            >
              {docText.startsWith("TITLE:") ? docText : `TITLE: ${docText}`}
            </text>
          </g>
        </g>

        {/* 4. CANVAS BOTTOM CONTACT FOOTER (1080 × 65) */}
        <g transform="translate(0, 1285)">
          <rect x="0" y="0" width={CANVAS_W} height="65" fill="#ffffff" />
          <line
            x1="0"
            y1="0"
            x2={CANVAS_W}
            y2="0"
            stroke="#E2E8F0"
            strokeWidth="1.5"
          />

          {/* Col 1: Instagram */}
          <g transform="translate(30, 22)">
            <rect
              x="0"
              y="0"
              width="20"
              height="20"
              rx="5"
              fill="none"
              stroke="#0B2A4A"
              strokeWidth="2"
            />
            <circle
              cx="10"
              cy="10"
              r="4.5"
              fill="none"
              stroke="#0B2A4A"
              strokeWidth="2"
            />
            <text
              x="28"
              y="16"
              fontSize="17"
              fontWeight="800"
              fill="#0B2A4A"
              className="flier-font"
            >
              {FIXED_CONTACT.instagram}
            </text>
          </g>

          {/* Col 2: Phone */}
          <g transform="translate(295, 22)">
            <path
              d="M3.6 1.5C3.2 0.7 2.3 0.2 1.4 0.5L0.5 0.9C0.2 1.1 0 1.4 0 1.7C0 9.4 6.3 15.7 14 15.7C14.3 15.7 14.6 15.5 14.8 15.2L15.2 14.3C15.5 13.4 15 12.5 14.2 12.1L12.2 11.1C11.5 10.7 10.6 10.9 10.1 11.5L9.3 12.5C7.1 11.4 5.3 9.6 4.2 7.4L5.2 6.6C5.8 6.1 6 5.2 5.6 4.5L4.6 2.5L3.6 1.5Z"
              fill="#0B2A4A"
              transform="scale(1.2)"
            />
            <text
              x="26"
              y="16"
              fontSize="17"
              fontWeight="800"
              fill="#0B2A4A"
              className="flier-font"
            >
              {FIXED_CONTACT.phone}
            </text>
          </g>

          {/* Col 3: Website */}
          <g transform="translate(565, 22)">
            <circle
              cx="10"
              cy="10"
              r="9"
              fill="none"
              stroke="#0B2A4A"
              strokeWidth="1.8"
            />
            <ellipse
              cx="10"
              cy="10"
              rx="4.5"
              ry="9"
              fill="none"
              stroke="#0B2A4A"
              strokeWidth="1.8"
            />
            <text
              x="28"
              y="16"
              fontSize="17"
              fontWeight="800"
              fill="#0B2A4A"
              className="flier-font"
            >
              {FIXED_CONTACT.website}
            </text>
          </g>

          {/* Col 4: Email */}
          <g transform="translate(830, 22)">
            <rect
              x="0"
              y="1"
              width="20"
              height="15"
              rx="3"
              fill="none"
              stroke="#0B2A4A"
              strokeWidth="1.8"
            />
            <path
              d="M1 2L10 9L19 2"
              fill="none"
              stroke="#0B2A4A"
              strokeWidth="1.8"
            />
            <text
              x="28"
              y="16"
              fontSize="16"
              fontWeight="800"
              fill="#0B2A4A"
              className="flier-font"
            >
              {FIXED_CONTACT.email}
            </text>
          </g>
        </g>
      </svg>
    </div>
  );
}

/**
 * High-performance SVG to PNG converter with resolution scale support (1x or 2x Ultra HD).
 * Handles external image URLs by converting them to data URLs to prevent canvas tainting.
 */
export async function svgToPngBlob(
  svgEl: SVGSVGElement,
  scale: number = 1
): Promise<Blob | null> {
  try {
    const clonedSvg = svgEl.cloneNode(true) as SVGSVGElement;

    // Convert any external <image> hrefs to Data URLs
    const images = Array.from(clonedSvg.querySelectorAll("image"));
    for (const imgEl of images) {
      const href = imgEl.getAttribute("href") || imgEl.getAttribute("xlink:href");
      if (href && href.startsWith("http")) {
        try {
          const res = await fetch(href, { mode: "cors" });
          const blob = await res.blob();
          const dataUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
          imgEl.setAttribute("href", dataUrl);
        } catch {
          // Gracefully continue
        }
      }
    }

    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(clonedSvg);
    const svgBlob = new Blob([svgStr], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    const img = new window.Image();
    const loaded = new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = (e) => reject(e);
    });
    img.src = url;
    await loaded;

    const targetWidth = CANVAS_W * scale;
    const targetHeight = CANVAS_H * scale;

    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
    URL.revokeObjectURL(url);

    return new Promise<Blob | null>((resolve) => {
      canvas.toBlob((blob) => resolve(blob), "image/png");
    });
  } catch (err) {
    console.error("Failed to render SVG to PNG", err);
    return null;
  }
}
