"use client";

import React from "react";
import { TemplateDefinition, TemplateRenderProps, FlierItemBox, FlierImageSlot, FlierTextSlot } from "./types";
import { EKO_LOGO_DATA_URL } from "../../utils/templateLogos";
import { FIXED_CONTACT } from "../../utils/constants";
import { wrapSvgText, fitSvgText } from "../../utils/textWrap";

const CANVAS_W = 1080;
const CANVAS_H = 1350;

export const getEkoItemBoxes = (hasSec: boolean): Record<string, FlierItemBox> => ({
  "image-primary": {
    id: "image-primary",
    type: "image",
    label: "Hero Background Photo",
    x: 8,
    y: 8,
    width: CANVAS_W - 16,
    height: CANVAS_H - 16,
    rx: 6,
  },
  "image-secondary-0": {
    id: "image-secondary-0",
    type: "image",
    label: "Secondary Photo 1",
    x: 640,
    y: 60,
    width: 175,
    height: 130,
    rx: 16,
  },
  "image-secondary-1": {
    id: "image-secondary-1",
    type: "image",
    label: "Secondary Photo 2",
    x: 830,
    y: 60,
    width: 175,
    height: 130,
    rx: 16,
  },
  logo: {
    id: "logo",
    type: "image",
    label: "Agency Logo",
    x: 126,
    y: 60,
    width: 320,
    height: 100,
    rx: 16,
  },
  location: {
    id: "location",
    type: "text",
    label: "Location",
    x: 126,
    y: 1010,
    width: 370,
    height: 50,
    rx: 8,
  },
  priceNGN: {
    id: "priceNGN",
    type: "text",
    label: "Price (NGN)",
    x: 126,
    y: 1065,
    width: 370,
    height: 80,
    rx: 8,
  },
  propertyTitle: {
    id: "propertyTitle",
    type: "text",
    label: "Property Specs",
    x: 535,
    y: 1010,
    width: 420,
    height: 135,
    rx: 8,
  },
  contact: {
    id: "contact",
    type: "text",
    label: "Contact Information",
    x: 126,
    y: 1195,
    width: 828,
    height: 40,
    rx: 6,
  },
});

export const ekoImageSlots: FlierImageSlot[] = [
  { id: "image-primary", label: "Hero Background Photo", isCover: true, description: "Full-bleed background hero photo" },
  { id: "image-secondary-0", label: "Secondary Photo 1", isCover: false, description: "Top-left editorial photo inset" },
  { id: "logo", label: "Agency Brand Logo", isCover: false, description: "Bottom-right brand logo" },
];

export const ekoTextSlots: FlierTextSlot[] = [
  { id: "location", label: "Property Location", field: "location" },
  { id: "priceNGN", label: "Price (Naira)", field: "priceNGN" },
  { id: "propertyTitle", label: "Property Specs", field: "propertyType" },
  { id: "contact", label: "Agency Contact Ribbon" },
];

