"use client";

import React, { useState } from "react";
import { X, CheckCircle2, Layout, Wand2, Sparkles } from "lucide-react";
import { TemplateId, CustomTemplateItem } from "../types/propkit";
import { TEMPLATES_CONFIG } from "../utils/constants";
import { getStoredCustomTemplates } from "../utils/storage";

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
  const [activeTab, setActiveTab] = useState<"all" | "official" | "custom">("all");
  const customTemplates: CustomTemplateItem[] =
    typeof window !== "undefined" ? getStoredCustomTemplates() : [];

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

  const displayedTemplates =
    activeTab === "official"
      ? officialTemplates
      : activeTab === "custom"
      ? userTemplates
      : [...officialTemplates, ...userTemplates];

  const handleSelect = (id: TemplateId) => {
    onSelectTemplate(id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-150"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden z-10 flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between">
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
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="px-5 sm:px-6 pt-4 pb-2 flex items-center justify-between border-b border-slate-50 bg-slate-50/50">
          <div className="inline-flex rounded-xl bg-slate-200/70 p-1 text-xs font-medium">
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === "all"
                  ? "bg-white text-[#1B494E] font-bold shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              All ({officialTemplates.length + userTemplates.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("official")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === "official"
                  ? "bg-white text-[#1B494E] font-bold shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Official ({officialTemplates.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("custom")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === "custom"
                  ? "bg-white text-[#1B494E] font-bold shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Custom ({userTemplates.length})
            </button>
          </div>

          <span className="text-[11px] font-semibold text-slate-400 hidden sm:inline">
            Click to apply
          </span>
        </div>

        {/* Template Grid */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-3">
          {displayedTemplates.length === 0 ? (
            <div className="p-10 text-center rounded-2xl border-2 border-dashed border-slate-200">
              <Wand2 size={32} className="mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-bold text-slate-700">No custom templates yet</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Paste vector code into the &ldquo;SVG to Code&rdquo; generator to add your own custom
                flyer designs to your library.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {displayedTemplates.map((tmpl) => {
                const isSelected = selectedTemplateId === tmpl.id;
                return (
                  <div
                    key={tmpl.id}
                    onClick={() => handleSelect(tmpl.id)}
                    className={`relative p-4 rounded-2xl border-2 text-left cursor-pointer transition-transform duration-150 ease-out active:scale-[0.98] group flex flex-col justify-between ${
                      isSelected
                        ? "border-[#1B494E] bg-emerald-50/20 ring-2 ring-[#1B494E]/20 shadow-md"
                        : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/70 shadow-xs"
                    }`}
                  >
                    <div>
                      {/* Top Header inside Card */}
                      <div className="flex items-center justify-between gap-2 mb-2.5">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-4 h-4 rounded-full border border-black/10 shrink-0 shadow-2xs"
                            style={{ backgroundColor: tmpl.themeColor }}
                          />
                          <span
                            className="w-2.5 h-2.5 rounded-full border border-black/10 shrink-0 shadow-2xs -ml-1.5"
                            style={{ backgroundColor: tmpl.accentColor }}
                          />
                          <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                            {tmpl.badge}
                          </span>
                        </div>

                        {isSelected && (
                          <span className="w-5 h-5 rounded-full bg-[#1B494E] text-white flex items-center justify-center shrink-0">
                            <CheckCircle2 size={14} />
                          </span>
                        )}
                      </div>

                      {/* Title & Description */}
                      <h4 className="font-extrabold text-[#1B494E] text-base group-hover:text-[#F26522] transition-colors">
                        {tmpl.name}
                      </h4>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                        {tmpl.description}
                      </p>
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
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <p className="text-xs text-slate-500 flex items-center gap-1.5">
            <Sparkles size={13} className="text-[#F26522]" />
            <span>You can change this template anytime before downloading.</span>
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
