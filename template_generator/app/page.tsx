"use client";

import React, { useState } from "react";
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
import { Sidebar } from "../components/Sidebar";
import { TopBar } from "../components/TopBar";
import { NewPropertyView } from "../components/NewPropertyView";
import { HistoryView } from "../components/HistoryView";
import { DashboardView } from "../components/DashboardView";
import { ReviewAndKitView } from "../components/ReviewAndKitView";
import { SettingsModal } from "../components/SettingsModal";
import { DEFAULT_SETTINGS } from "../utils/constants";

export default function Home() {
  const [activeView, setActiveView] = useState<ActiveView>("new");
  const [properties, setProperties] = useState<PropertyItem[]>(() =>
    typeof window !== "undefined" ? getStoredProperties() : []
  );
  const [settings, setSettings] = useState<AppSettings>(() =>
    typeof window !== "undefined" ? getStoredSettings() : DEFAULT_SETTINGS
  );
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);

  // State for active property being created or viewed
  const [currentReviewData, setCurrentReviewData] = useState<PropertyData | null>(null);
  const [currentImages, setCurrentImages] = useState<UploadedImage[]>([]);
  const [currentPrimaryId, setCurrentPrimaryId] = useState<string | null>(null);
  const [currentTemplateId, setCurrentTemplateId] = useState<TemplateId | undefined>("bmi");
  const [currentBriefText, setCurrentBriefText] = useState<string>("");
  const [currentBriefUrl, setCurrentBriefUrl] = useState<string>("");
  const [existingId, setExistingId] = useState<string | undefined>(undefined);
  const [existingCaption, setExistingCaption] = useState<string | undefined>(undefined);

  const handleSaveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    saveStoredSettings(newSettings);
  };

  const handleStartExtraction = async (
    briefs: string[],
    images: UploadedImage[],
    briefUrl?: string
  ) => {
    setExtracting(true);
    setExtractError(null);

    try {
      // Simulate rapid AI extraction polish
      await new Promise((r) => setTimeout(r, 600));

      // Combine briefs if multi-brief
      const combinedBriefText = briefs
        .map((b, i) => (briefs.length > 1 ? `[Brief ${i + 1}]\n${b}` : b))
        .filter((b) => b.trim().length > 0)
        .join("\n\n");

      const extracted = extractDetailsLocally(combinedBriefText);

      setCurrentReviewData(extracted);
      setCurrentImages(images);
      setCurrentPrimaryId(images.length > 0 ? images[0].id : null);
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

  const handleSaveProperty = (prop: PropertyItem) => {
    saveStoredProperty(prop);
    setProperties(getStoredProperties());
  };

  const handleDeleteProperty = (id: string) => {
    deleteStoredProperty(id);
    setProperties(getStoredProperties());
  };

  const handleOpenProperty = (prop: PropertyItem) => {
    setCurrentReviewData(prop.data);
    setCurrentImages(prop.images || []);
    setCurrentPrimaryId(prop.primaryId || prop.images?.[0]?.id || null);
    setCurrentTemplateId(prop.templateId || "bmi");
    setCurrentBriefText(prop.briefText);
    setCurrentBriefUrl(prop.briefUrl || "");
    setExistingId(prop.id);
    setExistingCaption(prop.caption);
    setActiveView("kit");
  };

  return (
    <div className="flex min-h-screen bg-[#F4F9F9] font-sans antialiased text-slate-900">
      {/* Figma Dark Teal Sidebar (Fixed on Desktop, Slide-in Drawer on Mobile) */}
      <Sidebar
        activeView={activeView}
        onNavigate={(view) => {
          setActiveView(view);
          setMobileMenuOpen(false);
          if (view === "new") {
            setCurrentReviewData(null);
            setCurrentImages([]);
            setCurrentTemplateId("bmi");
            setExistingId(undefined);
          }
        }}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Area - offset by md:pl-60 for the fixed desktop sidebar */}
      <div className="flex-1 flex flex-col min-w-0 md:pl-60">
        {/* Top Header Bar with Mobile Hamburger Trigger */}
        <TopBar
          activeView={activeView}
          onOpenSettings={() => setSettingsOpen(true)}
          onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
        />

        {/* Content Views */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {activeView === "dashboard" && (
            <DashboardView
              properties={properties}
              onNewProperty={() => setActiveView("new")}
              onOpenProperty={handleOpenProperty}
              onViewAllHistory={() => setActiveView("history")}
            />
          )}

          {activeView === "new" && (
            <NewPropertyView
              onStartExtraction={handleStartExtraction}
              extracting={extracting}
              error={extractError}
            />
          )}

          {activeView === "history" && (
            <HistoryView
              properties={properties}
              onOpenProperty={handleOpenProperty}
              onNewProperty={() => setActiveView("new")}
              onDeleteProperty={handleDeleteProperty}
            />
          )}

          {(activeView === "review" || activeView === "kit") && currentReviewData && (
            <ReviewAndKitView
              initialStep={activeView}
              initialData={currentReviewData}
              images={currentImages}
              primaryId={currentPrimaryId}
              settings={settings}
              briefText={currentBriefText}
              briefUrl={currentBriefUrl}
              existingId={existingId}
              existingCaption={existingCaption}
              initialTemplateId={currentTemplateId}
              onSaveProperty={handleSaveProperty}
              onBackToNew={() => setActiveView("new")}
              onDone={() => setActiveView("dashboard")}
            />
          )}
        </main>
      </div>

      {/* Settings Modal */}
      {settingsOpen && (
        <SettingsModal
          settings={settings}
          onSaveSettings={handleSaveSettings}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </div>
  );
}
