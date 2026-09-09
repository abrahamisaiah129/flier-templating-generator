import React, { RefObject, useRef, useState } from "react";
import { FlierItemBox, getTemplateItemBoxes } from "../data/templates";
import { TemplateId } from "../types/propkit";

export const CANVAS_W = 1080;
export const CANVAS_H = 1350;

export interface UseCanvasInteractionProps {
  svgRef?: RefObject<SVGSVGElement | null>;
  templateId: TemplateId;
  selectedItemId: string | null;
  activeBox: FlierItemBox | null;
  hasSec1: boolean;
  hasSec2: boolean;
  draggable?: boolean;
  effectiveOffsets: Record<string, { dx: number; dy: number }>;
  effectiveWidths: Record<string, number>;
  onSelectItem?: (itemId: string | null, itemType: "text" | "image") => void;
  onItemOffsetsChange?: (offsets: Record<string, { dx: number; dy: number }>) => void;
  onItemWidthChange?: (id: string, width: number) => void;
  setInternalOffsets: React.Dispatch<React.SetStateAction<Record<string, { dx: number; dy: number }>>>;
  setInternalWidths: React.Dispatch<React.SetStateAction<Record<string, number>>>;
}

export function useCanvasInteraction({
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
}: UseCanvasInteractionProps) {
  const [isResizing, setIsResizing] = useState(false);
  const resizeInfoRef = useRef<{
    itemId: string;
    side: "left" | "right";
    startSvgX: number;
    startWidth: number;
  } | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const dragInfoRef = useRef<{
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

  const handleWidthChange = (id: string, width: number) => {
    setInternalWidths((prev) => ({ ...prev, [id]: width }));
    onItemWidthChange?.(id, width);
  };

  const handleResizePointerDown = (
    e: React.PointerEvent,
    itemId: string,
    side: "left" | "right",
    currentWidth: number
  ) => {
    e.stopPropagation();
    const svgCoords = screenToSvgCoords(e.clientX, e.clientY);
    if (!svgCoords) return;

    resizeInfoRef.current = {
      itemId,
      side,
      startSvgX: svgCoords.x,
      startWidth: currentWidth,
    };
    setIsResizing(true);
    try {
      (e.currentTarget as Element).setPointerCapture(e.pointerId);
    } catch {
      // Ignored
    }
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
    if (resizeInfoRef.current) {
      const svgCoords = screenToSvgCoords(e.clientX, e.clientY);
      if (!svgCoords) return;
      const info = resizeInfoRef.current;
      const deltaX = svgCoords.x - info.startSvgX;
      let newWidth = info.side === "right" ? info.startWidth + deltaX : info.startWidth - deltaX;
      newWidth = Math.max(120, Math.min(CANVAS_W - 40, Math.round(newWidth)));
      handleWidthChange(info.itemId, newWidth);
      return;
    }

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
      const boxW = effectiveWidths[info.itemId] || info.itemBox.width;
      const minDx = -info.itemBox.x + 10;
      const maxDx = CANVAS_W - (info.itemBox.x + boxW) - 10;
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
    if (resizeInfoRef.current) {
      try {
        (e.currentTarget as Element).releasePointerCapture(e.pointerId);
      } catch {
        // Ignored
      }
      resizeInfoRef.current = null;
      setIsResizing(false);
    }

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

  return {
    isResizing,
    isDragging,
    screenToSvgCoords,
    handleWidthChange,
    handleResizePointerDown,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
  };
}
