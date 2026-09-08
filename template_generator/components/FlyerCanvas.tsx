"use client";

import React, { RefObject, useMemo } from "react";
import { PropertyData, AppSettings, TemplateId, CustomTemplateItem } from "../types/propkit";
import { FIXED_CONTACT, EMPTY_FIELD } from "../utils/constants";
import { formatNaira, formatUsd } from "../utils/extractor";
import { getStoredCustomTemplates } from "../utils/storage";
import {
  FlierItemBox,
  getTemplateItemBoxes,
  BmiTemplate,
  EkoTemplate,
  EnoseTemplate,
} from "../data/templates";

// Re-export for backward compatibility
export * from "../data/templates";

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

  // Primary image tokens (Image 1)
  const pImg = primaryImage || "";
  res = res.split("{{image}}").join(pImg);
  res = res.split("{{image_1}}").join(pImg);
  res = res.split("{{image_0}}").join(pImg);
  res = res.split("{{image_url}}").join(pImg);
  res = res.split("{{primary_image}}").join(pImg);
  res = res.split("{{background_image}}").join(pImg);
  res = res.split("{{hero_image}}").join(pImg);

  // Secondary image tokens
  const sImg1 = secondaryImages[0] || pImg;
  const sImg2 = secondaryImages[1] || sImg1 || pImg;
  const sImg3 = secondaryImages[2] || sImg2 || pImg;
  res = res.split("{{image_2}}").join(sImg1);
  res = res.split("{{secondary_image}}").join(sImg1);
  res = res.split("{{secondary_image_1}}").join(sImg1);
  res = res.split("{{thumbnail_1}}").join(sImg1);
  res = res.split("{{image_3}}").join(sImg2);
  res = res.split("{{secondary_image_2}}").join(sImg2);
  res = res.split("{{thumbnail_2}}").join(sImg2);
  res = res.split("{{image_4}}").join(sImg3);

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
  selectedItemId?: string | null;
  onSelectItem?: (itemId: string | null, itemType: "text" | "image") => void;
  onTriggerUpload?: (slotId: string) => void;
  itemOffsets?: Record<string, { dx: number; dy: number }>;
  onItemOffsetsChange?: (offsets: Record<string, { dx: number; dy: number }>) => void;
  draggable?: boolean;
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
  selectedItemId,
  onSelectItem,
  onTriggerUpload,
  itemOffsets,
  onItemOffsetsChange,
  draggable = true,
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

  const hasSec1 = resolvedSecondaryImages.length > 0;
  const hasSec2 = resolvedSecondaryImages.length > 1;

  // Local or controlled item offsets
  const [internalOffsets, setInternalOffsets] = React.useState<Record<string, { dx: number; dy: number }>>({});
  const effectiveOffsets = itemOffsets !== undefined ? itemOffsets : internalOffsets;

  const [isDragging, setIsDragging] = React.useState(false);
  const dragInfoRef = React.useRef<{
    itemId: string;
    itemType: "text" | "image";
    startSvgX: number;
    startSvgY: number;
    startDx: number;
    startDy: number;
    itemBox: FlierItemBox | null;
    hasMoved: boolean;
  } | null>(null);

  // Helper to convert screen coordinates to SVG viewBox coordinates (0..1080, 0..1350)
  const screenToSvgCoords = (clientX: number, clientY: number): { x: number; y: number } | null => {
    const svg = svgRef?.current;
    if (!svg) return null;
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return null;
    const transformed = pt.matrixTransform(ctm.inverse());
    return { x: transformed.x, y: transformed.y };
  };

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (e.button !== 0) return;

    const target = (e.target as Element).closest("[data-flier-item]");
    const overlayTarget = (e.target as Element).closest(".flier-selection-overlay");

    let targetId: string | null = null;
    let targetType: "text" | "image" = "text";

    if (target) {
      targetId = target.getAttribute("data-flier-item");
      targetType = (target.getAttribute("data-flier-type") || "text") as "text" | "image";
    } else if (overlayTarget && selectedItemId) {
      targetId = selectedItemId;
      targetType = activeBox?.type || "text";
    }

    if (!targetId) {
      onSelectItem?.(null, "text");
      return;
    }

    onSelectItem?.(targetId, targetType);

    if (draggable === false || targetId === "image-primary") {
      return;
    }

    const svgCoords = screenToSvgCoords(e.clientX, e.clientY);
    if (!svgCoords) return;

    const boxes = getTemplateItemBoxes(templateId, hasSec1, hasSec2);
    const box = boxes[targetId] || null;
    const currentOffset = effectiveOffsets[targetId] || { dx: 0, dy: 0 };

    dragInfoRef.current = {
      itemId: targetId,
      itemType: targetType,
      startSvgX: svgCoords.x,
      startSvgY: svgCoords.y,
      startDx: currentOffset.dx,
      startDy: currentOffset.dy,
      itemBox: box,
      hasMoved: false,
    };

    try {
      (e.currentTarget as Element).setPointerCapture(e.pointerId);
    } catch {
      // Ignored
    }
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!dragInfoRef.current) return;
    const info = dragInfoRef.current;
    const svgCoords = screenToSvgCoords(e.clientX, e.clientY);
    if (!svgCoords) return;

    const deltaX = svgCoords.x - info.startSvgX;
    const deltaY = svgCoords.y - info.startSvgY;

    if (!info.hasMoved && (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3)) {
      info.hasMoved = true;
      setIsDragging(true);
    }

    if (!info.hasMoved) return;

    let newDx = info.startDx + deltaX;
    let newDy = info.startDy + deltaY;

    if (info.itemBox) {
      const minDx = -info.itemBox.x + 10;
      const maxDx = CANVAS_W - (info.itemBox.x + info.itemBox.width) - 10;
      newDx = Math.max(minDx, Math.min(maxDx, newDx));

      const minDy = -info.itemBox.y + 10;
      const maxDy = CANVAS_H - (info.itemBox.y + info.itemBox.height) - 10;
      newDy = Math.max(minDy, Math.min(maxDy, newDy));
    }

    const nextOffsets = {
      ...effectiveOffsets,
      [info.itemId]: { dx: Math.round(newDx), dy: Math.round(newDy) },
    };

    setInternalOffsets(nextOffsets);
    onItemOffsetsChange?.(nextOffsets);
  };

  const handlePointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    if (dragInfoRef.current) {
      try {
        (e.currentTarget as Element).releasePointerCapture(e.pointerId);
      } catch {
        // Ignored
      }
      dragInfoRef.current = null;
      setIsDragging(false);
    }
  };

  // Sync transform changes for custom SVG templates
  React.useEffect(() => {
    if (!isCustom || !svgRef?.current) return;
    const svgEl = svgRef.current;
    Object.entries(effectiveOffsets).forEach(([itemId, off]) => {
      const el = svgEl.querySelector(`[data-flier-item="${itemId}"]`);
      if (el) {
        if (off.dx || off.dy) {
          el.setAttribute("transform", `translate(${off.dx}, ${off.dy})`);
        } else {
          el.removeAttribute("transform");
        }
      }
    });
  }, [isCustom, effectiveOffsets, processedCustomSvgInner, svgRef]);

  // Active Bounding Box for the selected element
  const activeBox = useMemo(() => {
    if (!selectedItemId) return null;
    const boxes = getTemplateItemBoxes(templateId, hasSec1, hasSec2);
    return boxes[selectedItemId] || null;
  }, [selectedItemId, templateId, hasSec1, hasSec2]);

  const activeOffset = selectedItemId ? effectiveOffsets[selectedItemId] || { dx: 0, dy: 0 } : { dx: 0, dy: 0 };

  const handleCanvasDoubleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const target = (e.target as Element).closest("[data-flier-item]");
    if (target) {
      const itemId = target.getAttribute("data-flier-item");
      const itemType = (target.getAttribute("data-flier-type") || "text") as "text" | "image";
      if (itemId && itemType === "image") {
        onTriggerUpload?.(itemId);
      }
    }
  };

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
        className={`block w-full h-auto select-none ${isDragging ? "cursor-grabbing" : "cursor-default"}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onDoubleClick={handleCanvasDoubleClick}
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

            [data-flier-item]:not([data-flier-item="image-primary"]) {
              cursor: grab;
            }
            [data-flier-item]:not([data-flier-item="image-primary"]):active {
              cursor: grabbing;
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

        {/* TEMPLATE 1: BMI SIGNATURE (Imported from data/templates) */}
        {templateId === "bmi" && (
          <BmiTemplate
            data={data}
            settings={settings}
            primaryImage={resolvedPrimaryImage}
            secondaryImages={resolvedSecondaryImages}
            fallbackColor={fallbackColor}
            rawPriceNaira={rawPriceNaira}
            priceUsd={priceUsd}
            bedroomNum={bedroomNum}
            locationText={locationText}
            docText={docText}
            selectedItemId={selectedItemId}
            onSelectItem={onSelectItem}
            itemOffsets={effectiveOffsets}
          />
        )}

        {/* TEMPLATE 2: EKO LUX PROP (Imported from data/templates) */}
        {templateId === "eko" && (
          <EkoTemplate
            data={data}
            settings={settings}
            primaryImage={resolvedPrimaryImage}
            secondaryImages={resolvedSecondaryImages}
            fallbackColor={fallbackColor}
            rawPriceNaira={rawPriceNaira}
            priceUsd={priceUsd}
            bedroomNum={bedroomNum}
            locationText={locationText}
            docText={docText}
            selectedItemId={selectedItemId}
            onSelectItem={onSelectItem}
            itemOffsets={effectiveOffsets}
          />
        )}

        {/* TEMPLATE 3: ENOSE LUX PROP (Imported from data/templates) */}
        {templateId === "enose" && (
          <EnoseTemplate
            data={data}
            settings={settings}
            primaryImage={resolvedPrimaryImage}
            secondaryImages={resolvedSecondaryImages}
            fallbackColor={fallbackColor}
            rawPriceNaira={rawPriceNaira}
            priceUsd={priceUsd}
            bedroomNum={bedroomNum}
            locationText={locationText}
            docText={docText}
            selectedItemId={selectedItemId}
            onSelectItem={onSelectItem}
            itemOffsets={effectiveOffsets}
          />
        )}

        {/* CUSTOM TEMPLATES */}
        {isCustom && processedCustomSvgInner && (
          <g dangerouslySetInnerHTML={{ __html: processedCustomSvgInner }} />
        )}

        {/* ON-CANVAS SELECTION OVERLAY & CONTROL HANDLES */}
        {activeBox && (
          <g
            className="flier-selection-overlay pointer-events-none"
            transform={activeOffset.dx || activeOffset.dy ? `translate(${activeOffset.dx}, ${activeOffset.dy})` : undefined}
          >
            {/* Outline Box */}
            <rect
              x={activeBox.x - 4}
              y={activeBox.y - 4}
              width={activeBox.width + 8}
              height={activeBox.height + 8}
              rx={Math.max(4, (activeBox.rx || 0) + 2)}
              fill="none"
              stroke="#F26522"
              strokeWidth="4"
              strokeDasharray="8 6"
              filter="drop-shadow(0 2px 10px rgba(242,101,34,0.5))"
            />
            {/* 4 Corner Control Handles */}
            {[
              { cx: activeBox.x - 4, cy: activeBox.y - 4 },
              { cx: activeBox.x + activeBox.width + 4, cy: activeBox.y - 4 },
              { cx: activeBox.x - 4, cy: activeBox.y + activeBox.height + 4 },
              { cx: activeBox.x + activeBox.width + 4, cy: activeBox.y + activeBox.height + 4 },
            ].map((handle, hIdx) => (
              <rect
                key={hIdx}
                x={handle.cx - 7}
                y={handle.cy - 7}
                width="14"
                height="14"
                fill="#FFFFFF"
                stroke="#F26522"
                strokeWidth="3"
                rx="3"
              />
            ))}
            {/* Floating Selection Label Pill */}
            <g
              transform={`translate(${Math.max(16, activeBox.x)}, ${Math.max(42, activeBox.y - 38)})`}
            >
              <rect
                x="0"
                y="0"
                width={Math.max(140, activeBox.label.length * 10 + 50)}
                height="32"
                rx="16"
                fill="#F26522"
                filter="drop-shadow(0 4px 8px rgba(0,0,0,0.35))"
              />
              <text
                x="14"
                y="21"
                fontSize="14"
                fontWeight="800"
                fill="#FFFFFF"
                className="font-montserrat"
              >
                {activeBox.type === "image" ? "📷" : "✏️"} {activeBox.label}
              </text>
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

    // Ensure selection overlay or inspection handles are stripped from the exported image
    clonedSvg.querySelectorAll(".flier-selection-overlay").forEach((el) => el.remove());

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
          imgEl.removeAttribute("href");
          imgEl.removeAttribute("xlink:href");
        }
      } else if (href) {
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
        resolve();
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
