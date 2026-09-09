"use client";

import React from "react";
import { FlierItemBox } from "../../data/templates";

export interface CanvasSelectionOverlayProps {
  activeBox: FlierItemBox;
  activeOffset: { dx: number; dy: number };
  itemScales?: Record<string, number>;
  handleResizePointerDown: (
    e: React.PointerEvent,
    itemId: string,
    side: "left" | "right",
    currentWidth: number
  ) => void;
}

export function CanvasSelectionOverlay({
  activeBox,
  activeOffset,
  itemScales,
  handleResizePointerDown,
}: CanvasSelectionOverlayProps) {
  return (
    <g
      className="flier-selection-overlay"
      transform={
        activeOffset.dx || activeOffset.dy
          ? `translate(${activeOffset.dx}, ${activeOffset.dy})`
          : undefined
      }
    >
      {/* Dashed Outline Box */}
      <rect
        className="pointer-events-none"
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
          className="pointer-events-none"
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

      {/* Interactive Width Resize Handle (for text elements) */}
      {activeBox.type === "text" && (
        <g
          className="cursor-ew-resize select-none"
          onPointerDown={(e) =>
            handleResizePointerDown(e, activeBox.id, "right", activeBox.width)
          }
        >
          {/* Generous touch/click hit area */}
          <rect
            x={activeBox.x + activeBox.width + 4 - 8}
            y={activeBox.y + activeBox.height / 2 - 22}
            width="22"
            height="44"
            fill="transparent"
          />
          {/* Visual grab pill */}
          <rect
            x={activeBox.x + activeBox.width + 4 - 5}
            y={activeBox.y + activeBox.height / 2 - 18}
            width="10"
            height="36"
            rx="5"
            fill="#F26522"
            stroke="#FFFFFF"
            strokeWidth="2.5"
            filter="drop-shadow(0 2px 8px rgba(0,0,0,0.35))"
          />
          {/* Visual grip bar inside */}
          <line
            x1={activeBox.x + activeBox.width + 4}
            y1={activeBox.y + activeBox.height / 2 - 8}
            x2={activeBox.x + activeBox.width + 4}
            y2={activeBox.y + activeBox.height / 2 + 8}
            stroke="#FFFFFF"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </g>
      )}

      {/* Floating Selection Label Pill with real-time width display */}
      <g
        className="pointer-events-none"
        transform={`translate(${Math.max(16, activeBox.x)}, ${Math.max(42, activeBox.y - 38)})`}
      >
        <rect
          x="0"
          y="0"
          width={Math.max(160, activeBox.label.length * 9 + 85)}
          height="32"
          rx="16"
          fill="#F26522"
          filter="drop-shadow(0 4px 8px rgba(0,0,0,0.35))"
        />
        <text
          x="14"
          y="21"
          fontSize="13"
          fontWeight="800"
          fill="#FFFFFF"
          className="font-montserrat"
        >
          {activeBox.type === "image" ? "📷" : "✏️"} {activeBox.label} · {Math.round(activeBox.width)}px
          {activeBox.type === "text" && itemScales?.[activeBox.id] && itemScales[activeBox.id] !== 1
            ? ` (${Math.round(itemScales[activeBox.id] * 100)}%)`
            : ""}
        </text>
      </g>
    </g>
  );
}
