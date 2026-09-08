"use client";

import { TemplateDefinition, FlierItemBox, FlierImageSlot, FlierTextSlot } from "./types";
import { bmiTemplateDefinition, getBmiItemBoxes } from "./bmi";
import { ekoTemplateDefinition, getEkoItemBoxes } from "./eko";
import { enoseTemplateDefinition, getEnoseItemBoxes } from "./enose";
import { TemplateId } from "../../types/propkit";

export * from "./types";
export * from "./bmi";
export * from "./eko";
export * from "./enose";

export const OFFICIAL_TEMPLATES: TemplateDefinition[] = [
  bmiTemplateDefinition,
  ekoTemplateDefinition,
  enoseTemplateDefinition,
];

export const TEMPLATES_REGISTRY: Record<string, TemplateDefinition> = {
  bmi: bmiTemplateDefinition,
  eko: ekoTemplateDefinition,
  enose: enoseTemplateDefinition,
};

export function getTemplateDefinition(id?: TemplateId): TemplateDefinition {
  if (id && TEMPLATES_REGISTRY[id]) {
    return TEMPLATES_REGISTRY[id];
  }
  return bmiTemplateDefinition;
}

export function getTemplateItemBoxes(
  templateId: TemplateId | undefined,
  hasSec1: boolean,
  hasSec2: boolean
): Record<string, FlierItemBox> {
  switch (templateId) {
    case "eko":
      return getEkoItemBoxes(hasSec1);
    case "enose":
      return getEnoseItemBoxes(hasSec1);
    case "bmi":
    default:
      return getBmiItemBoxes(hasSec1, hasSec2);
  }
}

export function getTemplateImageSlots(templateId: TemplateId | undefined): FlierImageSlot[] {
  const def = getTemplateDefinition(templateId);
  return def.imageSlots || [];
}

export function getTemplateTextSlots(templateId: TemplateId | undefined): FlierTextSlot[] {
  const def = getTemplateDefinition(templateId);
  return def.textSlots || [];
}
