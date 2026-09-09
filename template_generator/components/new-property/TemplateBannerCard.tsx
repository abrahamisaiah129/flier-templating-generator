"use client";

import React from "react";
import { Layout, Palette } from "lucide-react";

export interface TemplateBannerCardProps {
  templateName: string;
  templateBadge?: string;
  templateDescription?: string;
  themeColor: string;
  totalTemplatesCount: number;
  onOpenModal: () => void;
}

export function TemplateBannerCard({
  templateName,
  templateBadge,
  templateDescription,
  themeColor,
  totalTemplatesCount,
  onOpenModal,
}: TemplateBannerCardProps) {
  return (
    <div className="mb-7">
      <div className="flex items-center justify-between mb-2">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
          Flyer Design Template
        </label>
        <span
          className="text-xs font-semibold text-slate-500"
          suppressHydrationWarning
        >
          {totalTemplatesCount} templates available
        </span>
      </div>

      <div
        onClick={onOpenModal}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 p-4 rounded-2xl bg-white border border-slate-200/90 hover:border-[#1B494E]/60 shadow-xs hover:shadow-sm cursor-pointer transition-all duration-150 group touch-manipulation"
      >
        <div className="flex items-center gap-3.5 min-w-0">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border border-black/10 shadow-2xs group-hover:scale-105 transition-transform duration-150 motion-reduce:transform-none"
            style={{ backgroundColor: themeColor || "#1B494E" }}
          >
            <Layout size={20} className="text-white" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-sm sm:text-base font-extrabold text-[#1B494E] group-hover:text-[#F26522] transition-colors">
                {templateName}
              </h4>
              {templateBadge ? (
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 shrink-0">
                  {templateBadge}
                </span>
              ) : null}
            </div>
            {templateDescription ? (
              <p className="text-xs text-slate-500 truncate mt-0.5">
                {templateDescription}
              </p>
            ) : null}
          </div>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenModal();
          }}
          className="w-full sm:w-auto shrink-0 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-[#1B494E] text-slate-700 hover:text-white font-bold text-xs flex items-center justify-center gap-2 transition-all duration-150 ease-out active:scale-[0.98] motion-reduce:transform-none cursor-pointer shadow-2xs min-h-[40px] touch-manipulation"
        >
          <Palette size={14} />
          <span>Change Template</span>
        </button>
      </div>
    </div>
  );
}
