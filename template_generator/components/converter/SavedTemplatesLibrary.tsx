"use client";

import React from "react";
import {
  Layers,
  Eye,
  Copy,
  Check,
  Download,
  Trash2,
  ArrowRight,
} from "lucide-react";
import { CustomTemplateItem } from "../../types/propkit";

export interface SavedTemplatesLibraryProps {
  savedTemplates: CustomTemplateItem[];
  activePreviewId?: string | null;
  copiedTemplateId?: string | null;
  onPreview: (template: CustomTemplateItem) => void;
  onUseTemplate?: (templateId: string) => void;
  onCopy: (code: string, id: string) => void;
  onDownload: (code: string, name: string) => void;
  onDelete: (id: string) => void;
}

export function SavedTemplatesLibrary({
  savedTemplates,
  activePreviewId,
  copiedTemplateId,
  onPreview,
  onUseTemplate,
  onCopy,
  onDownload,
  onDelete,
}: SavedTemplatesLibraryProps) {
  if (savedTemplates.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-6 shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Layers size={18} className="text-[#1B494E]" />
          <h3 className="font-extrabold text-sm uppercase tracking-wider text-[#1B494E]">
            Your Custom Template Library ({savedTemplates.length})
          </h3>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {savedTemplates.map((item) => {
          const isPreviewing = activePreviewId === item.id;
          return (
            <div
              key={item.id}
              className={`p-4 rounded-xl border transition-all flex flex-col justify-between overflow-hidden ${
                isPreviewing
                  ? "border-[#F26522] bg-orange-50/20 ring-1 ring-[#F26522]"
                  : "border-slate-200 bg-white hover:border-slate-300 shadow-xs"
              }`}
            >
              <div className="space-y-2 mb-3 min-w-0">
                <div className="flex items-start justify-between gap-2 min-w-0">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-black/10 shrink-0"
                      style={{ backgroundColor: item.themeColor || "#1B494E" }}
                    />
                    <h4 className="font-extrabold text-sm text-[#1B494E] truncate min-w-0" title={item.name}>
                      {item.name}
                    </h4>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 shrink-0 whitespace-nowrap max-w-[110px] truncate" title={item.badge}>
                      {item.badge}
                    </span>
                  )}
                </div>
                {item.description && (
                  <p className="text-xs text-slate-500 line-clamp-2">
                    {item.description}
                  </p>
                )}
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100 min-w-0">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => onPreview(item)}
                    className="py-2 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center gap-1.5 cursor-pointer touch-manipulation min-h-[36px]"
                  >
                    <Eye size={12} />
                    <span>{isPreviewing ? "Previewing" : "Preview"}</span>
                  </button>
                  {onUseTemplate && (
                    <button
                      type="button"
                      onClick={() => onUseTemplate(item.id)}
                      className="py-2 rounded-lg text-xs font-bold bg-[#1B494E] hover:bg-[#163e42] text-white flex items-center justify-center gap-1.5 cursor-pointer touch-manipulation min-h-[36px]"
                    >
                      <span>Use</span>
                      <ArrowRight size={12} />
                    </button>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs pt-1 flex-wrap gap-2 min-w-0">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => onCopy(item.svgMarkup, item.id)}
                      className="text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer shrink-0 touch-manipulation"
                    >
                      {copiedTemplateId === item.id ? (
                        <>
                          <Check size={12} className="text-emerald-600" />
                          <span className="text-emerald-600 font-bold">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy size={12} />
                          <span>Copy SVG</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => onDownload(item.svgMarkup, item.name)}
                      className="text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer shrink-0 touch-manipulation"
                    >
                      <Download size={12} />
                      <span>Download</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => onDelete(item.id)}
                    className="text-slate-400 hover:text-red-600 p-1.5 rounded transition-colors cursor-pointer shrink-0 ml-auto touch-manipulation min-w-[28px] min-h-[28px] flex items-center justify-center"
                    title="Delete template"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
