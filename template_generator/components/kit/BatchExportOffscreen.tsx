"use client";

import React, { MutableRefObject } from "react";
import { UploadedImage, PropertyData, AppSettings, TemplateId, CustomTemplateItem } from "../../types/propkit";
import { FlyerCanvas } from "../canvas/FlyerCanvas";

export interface BatchExportOffscreenProps {
  localImages: UploadedImage[];
  propertiesData: PropertyData[];
  defaultData: PropertyData;
  settings: AppSettings;
  selectedTemplate: TemplateId;
  customTemplate?: CustomTemplateItem;
  itemOffsetsMap: Record<number, Record<string, { dx: number; dy: number }>>;
  itemWidthsMap: Record<number, Record<string, number>>;
  itemWrapMap: Record<number, Record<string, boolean>>;
  itemFontSizesMap: Record<number, Record<string, number>>;
  itemScalesMap: Record<number, Record<string, number>>;
  offscreenSvgs: MutableRefObject<Array<SVGSVGElement | null>>;
}

export function BatchExportOffscreen({
  localImages,
  propertiesData,
  defaultData,
  settings,
  selectedTemplate,
  customTemplate,
  itemOffsetsMap,
  itemWidthsMap,
  itemWrapMap,
  itemFontSizesMap,
  itemScalesMap,
  offscreenSvgs,
}: BatchExportOffscreenProps) {
  return (
    <div
      style={{
        position: "absolute",
        left: -9999,
        top: -9999,
        width: 1080,
        height: 1350,
        overflow: "hidden",
        pointerEvents: "none",
        visibility: "hidden",
      }}
      aria-hidden="true"
    >
      {localImages.map((img, idx) => (
        <div
          key={img.id || idx}
          ref={(el) => {
            if (el) {
              const svg = el.querySelector("svg");
              if (svg) offscreenSvgs.current[idx] = svg;
            }
          }}
        >
          <FlyerCanvas
            data={propertiesData[idx] || defaultData}
            settings={settings}
            primaryImage={img.url}
            secondaryImages={
              localImages
                .filter((_, i) => i !== idx)
                .map((m) => m.url)
            }
            templateId={selectedTemplate}
            customTemplate={customTemplate}
            itemOffsets={itemOffsetsMap[idx] || {}}
            itemWidths={itemWidthsMap[idx] || {}}
            itemWrap={itemWrapMap[idx] || {}}
            itemFontSizes={itemFontSizesMap[idx] || {}}
            itemScales={itemScalesMap[idx] || {}}
            draggable={false}
          />
        </div>
      ))}
    </div>
  );
}
