"use client";

import React, { useEffect } from "react";
import { usePropKit } from "../../context/PropKitContext";
import { AppLayout } from "../../components/layout/AppLayout";
import { DashboardView } from "../../components/dashboard/DashboardView";

export default function DashboardPage() {
  const {
    properties,
    setActiveView,
    openProperty,
  } = usePropKit();

  useEffect(() => {
    setActiveView("dashboard");
  }, [setActiveView]);

  return (
    <AppLayout>
      <DashboardView
        properties={properties}
        onNewProperty={() => setActiveView("new")}
        onOpenProperty={openProperty}
        onViewAllHistory={() => setActiveView("history")}
      />
    </AppLayout>
  );
}
