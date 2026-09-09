"use client";

import React from "react";
import { TemplateDefinition, TemplateRenderProps, FlierItemBox, FlierImageSlot, FlierTextSlot } from "./types";
import { ENOSE_LOGO_DATA_URL } from "../../utils/templateLogos";
import { wrapSvgText } from "../../utils/textWrap";

const CANVAS_W = 1080;
const CANVAS_H = 1350;

export const getEnoseItemBoxes = (hasSec: boolean): Record<string, FlierItemBox> => ({
  "image-primary": {
    id: "image-primary",
    type: "image",
    label: "Hero Background Photo",
    x: 8,
    y: 8,
    width: CANVAS_W - 16,
    height: 720,
    rx: 6,
  },
  "image-secondary-0": {
    id: "image-secondary-0",
    type: "image",
    label: "Secondary Photo 1",
    x: 60,
    y: 740,
    width: 340,
    height: 260,
    rx: 20,
  },
  logo: {
    id: "logo",
    type: "image",
    label: "Agency Logo",
    x: 60,
    y: 40,
    width: 220,
    height: 60,
    rx: 8,
  },
  priceNGN: {
    id: "priceNGN",
    type: "text",
    label: "Price (NGN)",
    x: 96,
    y: 1000,
    width: 398,
    height: 190,
    rx: 22,
  },
  propertyTitle: {
    id: "propertyTitle",
    type: "text",
    label: "Property Specs",
    x: 520,
    y: 1020,
    width: 500,
    height: 50,
    rx: 10,
  },
  location: {
    id: "location",
    type: "text",
    label: "Location",
    x: 520,
    y: 1070,
    width: 500,
    height: 120,
    rx: 14,
  },
  contact: {
    id: "contact",
    type: "text",
    label: "Agency Contact",
    x: 40,
    y: 1210,
    width: 1000,
    height: 90,
    rx: 10,
  },
});

export const enoseImageSlots: FlierImageSlot[] = [
  { id: "image-primary", label: "Hero Background Photo", isCover: true, description: "Arch-top architectural hero photo frame" },
  { id: "image-secondary-0", label: "Secondary Photo 1", isCover: false, description: "Gallery secondary rounded photo frame" },
  { id: "logo", label: "Agency Brand Logo", isCover: false, description: "Top-left brand logo badge" },
];

export const enoseTextSlots: FlierTextSlot[] = [
  { id: "priceNGN", label: "Price (Naira)", field: "priceNGN" },
  { id: "propertyTitle", label: "Property Specs", field: "propertyType" },
  { id: "location", label: "Location Headline", field: "location" },
  { id: "contact", label: "Agency Contact Ribbon" },
];

