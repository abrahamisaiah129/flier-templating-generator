"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import {
  ActiveView,
  AppSettings,
  PropertyData,
  PropertyItem,
  TemplateId,
  UploadedImage,
} from "../types/propkit";
import {
  getStoredProperties,
  getStoredSettings,
  saveStoredProperty,
  deleteStoredProperty,
  saveStoredSettings,
} from "../utils/storage";
import { extractDetailsLocally } from "../utils/extractor";
import { DEFAULT_SETTINGS } from "../utils/constants";

export interface PropKitContextValue {
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  properties: PropertyItem[];
  settings: AppSettings;
  settingsOpen: boolean;
  setSettingsOpen: (open: boolean) => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  extracting: boolean;
  extractError: string | null;

  // Active property review & kit state
  currentReviewData: PropertyData | null;
  setCurrentReviewData: (data: PropertyData | null) => void;
  currentReviewDataList: PropertyData[];
  setCurrentReviewDataList: (list: PropertyData[]) => void;
  currentImages: UploadedImage[];
  setCurrentImages: (images: UploadedImage[]) => void;
  currentPrimaryId: string | null;
  setCurrentPrimaryId: (id: string | null) => void;
  currentTemplateId: TemplateId;
  setCurrentTemplateId: (templateId: TemplateId) => void;
  currentBriefText: string;
  setCurrentBriefText: (text: string) => void;
  currentBriefUrl: string;
  setCurrentBriefUrl: (url: string) => void;
  existingId?: string;
  setExistingId: (id: string | undefined) => void;
  existingCaption?: string;
  setExistingCaption: (caption: string | undefined) => void;

  // Actions
  saveSettings: (newSettings: AppSettings) => void;
  startExtraction: (
    briefs: string[],
    images: UploadedImage[],
    briefUrl?: string,
    templateId?: TemplateId
  ) => Promise<void>;
  saveProperty: (prop: PropertyItem) => void;
  deleteProperty: (id: string) => void;
  updatePropertyTemplate: (id: string, templateId: TemplateId) => void;
  openProperty: (prop: PropertyItem) => void;
  resetWorkflow: () => void;
}

const PropKitContext = createContext<PropKitContextValue | null>(null);

export function PropKitProvider({ children }: { children: ReactNode }) {
  const [activeView, setActiveView] = useState<ActiveView>("new");
  const [properties, setProperties] = useState<PropertyItem[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);

  // Active property workflow state
  const [currentReviewData, setCurrentReviewData] = useState<PropertyData | null>(null);
  const [currentReviewDataList, setCurrentReviewDataList] = useState<PropertyData[]>([]);
  const [currentImages, setCurrentImages] = useState<UploadedImage[]>([]);
  const [currentPrimaryId, setCurrentPrimaryId] = useState<string | null>(null);
  const [currentTemplateId, setCurrentTemplateId] = useState<TemplateId>("bmi");
  const [currentBriefText, setCurrentBriefText] = useState<string>("");
  const [currentBriefUrl, setCurrentBriefUrl] = useState<string>("");
  const [existingId, setExistingId] = useState<string | undefined>(undefined);
  const [existingCaption, setExistingCaption] = useState<string | undefined>(undefined);

  // Hydrate from localStorage once mounted
  useEffect(() => {
    if (typeof window !== "undefined") {
      setProperties(getStoredProperties());
      setSettings(getStoredSettings());
    }
  }, []);

  const saveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    saveStoredSettings(newSettings);
  };

  const startExtraction = async (
    briefs: string[],
    images: UploadedImage[],
    briefUrl?: string,
    templateId?: TemplateId
  ) => {
    setExtracting(true);
    setExtractError(null);

    try {
      await new Promise((r) => setTimeout(r, 600));

      const nonBlankBriefs = briefs.filter((b) => b.trim().length > 0);
      const targetBriefs = nonBlankBriefs.length > 0 ? nonBlankBriefs : briefs;
      const dataList: PropertyData[] = targetBriefs.map((b) => extractDetailsLocally(b));

      const combinedBriefText = briefs
        .map((b, i) => (briefs.length > 1 ? `[Brief ${i + 1}]\n${b}` : b))
        .filter((b) => b.trim().length > 0)
        .join("\n\n");

      const primaryExtracted = dataList[0] || extractDetailsLocally(combinedBriefText);

      setCurrentReviewData(primaryExtracted);
      setCurrentReviewDataList(dataList);
      setCurrentImages(images);
      setCurrentPrimaryId(images.length > 0 ? images[0].id : null);
      if (templateId) {
        setCurrentTemplateId(templateId);
      }
      setCurrentBriefText(combinedBriefText);
      setCurrentBriefUrl(briefUrl || "");
      setExistingId(undefined);
      setExistingCaption(undefined);
      setActiveView("review");
    } catch (err) {
      console.error("Extraction error", err);
      setExtractError("Extraction failed. Please check the brief content.");
    } finally {
      setExtracting(false);
    }
  };

  const saveProperty = (prop: PropertyItem) => {
    saveStoredProperty(prop);
    setProperties(getStoredProperties());
  };

  const deleteProperty = (id: string) => {
    deleteStoredProperty(id);
    setProperties(getStoredProperties());
  };

  const updatePropertyTemplate = (id: string, templateId: TemplateId) => {
    const existing = properties.find((p) => p.id === id);
    if (existing) {
      const updated: PropertyItem = { ...existing, templateId };
      saveStoredProperty(updated);
      setProperties(getStoredProperties());
    }
  };

  const openProperty = (prop: PropertyItem) => {
    setCurrentReviewData(prop.data);
    setCurrentReviewDataList([prop.data]);
    setCurrentImages(prop.images || []);
    setCurrentPrimaryId(prop.primaryId || prop.images?.[0]?.id || null);
    setCurrentTemplateId(prop.templateId || "bmi");
    setCurrentBriefText(prop.briefText);
    setCurrentBriefUrl(prop.briefUrl || "");
    setExistingId(prop.id);
    setExistingCaption(prop.caption);
    setActiveView("kit");
  };

  const resetWorkflow = () => {
    setCurrentReviewData(null);
    setCurrentReviewDataList([]);
    setCurrentImages([]);
    setCurrentPrimaryId(null);
    setCurrentTemplateId("bmi");
    setCurrentBriefText("");
    setCurrentBriefUrl("");
    setExistingId(undefined);
    setExistingCaption(undefined);
  };

  return (
    <PropKitContext.Provider
      value={{
        activeView,
        setActiveView,
        properties,
        settings,
        settingsOpen,
        setSettingsOpen,
        mobileMenuOpen,
        setMobileMenuOpen,
        extracting,
        extractError,
        currentReviewData,
        setCurrentReviewData,
        currentReviewDataList,
        setCurrentReviewDataList,
        currentImages,
        setCurrentImages,
        currentPrimaryId,
        setCurrentPrimaryId,
        currentTemplateId,
        setCurrentTemplateId,
        currentBriefText,
        setCurrentBriefText,
        currentBriefUrl,
        setCurrentBriefUrl,
        existingId,
        setExistingId,
        existingCaption,
        setExistingCaption,
        saveSettings,
        startExtraction,
        saveProperty,
        deleteProperty,
        updatePropertyTemplate,
        openProperty,
        resetWorkflow,
      }}
    >
      {children}
    </PropKitContext.Provider>
  );
}

export function usePropKit(): PropKitContextValue {
  const ctx = useContext(PropKitContext);
  if (!ctx) {
    throw new Error("usePropKit must be used within a PropKitProvider");
  }
  return ctx;
}
