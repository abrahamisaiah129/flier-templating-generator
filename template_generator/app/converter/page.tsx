"use client";

import React, { useEffect } from "react";
import { usePropKit } from "../../context/PropKitContext";
import { AppLayout } from "../../components/layout/AppLayout";
import { SvgConverterView } from "../../components/converter/SvgConverterView";

export default function ConverterPage() {
  const {
    settings,
    setActiveView,
    setCurrentTemplateId,
  } = usePropKit();

  useEffect(() => {
    setActiveView("converter");
  }, [setActiveView]);

  return (
    <AppLayout>
      <SvgConverterView
        settings={settings}
        onUseTemplate={(templateId) => {
          setCurrentTemplateId(templateId);
          setActiveView("new");
        }}
      />
    </AppLayout>
  );
}
