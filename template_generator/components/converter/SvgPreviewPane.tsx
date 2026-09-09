"use client";

import React, { useMemo } from "react";
import { Eye, ArrowRight, X } from "lucide-react";
import { CustomTemplateItem } from "../../types/propkit";

export interface SvgPreviewPaneProps {
  svgMarkup: string;
  activePreviewTemplate: CustomTemplateItem | null;
  onClearActivePreview?: () => void;
  onUseTemplate?: (id: string) => void;
}

export function SvgPreviewPane({
  svgMarkup,
  activePreviewTemplate,
  onClearActivePreview,
  onUseTemplate,
}: SvgPreviewPaneProps) {
  const cleanInnerSvg = useMemo(() => {
    if (!svgMarkup) return "";
    const match = svgMarkup.match(/<svg\b[^>]*>([\s\S]*?)<\/svg>/i);
    return match ? match[1] : svgMarkup;
  }, [svgMarkup]);

  return (
    <div className="flex flex-col h-[520px] bg-slate-50 rounded-2xl border border-slate-200/80 p-4">
      <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-200/80">
        <div className="flex items-center gap-2">
          <Eye size={16} className="text-[#1B494E]" />
          <span className="font-bold text-xs uppercase tracking-wider text-[#1B494E]">
            {activePreviewTemplate ? `Preview: ${activePreviewTemplate.name}` : "Live Vector Preview"}
          </span>
        </div>

        {activePreviewTemplate && (
          <div className="flex items-center gap-2">
            {onUseTemplate && (
              <button
                type="button"
                onClick={() => onUseTemplate(activePreviewTemplate.id)}
                className="text-xs font-bold px-2.5 py-1 rounded-lg bg-[#F26522] text-white flex items-center gap-1 cursor-pointer hover:bg-[#d95315]"
              >
                <span>Use Template</span>
                <ArrowRight size={12} />
              </button>
            )}
            {onClearActivePreview && (
              <button
                type="button"
                onClick={onClearActivePreview}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700 cursor-pointer"
                title="Back to current input preview"
              >
                <X size={14} />
              </button>
            )}
          </div>
        )}
      </div>

      <div className="flex-1 flex items-center justify-center bg-slate-900 rounded-xl overflow-hidden p-2 relative">
        {cleanInnerSvg ? (
          <svg
            viewBox="0 0 1080 1350"
            className="w-full h-full object-contain max-h-[440px]"
            dangerouslySetInnerHTML={{ __html: cleanInnerSvg }}
          />
        ) : (
          <div className="text-center p-6 text-slate-500">
            <Eye size={32} className="mx-auto mb-2 opacity-50" />
            <p className="text-xs font-bold">No SVG loaded</p>
            <p className="text-[11px] mt-1">Paste SVG code or upload a file to preview</p>
          </div>
        )}
      </div>
    </div>
  );
}
