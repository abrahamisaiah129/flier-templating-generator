"use client";

import React, { RefObject } from "react";
import { PropertyData, AppSettings, TemplateId, CustomTemplateItem } from "../types/propkit";
import { FIXED_CONTACT, EMPTY_FIELD } from "../utils/constants";
import {
  BMI_LOGO_DATA_URL,
  EKO_LOGO_DATA_URL,
  ENOSE_LOGO_DATA_URL,
} from "../utils/templateLogos";
import { formatNaira, formatUsd, formatPropertyTypeLines } from "../utils/extractor";
import { getStoredCustomTemplates } from "../utils/storage";

export const CANVAS_W = 1080;
export const CANVAS_H = 1350;

function injectPropertyDataIntoSvg(
  rawSvg: string,
  data: PropertyData,
  primaryImage: string | null,
  secondaryImages: string[] = [],
  settings: AppSettings,
  helpers: {
    rawPriceNaira: string;
    priceUsd: string;
    bedroomNum: string;
    locationText: string;
    docText: string;
  }
): string {
  let res = rawSvg;

  const tokenMap: Record<string, string> = {
    "{{title}}": data.propertyTitle || "Luxury Property",
    "{{property_title}}": data.propertyTitle || "Luxury Property",
    "{{property_type}}": data.propertyType || "Apartment",
    "{{bedrooms}}": helpers.bedroomNum,
    "{{bathrooms}}": String(data.bathrooms || 4),
    "{{location}}": helpers.locationText,
    "{{price}}": helpers.rawPriceNaira,
    "{{price_naira}}": helpers.rawPriceNaira,
    "{{price_usd}}": helpers.priceUsd,
    "{{documentation}}": helpers.docText,
    "{{phone}}": FIXED_CONTACT.phone,
    "{{instagram}}": FIXED_CONTACT.instagram,
    "{{website}}": FIXED_CONTACT.website,
    "{{email}}": FIXED_CONTACT.email,
  };

  for (const [token, value] of Object.entries(tokenMap)) {
    res = res.split(token).join(value);
  }

  // Primary image tokens
  const pImg = primaryImage || "";
  res = res.split("{{image}}").join(pImg);
  res = res.split("{{image_url}}").join(pImg);
  res = res.split("{{primary_image}}").join(pImg);
  res = res.split("{{background_image}}").join(pImg);
  res = res.split("{{hero_image}}").join(pImg);

  // Secondary image tokens
  const sImg1 = secondaryImages[0] || pImg;
  const sImg2 = secondaryImages[1] || sImg1 || pImg;
  res = res.split("{{image_2}}").join(sImg1);
  res = res.split("{{secondary_image}}").join(sImg1);
  res = res.split("{{secondary_image_1}}").join(sImg1);
  res = res.split("{{thumbnail_1}}").join(sImg1);
  res = res.split("{{image_3}}").join(sImg2);
  res = res.split("{{secondary_image_2}}").join(sImg2);
  res = res.split("{{thumbnail_2}}").join(sImg2);

  // Ensure all <image> tags have crossOrigin="anonymous" and both href/xlink:href
  let imgIndex = 0;
  res = res.replace(/<image\b([\s\S]*?)(\/?>)/gi, (match, attrs, close) => {
    let cleanAttrs = attrs;
    const targetUrl = imgIndex === 0 ? pImg : secondaryImages[imgIndex - 1] || pImg;
    imgIndex++;

    if (!cleanAttrs.includes("crossOrigin") && !cleanAttrs.includes("crossorigin")) {
      cleanAttrs += ' crossOrigin="anonymous"';
    }

    if (targetUrl) {
      if (/(?:href|xlink:href)=/i.test(cleanAttrs)) {
        cleanAttrs = cleanAttrs.replace(
          /(?:href|xlink:href)=["'][^"']*["']/gi,
          `href="${targetUrl}" xlink:href="${targetUrl}"`
        );
      } else {
        cleanAttrs += ` href="${targetUrl}" xlink:href="${targetUrl}"`;
      }
    }

    return `<image${cleanAttrs}${close}`;
  });

  return res;
}

