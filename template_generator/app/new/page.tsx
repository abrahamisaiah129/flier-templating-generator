"use client";

import React, { useEffect } from "react";
import { usePropKit } from "../../context/PropKitContext";
import { AppLayout } from "../../components/layout/AppLayout";
import { NewPropertyView } from "../../components/new-property/NewPropertyView";

export default function NewPropertyPage() {
  const {
    setActiveView,
    startExtraction,
    extracting,
    extractError,
    currentTemplateId,
  } = usePropKit();

  useEffect(() => {
    setActiveView("new");
  }, [setActiveView]);

  return (
    <AppLayout>
      <NewPropertyView
        onStartExtraction={startExtraction}
        extracting={extracting}
        error={extractError}
        initialTemplateId={currentTemplateId}
      />
    </AppLayout>
  );
}
