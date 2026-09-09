"use client";

import React from "react";
import { TemplateDefinition, TemplateRenderProps, FlierItemBox, FlierImageSlot, FlierTextSlot } from "./types";
import { BMI_LOGO_DATA_URL } from "../../utils/templateLogos";
import { FIXED_CONTACT } from "../../utils/constants";
import { formatPropertyTypeLines } from "../../utils/extractor";
import { wrapSvgText } from "../../utils/textWrap";

const CANVAS_W = 1080;

export const getBmiItemBoxes = (hasSec1: boolean, hasSec2: boolean): Record<string, FlierItemBox> => ({
  "image-primary": {
    id: "image-primary",
    type: "image",
    label: "Hero Background (Photo 1)",
    x: 8,
    y: 8,
    width: CANVAS_W - 16,
    height: 1285,
    rx: 6,
  },
  "image-secondary-0": {
    id: "image-secondary-0",
    type: "image",
    label: "Secondary Photo 1",
    x: hasSec2 ? 640 : 780,
    y: 55,
    width: hasSec2 ? 175 : 230,
    height: hasSec2 ? 130 : 160,
    rx: 18,
  },
  "image-secondary-1": {
    id: "image-secondary-1",
    type: "image",
    label: "Secondary Photo 2",
    x: 830,
    y: 55,
    width: 175,
    height: 130,
    rx: 18,
  },
  logo: {
    id: "logo",
    type: "image",
    label: "Agency Logo",
    x: 84,
    y: 15,
    width: 360,
    height: 140,
    rx: 33,
  },
  furnished: {
    id: "furnished",
    type: "text",
    label: "Furnished Status",
    x: 150,
    y: 772,
    width: 261,
    height: 46,
    rx: 12,
  },
  bedrooms: {
    id: "bedrooms",
    type: "text",
    label: "Bedrooms & Spec",
    x: 166,
    y: 818,
    width: 255,
    height: 280,
    rx: 16,
  },
  location: {
    id: "location",
    type: "text",
    label: "Location",
    x: 436,
    y: 824,
    width: 412,
    height: 82,
    rx: 16,
  },
  priceNGN: {
    id: "priceNGN",
    type: "text",
    label: "Price (NGN)",
    x: 437,
    y: 907,
    width: 438,
    height: 136,
    rx: 18,
  },
  priceUsd: {
    id: "priceUsd",
    type: "text",
    label: "Price (USD)",
    x: 437,
    y: 1043,
    width: 300,
    height: 57,
    rx: 14,
  },
  documentation: {
    id: "documentation",
    type: "text",
    label: "Documentation",
    x: 137,
    y: 1125,
    width: 441,
    height: 70,
    rx: 10,
  },
  contact: {
    id: "contact",
    type: "text",
    label: "Agency Contact",
    x: 0,
    y: 1293,
    width: 1080,
    height: 57,
    rx: 0,
  },
});

export const bmiImageSlots: FlierImageSlot[] = [
  { id: "image-primary", label: "Hero Background Photo", isCover: true, description: "Full-bleed property background photo" },
  { id: "image-secondary-0", label: "Secondary Photo 1", isCover: false, description: "Top-right secondary property thumbnail" },
  { id: "image-secondary-1", label: "Secondary Photo 2", isCover: false, description: "Top-right secondary property thumbnail" },
  { id: "logo", label: "Agency Logo", isCover: false, description: "Top-left agency header badge" },
];

export const bmiTextSlots: FlierTextSlot[] = [
  { id: "priceNGN", label: "Price (Naira)", field: "priceNGN" },
  { id: "priceUsd", label: "Price (USD) / Deposit Plan" },
  { id: "location", label: "Property Location", field: "location" },
  { id: "bedrooms", label: "Bedrooms & Spec", field: "bedrooms" },
  { id: "propertyTitle", label: "Property Specs & Type", field: "propertyType" },
  { id: "documentation", label: "Documentation / Title", field: "documentation" },
  { id: "furnished", label: "Furnished Status", field: "furnished" },
  { id: "contact", label: "Agency Contact Ribbon" },
];

