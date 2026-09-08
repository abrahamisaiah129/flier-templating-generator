"use client";

import React from "react";
import { PropertyData, AppSettings, TemplateId } from "../../types/propkit";

export interface FlierItemBox {
  id: string;
  type: "text" | "image";
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rx?: number;
}

export interface FlierImageSlot {
  id: string;
  label: string;
  isCover?: boolean;
  description?: string;
}

export interface FlierTextSlot {
  id: string;
  label: string;
  field?: keyof PropertyData;
}

export interface TemplateRenderProps {
  data: PropertyData;
  settings: AppSettings;
  primaryImage: string | null;
  secondaryImages: string[];
  fallbackColor?: string;
  rawPriceNaira: string;
  priceUsd: string;
  bedroomNum: string;
  locationText: string;
  docText: string;
  selectedItemId?: string | null;
  onSelectItem?: (itemId: string | null, itemType: "text" | "image") => void;
  itemOffsets?: Record<string, { dx: number; dy: number }>;
}

export interface TemplateDefinition {
  id: TemplateId;
  name: string;
  badge: string;
  themeColor: string;
  accentColor: string;
  description: string;
  aspectRatio: string;
  width: number;
  height: number;
  imageSlots: FlierImageSlot[];
  textSlots: FlierTextSlot[];
  getItemBoxes: (hasSec1: boolean, hasSec2: boolean) => Record<string, FlierItemBox>;
  Component: React.ComponentType<TemplateRenderProps>;
}
