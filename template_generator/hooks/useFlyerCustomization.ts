import { useState, useMemo } from "react";
import { PropertyData, TemplateId } from "../types/propkit";
import { getTemplateItemBoxes, FlierItemBox } from "../data/templates";
import { formatNaira } from "../utils/extractor";
import { fitSvgText } from "../utils/textWrap";

export interface UseFlyerCustomizationProps {
  selectedTemplate: TemplateId;
  activePropertyIndex: number;
  propertiesCount: number;
  hasMultipleImages: boolean;
  hasThreeImages: boolean;
  selectedCanvasItemId: string | null;
  currentPropertyData?: PropertyData | null;
}

export function useFlyerCustomization({
  selectedTemplate,
  activePropertyIndex,
  propertiesCount,
  hasMultipleImages,
  hasThreeImages,
  selectedCanvasItemId,
  currentPropertyData,
}: UseFlyerCustomizationProps) {
  const safePropIndex = Math.min(
    Math.max(0, activePropertyIndex),
    Math.max(0, propertiesCount - 1)
  );

  // Custom positioning offsets per property index
  const [itemOffsetsMap, setItemOffsetsMap] = useState<
    Record<number, Record<string, { dx: number; dy: number }>>
  >({});

  // Custom widths per property index
  const [itemWidthsMap, setItemWidthsMap] = useState<
    Record<number, Record<string, number>>
  >({});

  // Custom wrapping toggles per property index
  const [itemWrapMap, setItemWrapMap] = useState<
    Record<number, Record<string, boolean>>
  >({});

  // Custom font sizes per property index
  const [itemFontSizesMap, setItemFontSizesMap] = useState<
    Record<number, Record<string, number>>
  >({});

  // Custom scale factor per item (e.g. 1.0 = 100%, 0.8 = 80%)
  const [itemScalesMap, setItemScalesMap] = useState<
    Record<number, Record<string, number>>
  >({});

  const currentItemOffsets = itemOffsetsMap[safePropIndex] || {};
  const currentItemWidths = itemWidthsMap[safePropIndex] || {};
  const currentItemWrap = itemWrapMap[safePropIndex] || {};
  const currentItemFontSizes = itemFontSizesMap[safePropIndex] || {};
  const currentItemScales = itemScalesMap[safePropIndex] || {};

  const currentItemDefaultBox = useMemo(() => {
    if (!selectedCanvasItemId) return null;
    const boxes = getTemplateItemBoxes(selectedTemplate, hasMultipleImages, hasThreeImages);
    return boxes[selectedCanvasItemId] || null;
  }, [selectedCanvasItemId, selectedTemplate, hasMultipleImages, hasThreeImages]);

  const activeItemWidth = selectedCanvasItemId
    ? Math.round(currentItemWidths[selectedCanvasItemId] ?? currentItemDefaultBox?.width ?? 400)
    : 400;

  const isItemWrapActive = selectedCanvasItemId
    ? currentItemWrap[selectedCanvasItemId] !== false
    : true;

  const activeItemFontSize = selectedCanvasItemId
    ? (currentItemFontSizes[selectedCanvasItemId] || (
        selectedCanvasItemId === "location" ? (selectedTemplate === "enose" ? 46 : 28) :
        selectedCanvasItemId === "priceNGN" ? 48 :
        selectedCanvasItemId === "documentation" ? 21 : 24
      ))
    : 24;

  const activeItemScale = selectedCanvasItemId
    ? Math.round((currentItemScales[selectedCanvasItemId] ?? 1.0) * 100)
    : 100;

  const hasCustomFormatting = Boolean(
    (selectedCanvasItemId && currentItemWidths[selectedCanvasItemId] !== undefined) ||
    (selectedCanvasItemId && currentItemWrap[selectedCanvasItemId] !== undefined) ||
    (selectedCanvasItemId && currentItemFontSizes[selectedCanvasItemId] !== undefined) ||
    (selectedCanvasItemId && currentItemScales[selectedCanvasItemId] !== undefined)
  );

  const handleItemOffsetsChange = (offsets: Record<string, { dx: number; dy: number }>) => {
    setItemOffsetsMap((prev) => ({
      ...prev,
      [safePropIndex]: offsets,
    }));
  };

  const handleItemWidthChange = (itemId: string, width: number) => {
    setItemWidthsMap((prev) => ({
      ...prev,
      [safePropIndex]: {
        ...(prev[safePropIndex] || {}),
        [itemId]: Math.max(80, Math.round(width)),
      },
    }));
  };

  const handleStepItemWidth = (itemId: string, delta: number) => {
    const defaultBox = currentItemDefaultBox;
    const currentW = currentItemWidths[itemId] ?? defaultBox?.width ?? 400;
    const nextW = Math.max(80, currentW + delta);
    handleItemWidthChange(itemId, nextW);
  };

  const handleToggleItemWrap = (itemId: string) => {
    const currentVal = currentItemWrap[itemId] !== false;
    setItemWrapMap((prev) => ({
      ...prev,
      [safePropIndex]: {
        ...(prev[safePropIndex] || {}),
        [itemId]: !currentVal,
      },
    }));
  };

  const handleStepItemFontSize = (itemId: string, delta: number) => {
    const baseSize =
      currentItemFontSizes[itemId] ||
      (itemId === "location" ? (selectedTemplate === "enose" ? 46 : 28) :
       itemId === "priceNGN" ? 48 :
       itemId === "documentation" ? 21 : 24);
    const nextSize = Math.max(10, Math.min(120, baseSize + delta));
    setItemFontSizesMap((prev) => ({
      ...prev,
      [safePropIndex]: {
        ...(prev[safePropIndex] || {}),
        [itemId]: nextSize,
      },
    }));
  };

  const handleItemScaleChange = (itemId: string, scale: number) => {
    setItemScalesMap((prev) => ({
      ...prev,
      [safePropIndex]: {
        ...(prev[safePropIndex] || {}),
        [itemId]: Math.max(0.4, Math.min(2.0, Math.round(scale * 100) / 100)),
      },
    }));
  };

  const handleStepItemScale = (itemId: string, delta: number) => {
    const currentScale = currentItemScales[itemId] ?? 1.0;
    const nextScale = Math.max(0.4, Math.min(2.0, Math.round((currentScale + delta) * 100) / 100));
    handleItemScaleChange(itemId, nextScale);
  };

  const handleAutoFitActiveItem = () => {
    if (!selectedCanvasItemId || !currentPropertyData) return;
    const itemId = selectedCanvasItemId;
    let text = "";
    if (itemId === "location") text = currentPropertyData.location || "";
    else if (itemId === "priceNGN") text = formatNaira(currentPropertyData.priceNGN) || "";
    else if (itemId === "documentation") text = currentPropertyData.documentation || "";
    else if (itemId === "propertyTitle") text = currentPropertyData.propertyType || "";
    else if (itemId === "bedrooms") text = `${currentPropertyData.bedrooms || 4} BEDROOMS`;

    const box = currentItemDefaultBox;
    const targetWidth = currentItemWidths[itemId] ?? box?.width ?? 400;

    const baseSize =
      itemId === "location" ? (selectedTemplate === "enose" ? 44 : 25) :
      itemId === "priceNGN" ? 54 :
      itemId === "documentation" ? 21 : 24;

    const fitResult = fitSvgText(text, targetWidth, baseSize, {
      maxLines: 2,
      minFontSize: 13,
      breakWords: true,
    });

    if (fitResult.lines.length > 1) {
      setItemWrapMap((prev) => ({
        ...prev,
        [safePropIndex]: {
          ...(prev[safePropIndex] || {}),
          [itemId]: true,
        },
      }));
    }

    setItemFontSizesMap((prev) => ({
      ...prev,
      [safePropIndex]: {
        ...(prev[safePropIndex] || {}),
        [itemId]: fitResult.fontSize,
      },
    }));

    setItemScalesMap((prev) => ({
      ...prev,
      [safePropIndex]: {
        ...(prev[safePropIndex] || {}),
        [itemId]: 1.0,
      },
    }));
  };

  const handleResetActiveItemPosition = () => {
    if (!selectedCanvasItemId) return;
    setItemOffsetsMap((prev) => {
      const current = { ...(prev[safePropIndex] || {}) };
      delete current[selectedCanvasItemId];
      return { ...prev, [safePropIndex]: current };
    });
  };

  const handleResetActiveItemFormatting = () => {
    if (!selectedCanvasItemId) return;
    setItemWidthsMap((prev) => {
      const copy = { ...(prev[safePropIndex] || {}) };
      delete copy[selectedCanvasItemId];
      return { ...prev, [safePropIndex]: copy };
    });
    setItemWrapMap((prev) => {
      const copy = { ...(prev[safePropIndex] || {}) };
      delete copy[selectedCanvasItemId];
      return { ...prev, [safePropIndex]: copy };
    });
    setItemFontSizesMap((prev) => {
      const copy = { ...(prev[safePropIndex] || {}) };
      delete copy[selectedCanvasItemId];
      return { ...prev, [safePropIndex]: copy };
    });
    setItemScalesMap((prev) => {
      const copy = { ...(prev[safePropIndex] || {}) };
      delete copy[selectedCanvasItemId];
      return { ...prev, [safePropIndex]: copy };
    });
  };

  const handleResetAllPositions = () => {
    setItemOffsetsMap((prev) => {
      const copy = { ...prev };
      delete copy[safePropIndex];
      return copy;
    });
    setItemWidthsMap((prev) => {
      const copy = { ...prev };
      delete copy[safePropIndex];
      return copy;
    });
    setItemWrapMap((prev) => {
      const copy = { ...prev };
      delete copy[safePropIndex];
      return copy;
    });
    setItemFontSizesMap((prev) => {
      const copy = { ...prev };
      delete copy[safePropIndex];
      return copy;
    });
    setItemScalesMap((prev) => {
      const copy = { ...prev };
      delete copy[safePropIndex];
      return copy;
    });
  };

  return {
    safePropIndex,
    itemOffsetsMap,
    itemWidthsMap,
    itemWrapMap,
    itemFontSizesMap,
    itemScalesMap,
    currentItemOffsets,
    currentItemWidths,
    currentItemWrap,
    currentItemFontSizes,
    currentItemScales,
    currentItemDefaultBox,
    activeItemWidth,
    isItemWrapActive,
    activeItemFontSize,
    activeItemScale,
    hasCustomFormatting,
    handleItemOffsetsChange,
    handleItemWidthChange,
    handleStepItemWidth,
    handleToggleItemWrap,
    handleStepItemFontSize,
    handleItemScaleChange,
    handleStepItemScale,
    handleAutoFitActiveItem,
    handleResetActiveItemPosition,
    handleResetActiveItemFormatting,
    handleResetAllPositions,
  };
}
