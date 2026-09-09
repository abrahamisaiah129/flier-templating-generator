"use client";

import React from "react";
import { usePropKit } from "../context/PropKitContext";
import { AppLayout } from "../components/layout/AppLayout";
import { DashboardView } from "../components/dashboard/DashboardView";
import { NewPropertyView } from "../components/new-property/NewPropertyView";
import { HistoryView } from "../components/history/HistoryView";
import { SvgConverterView } from "../components/converter/SvgConverterView";
import { ReviewAndKitView } from "../components/ReviewAndKitView";

export default function Home() {
  const {
    activeView,
    setActiveView,
    properties,
    settings,
    extracting,
    extractError,
    currentReviewData,
    currentReviewDataList,
    currentImages,
    currentPrimaryId,
    currentTemplateId,
    setCurrentTemplateId,
    currentBriefText,
    currentBriefUrl,
    existingId,
    existingCaption,
    startExtraction,
    saveProperty,
    deleteProperty,
    updatePropertyTemplate,
    openProperty,
  } = usePropKit();

  return (
    <AppLayout>
      {activeView === "dashboard" && (
        <DashboardView
          properties={properties}
          onNewProperty={() => setActiveView("new")}
          onOpenProperty={openProperty}
          onViewAllHistory={() => setActiveView("history")}
        />
      )}

      {activeView === "new" && (
        <NewPropertyView
          onStartExtraction={startExtraction}
          extracting={extracting}
          error={extractError}
          initialTemplateId={currentTemplateId}
        />
      )}

      {activeView === "history" && (
        <HistoryView
          properties={properties}
          onOpenProperty={openProperty}
          onNewProperty={() => setActiveView("new")}
          onDeleteProperty={deleteProperty}
          onUpdatePropertyTemplate={updatePropertyTemplate}
        />
      )}

      {activeView === "converter" && (
        <SvgConverterView
          settings={settings}
          onUseTemplate={(templateId) => {
            setCurrentTemplateId(templateId);
            setActiveView("new");
          }}
        />
      )}

      {(activeView === "review" || activeView === "kit") && currentReviewData && (
        <ReviewAndKitView
          initialStep={activeView}
          initialData={currentReviewData}
          initialDataList={currentReviewDataList}
          images={currentImages}
          primaryId={currentPrimaryId}
          settings={settings}
          briefText={currentBriefText}
          briefUrl={currentBriefUrl}
          existingId={existingId}
          existingCaption={existingCaption}
          initialTemplateId={currentTemplateId}
          onSaveProperty={saveProperty}
          onBackToNew={() => setActiveView("new")}
          onDone={() => setActiveView("dashboard")}
        />
      )}
    </AppLayout>
  );
}
