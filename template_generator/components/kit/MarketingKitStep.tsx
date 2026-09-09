"use client";

import React, { RefObject } from "react";
import {
  Download,
  FolderArchive,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Palette,
  Eye,
  Images,
} from "lucide-react";
import {
  PropertyData,
  UploadedImage,
  TemplateId,
  AppSettings,
  CustomTemplateItem,
} from "../../types/propkit";
import { FlyerCanvas } from "../canvas/FlyerCanvas";
import { CanvasInspectorToolbar } from "../canvas/CanvasInspectorToolbar";
import { CaptionGeneratorCard } from "./CaptionGeneratorCard";
import { FlierItemBox } from "../../data/templates";

export interface MarketingKitStepProps {
  data: PropertyData;
  propertiesData: PropertyData[];
  safePropIndex: number;
  localImages: UploadedImage[];
  safeActiveIndex: number;
  currentActiveImage: string | null;
  selectedTemplate: TemplateId;
  currentSelectedCustomTemplate?: CustomTemplateItem;
  effectiveSettings: AppSettings;
  svgRef: RefObject<SVGSVGElement | null>;
  selectedCanvasItemId: string | null;
  selectedCanvasItemType: "text" | "image" | null;
  currentItemDefaultBox: FlierItemBox | null;
  currentItemOffsets: Record<string, { dx: number; dy: number }>;
  currentItemWidths: Record<string, number>;
  currentItemWrap: Record<string, boolean>;
  currentItemFontSizes: Record<string, number>;
  currentItemScales: Record<string, number>;
  activeItemWidth: number;
  isItemWrapActive: boolean;
  activeItemFontSize: number;
  activeItemScale: number;
  hasCustomFormatting: boolean;
  exportScale: number;
  downloading: boolean;
  batchDownloading: boolean;
  batchProgress: string | null;
  caption: string;
  onCaptionChange: (caption: string) => void;
  onSelectImageIndex: (idx: number) => void;
  onSelectCanvasItem: (itemId: string | null, itemType: "text" | "image") => void;
  onItemOffsetsChange: (offsets: Record<string, { dx: number; dy: number }>) => void;
  onItemWidthChange: (id: string, width: number) => void;
  onStepItemWidth: (id: string, delta: number) => void;
  onToggleItemWrap: (id: string) => void;
  onStepItemFontSize: (id: string, delta: number) => void;
  onStepItemScale: (id: string, delta: number) => void;
  onAutoFitActiveItem: () => void;
  onResetActiveItemPosition: () => void;
  onResetActiveItemFormatting: () => void;
  onResetAllPositions: () => void;
  onSetExportScale: (scale: number) => void;
  onDownloadPng: (overrideIdx?: number) => void;
  onDownloadAllZip: () => void;
  onDownloadAllSeparate: () => void;
  onOpenTemplateModal: () => void;
}

