import { AppSettings, PropertyItem } from "../types/propkit";
import { DEFAULT_SETTINGS, SAMPLE_PROPERTIES } from "./constants";

const PROPS_KEY = "propkit_properties_v2";
const SETTINGS_KEY = "propkit_settings_v2";

export function getStoredProperties(): PropertyItem[] {
  if (typeof window === "undefined") return SAMPLE_PROPERTIES;
  try {
    const raw = localStorage.getItem(PROPS_KEY);
    if (!raw) {
      localStorage.setItem(PROPS_KEY, JSON.stringify(SAMPLE_PROPERTIES));
      return SAMPLE_PROPERTIES;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error("Failed to load properties from localStorage", e);
    return SAMPLE_PROPERTIES;
  }
}

export function saveStoredProperty(item: PropertyItem): void {
  if (typeof window === "undefined") return;
  try {
    const list = getStoredProperties();
    const idx = list.findIndex((p) => p.id === item.id);
    let updated: PropertyItem[];
    if (idx >= 0) {
      updated = [...list];
      updated[idx] = item;
    } else {
      updated = [item, ...list];
    }
    localStorage.setItem(PROPS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error("Failed to save property to localStorage", e);
  }
}

export function deleteStoredProperty(id: string): void {
  if (typeof window === "undefined") return;
  try {
    const list = getStoredProperties().filter((p) => p.id !== id);
    localStorage.setItem(PROPS_KEY, JSON.stringify(list));
  } catch (e) {
    console.error("Failed to delete property from localStorage", e);
  }
}

export function getStoredSettings(): AppSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch (e) {
    return DEFAULT_SETTINGS;
  }
}

export function saveStoredSettings(settings: AppSettings): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error("Failed to save settings", e);
  }
}
