"use client";

import React, { useEffect } from "react";
import { usePropKit } from "../../context/PropKitContext";
import { AppLayout } from "../../components/layout/AppLayout";
import { ReviewAndKitView } from "../../components/ReviewAndKitView";
import { ArrowLeft } from "lucide-react";

export default function ReviewPage() {
  const {
    activeView,
    setActiveView,
    settings,
    currentReviewData,
    currentReviewDataList,
    currentImages,
    currentPrimaryId,
    currentTemplateId,
    currentBriefText,
    currentBriefUrl,
    existingId,
    existingCaption,
    saveProperty,
  } = usePropKit();

  useEffect(() => {
    if (activeView !== "review" && activeView !== "kit") {
      setActiveView("review");
    }
  }, [activeView, setActiveView]);

  return (
    <AppLayout>
      {currentReviewData ? (
        <ReviewAndKitView
          initialStep={activeView === "kit" ? "kit" : "review"}
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
      ) : (
        <div className="max-w-xl mx-auto py-16 text-center space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-[#E6EEEE] flex items-center justify-center text-[#1B494E]">
            <span className="text-2xl">📝</span>
          </div>
          <h2 className="text-xl font-extrabold text-[#1B494E]">No active property in review</h2>
          <p className="text-slate-500 text-sm">
            Please start from the New Property form or select an existing listing from History.
          </p>
          <button
            type="button"
            onClick={() => setActiveView("new")}
            className="px-5 py-2.5 rounded-xl bg-[#F26522] hover:bg-[#d95315] text-white font-bold text-xs inline-flex items-center gap-2 transition-transform active:scale-95 cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>Go to New Property</span>
          </button>
        </div>
      )}
    </AppLayout>
  );
}