export function EkoTemplate({
  data,
  settings,
  primaryImage,
  secondaryImages,
  fallbackColor,
  rawPriceNaira,
  bedroomNum,
  itemOffsets,
  itemWidths,
  itemWrap,
  itemAlign,
  itemFontSizes,
  itemScales,
}: TemplateRenderProps) {
  const getTransform = (id: string, base?: string) => {
    const off = itemOffsets?.[id];
    if (!off || (off.dx === 0 && off.dy === 0)) return base || undefined;
    if (base) {
      const match = base.match(/translate\(([^,]+),\s*([^)]+)\)/);
      if (match) {
        const bx = parseFloat(match[1]) || 0;
        const by = parseFloat(match[2]) || 0;
        return `translate(${bx + off.dx}, ${by + off.dy})`;
      }
    }
    return `translate(${off.dx}, ${off.dy})`;
  };

  // Location wrapping & width
  const locRaw = (data.location || "LEKKI PHASE 1").toUpperCase();
  const locWidth = itemWidths?.["location"] || 370;
  const isLocWrap = itemWrap?.["location"] !== false;
  const locScale = itemScales?.["location"] || 1.0;
  const baseLocFontSize = itemFontSizes?.["location"] || 28;
  const locFit = isLocWrap
    ? fitSvgText(locRaw, locWidth, baseLocFontSize, {
        scale: locScale,
        maxLines: 3,
        minFontSize: 14,
        breakWords: true,
      })
    : {
        lines: [locRaw],
        fontSize: Math.max(14, Math.round(baseLocFontSize * locScale)),
        lineHeight: Math.round(baseLocFontSize * locScale * 1.2),
        totalHeight: Math.round(baseLocFontSize * locScale),
      };
  const locLines = locFit.lines;
  const locFontSize = locFit.fontSize;

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

  const priceWidth = itemWidths?.["priceNGN"] || 370;
  const priceScale = itemScales?.["priceNGN"] || 1.0;
  const basePriceFontSize = itemFontSizes?.["priceNGN"] || (rawPriceNaira.length > 10 ? 46 : rawPriceNaira.length > 7 ? 56 : 68);
  const ekoPriceFontSize = Math.max(20, Math.round(basePriceFontSize * priceScale));

  return (
    <g>
      {/* Full-bleed Photo Layer */}
      <g
        data-flier-item="image-primary"
        data-flier-type="image"
        className="cursor-pointer"
      >
        <rect x="0" y="0" width={CANVAS_W} height={CANVAS_H} fill={fallbackColor || "#0F172A"} />
        {primaryImage && (
          <image
            href={primaryImage}
            xlinkHref={primaryImage}
            crossOrigin="anonymous"
            x="0"
            y="0"
            width={CANVAS_W}
            height={CANVAS_H}
            preserveAspectRatio="xMidYMid slice"
          />
        )}
      </g>

      {/* Deep Cinematic Vignette */}
      <rect x="0" y="620" width={CANVAS_W} height="730" fill="url(#ekoBottomGrad)" />

      {/* Secondary Photo Containers */}
      {secondaryImages.length > 0 && (
        <g id="ekoSecondaryPhotos" filter="url(#cardShadow)">
          {secondaryImages.slice(0, 2).map((secUrl, sIdx) => {
            const xPos = secondaryImages.length === 1 ? 780 : 640 + sIdx * 190;
            const yPos = 60;
            const w = secondaryImages.length === 1 ? 230 : 175;
            const h = secondaryImages.length === 1 ? 160 : 130;
            const clipId = `ekoSecClip_${sIdx}`;
            return (
              <g
                key={sIdx}
                data-flier-item={`image-secondary-${sIdx}`}
                data-flier-type="image"
                transform={getTransform(`image-secondary-${sIdx}`)}
                className="cursor-pointer"
              >
                <defs>
                  <clipPath id={clipId}>
                    <rect x={xPos} y={yPos} width={w} height={h} rx="16" ry="16" />
                  </clipPath>
                </defs>
                <rect x={xPos} y={yPos} width={w} height={h} rx="16" ry="16" fill={fallbackColor || "#1E293B"} />
                <image
                  href={secUrl}
                  xlinkHref={secUrl}
                  crossOrigin="anonymous"
                  x={xPos}
                  y={yPos}
                  width={w}
                  height={h}
                  clipPath={`url(#${clipId})`}
                  preserveAspectRatio="xMidYMid slice"
                />
                <rect
                  x={xPos}
                  y={yPos}
                  width={w}
                  height={h}
                  rx="16"
                  ry="16"
                  fill="none"
                  stroke="#FFFFFF"
                  strokeWidth="3"
                  strokeOpacity="0.95"
                />
              </g>
            );
          })}
        </g>
      )}

      {/* Left Side: Location & Giant Bold Price */}
      <text
        x="126"
        y={locLines.length > 1 ? 1042 - (locLines.length - 1) * (locFontSize + 4) : 1042}
        fontSize={locFontSize}
        textLength={!isLocWrap && locRaw.length * (locFontSize * 0.58) > locWidth ? locWidth : undefined}
        lengthAdjust={!isLocWrap && locRaw.length * (locFontSize * 0.58) > locWidth ? "spacingAndGlyphs" : undefined}
        fontWeight="700"
        fill="#FFFFFF"
        letterSpacing="2"
        className="font-montserrat cursor-pointer"
        data-flier-item="location"
        data-flier-type="text"
        transform={getTransform("location")}
      >
        {locLines.map((line, lIdx) => (
          <tspan key={lIdx} x="126" dy={lIdx === 0 ? 0 : locFontSize + 4}>
            {line}
          </tspan>
        ))}
      </text>
      <text
        x="126"
        y="1132"
        fontSize={ekoPriceFontSize}
        textLength={rawPriceNaira.length * (ekoPriceFontSize * 0.58) > priceWidth ? priceWidth : undefined}
        lengthAdjust={rawPriceNaira.length * (ekoPriceFontSize * 0.58) > priceWidth ? "spacingAndGlyphs" : undefined}
        fontWeight="800"
        fill="#FFFFFF"
        letterSpacing="-0.5"
        className="font-cinzel cursor-pointer"
        data-flier-item="priceNGN"
        data-flier-type="text"
        transform={getTransform("priceNGN")}
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
        strokeWidth="2"
        strokeOpacity="0.9"
      />

      {/* Right Side: Stacked Uppercase Specs */}
      <g
        data-flier-item="propertyTitle"
        data-flier-type="text"
        transform={getTransform("propertyTitle")}
        className="cursor-pointer"
      >
        <text
          x="535"
          y="1048"
          fontSize="26"
          fontWeight="700"
          fill="#FFFFFF"
          letterSpacing="1.5"
          className="font-montserrat"
        >
          {ekoSpecLines[0]}
        </text>
        <text
          x="535"
          y="1088"
          fontSize="26"
          fontWeight="700"
          fill="#FFFFFF"
          letterSpacing="1.5"
          className="font-montserrat"
        >
          {ekoSpecLines[1]}
        </text>
        <text
          x="535"
          y="1128"
          fontSize="26"
          fontWeight="700"
          fill="#FFFFFF"
          letterSpacing="1.5"
          className="font-montserrat"
        >
          {ekoSpecLines[2]}
        </text>
      </g>

      {/* Full-width Horizontal Divider Line */}
      <line
        x1="126"
        y1="1169"
        x2="954"
        y2="1169"
        stroke="#FFFFFF"
        strokeWidth="1.5"
        strokeOpacity="0.9"
      />

      {/* Bottom Contact Details */}
      <text
        x="126"
        y="1225"
        fontSize="16"
        fontWeight="700"
        fill="#FFFFFF"
        fillOpacity="0.9"
        letterSpacing="1.5"
        className="font-montserrat cursor-pointer"
        data-flier-item="contact"
        data-flier-type="text"
        transform={getTransform("contact")}
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
        data-flier-item="logo"
        data-flier-type="image"
        transform={getTransform("logo")}
        className="cursor-pointer"
      />
    </g>
  );
}

export const ekoTemplateDefinition: TemplateDefinition = {
  id: "eko",
  name: "Eko Lux Prop",
  badge: "Minimalist Dark",
  themeColor: "#050B14",
  accentColor: "#FFFFFF",
  description: "High-end minimalist dark theme with dual photo collage & price ribbons",
  aspectRatio: "4:5",
  width: 1080,
  height: 1350,
  imageSlots: ekoImageSlots,
  textSlots: ekoTextSlots,
  getItemBoxes: getEkoItemBoxes,
  Component: EkoTemplate,
};
