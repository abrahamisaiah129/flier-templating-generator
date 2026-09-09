"use client";

import React, { useEffect } from "react";
import { usePropKit } from "../../context/PropKitContext";
import { AppLayout } from "../../components/layout/AppLayout";
import { HistoryView } from "../../components/history/HistoryView";

export default function HistoryPage() {
  const {
    properties,
    setActiveView,
    openProperty,
    deleteProperty,
    updatePropertyTemplate,
  } = usePropKit();

  useEffect(() => {
    setActiveView("history");
  }, [setActiveView]);

  return (
    <AppLayout>
      <HistoryView
        properties={properties}
        onOpenProperty={openProperty}
        onNewProperty={() => setActiveView("new")}
        onDeleteProperty={deleteProperty}
        onUpdatePropertyTemplate={updatePropertyTemplate}
      />
    </AppLayout>
  );
}
