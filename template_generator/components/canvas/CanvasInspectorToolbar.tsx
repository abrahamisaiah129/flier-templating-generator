"use client";

import React from "react";
import {
  Move,
  RotateCcw,
  Minus,
  Plus,
  WrapText,
  Type,
  Zap,
  Percent,
} from "lucide-react";
import { FlierItemBox } from "../../data/templates";

export interface CanvasInspectorToolbarProps {
  selectedCanvasItemId: string;
  selectedCanvasItemType: "text" | "image";
  currentItemDefaultBox: FlierItemBox | null;
  currentItemOffsets: Record<string, { dx: number; dy: number }>;
  activeItemWidth: number;
  isItemWrapActive: boolean;
  activeItemFontSize: number;
  activeItemScale: number;
  hasCustomFormatting: boolean;
  onStepItemWidth: (id: string, delta: number) => void;
  onToggleItemWrap: (id: string) => void;
  onStepItemFontSize: (id: string, delta: number) => void;
  onStepItemScale: (id: string, delta: number) => void;
  onAutoFitActiveItem: () => void;
  onResetActiveItemPosition: () => void;
  onResetActiveItemFormatting: () => void;
  onDeselect: () => void;
}

export function CanvasInspectorToolbar({
  selectedCanvasItemId,
  selectedCanvasItemType,
  currentItemDefaultBox,
  currentItemOffsets,
  activeItemWidth,
  isItemWrapActive,
  activeItemFontSize,
  activeItemScale,
  hasCustomFormatting,
  onStepItemWidth,
  onToggleItemWrap,
  onStepItemFontSize,
  onStepItemScale,
  onAutoFitActiveItem,
  onResetActiveItemPosition,
  onResetActiveItemFormatting,
  onDeselect,
}: CanvasInspectorToolbarProps) {
  const currentOffset = currentItemOffsets[selectedCanvasItemId];

  return (
    <div className="bg-[#1B494E] text-white p-3 rounded-2xl shadow-lg border border-teal-700/50 space-y-2.5 transition-all">
      {/* Row 1: Header / Selection indicator & Position Offset */}
      <div className="flex items-center justify-between gap-2 text-xs flex-wrap">
        <div className="flex items-center gap-2 font-bold min-w-0">
          <span className="w-2.5 h-2.5 rounded-full bg-[#F26522] animate-pulse flex-shrink-0" />
          <span className="text-teal-200 text-[11px]">Selected:</span>
          <span className="text-white truncate font-extrabold max-w-[120px] sm:max-w-none">
            {currentItemDefaultBox?.label || selectedCanvasItemId}
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 uppercase tracking-wider text-teal-300 font-bold">
            {selectedCanvasItemType}
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Position Delta Offset Indicator */}
          {currentOffset && (currentOffset.dx !== 0 || currentOffset.dy !== 0) && (
            <div className="flex items-center gap-1 bg-black/25 px-2 py-0.5 rounded-lg border border-white/10">
              <span className="text-[10px] text-teal-200 font-bold flex items-center gap-1">
                <Move size={11} />
                <span>
                  {currentOffset.dx > 0 ? `+${currentOffset.dx}` : currentOffset.dx}px,{" "}
                  {currentOffset.dy > 0 ? `+${currentOffset.dy}` : currentOffset.dy}px
                </span>
              </span>
              <button
                type="button"
                onClick={onResetActiveItemPosition}
                className="ml-1 px-1.5 py-0.5 rounded bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer touch-manipulation min-h-[28px]"
                title="Reset element to original template position"
              >
                <RotateCcw size={10} />
                <span>Reset</span>
              </button>
            </div>
          )}

          {/* Deselect button */}
          <button
            type="button"
            onClick={onDeselect}
            className="p-1.5 rounded-md text-teal-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer touch-manipulation min-w-[32px] min-h-[32px] flex items-center justify-center"
            title="Deselect element"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Row 2: Dedicated Text Formatting Toolbar (Width, Wrap, Font Size, Scale, Auto-Fit) */}
      {selectedCanvasItemType === "text" && (
        <div className="pt-2.5 border-t border-teal-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Text Box Width Stepper & Indicator */}
            <div className="flex items-center bg-black/30 rounded-lg p-0.5 border border-white/10">
              <span className="text-[10px] font-bold text-teal-200 px-2 flex items-center gap-1">
                <span>Width:</span>
                <span className="font-mono text-white text-xs font-black">{activeItemWidth}px</span>
              </span>
              <button
                type="button"
                onClick={() => onStepItemWidth(selectedCanvasItemId, -20)}
                className="w-7 h-7 sm:w-6 sm:h-6 rounded bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer active:scale-95 touch-manipulation"
                title="Narrow text box width (-20px)"
              >
                <Minus size={12} />
              </button>
              <button
                type="button"
                onClick={() => onStepItemWidth(selectedCanvasItemId, 20)}
                className="w-7 h-7 sm:w-6 sm:h-6 rounded bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer ml-0.5 active:scale-95 touch-manipulation"
                title="Widen text box width (+20px)"
              >
                <Plus size={12} />
              </button>
            </div>

            {/* Text Wrap Toggle Button */}
            <button
              type="button"
              onClick={() => onToggleItemWrap(selectedCanvasItemId)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95 touch-manipulation min-h-[30px] ${
                isItemWrapActive
                  ? "bg-emerald-600 hover:bg-emerald-500 text-white ring-1 ring-emerald-400"
                  : "bg-white/10 hover:bg-white/20 text-slate-300"
              }`}
              title={
                isItemWrapActive
                  ? "Text wrapping is ON (click to force single line)"
                  : "Text wrapping is OFF (click to enable multi-line wrap)"
              }
            >
              <WrapText size={13} />
              <span>Wrap: {isItemWrapActive ? "ON" : "OFF"}</span>
            </button>

            {/* Font Size Stepper */}
            <div className="flex items-center bg-black/30 rounded-lg p-0.5 border border-white/10">
              <span className="text-[10px] font-bold text-teal-200 px-2 flex items-center gap-1">
                <Type size={11} />
                <span className="font-mono text-white text-xs font-black">{activeItemFontSize}px</span>
              </span>
              <button
                type="button"
                onClick={() => onStepItemFontSize(selectedCanvasItemId, -2)}
                className="w-7 h-7 sm:w-6 sm:h-6 rounded bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer active:scale-95 touch-manipulation"
                title="Decrease font size (-2px)"
              >
                <Minus size={12} />
              </button>
              <button
                type="button"
                onClick={() => onStepItemFontSize(selectedCanvasItemId, 2)}
                className="w-7 h-7 sm:w-6 sm:h-6 rounded bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer ml-0.5 active:scale-95 touch-manipulation"
                title="Increase font size (+2px)"
              >
                <Plus size={12} />
              </button>
            </div>

            {/* Scale Stepper (±10%) */}
            <div className="flex items-center bg-black/30 rounded-lg p-0.5 border border-white/10">
              <span className="text-[10px] font-bold text-teal-200 px-2 flex items-center gap-1">
                <Percent size={11} />
                <span className="font-mono text-white text-xs font-black">{activeItemScale}%</span>
              </span>
              <button
                type="button"
                onClick={() => onStepItemScale(selectedCanvasItemId, -0.1)}
                className="w-7 h-7 sm:w-6 sm:h-6 rounded bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer active:scale-95 touch-manipulation"
                title="Scale text down (-10%)"
              >
                <Minus size={12} />
              </button>
              <button
                type="button"
                onClick={() => onStepItemScale(selectedCanvasItemId, 0.1)}
                className="w-7 h-7 sm:w-6 sm:h-6 rounded bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer ml-0.5 active:scale-95 touch-manipulation"
                title="Scale text up (+10%)"
              >
                <Plus size={12} />
              </button>
            </div>

            {/* Auto-Fit Button */}
            <button
              type="button"
              onClick={onAutoFitActiveItem}
              className="px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95 bg-[#F26522] hover:bg-[#d95315] text-white touch-manipulation min-h-[30px]"
              title="Automatically calculate font size and wrapping to perfectly fit boundaries"
            >
              <Zap size={13} />
              <span>Auto-Fit</span>
            </button>
          </div>

          {/* Reset Box Formatting (Width, Wrap, Font Size, Scale) */}
          {hasCustomFormatting && (
            <button
              type="button"
              onClick={onResetActiveItemFormatting}
              className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-teal-100 hover:text-white text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
              title="Reset text box width, wrapping, font size, and scale to default"
            >
              <RotateCcw size={11} />
              <span>Reset Box</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