interface FlyerCanvasProps {
  data: PropertyData;
  settings: AppSettings;
  svgRef?: RefObject<SVGSVGElement | null>;
  primaryImage: string | null;
  secondaryImages?: string[];
  templateId?: TemplateId;
  customTemplate?: CustomTemplateItem;
  className?: string;
  fallbackColor?: string;
}

export function FlyerCanvas({
  data,
  settings,
  svgRef,
  primaryImage,
  secondaryImages = [],
  templateId = "bmi",
  customTemplate,
  className = "",
  fallbackColor,
}: FlyerCanvasProps) {
  // Ingest image from URL parameters if primaryImage is not provided
  const resolvedPrimaryImage = (() => {
    if (primaryImage && primaryImage.trim().length > 0) return primaryImage.trim();
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const urlImg =
        params.get("image") ||
        params.get("img") ||
        params.get("bg") ||
        params.get("primaryImage");
      if (urlImg) return urlImg.trim();
    }
    return null;
  })();

  // Ingest secondary images from URL parameters if none provided
  const resolvedSecondaryImages = (() => {
    if (secondaryImages && secondaryImages.length > 0) return secondaryImages;
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const multi = params.get("images") || params.get("secondaryImages");
      if (multi) {
        return multi.split(",").map((s) => s.trim()).filter(Boolean);
      }
      const img2 = params.get("image2") || params.get("img2");
      const img3 = params.get("image3") || params.get("img3");
      const list = [img2, img3].filter((s): s is string => Boolean(s && s.trim().length > 0));
      if (list.length > 0) return list;
    }
    return [];
  })();

  // Formatters & helpers
  const rawPriceNaira = formatNaira(data.priceNGN) || "PRICE ON REQUEST";
  const priceUsd = formatUsd(data.priceNGN, settings.usdRate) || "USD ESTIMATE";
  const bedroomNum = data.bedrooms ? String(data.bedrooms) : "4";
  const locationText = (data.location || EMPTY_FIELD).toUpperCase().trim();
  const docText = (data.documentation || "GOVERNOR'S CONSENT").toUpperCase().trim();

  const isCustom = templateId !== "bmi" && templateId !== "eko" && templateId !== "enose";
  const resolvedCustomTemplate =
    customTemplate ||
    (isCustom
      ? (typeof window !== "undefined"
          ? getStoredCustomTemplates().find((t) => t.id === templateId)
          : undefined)
      : undefined);

  const processedCustomSvgInner = (() => {
    if (!isCustom || !resolvedCustomTemplate?.svgMarkup) return "";
    const replaced = injectPropertyDataIntoSvg(
      resolvedCustomTemplate.svgMarkup,
      data,
      resolvedPrimaryImage,
      resolvedSecondaryImages,
      settings,
      {
        rawPriceNaira,
        priceUsd,
        bedroomNum,
        locationText,
        docText,
      }
    );
    const match = replaced.match(/<svg\b[^>]*>([\s\S]*?)<\/svg>/i);
    return match ? match[1] : replaced;
  })();

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
            isCustom
              ? resolvedCustomTemplate?.themeColor || "#0E1626"
              : templateId === "enose"
              ? "#FFF5ED"
              : templateId === "eko"
              ? "#000000"
              : "#0A1D23",
        }}
      >
        <defs>
          <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;800;900&family=Montserrat:wght@400;500;600;700;800;900&family=Playfair+Display:ital,wght@0,600;0,700;0,800;0,900;1,600&family=Plus+Jakarta+Sans:wght@500;600;700;800;900&display=swap');

            .font-montserrat {
              font-family: 'Montserrat', var(--font-montserrat), -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }
            .font-cinzel {
              font-family: 'Cinzel', var(--font-cinzel), 'Playfair Display', Georgia, serif;
            }
            .font-playfair {
              font-family: 'Playfair Display', var(--font-playfair), Georgia, serif;
            }
            .font-sans-clean {
              font-family: 'Plus Jakarta Sans', 'Montserrat', var(--font-plus-jakarta), -apple-system, sans-serif;
            }
            .flier-font {
              font-family: 'Montserrat', var(--font-montserrat), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
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

          <filter id="bmiLogoShadow" x="67.4648" y="-46.9986" width="393.538" height="236.453" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
            <feFlood floodOpacity="0" result="BackgroundImageFix"/>
            <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
            <feOffset dy="13.2282"/>
            <feGaussianBlur stdDeviation="8.2676"/>
            <feComposite in2="hardAlpha" operator="out"/>
            <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.1 0"/>
            <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow"/>
            <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow" result="shape"/>
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
        {/* TEMPLATE 1: BMI SIGNATURE TEMPLATE                         */}
        {/* ========================================================= */}
        {templateId === "bmi" && (
          <g>
            {/* 1. Background Photo Layer with Fallback & CORS handling */}
            <rect x="0" y="0" width={CANVAS_W} height="1293" fill={fallbackColor || "#1E293B"} />
            {resolvedPrimaryImage && (
              <image
                href={resolvedPrimaryImage}
                xlinkHref={resolvedPrimaryImage}
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

            {/* Secondary Photo Containers (Nested rounded thumbnail shapes with clipping masks) */}
            {resolvedSecondaryImages.length > 0 && (
              <g id="bmiSecondaryPhotos" filter="url(#cardShadow)">
                {resolvedSecondaryImages.slice(0, 2).map((secUrl, sIdx) => {
                  const xPos = resolvedSecondaryImages.length === 1 ? 780 : 640 + sIdx * 190;
                  const yPos = 55;
                  const w = resolvedSecondaryImages.length === 1 ? 230 : 175;
                  const h = resolvedSecondaryImages.length === 1 ? 160 : 130;
                  const clipId = `bmiSecClip_${sIdx}`;
                  return (
                    <g key={sIdx}>
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

            {/* 2. Top-Left Logo Badge - Exact Figma curvature & position */}
            <g filter="url(#bmiLogoShadow)">
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
              {/* Furnished Status Tab - Exact Figma Vector Coordinates */}
              <g filter="url(#badgeShadow)">
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

              {/* Navy Spec Container - Exact Figma Vector Coordinates */}
              <path
                opacity="0.88"
                fillRule="evenodd"
                clipRule="evenodd"
                d="M166.69 817.864H421.71C430.03 817.864 436.776 824.609 436.776 832.93V1098.36C436.776 1106.68 430.03 1113.43 421.71 1113.43H166.69C141.728 1113.43 121.492 1093.19 121.492 1068.23V863.062C121.492 838.1 141.728 817.864 166.69 817.864Z"
                fill="#0B2854"
              />

              {/* Giant Orange Bedroom Num + Stacked Details */}
              <g>
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

              {/* Documentation Strip - Exact Figma Vector Coordinates */}
              <g filter="url(#cardShadow)">
                <path
                  opacity="0.85"
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M137.739 1125.45H578.473V1195.66H137.739V1125.45Z"
                  fill="#F7F7F7"
                />
                <text
                  x="358"
                  y="1168"
                  textAnchor="middle"
                  fontSize={docFontSize}
                  fontWeight="900"
                  fill="#1C3C6A"
                  letterSpacing="2.5"
                  className="font-montserrat"
                >
                  {docText.startsWith("TITLE:") ? docText : `TITLE: ${docText}`}
                </text>
              </g>

              {/* Location Pill - Exact Figma Vector Coordinates */}
              <g filter="url(#cardShadow)">
                <path
                  opacity="0.82"
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M436 824H848.696C865.123 824 878.44 839.523 878.44 858.672V903.546C878.44 905.142 877.33 906.436 875.961 906.436H436V824Z"
                  fill="#000000"
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
                  y="873"
                  fontSize={locFontSize}
                  fontWeight="900"
                  fill="#FFFFFF"
                  letterSpacing="1.5"
                  className="font-montserrat"
                >
                  {locationText}
                </text>
              </g>

              {/* White Price Box - Exact Figma Vector Coordinates */}
              <g filter="url(#cardShadow)">
                <path
                  opacity="0.96"
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M437 907H875.121C891.762 907 905.253 920.491 905.253 937.132V1013.37C905.253 1030.01 891.762 1043.5 875.121 1043.5H437V907Z"
                  fill="#FFFFFF"
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
                  x="665"
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

              {/* Orange Initial Deposit / Payment Plan Strip - Exact Figma Path */}
              <g filter="url(#cardShadow)">
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
            {/* Full-bleed Photo Layer with Fallback & CORS handling */}
            <rect x="0" y="0" width={CANVAS_W} height={CANVAS_H} fill={fallbackColor || "#0F172A"} />
            {resolvedPrimaryImage && (
              <image
                href={resolvedPrimaryImage}
                xlinkHref={resolvedPrimaryImage}
                crossOrigin="anonymous"
                x="0"
                y="0"
                width={CANVAS_W}
                height={CANVAS_H}
                preserveAspectRatio="xMidYMid slice"
              />
            )}

            {/* Deep Cinematic Vignette */}
            <rect x="0" y="620" width={CANVAS_W} height="730" fill="url(#ekoBottomGrad)" />

            {/* Secondary Photo Containers (Eko Editorial Thumbnails with clipping masks) */}
            {resolvedSecondaryImages.length > 0 && (
              <g id="ekoSecondaryPhotos" filter="url(#cardShadow)">
                {resolvedSecondaryImages.slice(0, 2).map((secUrl, sIdx) => {
                  const xPos = resolvedSecondaryImages.length === 1 ? 780 : 640 + sIdx * 190;
                  const yPos = 60;
                  const w = resolvedSecondaryImages.length === 1 ? 230 : 175;
                  const h = resolvedSecondaryImages.length === 1 ? 160 : 130;
                  const clipId = `ekoSecClip_${sIdx}`;
                  return (
                    <g key={sIdx}>
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
              y="1042"
              fontSize="28"
              fontWeight="700"
              fill="#FFFFFF"
              letterSpacing="2"
              className="font-montserrat"
            >
              {(data.location || "LEKKI PHASE 1").toUpperCase()}
            </text>
            <text
              x="126"
              y="1132"
              fontSize={ekoPriceFontSize}
              fontWeight="800"
              fill="#FFFFFF"
              letterSpacing="-0.5"
              className="font-cinzel"
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

            {/* Bottom Details */}
            {/* Left Contact Details */}
            <text
              x="126"
              y="1225"
              fontSize="16"
              fontWeight="700"
              fill="#FFFFFF"
              fillOpacity="0.9"
              letterSpacing="1.5"
              className="font-montserrat"
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

            {/* Main Arch-top Photo Frame with Fallback & CORS handling */}
            <g clipPath="url(#enoseArchClip)">
              <rect x="48" y="165" width="984" height="1135" fill={fallbackColor || "#2A1808"} />
              {resolvedPrimaryImage && (
                <image
                  href={resolvedPrimaryImage}
                  xlinkHref={resolvedPrimaryImage}
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

            {/* Enose Secondary Photo Container (Nested Arch/Rounded shape with clipping masks) */}
            {resolvedSecondaryImages.length > 0 && (
              <g id="enoseSecondaryPhotos" filter="url(#cardShadow)">
                {resolvedSecondaryImages.slice(0, 2).map((secUrl, sIdx) => {
                  const xPos = 740;
                  const yPos = resolvedSecondaryImages.length === 1 ? 210 : 210 + sIdx * 155;
                  const w = 240;
                  const h = resolvedSecondaryImages.length === 1 ? 165 : 135;
                  const clipId = `enoseSecClip_${sIdx}`;
                  return (
                    <g key={sIdx}>
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
              {/* Subtitle */}
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

              {/* Huge Bold Location Headline */}
              <text
                x="525"
                y="1115"
                fontSize={enoseLocFontSize}
                fontWeight="800"
                fill="#FFF5ED"
                letterSpacing="1"
                className="font-montserrat"
              >
                {enoseLocation.line1}
              </text>
              {enoseLocation.line2 && (
                <text
                  x="525"
                  y="1175"
                  fontSize={enoseLocFontSize}
                  fontWeight="800"
                  fill="#FFF5ED"
                  letterSpacing="1"
                  className="font-montserrat"
                >
                  {enoseLocation.line2}
                </text>
              )}
            </g>
          </g>
        )}

        {/* ========================================================= */}
        {/* TEMPLATE 4+: CUSTOM SAVED TEMPLATES                       */}
        {/* ========================================================= */}
        {isCustom && processedCustomSvgInner && (
          <g dangerouslySetInnerHTML={{ __html: processedCustomSvgInner }} />
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

    // Convert any external <image> hrefs to Data URLs to guarantee clean canvas export
    const images = Array.from(clonedSvg.querySelectorAll("image"));
    for (const imgEl of images) {
      const href = imgEl.getAttribute("href") || imgEl.getAttribute("xlink:href");
      imgEl.setAttribute("crossOrigin", "anonymous");

      if (href && href.startsWith("http")) {
        let convertedDataUrl: string | null = null;

        // Method 1: Fetch with CORS
        try {
          const res = await fetch(href, { mode: "cors" });
          if (res.ok) {
            const blob = await res.blob();
            convertedDataUrl = await new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.readAsDataURL(blob);
            });
          }
        } catch {
          // Fetch failed (e.g. CORS blocked by host)
        }

        // Method 2: Offscreen image draw if fetch failed
        if (!convertedDataUrl) {
          try {
            const imgObj = new window.Image();
            imgObj.crossOrigin = "anonymous";
            convertedDataUrl = await new Promise<string | null>((resolve) => {
              imgObj.onload = () => {
                try {
                  const offCanvas = document.createElement("canvas");
                  offCanvas.width = imgObj.naturalWidth || 400;
                  offCanvas.height = imgObj.naturalHeight || 300;
                  const offCtx = offCanvas.getContext("2d");
                  if (offCtx) {
                    offCtx.drawImage(imgObj, 0, 0);
                    resolve(offCanvas.toDataURL("image/png"));
                    return;
                  }
                } catch {
                  // Canvas tainted
                }
                resolve(null);
              };
              imgObj.onerror = () => resolve(null);
              imgObj.src = href;
            });
          } catch {
            // Offscreen attempt failed
          }
        }

        if (convertedDataUrl) {
          imgEl.setAttribute("href", convertedDataUrl);
          imgEl.setAttribute("xlink:href", convertedDataUrl);
        } else {
          // If the remote host completely forbids cross-origin extraction,
          // remove the external link so the canvas is NOT tainted and toBlob never fails!
          // The underlying fallback rect gracefully provides the background.
          imgEl.removeAttribute("href");
          imgEl.removeAttribute("xlink:href");
        }
      } else if (href) {
        // Ensure both attributes are in sync
        imgEl.setAttribute("href", href);
        imgEl.setAttribute("xlink:href", href);
      }
    }

    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(clonedSvg);
    const svgBlob = new Blob([svgStr], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    if (typeof document !== "undefined" && document.fonts?.ready) {
      await document.fonts.ready;
    }

    const img = new window.Image();
    const loaded = new Promise<void>((resolve) => {
      img.onload = () => resolve();
      img.onerror = (e) => {
        console.warn("SVG rasterizer encountered non-fatal image warning, rendering with fallbacks:", e);
        resolve(); // Never block the user export
      };
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
      try {
        canvas.toBlob((blob) => resolve(blob), "image/png");
      } catch (toBlobErr) {
        console.warn("Canvas toBlob error:", toBlobErr);
        resolve(null);
      }
    });
  } catch (err) {
    console.error("Failed to render SVG to PNG without blocking:", err);
    return null;
  }
}
