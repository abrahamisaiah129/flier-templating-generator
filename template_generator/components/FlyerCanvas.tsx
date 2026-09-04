"use client";

import React, { RefObject } from "react";
import { PropertyData, AppSettings, TemplateId } from "../types/propkit";
import { FIXED_CONTACT, EMPTY_FIELD } from "../utils/constants";
import {
  BMI_LOGO_DATA_URL,
  EKO_LOGO_DATA_URL,
  ENOSE_LOGO_DATA_URL,
} from "../utils/templateLogos";
import { formatNaira, formatUsd, formatPropertyTypeLines } from "../utils/extractor";

export const CANVAS_W = 1080;
export const CANVAS_H = 1350;

interface FlyerCanvasProps {
  data: PropertyData;
  settings: AppSettings;
  svgRef?: RefObject<SVGSVGElement | null>;
  primaryImage: string | null;
  templateId?: TemplateId;
  className?: string;
}

export function FlyerCanvas({
  data,
  settings,
  svgRef,
  primaryImage,
  templateId = "bmi",
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

  // Dynamic font sizing for BMI
  const locFontSize = locationText.length > 24 ? 19 : locationText.length > 18 ? 22 : 25;
  const priceFontSize = rawPriceNaira.length > 10 ? 46 : rawPriceNaira.length > 7 ? 54 : 62;
  const docFontSize = docText.length > 28 ? 18 : 22;

  // Helpers for Eko Template
  const ekoSpecLines = (() => {
    const line1 = `${bedroomNum} BEDROOM ${(data.propertyType || "DUPLEX").toUpperCase()}`;
    const feats = (data.features || []).filter(Boolean);
    if (feats.length >= 2) {
      return [line1, `WITH ${feats[0].toUpperCase()} AND`, feats[1].toUpperCase()];
    } else if (feats.length === 1) {
      return [line1, `WITH ${feats[0].toUpperCase()}`, "CONTEMPORARY LIVING"];
    }
    return [line1, "LUXURY FINISHES", "SERENE ENVIRONMENT"];
  })();
  const ekoPriceFontSize = rawPriceNaira.length > 8 ? 68 : 84;

  // Helpers for Enose Template
  const enoseLocation = (() => {
    const loc = data.location || "Freedom Way, Lekki Phase 1";
    const parts = loc.split(",").map((s) => s.trim()).filter(Boolean);
    if (parts.length > 1) {
      return { line1: parts[0] + ",", line2: parts.slice(1).join(", ") };
    }
    const words = loc.split(" ");
    if (words.length > 2) {
      const mid = Math.ceil(words.length / 2);
      return { line1: words.slice(0, mid).join(" "), line2: words.slice(mid).join(" ") };
    }
    return { line1: loc, line2: "" };
  })();
  const enoseLocFontSize =
    (enoseLocation.line1.length > 18 || enoseLocation.line2.length > 18) ? 46 : 56;
  const enosePriceFontSize = rawPriceNaira.length > 8 ? 60 : 74;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl shadow-xl border border-slate-200/80 bg-white ${className}`}
    >
      <svg
        ref={svgRef}
        viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
        width="100%"
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
        className="block w-full h-auto select-none"
        style={{
          background:
            templateId === "enose"
              ? "#FFF5ED"
              : templateId === "eko"
              ? "#000000"
              : "#0A1D23",
        }}
      >
        <defs>
          <style>{`
            .flier-font {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            }
          `}</style>

          {/* Shared Filters */}
          <filter id="floatingShadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="12" stdDeviation="16" floodColor="#000000" floodOpacity="0.4" />
          </filter>

          <filter id="cardShadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="8" stdDeviation="10" floodColor="#000000" floodOpacity="0.25" />
          </filter>

          <filter id="badgeShadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#000000" floodOpacity="0.2" />
          </filter>

          {/* BMI Gradients */}
          <linearGradient id="bmiTopVignette" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#000000" stopOpacity="0.55" />
            <stop offset="35%" stopColor="#000000" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </linearGradient>

          <linearGradient id="bmiBottomVignette" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#000000" stopOpacity="0" />
            <stop offset="60%" stopColor="#000000" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.75" />
          </linearGradient>

          {/* Eko Gradients */}
          <linearGradient id="ekoBottomGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#000000" stopOpacity="0" />
            <stop offset="30%" stopColor="#000000" stopOpacity="0.45" />
            <stop offset="70%" stopColor="#000000" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#000000" stopOpacity="1" />
          </linearGradient>

          {/* Enose Clip & Gradients */}
          <clipPath id="enoseArchClip">
            <rect x="48" y="165" width="984" height="1135" rx="28" fill="white" />
          </clipPath>

          <linearGradient id="enoseGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#47290C" stopOpacity="0" />
            <stop offset="45%" stopColor="#47290C" stopOpacity="0.65" />
            <stop offset="85%" stopColor="#47290C" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#47290C" stopOpacity="1" />
          </linearGradient>
        </defs>

        {/* ========================================================= */}
        {/* TEMPLATE 1: BMI SIGNATURE TEMPLATE (Figma Official)       */}
        {/* ========================================================= */}
        {templateId === "bmi" && (
          <g>
            {/* 1. Background Photo */}
            {primaryImage ? (
              <image
                href={primaryImage}
                x="0"
                y="0"
                width={CANVAS_W}
                height="1293"
                preserveAspectRatio="xMidYMid slice"
              />
            ) : (
              <rect x="0" y="0" width={CANVAS_W} height="1293" fill="#1E293B" />
            )}
            <rect x="0" y="0" width={CANVAS_W} height="280" fill="url(#bmiTopVignette)" />
            <rect x="0" y="700" width={CANVAS_W} height="593" fill="url(#bmiBottomVignette)" />

            {/* Outer 15px White Frame */}
            <rect
              x="7.5"
              y="7.5"
              width="1065"
              height="1335"
              stroke="#FFFFFF"
              strokeWidth="15"
              fill="none"
            />

            {/* 2. Top-Left Logo Badge */}
            <g filter="url(#badgeShadow)">
              <rect
                x="84"
                y="32"
                width="340"
                height="96"
                rx="30"
                fill="#FFFFFF"
                fillOpacity="0.98"
              />
              <image
                href={settings.logoUrl || BMI_LOGO_DATA_URL}
                x="98"
                y="40"
                width="312"
                height="80"
                preserveAspectRatio="xMidYMid meet"
              />
            </g>

            {/* 3. Floating Composite Spec Card */}
            <g filter="url(#floatingShadow)">
              {/* Furnished Status Tab */}
              <g filter="url(#badgeShadow)">
                <rect
                  x="120"
                  y="765"
                  width="240"
                  height="46"
                  rx="10"
                  fill="#EB7A29"
                />
                <text
                  x="240"
                  y="796"
                  textAnchor="middle"
                  fontSize="20"
                  fontWeight="900"
                  fill="#FFFFFF"
                  letterSpacing="2.5"
                  className="flier-font"
                >
                  {data.furnished === false ? "UNFURNISHED" : "FURNISHED"}
                </text>
              </g>

              {/* Navy Spec Container */}
              <rect
                x="120"
                y="810"
                width="310"
                height="305"
                rx="18"
                fill="#0B2854"
                fillOpacity="0.88"
              />

              {/* Giant Orange Bedroom Num + Stacked Details */}
              <g>
                <text
                  x="185"
                  y="990"
                  textAnchor="middle"
                  fontSize="155"
                  fontWeight="900"
                  fill="#EB7A29"
                  className="flier-font"
                >
                  {bedroomNum}
                </text>
                <line
                  x1="240"
                  y1="830"
                  x2="240"
                  y2="1090"
                  stroke="#FFFFFF"
                  strokeOpacity="0.18"
                  strokeWidth="1.5"
                />
                <g transform="translate(256, 835)">
                  <text
                    x="0"
                    y="18"
                    fontSize="20"
                    fontWeight="800"
                    fill="#EB7A29"
                    letterSpacing="2"
                    className="flier-font"
                  >
                    {bedroomNum === "1" ? "BEDROOM" : "BEDROOMS"}
                  </text>
                  {titleLines.map((line, idx) => (
                    <text
                      key={idx}
                      x="0"
                      y={54 + idx * 34}
                      fontSize="24"
                      fontWeight="900"
                      fill="#FFFFFF"
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
                      y={140 + idx * 30}
                      fontSize="20"
                      fontWeight="800"
                      fill="#EB7A29"
                      letterSpacing="1"
                      className="flier-font"
                    >
                      {hl}
                    </text>
                  ))}
                </g>
              </g>

              {/* Documentation Strip */}
              <g filter="url(#cardShadow)">
                <rect
                  x="120"
                  y="1126"
                  width="460"
                  height="66"
                  rx="12"
                  fill="#F7F7F7"
                  fillOpacity="0.95"
                />
                <text
                  x="350"
                  y="1168"
                  textAnchor="middle"
                  fontSize={docFontSize}
                  fontWeight="900"
                  fill="#1C3C6A"
                  letterSpacing="2.5"
                  className="flier-font"
                >
                  {docText.startsWith("TITLE:") ? docText : `TITLE: ${docText}`}
                </text>
              </g>

              {/* Location Pill */}
              <g filter="url(#cardShadow)">
                <rect
                  x="440"
                  y="810"
                  width="520"
                  height="74"
                  rx="37"
                  fill="#111827"
                  fillOpacity="0.88"
                  stroke="#FFFFFF"
                  strokeOpacity="0.15"
                  strokeWidth="1.5"
                />
                <g transform="translate(465, 828)">
                  <path
                    d="M11 0C4.9 0 0 4.9 0 11C0 19.2 11 31 11 31C11 31 22 19.2 22 11C22 4.9 17.1 0 11 0ZM11 15C8.8 15 7 13.2 7 11C7 8.8 8.8 7 11 7C13.2 7 15 8.8 15 11C15 13.2 13.2 15 11 15Z"
                    fill="#EB7A29"
                    transform="scale(1.15)"
                  />
                </g>
                <text
                  x="510"
                  y="856"
                  fontSize={locFontSize}
                  fontWeight="900"
                  fill="#FFFFFF"
                  letterSpacing="1.5"
                  className="flier-font"
                >
                  {locationText}
                </text>
              </g>

              {/* White Price Box */}
              <g filter="url(#cardShadow)">
                <rect
                  x="440"
                  y="898"
                  width="520"
                  height="150"
                  rx="20"
                  fill="#FFFFFF"
                  fillOpacity="0.98"
                />
                {/* Vertical PRICE label */}
                <g transform="translate(470, 930)">
                  <text
                    x="0"
                    y="14"
                    fontSize="13"
                    fontWeight="900"
                    fill="#64748B"
                    letterSpacing="2"
                    className="flier-font"
                  >
                    P
                  </text>
                  <text
                    x="0"
                    y="29"
                    fontSize="13"
                    fontWeight="900"
                    fill="#64748B"
                    letterSpacing="2"
                    className="flier-font"
                  >
                    R
                  </text>
                  <text
                    x="0"
                    y="44"
                    fontSize="13"
                    fontWeight="900"
                    fill="#64748B"
                    letterSpacing="2"
                    className="flier-font"
                  >
                    I
                  </text>
                  <text
                    x="0"
                    y="59"
                    fontSize="13"
                    fontWeight="900"
                    fill="#64748B"
                    letterSpacing="2"
                    className="flier-font"
                  >
                    C
                  </text>
                  <text
                    x="0"
                    y="74"
                    fontSize="13"
                    fontWeight="900"
                    fill="#64748B"
                    letterSpacing="2"
                    className="flier-font"
                  >
                    E
                  </text>
                  <text
                    x="0"
                    y="88"
                    fontSize="13"
                    fontWeight="900"
                    fill="#64748B"
                    letterSpacing="2"
                    className="flier-font"
                  >
                    :
                  </text>
                </g>

                <text
                  x="705"
                  y="995"
                  textAnchor="middle"
                  fontSize={priceFontSize}
                  fontWeight="900"
                  fill="#0B2854"
                  className="flier-font"
                >
                  {rawPriceNaira}
                </text>
              </g>

              {/* Orange USD Strip */}
              <g filter="url(#cardShadow)">
                <rect
                  x="440"
                  y="1060"
                  width="320"
                  height="55"
                  rx="27.5"
                  fill="#EB7A29"
                  fillOpacity="0.95"
                />
                <text
                  x="600"
                  y="1097"
                  textAnchor="middle"
                  fontSize="26"
                  fontWeight="900"
                  fill="#FFFFFF"
                  letterSpacing="1.5"
                  className="flier-font"
                >
                  {priceUsd}
                </text>
              </g>
            </g>

            {/* 4. Canvas Bottom Contact Footer (1080 × 57) */}
            <g transform="translate(0, 1293)">
              <rect x="0" y="0" width={CANVAS_W} height="57" fill="#FFFFFF" />
              <line
                x1="0"
                y1="0"
                x2={CANVAS_W}
                y2="0"
                stroke="#E2E8F0"
                strokeWidth="1.5"
              />

              {/* Col 1: Instagram */}
              <g transform="translate(30, 18)">
                <rect
                  x="0"
                  y="0"
                  width="18"
                  height="18"
                  rx="5"
                  fill="none"
                  stroke="#0B2854"
                  strokeWidth="2"
                />
                <circle cx="9" cy="9" r="4" fill="none" stroke="#0B2854" strokeWidth="2" />
                <text
                  x="26"
                  y="15"
                  fontSize="16"
                  fontWeight="800"
                  fill="#0B2854"
                  className="flier-font"
                >
                  {FIXED_CONTACT.instagram}
                </text>
              </g>

              {/* Col 2: Phone */}
              <g transform="translate(295, 18)">
                <path
                  d="M3.6 1.5C3.2 0.7 2.3 0.2 1.4 0.5L0.5 0.9C0.2 1.1 0 1.4 0 1.7C0 9.4 6.3 15.7 14 15.7C14.3 15.7 14.6 15.5 14.8 15.2L15.2 14.3C15.5 13.4 15 12.5 14.2 12.1L12.2 11.1C11.5 10.7 10.6 10.9 10.1 11.5L9.3 12.5C7.1 11.4 5.3 9.6 4.2 7.4L5.2 6.6C5.8 6.1 6 5.2 5.6 4.5L4.6 2.5L3.6 1.5Z"
                  fill="#0B2854"
                  transform="scale(1.1)"
                />
                <text
                  x="24"
                  y="15"
                  fontSize="16"
                  fontWeight="800"
                  fill="#0B2854"
                  className="flier-font"
                >
                  {FIXED_CONTACT.phone}
                </text>
              </g>

              {/* Col 3: Website */}
              <g transform="translate(565, 18)">
                <circle cx="9" cy="9" r="8" fill="none" stroke="#0B2854" strokeWidth="1.8" />
                <ellipse cx="9" cy="9" rx="4" ry="8" fill="none" stroke="#0B2854" strokeWidth="1.8" />
                <text
                  x="26"
                  y="15"
                  fontSize="16"
                  fontWeight="800"
                  fill="#0B2854"
                  className="flier-font"
                >
                  {FIXED_CONTACT.website}
                </text>
              </g>

              {/* Col 4: Email */}
              <g transform="translate(830, 18)">
                <rect
                  x="0"
                  y="1"
                  width="18"
                  height="14"
                  rx="3"
                  fill="none"
                  stroke="#0B2854"
                  strokeWidth="1.8"
                />
                <path d="M1 2L9 8L17 2" fill="none" stroke="#0B2854" strokeWidth="1.8" />
                <text
                  x="26"
                  y="15"
                  fontSize="15"
                  fontWeight="800"
                  fill="#0B2854"
                  className="flier-font"
                >
                  {FIXED_CONTACT.email}
                </text>
              </g>
            </g>
          </g>
        )}

        {/* ========================================================= */}
        {/* TEMPLATE 2: EKO LUXURY EDITORIAL TEMPLATE                 */}
        {/* ========================================================= */}
        {templateId === "eko" && (
          <g>
            {/* Full-bleed Photo */}
            {primaryImage ? (
              <image
                href={primaryImage}
                x="0"
                y="0"
                width={CANVAS_W}
                height={CANVAS_H}
                preserveAspectRatio="xMidYMid slice"
              />
            ) : (
              <rect x="0" y="0" width={CANVAS_W} height={CANVAS_H} fill="#1E293B" />
            )}

            {/* Deep Cinematic Vignette */}
            <rect x="0" y="620" width={CANVAS_W} height="730" fill="url(#ekoBottomGrad)" />

            {/* Left Side: Location & Giant Bold Price */}
            <text
              x="126"
              y="1042"
              fontSize="34"
              fontWeight="600"
              fill="#FFFFFF"
              letterSpacing="0.5"
              className="flier-font"
            >
              {data.location || "Lekki Phase 1"}
            </text>
            <text
              x="126"
              y="1132"
              fontSize={ekoPriceFontSize}
              fontWeight="900"
              fill="#FFFFFF"
              letterSpacing="-1"
              className="flier-font"
            >
              {rawPriceNaira}
            </text>

            {/* Central Vertical Divider Line */}
            <line
              x1="501"
              y1="1020"
              x2="501"
              y2="1140"
              stroke="#FFFFFF"
              strokeWidth="1.5"
              strokeOpacity="0.85"
            />

            {/* Right Side: Stacked Uppercase Specs */}
            <text
              x="535"
              y="1048"
              fontSize="28"
              fontWeight="800"
              fill="#FFFFFF"
              letterSpacing="1.2"
              className="flier-font"
            >
              {ekoSpecLines[0]}
            </text>
            <text
              x="535"
              y="1088"
              fontSize="28"
              fontWeight="800"
              fill="#FFFFFF"
              letterSpacing="1.2"
              className="flier-font"
            >
              {ekoSpecLines[1]}
            </text>
            <text
              x="535"
              y="1128"
              fontSize="28"
              fontWeight="800"
              fill="#FFFFFF"
              letterSpacing="1.2"
              className="flier-font"
            >
              {ekoSpecLines[2]}
            </text>

            {/* Full-width Horizontal Divider Line */}
            <line
              x1="126"
              y1="1169"
              x2="954"
              y2="1169"
              stroke="#FFFFFF"
              strokeWidth="1.5"
              strokeOpacity="0.85"
            />

            {/* Bottom Details */}
            {/* Left Contact Details */}
            <text
              x="126"
              y="1225"
              fontSize="16"
              fontWeight="700"
              fill="#FFFFFF"
              fillOpacity="0.85"
              letterSpacing="1.5"
              className="flier-font"
            >
              {FIXED_CONTACT.phone} · {FIXED_CONTACT.instagram}
            </text>

            {/* Right Eko Luxury Properties Logo */}
            <image
              href={settings.logoUrl || EKO_LOGO_DATA_URL}
              x="710"
              y="1185"
              width="244"
              height="65"
              preserveAspectRatio="xMidYMid meet"
            />
          </g>
        )}

        {/* ========================================================= */}
        {/* TEMPLATE 3: ENOSE LUXURY ARCHITECTURAL GALLERY TEMPLATE   */}
        {/* ========================================================= */}
        {templateId === "enose" && (
          <g>
            {/* Background Frame: Luxurious Warm Cream */}
            <rect width={CANVAS_W} height={CANVAS_H} fill="#FFF5ED" />

            {/* Top-Left Enose Logo */}
            <image
              href={settings.logoUrl || ENOSE_LOGO_DATA_URL}
              x="68"
              y="60"
              width="285"
              height="65"
              preserveAspectRatio="xMidYMid meet"
            />

            {/* Main Arch-top Photo Frame */}
            <g clipPath="url(#enoseArchClip)">
              {primaryImage ? (
                <image
                  href={primaryImage}
                  x="48"
                  y="165"
                  width="984"
                  height="1135"
                  preserveAspectRatio="xMidYMid slice"
                />
              ) : (
                <rect x="48" y="165" width="984" height="1135" fill="#1E293B" />
              )}
              {/* Chocolate Brown Bottom Vignette */}
              <rect x="48" y="800" width="984" height="500" fill="url(#enoseGrad)" />
            </g>

            {/* Bottom Left Price Badge */}
            <g>
              {/* Chocolate Brown Card with Dashed White Border */}
              <rect
                x="96"
                y="1015"
                width="398"
                height="176"
                rx="22"
                fill="#47290C"
                stroke="#FFFFFF"
                strokeWidth="1.5"
                strokeDasharray="4 4"
                filter="url(#cardShadow)"
              />

              {/* Floating Pill on Top: PRICE */}
              <g filter="url(#badgeShadow)">
                <rect
                  x="182"
                  y="996"
                  width="226"
                  height="58"
                  rx="10"
                  fill="#FFF5ED"
                />
                <text
                  x="295"
                  y="1036"
                  textAnchor="middle"
                  fontSize="28"
                  fontWeight="900"
                  fill="#47290C"
                  letterSpacing="3"
                  className="flier-font"
                >
                  PRICE
                </text>
              </g>

              {/* Price text in Cream */}
              <text
                x="295"
                y="1128"
                textAnchor="middle"
                fontSize={enosePriceFontSize}
                fontWeight="900"
                fill="#FFF5ED"
                letterSpacing="1"
                className="flier-font"
              >
                {rawPriceNaira}
              </text>
            </g>

            {/* Bottom Right: Property Subtitle & Bold Location Headline */}
            <g>
              {/* Subtitle */}
              <text
                x="525"
                y="1055"
                fontSize="30"
                fontWeight="700"
                fill="#FFF5ED"
                className="flier-font"
              >
                {data.bedrooms ? `${data.bedrooms} Bedroom` : "Luxury"}{" "}
                {data.propertyType || "Apartment"}
              </text>

              {/* Huge Bold Location Headline */}
              <text
                x="525"
                y="1115"
                fontSize={enoseLocFontSize}
                fontWeight="900"
                fill="#FFF5ED"
                letterSpacing="0.5"
                className="flier-font"
              >
                {enoseLocation.line1}
              </text>
              {enoseLocation.line2 && (
                <text
                  x="525"
                  y="1175"
                  fontSize={enoseLocFontSize}
                  fontWeight="900"
                  fill="#FFF5ED"
                  letterSpacing="0.5"
                  className="flier-font"
                >
                  {enoseLocation.line2}
                </text>
              )}
            </g>
          </g>
        )}
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
