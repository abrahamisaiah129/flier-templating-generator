"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Image as ImageIcon } from "lucide-react";
import { PropertyItem, TemplateId, CustomTemplateItem } from "../../types/propkit";
import { TEMPLATES_CONFIG } from "../../utils/constants";
import { getStoredCustomTemplates } from "../../utils/storage";
import { TemplateSelectorModal } from "../TemplateSelectorModal";
import { HistoryFilterBar } from "./HistoryFilterBar";
import { HistoryPropertyCard } from "./HistoryPropertyCard";

export interface HistoryViewProps {
  properties: PropertyItem[];
  onOpenProperty: (prop: PropertyItem) => void;
  onNewProperty: () => void;
  onDeleteProperty: (id: string) => void;
  onUpdatePropertyTemplate?: (id: string, templateId: TemplateId) => void;
}

export function HistoryView({
  properties,
  onOpenProperty,
  onNewProperty,
  onDeleteProperty,
  onUpdatePropertyTemplate,
}: HistoryViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [modalPropId, setModalPropId] = useState<string | null>(null);

  const [customTemplates, setCustomTemplates] = useState<CustomTemplateItem[]>([]);

  useEffect(() => {
    setCustomTemplates(getStoredCustomTemplates());
  }, [modalPropId]);

  const getTemplateInfo = (templateId?: TemplateId) => {
    if (!templateId || templateId === "bmi") {
      return { name: "BMI Signature", badge: "Signature", isCustom: false, themeColor: "#0E1626" };
    }
    if (templateId === "eko") {
      return { name: "Eko Luxury", badge: "Luxury Light", isCustom: false, themeColor: "#F4F9F9" };
    }
    if (templateId === "enose") {
      return { name: "Enose Luxury", badge: "Warm Editorial", isCustom: false, themeColor: "#2A1810" };
    }
    const official = TEMPLATES_CONFIG.find((t) => t.id === templateId);
    if (official) {
      return { name: official.name, badge: official.badge, isCustom: false, themeColor: official.themeColor };
    }
    const custom = customTemplates.find((c) => c.id === templateId);
    if (custom) {
      return {
        name: custom.name || "Custom Template",
        badge: custom.badge || "Custom Style",
        isCustom: true,
        themeColor: custom.themeColor || "#1B494E",
      };
    }
    return { name: "Custom Template", badge: "Custom Style", isCustom: true, themeColor: "#1B494E" };
  };

  const filteredProperties = useMemo(() => {
    return properties.filter((p) => {
      const matchQuery =
        !searchQuery.trim() ||
        (p.data.propertyTitle || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.data.location || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.data.propertyType || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.data.documentation || "").toLowerCase().includes(searchQuery.toLowerCase());

      const matchStatus = statusFilter === "ALL" || p.status === statusFilter;

      return matchQuery && matchStatus;
    });
  }, [properties, searchQuery, statusFilter]);

  return (
    <div className="max-w-6xl mx-auto py-4 px-2 sm:px-4">
      {/* Header */}
      <div className="mb-7">
        <h1 className="text-3xl sm:text-[34px] font-extrabold text-[#1B494E] tracking-tight">
          Property History
        </h1>
        <p className="text-slate-600 text-sm sm:text-base mt-2">
          Everything your desk has received, verified, built &amp; published.
        </p>
      </div>

      {/* Search & Filter Bar */}
      <HistoryFilterBar
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        onNewProperty={onNewProperty}
      />

      {/* Property Cards Grid */}
      {filteredProperties.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-300">
          <ImageIcon size={36} className="mx-auto text-slate-400 mb-3" />
          <h3 className="font-bold text-slate-700 text-base">No properties found</h3>
          <p className="text-slate-500 text-xs mt-1">
            {searchQuery ? "Try refining your search terms." : "Get started by generating your first property flyer."}
          </p>
          <button
            type="button"
            onClick={onNewProperty}
            className="mt-4 px-4 py-2 rounded-lg bg-[#1B494E] text-white text-xs font-bold hover:bg-[#14383C] transition-colors"
          >
            Create Property
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProperties.map((p) => (
            <HistoryPropertyCard
              key={p.id}
              property={p}
              templateInfo={getTemplateInfo(p.templateId)}
              onOpenProperty={onOpenProperty}
              onDeleteProperty={onDeleteProperty}
              onOpenTemplateSelector={(id) => setModalPropId(id)}
            />
          ))}
        </div>
      )}

      {/* Template Selector Modal for Historical Property Re-theming */}
      {modalPropId && (
        <TemplateSelectorModal
          isOpen={Boolean(modalPropId)}
          onClose={() => setModalPropId(null)}
          selectedTemplateId={
            properties.find((p) => p.id === modalPropId)?.templateId || "bmi"
          }
          onSelectTemplate={(newTemplateId) => {
            if (modalPropId && onUpdatePropertyTemplate) {
              onUpdatePropertyTemplate(modalPropId, newTemplateId);
            }
            setModalPropId(null);
          }}
        />
      )}
    </div>
  );
}