export function BmiTemplate({
  data,
  settings,
  primaryImage,
  secondaryImages,
  fallbackColor,
  rawPriceNaira,
  priceUsd,
  bedroomNum,
  locationText,
  docText,
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

  const { titleLines, highlightLines } = formatPropertyTypeLines(
    data.propertyType,
    data.features
  );

  // Location wrapping & width
  const locWidth = itemWidths?.["location"] || 412.696;
  const isLocWrap = itemWrap?.["location"] !== false;
  const locFontSize = itemFontSizes?.["location"] || (locationText.length > 24 ? 19 : locationText.length > 18 ? 22 : 25);
  const locLines = isLocWrap ? wrapSvgText(locationText, locWidth - 70, locFontSize * 0.58) : [locationText];

  // Documentation wrapping & width
  const docWidth = itemWidths?.["documentation"] || 440.734;
  const isDocWrap = itemWrap?.["documentation"] !== false;
  const docFontSize = itemFontSizes?.["documentation"] || (docText.length > 28 ? 18 : 22);
  const fullDocText = docText.startsWith("TITLE:") ? docText : `TITLE: ${docText}`;
  const docLines = isDocWrap ? wrapSvgText(fullDocText, docWidth - 40, docFontSize * 0.58) : [fullDocText];

  // Price box width & size
  const priceWidth = itemWidths?.["priceNGN"] || 438;
  const priceFontSize = itemFontSizes?.["priceNGN"] || (rawPriceNaira.length > 10 ? 46 : rawPriceNaira.length > 7 ? 54 : 62);

  return (
    <g>
      {/* 1. Background Photo Layer with Fallback & CORS handling */}
      <g
        data-flier-item="image-primary"
        data-flier-type="image"
        className="cursor-pointer"
      >
        <rect x="0" y="0" width={CANVAS_W} height="1293" fill={fallbackColor || "#1E293B"} />
        {primaryImage && (
          <image
            href={primaryImage}
            xlinkHref={primaryImage}
            crossOrigin="anonymous"
            x="0"
            y="0"
            width={CANVAS_W}
            height="1293"
            preserveAspectRatio="xMidYMid slice"
          />
        )}
        <rect x="0" y="0" width={CANVAS_W} height="280" fill="url(#bmiTopVignette)" />
        <rect x="0" y="700" width={CANVAS_W} height="593" fill="url(#bmiBottomVignette)" />
      </g>

      {/* Secondary Photo Containers (Nested rounded thumbnail shapes with clipping masks) */}
      {secondaryImages.length > 0 && (
        <g id="bmiSecondaryPhotos" filter="url(#cardShadow)">
          {secondaryImages.slice(0, 2).map((secUrl, sIdx) => {
            const xPos = secondaryImages.length === 1 ? 780 : 640 + sIdx * 190;
            const yPos = 55;
            const w = secondaryImages.length === 1 ? 230 : 175;
            const h = secondaryImages.length === 1 ? 160 : 130;
            const clipId = `bmiSecClip_${sIdx}`;
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
                    <rect x={xPos} y={yPos} width={w} height={h} rx="18" ry="18" />
                  </clipPath>
                </defs>
                <rect x={xPos} y={yPos} width={w} height={h} rx="18" ry="18" fill={fallbackColor || "#1E293B"} />
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
                  rx="18"
                  ry="18"
                  fill="none"
                  stroke="#FFFFFF"
                  strokeWidth="3.5"
                />
              </g>
            );
          })}
        </g>
      )}

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
      <g
        filter="url(#bmiLogoShadow)"
        data-flier-item="logo"
        data-flier-type="image"
        transform={getTransform("logo")}
        className="cursor-pointer"
      >
        <rect
          x="84"
          y="-43.6915"
          width="360.468"
          height="203.383"
          rx="33.0704"
          fill="#FFFFFF"
        />
        <image
          href={settings.logoUrl || BMI_LOGO_DATA_URL}
          x="140.468"
          y="40.9182"
          width="260"
          height="79.1818"
          preserveAspectRatio="xMidYMid meet"
        />
      </g>

      {/* 3. Floating Composite Spec Card */}
      <g filter="url(#floatingShadow)">
        {/* Furnished Status Tab */}
        <g
          filter="url(#badgeShadow)"
          data-flier-item="furnished"
          data-flier-type="text"
          transform={getTransform("furnished")}
          className="cursor-pointer"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M150.997 772H411.037C422.852 772 432.431 781.578 432.431 793.394V817.801H150.997V772Z"
            fill="#EB7A29"
          />
          <text
            x="281"
            y="801"
            textAnchor="middle"
            fontSize="20"
            fontWeight="900"
            fill="#FFFFFF"
            letterSpacing="2.5"
            className="font-montserrat"
          >
            {data.furnished === false ? "UNFURNISHED" : "FURNISHED"}
          </text>
        </g>

        {/* Navy Spec Container */}
        <path
          opacity="0.88"
          fillRule="evenodd"
          clipRule="evenodd"
          d="M166.69 817.864H421.71C430.03 817.864 436.776 824.609 436.776 832.93V1098.36C436.776 1106.68 430.03 1113.43 421.71 1113.43H166.69C141.728 1113.43 121.492 1093.19 121.492 1068.23V863.062C121.492 838.1 141.728 817.864 166.69 817.864Z"
          fill="#0B2854"
        />

        {/* Giant Orange Bedroom Num + Stacked Details */}
        <g
          data-flier-item="bedrooms"
          data-flier-type="text"
          transform={getTransform("bedrooms")}
          className="cursor-pointer"
        >
          <text
            x="180"
            y="1008"
            textAnchor="middle"
            fontSize="165"
            fontWeight="900"
            fill="#EB7A29"
            className="font-montserrat"
          >
            {bedroomNum}
          </text>
          <line
            x1="234"
            y1="835"
            x2="234"
            y2="1090"
            stroke="#FFFFFF"
            strokeOpacity="0.22"
            strokeWidth="1.5"
          />
          <g transform="translate(248, 842)">
            <text
              x="0"
              y="20"
              fontSize="20"
              fontWeight="800"
              fill="#EB7A29"
              letterSpacing="2"
              className="font-montserrat"
            >
              {bedroomNum === "1" ? "BEDROOM" : "BEDROOMS"}
            </text>
            {titleLines.map((line, idx) => (
              <text
                key={idx}
                x="0"
                y={58 + idx * 36}
                fontSize="23"
                fontWeight="900"
                fill="#FFFFFF"
                letterSpacing="1.5"
                className="font-montserrat"
              >
                {line}
              </text>
            ))}
            {highlightLines.map((hl, idx) => (
              <text
                key={idx}
                x="0"
                y={145 + idx * 32}
                fontSize="19"
                fontWeight="800"
                fill="#EB7A29"
                letterSpacing="1"
                className="font-montserrat"
              >
                {hl}
              </text>
            ))}
          </g>
        </g>

        {/* Documentation Strip */}
        <g
          filter="url(#cardShadow)"
          data-flier-item="documentation"
          data-flier-type="text"
          transform={getTransform("documentation")}
          className="cursor-pointer"
        >
          <rect
            x="137.739"
            y="1125.45"
            width={docWidth}
            height={docLines.length > 1 ? Math.max(70, 42 + docLines.length * (docFontSize + 4)) : 70}
            rx="10"
            fill="#F7F7F7"
            opacity="0.85"
          />
          <text
            x={137.739 + docWidth / 2}
            y={docLines.length > 1 ? 1152 : 1168}
            textAnchor="middle"
            fontSize={docFontSize}
            fontWeight="900"
            fill="#1C3C6A"
            letterSpacing="2.5"
            className="font-montserrat"
          >
            {docLines.map((line, lIdx) => (
              <tspan key={lIdx} x={137.739 + docWidth / 2} dy={lIdx === 0 ? 0 : docFontSize + 4}>
                {line}
              </tspan>
            ))}
          </text>
        </g>

        {/* Location Pill */}
        <g
          filter="url(#cardShadow)"
          data-flier-item="location"
          data-flier-type="text"
          transform={getTransform("location")}
          className="cursor-pointer"
        >
          <rect
            x="436"
            y="824"
            width={locWidth}
            height={locLines.length > 1 ? Math.max(82, 48 + locLines.length * (locFontSize + 4)) : 82}
            rx="16"
            fill="#000000"
            opacity="0.82"
          />
          <g transform="translate(450, 846)">
            <path
              d="M11 0C4.9 0 0 4.9 0 11C0 19.2 11 31 11 31C11 31 22 19.2 22 11C22 4.9 17.1 0 11 0ZM11 15C8.8 15 7 13.2 7 11C7 8.8 8.8 7 11 7C13.2 7 15 8.8 15 11C15 13.2 13.2 15 11 15Z"
              fill="#EB7A29"
              transform="scale(1.15)"
            />
          </g>
          <text
            x="495"
            y={locLines.length > 1 ? 852 : 873}
            fontSize={locFontSize}
            fontWeight="900"
            fill="#FFFFFF"
            letterSpacing="1.5"
            className="font-montserrat"
          >
            {locLines.map((line, lIdx) => (
              <tspan key={lIdx} x="495" dy={lIdx === 0 ? 0 : locFontSize + 4}>
                {line}
              </tspan>
            ))}
          </text>
        </g>

        {/* White Price Box */}
        <g
          filter="url(#cardShadow)"
          data-flier-item="priceNGN"
          data-flier-type="text"
          transform={getTransform("priceNGN")}
          className="cursor-pointer"
        >
          <rect
            x="437"
            y="907"
            width={priceWidth}
            height="136"
            rx="18"
            fill="#FFFFFF"
            opacity="0.96"
          />
          {/* Vertical PRICE label */}
          <g transform="translate(458, 936)">
            <text x="0" y="14" fontSize="13" fontWeight="900" fill="#1A3B66" letterSpacing="2" className="font-montserrat">P</text>
            <text x="0" y="29" fontSize="13" fontWeight="900" fill="#1A3B66" letterSpacing="2" className="font-montserrat">R</text>
            <text x="0" y="44" fontSize="13" fontWeight="900" fill="#1A3B66" letterSpacing="2" className="font-montserrat">I</text>
            <text x="0" y="59" fontSize="13" fontWeight="900" fill="#1A3B66" letterSpacing="2" className="font-montserrat">C</text>
            <text x="0" y="74" fontSize="13" fontWeight="900" fill="#1A3B66" letterSpacing="2" className="font-montserrat">E</text>
            <text x="0" y="88" fontSize="13" fontWeight="900" fill="#1A3B66" letterSpacing="2" className="font-montserrat">:</text>
          </g>

          <text
            x={437 + priceWidth / 2 + 10}
            y="995"
            textAnchor="middle"
            fontSize={priceFontSize}
            fontWeight="900"
            fill="#1C3C6A"
            className="font-montserrat"
          >
            {rawPriceNaira}
          </text>
        </g>

        {/* Orange Initial Deposit Strip */}
        <g
          filter="url(#cardShadow)"
          data-flier-item="priceUsd"
          data-flier-type="text"
          transform={getTransform("priceUsd")}
          className="cursor-pointer"
        >
          <path
            opacity="0.95"
            fillRule="evenodd"
            clipRule="evenodd"
            d="M437 1043H737.62V1080.59C737.62 1091.41 728.851 1100.18 718.035 1100.18H437V1043Z"
            fill="#EB7A29"
          />
          <text
            x="585"
            y="1080"
            textAnchor="middle"
            fontSize="21"
            fontWeight="900"
            fill="#F6F6F6"
            letterSpacing="1.5"
            className="font-montserrat"
          >
            {priceUsd}
          </text>
        </g>
      </g>

      {/* 4. Canvas Bottom Contact Footer */}
      <g
        transform={getTransform("contact", "translate(0, 1293)")}
        data-flier-item="contact"
        data-flier-type="text"
        className="cursor-pointer"
      >
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
  );
}

export const bmiTemplateDefinition: TemplateDefinition = {
  id: "bmi",
  name: "BMI Signature",
  badge: "Luxury",
  themeColor: "#0B2854",
  accentColor: "#EB7A29",
  description: "High-end corporate luxury composite card with bedroom counter & doc strip",
  aspectRatio: "4:5",
  width: 1080,
  height: 1350,
  imageSlots: bmiImageSlots,
  textSlots: bmiTextSlots,
  getItemBoxes: getBmiItemBoxes,
  Component: BmiTemplate,
};
