"use client";

import React, { RefObject, useMemo, useState, useEffect } from "react";
import { PropertyData, AppSettings, TemplateId, CustomTemplateItem } from "../../types/propkit";
import { FIXED_CONTACT, EMPTY_FIELD } from "../../utils/constants";
import { formatNaira, formatUsd } from "../../utils/extractor";
import { getStoredCustomTemplates } from "../../utils/storage";
import { injectPropertyDataIntoSvg } from "../../utils/svgInjection";
import {
  FlierItemBox,
  getTemplateItemBoxes,
  BmiTemplate,
  EkoTemplate,
  EnoseTemplate,
} from "../../data/templates";
import { CanvasSelectionOverlay } from "./CanvasSelectionOverlay";
import { useCanvasInteraction, CANVAS_W, CANVAS_H } from "../../hooks/useCanvasInteraction";

// Re-export constants & types for backward compatibility
export { CANVAS_W, CANVAS_H };
export * from "../../data/templates";

export interface FlyerCanvasProps {
  data: PropertyData;
  settings: AppSettings;
  svgRef?: RefObject<SVGSVGElement | null>;
  primaryImage: string | null;
  secondaryImages?: string[];
  templateId?: TemplateId;
  customTemplate?: CustomTemplateItem;
  className?: string;
  selectedItemId?: string | null;
  onSelectItem?: (itemId: string | null, itemType: "text" | "image") => void;
  onTriggerUpload?: (slotId: string) => void;
  itemOffsets?: Record<string, { dx: number; dy: number }>;
  onItemOffsetsChange?: (offsets: Record<string, { dx: number; dy: number }>) => void;
  draggable?: boolean;
  itemWidths?: Record<string, number>;
  onItemWidthChange?: (id: string, width: number) => void;
  itemWrap?: Record<string, boolean>;
  itemFontSizes?: Record<string, number>;
  itemAlign?: Record<string, "left" | "center" | "right">;
  itemScales?: Record<string, number>;
  onItemScaleChange?: (id: string, scale: number) => void;
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
  selectedItemId = null,
  onSelectItem,
  onTriggerUpload,
  itemOffsets,
  onItemOffsetsChange,
  draggable = true,
  itemWidths,
  onItemWidthChange,
  itemWrap,
  itemFontSizes,
  itemAlign,
  itemScales,
  onItemScaleChange,
}: FlyerCanvasProps) {
  // Local or controlled item offsets
  const [internalOffsets, setInternalOffsets] = useState<Record<string, { dx: number; dy: number }>>({});
  const effectiveOffsets = itemOffsets !== undefined ? itemOffsets : internalOffsets;

  // Local or controlled item widths
  const [internalWidths, setInternalWidths] = useState<Record<string, number>>({});
  const effectiveWidths = itemWidths !== undefined ? itemWidths : internalWidths;

  const resolvedPrimaryImage = primaryImage || null;
  const resolvedSecondaryImages = secondaryImages || [];
  const hasSec1 = resolvedSecondaryImages.length > 0;
  const hasSec2 = resolvedSecondaryImages.length > 1;

  const rawPriceNaira: string = (data.priceNGN ? formatNaira(data.priceNGN) : null) || EMPTY_FIELD;
  const priceUsd: string = (data.priceNGN ? formatUsd(data.priceNGN, settings.usdRate) : null) || EMPTY_FIELD;
  const bedroomNum = data.bedrooms !== null && data.bedrooms !== undefined ? String(data.bedrooms) : "4";
  const locationText = (data.location || "LEKKI PHASE 1, LAGOS").toUpperCase();
  const docText = data.documentation || "Governor's Consent";

  const isCustom = templateId !== "bmi" && templateId !== "eko" && templateId !== "enose";
  const resolvedCustomTemplate =
    customTemplate ||
    (isCustom
      ? (typeof window !== "undefined"
          ? getStoredCustomTemplates().find((t) => t.id === templateId)
          : undefined)
      : undefined);

  const processedCustomSvgInner = useMemo(() => {
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
  }, [
    isCustom,
    resolvedCustomTemplate,
    data,
    resolvedPrimaryImage,
    resolvedSecondaryImages,
    settings,
    rawPriceNaira,
    priceUsd,
    bedroomNum,
    locationText,
    docText,
  ]);

  // Active Bounding Box for the selected element
  const activeBox: FlierItemBox | null = useMemo(() => {
    if (!selectedItemId) return null;
    const boxes = getTemplateItemBoxes(templateId, hasSec1, hasSec2);
    const box = boxes[selectedItemId];
    if (!box) return null;
    const customW = effectiveWidths[selectedItemId];
    return {
      ...box,
      width: customW !== undefined ? customW : box.width,
    };
  }, [selectedItemId, templateId, hasSec1, hasSec2, effectiveWidths]);

  const activeOffset = selectedItemId ? effectiveOffsets[selectedItemId] || { dx: 0, dy: 0 } : { dx: 0, dy: 0 };

  const {
    isResizing,
    isDragging,
    handleResizePointerDown,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
  } = useCanvasInteraction({
    svgRef,
    templateId,
    selectedItemId,
    activeBox,
    hasSec1,
    hasSec2,
    draggable,
    effectiveOffsets,
    effectiveWidths,
    onSelectItem,
    onItemOffsetsChange,
    onItemWidthChange,
    setInternalOffsets,
    setInternalWidths,
  });

  // Sync transform changes for custom SVG templates
  useEffect(() => {
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
      className={`relative overflow-hidden rounded-2xl shadow-xl border border-slate-200/80 bg-white w-full max-w-[420px] sm:max-w-[480px] lg:max-w-none mx-auto ${className}`}
    >
      <svg
        ref={svgRef}
        viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
        width="100%"
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
        className={`block w-full h-auto select-none touch-manipulation ${isDragging ? "cursor-grabbing" : isResizing ? "cursor-ew-resize" : "cursor-default"}`}
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

          <filter id="bmiLogoShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="#000000" floodOpacity="0.3" />
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
            <stop offset="25%" stopColor="#000000" stopOpacity="0.75" />
            <stop offset="60%" stopColor="#000000" stopOpacity="0.96" />
            <stop offset="100%" stopColor="#000000" stopOpacity="1" />
          </linearGradient>

          {/* Enose Clip & Gradients */}
          <clipPath id="enoseArchClip">
            <rect x="48" y="165" width="984" height="1135" rx="28" fill="white" />
          </clipPath>

          <linearGradient id="enoseWarmVignette" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#47290C" stopOpacity="0" />
            <stop offset="45%" stopColor="#47290C" stopOpacity="0.65" />
            <stop offset="85%" stopColor="#47290C" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#47290C" stopOpacity="1" />
          </linearGradient>
        </defs>

        {/* TEMPLATE 1: BMI Signature */}
        {templateId === "bmi" && (
          <BmiTemplate
            data={data}
            settings={settings}
            primaryImage={resolvedPrimaryImage}
            secondaryImages={resolvedSecondaryImages}
            rawPriceNaira={rawPriceNaira}
            priceUsd={priceUsd}
            bedroomNum={bedroomNum}
            locationText={locationText}
            docText={docText}
            selectedItemId={selectedItemId}
            onSelectItem={onSelectItem}
            itemOffsets={effectiveOffsets}
            itemWidths={effectiveWidths}
            itemWrap={itemWrap}
            itemFontSizes={itemFontSizes}
            itemAlign={itemAlign}
            itemScales={itemScales}
          />
        )}

        {/* TEMPLATE 2: Eko Luxury Light */}
        {templateId === "eko" && (
          <EkoTemplate
            data={data}
            settings={settings}
            primaryImage={resolvedPrimaryImage}
            secondaryImages={resolvedSecondaryImages}
            rawPriceNaira={rawPriceNaira}
            priceUsd={priceUsd}
            bedroomNum={bedroomNum}
            locationText={locationText}
            docText={docText}
            selectedItemId={selectedItemId}
            onSelectItem={onSelectItem}
            itemOffsets={effectiveOffsets}
            itemWidths={effectiveWidths}
            itemWrap={itemWrap}
            itemFontSizes={itemFontSizes}
            itemAlign={itemAlign}
            itemScales={itemScales}
          />
        )}

        {/* TEMPLATE 3: Enose Warm Luxury Editorial */}
        {templateId === "enose" && (
          <EnoseTemplate
            data={data}
            settings={settings}
            primaryImage={resolvedPrimaryImage}
            secondaryImages={resolvedSecondaryImages}
            rawPriceNaira={rawPriceNaira}
            priceUsd={priceUsd}
            bedroomNum={bedroomNum}
            locationText={locationText}
            docText={docText}
            selectedItemId={selectedItemId}
            onSelectItem={onSelectItem}
            itemOffsets={effectiveOffsets}
            itemWidths={effectiveWidths}
            itemWrap={itemWrap}
            itemFontSizes={itemFontSizes}
            itemAlign={itemAlign}
            itemScales={itemScales}
          />
        )}

        {/* CUSTOM TEMPLATES */}
        {isCustom && processedCustomSvgInner && (
          <g dangerouslySetInnerHTML={{ __html: processedCustomSvgInner }} />
        )}

        {/* ON-CANVAS SELECTION OVERLAY & CONTROL HANDLES */}
        {activeBox && (
          <CanvasSelectionOverlay
            activeBox={activeBox}
            activeOffset={activeOffset}
            itemScales={itemScales}
            handleResizePointerDown={handleResizePointerDown}
          />
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
          // Fetch failed
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
