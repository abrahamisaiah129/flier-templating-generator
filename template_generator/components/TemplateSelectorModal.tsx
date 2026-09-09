"use client";

import React, { useState } from "react";
import { X, CheckCircle2, Layout, Wand2, Sparkles, Trash2 } from "lucide-react";
import { TemplateId, CustomTemplateItem } from "../types/propkit";
import { TEMPLATES_CONFIG } from "../utils/constants";
import { getStoredCustomTemplates, deleteStoredCustomTemplate } from "../utils/storage";

interface TemplateSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTemplateId: TemplateId;
  onSelectTemplate: (templateId: TemplateId) => void;
  title?: string;
  subtitle?: string;
}

export function TemplateSelectorModal({
  isOpen,
  onClose,
  selectedTemplateId,
  onSelectTemplate,
  title = "Choose Flyer Template",
  subtitle = "Select an official layout or one of your custom-created templates",
}: TemplateSelectorModalProps) {
  const [selectedCategories, setSelectedCategories] = useState<Set<"official" | "custom">>(
    new Set(["official", "custom"])
  );
  const [customTemplates, setCustomTemplates] = useState<CustomTemplateItem[]>(() =>
    typeof window !== "undefined" ? getStoredCustomTemplates() : []
  );

  if (!isOpen) return null;

  const officialTemplates = TEMPLATES_CONFIG.map((t) => ({
    id: t.id,
    name: t.name,
    badge: t.badge,
    themeColor: t.themeColor,
    accentColor: t.accentColor,
    description: t.description,
    isCustom: false,
  }));

  const userTemplates = customTemplates.map((c) => ({
    id: c.id,
    name: c.name,
    badge: c.badge || "Custom Template",
    themeColor: c.themeColor || "#0E1626",
    accentColor: c.accentColor || "#F26522",
    description: c.description || "Custom SVG flyer template from your personal library",
    isCustom: true,
  }));

  const toggleCategory = (cat: "official" | "custom") => {
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) {
        if (next.size === 1) {
          const other = cat === "official" ? "custom" : "official";
          return new Set([other]);
        }
        next.delete(cat);
      } else {
        next.add(cat);
      }
      return next;
    });
  };

  const displayedTemplates = [
    ...(selectedCategories.has("official") ? officialTemplates : []),
    ...(selectedCategories.has("custom") ? userTemplates : []),
  ];

  const handleSelect = (id: TemplateId) => {
    onSelectTemplate(id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-150"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden z-10 flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1B494E]/10 text-[#1B494E] flex items-center justify-center shrink-0">
              <Layout size={20} />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-extrabold text-[#1B494E] tracking-tight">
                {title}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">{subtitle}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer touch-manipulation"
            title="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Option Tags Filter */}
        <div className="px-5 sm:px-6 pt-3.5 pb-2.5 flex items-center justify-between border-b border-slate-100 bg-slate-50/60">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-slate-500 mr-0.5">Filter:</span>

            {/* Official Option Tag */}
            <button
              type="button"
              onClick={() => toggleCategory("official")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-150 ease-out cursor-pointer flex items-center gap-1.5 border shadow-2xs ${
                selectedCategories.has("official")
                  ? "bg-[#1B494E] text-white border-[#1B494E]"
                  : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              <span>Official</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                  selectedCategories.has("official")
                    ? "bg-white/20 text-white"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {officialTemplates.length}
              </span>
            </button>

            {/* Custom Option Tag */}
            <button
              type="button"
              onClick={() => toggleCategory("custom")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-150 ease-out cursor-pointer flex items-center gap-1.5 border shadow-2xs ${
                selectedCategories.has("custom")
                  ? "bg-[#1B494E] text-white border-[#1B494E]"
                  : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              <span>Custom</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                  selectedCategories.has("custom")
                    ? "bg-white/20 text-white"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {userTemplates.length}
              </span>
            </button>
          </div>

          <span className="text-[11px] font-semibold text-slate-400 hidden sm:inline">
            {displayedTemplates.length} {displayedTemplates.length === 1 ? "template" : "templates"}
          </span>
        </div>

        {/* Template Grid */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-3">
          {displayedTemplates.length === 0 ? (
            <div className="p-10 text-center rounded-2xl border-2 border-dashed border-slate-200">
              <Wand2 size={32} className="mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-bold text-slate-700">No templates match filter</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Click the &ldquo;Official&rdquo; or &ldquo;Custom&rdquo; option tags above to display templates.
              </p>
              <button
                type="button"
                onClick={() => setSelectedCategories(new Set(["official", "custom"]))}
                className="mt-3 px-3.5 py-1.5 rounded-lg bg-[#1B494E] text-white text-xs font-bold hover:bg-[#14383C] transition-colors cursor-pointer"
              >
                Select Both Tags
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {displayedTemplates.map((tmpl) => {
                const isSelected = selectedTemplateId === tmpl.id;
                return (
                  <div
                    key={tmpl.id}
                    onClick={() => handleSelect(tmpl.id)}
                    className={`relative p-4 rounded-2xl border-2 text-left cursor-pointer transition-transform duration-150 ease-out active:scale-[0.98] group flex flex-col justify-between overflow-hidden min-w-0 ${
                      isSelected
                        ? "border-[#1B494E] bg-emerald-50/20 ring-2 ring-[#1B494E]/20 shadow-md"
                        : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/70 shadow-xs"
                    }`}
                  >
                    <div className="min-w-0">
                      {/* Top Header inside Card */}
                      <div className="flex items-center justify-between gap-2 mb-2.5 min-w-0">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span
                            className="w-4 h-4 rounded-full border border-black/10 shrink-0 shadow-2xs"
                            style={{ backgroundColor: tmpl.themeColor }}
                          />
                          <span
                            className="w-2.5 h-2.5 rounded-full border border-black/10 shrink-0 shadow-2xs -ml-1.5"
                            style={{ backgroundColor: tmpl.accentColor }}
                          />
                          {tmpl.badge ? (
                            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 truncate max-w-[110px] shrink-0">
                              {tmpl.badge}
                            </span>
                          ) : null}
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {tmpl.isCustom && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm(`Delete custom template "${tmpl.name}" from your storage library?`)) {
                                  deleteStoredCustomTemplate(tmpl.id);
                                  setCustomTemplates(getStoredCustomTemplates());
                                  if (selectedTemplateId === tmpl.id) {
                                    onSelectTemplate("bmi");
                                  }
                                }
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                              title="Delete template from storage"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                          {isSelected && (
                            <span className="w-5 h-5 rounded-full bg-[#1B494E] text-white flex items-center justify-center shrink-0">
                              <CheckCircle2 size={14} />
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Title & Description */}
                      <h4 className="font-extrabold text-[#1B494E] text-base group-hover:text-[#F26522] transition-colors truncate">
                        {tmpl.name}
                      </h4>
                      {tmpl.description ? (
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                          {tmpl.description}
                        </p>
                      ) : null}
                    </div>

                    {/* Bottom Indicator */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-400">
                        {tmpl.isCustom ? "Saved in Library" : "Built-in Luxury"}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelect(tmpl.id);
                        }}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          isSelected
                            ? "bg-[#1B494E] text-white"
                            : "bg-slate-100 text-slate-700 group-hover:bg-[#1B494E] group-hover:text-white"
                        }`}
                      >
                        {isSelected ? "Selected" : "Select"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 sm:p-5 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-xs text-slate-500 flex items-center gap-1.5">
            <Sparkles size={13} className="text-[#F26522] shrink-0" />
            <span>You can change this template anytime before downloading.</span>
          </p>
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs transition-colors cursor-pointer min-h-[40px] touch-manipulation flex items-center justify-center"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