export function MarketingKitStep({
  data,
  propertiesData,
  safePropIndex,
  localImages,
  safeActiveIndex,
  currentActiveImage,
  selectedTemplate,
  currentSelectedCustomTemplate,
  effectiveSettings,
  svgRef,
  selectedCanvasItemId,
  selectedCanvasItemType,
  currentItemDefaultBox,
  currentItemOffsets,
  currentItemWidths,
  currentItemWrap,
  currentItemFontSizes,
  currentItemScales,
  activeItemWidth,
  isItemWrapActive,
  activeItemFontSize,
  activeItemScale,
  hasCustomFormatting,
  exportScale,
  downloading,
  batchDownloading,
  batchProgress,
  caption,
  onCaptionChange,
  onSelectImageIndex,
  onSelectCanvasItem,
  onItemOffsetsChange,
  onItemWidthChange,
  onStepItemWidth,
  onToggleItemWrap,
  onStepItemFontSize,
  onStepItemScale,
  onAutoFitActiveItem,
  onResetActiveItemPosition,
  onResetActiveItemFormatting,
  onResetAllPositions,
  onSetExportScale,
  onDownloadPng,
  onDownloadAllZip,
  onDownloadAllSeparate,
  onOpenTemplateModal,
}: MarketingKitStepProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
      {/* LEFT COLUMN: ACTIONS, BATCH EXPORT & CAPTION */}
      <div className="lg:col-span-7 space-y-6 order-last lg:order-first">
        {/* Export Actions Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-6 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-[#1B494E]">
                High-Resolution Flyer Export
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Download ready-to-post graphics formatted at 1080×1350 for Instagram &amp; WhatsApp
              </p>
            </div>
            {/* Resolution Selector */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => onSetExportScale(1)}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer touch-manipulation ${
                  exportScale === 1 ? "bg-white text-[#1B494E] shadow-xs" : "hover:text-slate-900"
                }`}
              >
                1x Standard
              </button>
              <button
                type="button"
                onClick={() => onSetExportScale(2)}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer touch-manipulation ${
                  exportScale === 2 ? "bg-white text-[#1B494E] shadow-xs" : "hover:text-slate-900"
                }`}
              >
                2x Ultra-HD
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => onDownloadPng()}
              disabled={downloading || batchDownloading}
              className="py-3.5 px-4 rounded-xl bg-[#F26522] hover:bg-[#d95315] text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-orange-900/10 transition-transform duration-120 cursor-pointer active:scale-[0.98] disabled:opacity-50 min-h-[48px] touch-manipulation w-full"
            >
              {downloading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Generating Flyer...</span>
                </>
              ) : (
                <>
                  <Download size={16} />
                  <span>Download Active Flyer (PNG)</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onOpenTemplateModal}
              className="py-3.5 px-4 rounded-xl bg-teal-50 hover:bg-teal-100 text-[#1B494E] border border-teal-200 font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-transform duration-120 cursor-pointer active:scale-[0.98] min-h-[48px] touch-manipulation w-full"
            >
              <Palette size={16} />
              <span>Change Template Style</span>
            </button>
          </div>

          {/* Batch Export Options */}
          {localImages.length > 1 && (
            <div className="pt-3 border-t border-slate-100 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">
                  Batch Export All {localImages.length} Outputs
                </span>
                {batchProgress && (
                  <span className="text-[11px] font-semibold text-orange-600 flex items-center gap-1.5">
                    <Loader2 size={12} className="animate-spin" />
                    {batchProgress}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={onDownloadAllZip}
                  disabled={batchDownloading || downloading}
                  className="py-3 px-4 rounded-xl bg-orange-50 hover:bg-orange-100 text-[#F26522] border border-orange-200 font-bold text-xs flex items-center justify-center gap-2 transition-transform duration-120 cursor-pointer active:scale-[0.98] disabled:opacity-50 min-h-[44px] touch-manipulation w-full"
                >
                  <FolderArchive size={16} />
                  <span>Download All ({localImages.length}) as ZIP</span>
                </button>
                <button
                  type="button"
                  onClick={onDownloadAllSeparate}
                  disabled={batchDownloading || downloading}
                  className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition-transform duration-120 cursor-pointer active:scale-[0.98] disabled:opacity-50 min-h-[44px] touch-manipulation w-full"
                >
                  <Download size={16} />
                  <span>Download All Separately</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Social Caption Editor */}
        <CaptionGeneratorCard
          caption={caption}
          onCaptionChange={onCaptionChange}
        />
      </div>

      {/* RIGHT COLUMN: LIVE FLYER SVG CANVAS & TOOLBAR */}
      <div className="lg:col-span-5 space-y-3 order-first lg:order-last lg:sticky lg:top-20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-[#1B494E]">
              Live Flyer Studio
            </span>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#1B494E] text-white">
              {localImages.length <= 1 ? "1 Flyer" : `${localImages.length} Flyers`}
            </span>
          </div>
          <span className="text-[11px] font-semibold text-slate-400">
            1080 × 1350 (4:5)
          </span>
        </div>

        {/* Multi-Image Flyer Pager Bar */}
        {localImages.length > 1 && (
          <div className="bg-white rounded-2xl border border-slate-200/90 p-3 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#1B494E]">
                Flyer {safeActiveIndex + 1} of {localImages.length}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onSelectImageIndex(Math.max(0, safeActiveIndex - 1))}
                  disabled={safeActiveIndex === 0}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  title="Previous flyer"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onSelectImageIndex(Math.min(localImages.length - 1, safeActiveIndex + 1))
                  }
                  disabled={safeActiveIndex === localImages.length - 1}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  title="Next flyer"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            {/* Thumbnail preview strip */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 scrollbar-none -mx-1 px-1">
              {localImages.map((img, idx) => {
                const isActive = idx === safeActiveIndex;
                return (
                  <button
                    key={img.id || idx}
                    type="button"
                    onClick={() => onSelectImageIndex(idx)}
                    className={`relative flex-shrink-0 w-12 h-14 rounded-lg overflow-hidden border-2 transition-transform duration-120 cursor-pointer active:scale-[0.98] touch-manipulation ${
                      isActive
                        ? "border-[#F26522] ring-2 ring-orange-500/30 scale-105 shadow-xs"
                        : "border-slate-200 opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={img.url}
                      alt={`Flyer ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-0 inset-x-0 bg-black/70 text-white text-[9px] font-bold text-center py-0.5">
                      {idx + 1}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Dedicated Canvas Inspector Toolbar */}
        {selectedCanvasItemId && selectedCanvasItemType ? (
          <CanvasInspectorToolbar
            selectedCanvasItemId={selectedCanvasItemId}
            selectedCanvasItemType={selectedCanvasItemType}
            currentItemDefaultBox={currentItemDefaultBox}
            currentItemOffsets={currentItemOffsets}
            activeItemWidth={activeItemWidth}
            isItemWrapActive={isItemWrapActive}
            activeItemFontSize={activeItemFontSize}
            activeItemScale={activeItemScale}
            hasCustomFormatting={hasCustomFormatting}
            onStepItemWidth={onStepItemWidth}
            onToggleItemWrap={onToggleItemWrap}
            onStepItemFontSize={onStepItemFontSize}
            onStepItemScale={onStepItemScale}
            onAutoFitActiveItem={onAutoFitActiveItem}
            onResetActiveItemPosition={onResetActiveItemPosition}
            onResetActiveItemFormatting={onResetActiveItemFormatting}
            onDeselect={() => onSelectCanvasItem(null, "text")}
          />
        ) : (
          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-orange-50/70 border border-orange-100 text-orange-950 text-[11px]">
            <span className="flex items-center gap-1.5 font-medium">
              <span>💡</span>
              <span>
                <strong>Interactive Canvas:</strong> Click &amp; drag any text or photo to reposition. Click text to adjust width, wrap, size &amp; scale.
              </span>
            </span>
            {Object.keys(currentItemOffsets).length > 0 && (
              <button
                type="button"
                onClick={onResetAllPositions}
                className="text-[10px] font-bold text-[#F26522] hover:text-[#d95315] flex items-center gap-1 cursor-pointer flex-shrink-0 ml-2"
              >
                Reset All
              </button>
            )}
          </div>
        )}

        {/* Main Interactive Flyer Canvas */}
        <FlyerCanvas
          data={data}
          settings={effectiveSettings}
          svgRef={svgRef}
          primaryImage={currentActiveImage}
          secondaryImages={
            localImages
              .filter((_, idx) => idx !== safeActiveIndex)
              .map((img) => img.url)
          }
          templateId={selectedTemplate}
          customTemplate={currentSelectedCustomTemplate}
          selectedItemId={selectedCanvasItemId}
          onSelectItem={onSelectCanvasItem}
          itemOffsets={currentItemOffsets}
          onItemOffsetsChange={onItemOffsetsChange}
          draggable={true}
          itemWidths={currentItemWidths}
          onItemWidthChange={onItemWidthChange}
          itemWrap={currentItemWrap}
          itemFontSizes={currentItemFontSizes}
          itemScales={currentItemScales}
        />
      </div>
    </div>
  );
}
