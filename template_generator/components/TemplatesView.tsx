"use client";

import React, { useState, useRef } from "react";
import {
  Sparkles,
  ArrowRight,
  Check,
  Image as ImageIcon,
  CheckCircle2,
  Filter,
  Layers,
} from "lucide-react";
import { TemplateId, TemplateMetadata } from "../types/propkit";
import { REAL_ESTATE_TEMPLATES, SAMPLE_PROPERTIES, DEFAULT_SETTINGS } from "../utils/constants";
import { FlyerCanvas } from "./FlyerCanvas";

interface TemplatesViewProps {
  onSelectTemplate: (templateId: TemplateId) => void;
}

export function TemplatesView({ onSelectTemplate }: TemplatesViewProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const previewSvgRef = useRef<SVGSVGElement | null>(null);

  // Sample property for realistic template previewing
  const previewProperty = SAMPLE_PROPERTIES[0];

  const categories = [
    { id: "all", label: "All Templates" },
    { id: "brand", label: "Brand Classic" },
    { id: "luxury", label: "Luxury & Penthouse" },
    { id: "multi-photo", label: "Multi-Photo" },
    { id: "minimalist", label: "Minimalist" },
    { id: "impact", label: "High Impact Deals" },
  ];

  const filteredTemplates = REAL_ESTATE_TEMPLATES.filter((t) => {
    if (selectedCategory === "all") return true;
    if (selectedCategory === "luxury") return t.category === "luxury";
    return t.category === selectedCategory;
  });

  return (
    <div className="max-w-7xl mx-auto py-4 px-2 sm:px-4 space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#1B494E] via-[#14373B] to-[#0A2629] text-white rounded-3xl p-8 sm:p-10 shadow-lg border border-teal-900/40 relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white/90 text-xs font-bold uppercase tracking-wider">
            <Sparkles size={13} className="text-[#F26522]" />
            <span>Real Estate Marketing Automation</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
            Flyer Templates Library
          </h1>
          <p className="text-slate-200/90 text-sm sm:text-base leading-relaxed">
            Choose from agency-grade, pixel-accurate real estate marketing layouts. Every template is strictly engineered to prevent text clipping and exports in ultra-sharp 1080×1350 Instagram resolution.
          </p>
        </div>

        <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 opacity-10 pointer-events-none">
          <Layers size={320} />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              selectedCategory === cat.id
                ? "bg-[#1B494E] text-white shadow-md shadow-[#1B494E]/20"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredTemplates.map((tpl) => {
          return (
            <div
              key={tpl.id}
              className="bg-white rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-xl hover:border-[#1B494E]/40 transition-all duration-300 flex flex-col overflow-hidden group"
            >
              {/* Live Mini Preview Container */}
              <div className="relative bg-slate-100 p-5 flex items-center justify-center border-b border-slate-100 overflow-hidden">
                <div className="w-full max-w-[280px] group-hover:scale-[1.02] transition-transform duration-300">
                  <FlyerCanvas
                    data={previewProperty.data}
                    settings={DEFAULT_SETTINGS}
                    svgRef={previewSvgRef}
                    primaryImage={previewProperty.images[0]?.url || null}
                    secondaryImages={previewProperty.images}
                    templateId={tpl.id}
                    themeId={tpl.id === "editorial" ? "emerald" : tpl.id === "urgent" ? "onyx" : "signature"}
                  />
                </div>

                {/* Badge Tag */}
                <div className="absolute top-4 left-4">
                  <span
                    className="px-3 py-1 rounded-full text-[11px] font-extrabold text-white shadow-sm"
                    style={{ backgroundColor: tpl.tagColor }}
                  >
                    {tpl.tag}
                  </span>
                </div>

                {/* Recommended Images Pill */}
                <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-xs text-white text-[11px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5">
                  <ImageIcon size={11} />
                  <span>{tpl.recommendedImages} {tpl.recommendedImages === 1 ? "Photo" : "Photos"}</span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-6 flex-1 flex flex-col justify-between space-y-5">
                <div className="space-y-2">
                  <h3 className="text-xl font-extrabold text-[#1B494E] group-hover:text-[#F26522] transition-colors">
                    {tpl.name}
                  </h3>
                  <p className="text-xs font-semibold text-slate-400">
                    {tpl.subtitle}
                  </p>
                  <p className="text-xs text-slate-600 leading-relaxed pt-1">
                    {tpl.description}
                  </p>
                </div>

                {/* Feature Checklist */}
                <div className="space-y-1.5 py-3 border-y border-slate-100 text-xs text-slate-600">
                  {tpl.features.map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <CheckCircle2 size={13} className="text-emerald-600 flex-shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>

                {/* Primary Action Button */}
                <button
                  type="button"
                  onClick={() => onSelectTemplate(tpl.id)}
                  className="w-full py-3.5 px-4 rounded-xl bg-[#1B494E] group-hover:bg-[#F26522] text-white font-bold text-xs tracking-wider uppercase flex items-center justify-center gap-2 shadow-md shadow-[#1B494E]/10 transition-all cursor-pointer"
                >
                  <span>Use This Template</span>
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