export function EnoseTemplate({
  data,
  settings,
  primaryImage,
  secondaryImages,
  fallbackColor,
  rawPriceNaira,
  itemOffsets,
  itemWidths,
  itemWrap,
  itemAlign,
  itemFontSizes,
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

  const locRaw = (data.location || "VICTORIA ISLAND, LAGOS").toUpperCase();
  const locWidth = itemWidths?.["location"] || 460;
  const isLocWrap = itemWrap?.["location"] !== false;
  const enoseLocFontSize = itemFontSizes?.["location"] || (locRaw.length > 20 ? 46 : 56);
  const locLines = isLocWrap ? wrapSvgText(locRaw, locWidth, enoseLocFontSize * 0.58) : [locRaw];

  const enosePriceFontSize = itemFontSizes?.["priceNGN"] || (rawPriceNaira.length > 8 ? 60 : 74);

  return (
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
        data-flier-item="logo"
        data-flier-type="image"
        transform={getTransform("logo")}
        className="cursor-pointer"
      />

      {/* Main Arch-top Photo Frame */}
      <g
        clipPath="url(#enoseArchClip)"
        data-flier-item="image-primary"
        data-flier-type="image"
        className="cursor-pointer"
      >
        <rect x="48" y="165" width="984" height="1135" fill={fallbackColor || "#2A1808"} />
        {primaryImage && (
          <image
            href={primaryImage}
            xlinkHref={primaryImage}
            crossOrigin="anonymous"
            x="48"
            y="165"
            width="984"
            height="1135"
            preserveAspectRatio="xMidYMid slice"
          />
        )}
        {/* Chocolate Brown Bottom Vignette */}
        <rect x="48" y="800" width="984" height="500" fill="url(#enoseGrad)" />
      </g>

      {/* Enose Secondary Photo Container */}
      {secondaryImages.length > 0 && (
        <g id="enoseSecondaryPhotos" filter="url(#cardShadow)">
          {secondaryImages.slice(0, 2).map((secUrl, sIdx) => {
            const xPos = 740;
            const yPos = secondaryImages.length === 1 ? 210 : 210 + sIdx * 155;
            const w = 240;
            const h = secondaryImages.length === 1 ? 165 : 135;
            const clipId = `enoseSecClip_${sIdx}`;
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
                    <rect x={xPos} y={yPos} width={w} height={h} rx="20" ry="20" />
                  </clipPath>
                </defs>
                <rect x={xPos} y={yPos} width={w} height={h} rx="20" ry="20" fill={fallbackColor || "#47290C"} />
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
                  rx="20"
                  ry="20"
                  fill="none"
                  stroke="#FFF5ED"
                  strokeWidth="3.5"
                />
              </g>
            );
          })}
        </g>
      )}

      {/* Bottom Left Price Badge */}
      <g
        data-flier-item="priceNGN"
        data-flier-type="text"
        transform={getTransform("priceNGN")}
        className="cursor-pointer"
      >
        <rect
          x="96"
          y="1015"
          width="398"
          height="176"
          rx="22"
          fill="#47290C"
          stroke="#FFFFFF"
          strokeWidth="2"
          strokeDasharray="6 6"
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
            fontSize="26"
            fontWeight="900"
            fill="#47290C"
            letterSpacing="3"
            className="font-montserrat"
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
          fontWeight="800"
          fill="#FFF5ED"
          letterSpacing="-0.5"
          className="font-cinzel"
        >
          {rawPriceNaira}
        </text>
      </g>

      {/* Bottom Right: Property Subtitle & Bold Location Headline */}
      <g>
        <g
          data-flier-item="propertyTitle"
          data-flier-type="text"
          transform={getTransform("propertyTitle")}
          className="cursor-pointer"
        >
          <text
            x="525"
            y="1055"
            fontSize="32"
            fontWeight="700"
            fill="#FFF5ED"
            letterSpacing="1"
            className="font-cinzel"
          >
            {data.bedrooms ? `${data.bedrooms} Bedroom` : "Luxury"}{" "}
            {data.propertyType || "Apartment"}
          </text>
        </g>

        <g
          data-flier-item="location"
          data-flier-type="text"
          transform={getTransform("location")}
          className="cursor-pointer"
        >
          <text
            x="525"
            y={locLines.length > 1 ? 1115 - (locLines.length - 1) * (enoseLocFontSize + 4) * 0.5 : 1115}
            fontSize={enoseLocFontSize}
            fontWeight="800"
            fill="#FFF5ED"
            letterSpacing="1"
            className="font-montserrat"
          >
            {locLines.map((line, lIdx) => (
              <tspan key={lIdx} x="525" dy={lIdx === 0 ? 0 : enoseLocFontSize + 6}>
                {line}
              </tspan>
            ))}
          </text>
        </g>
      </g>
    </g>
  );
}

export const enoseTemplateDefinition: TemplateDefinition = {
  id: "enose",
  name: "Enose Lux Prop",
  badge: "Editorial Warm",
  themeColor: "#2A1808",
  accentColor: "#EB7A29",
  description: "Clean editorial luxury layout with gold accents and geometric framing",
  aspectRatio: "4:5",
  width: 1080,
  height: 1350,
  imageSlots: enoseImageSlots,
  textSlots: enoseTextSlots,
  getItemBoxes: getEnoseItemBoxes,
  Component: EnoseTemplate,
};
