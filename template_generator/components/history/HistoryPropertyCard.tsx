"use client";

import React from "react";
import {
  Image as ImageIcon,
  Images,
  Trash2,
  ChevronDown,
  Palette,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { PropertyItem, TemplateId } from "../../types/propkit";
import { formatNaira } from "../../utils/extractor";
import { STATUS_COLORS } from "../../utils/constants";

export interface HistoryPropertyCardProps {
  property: PropertyItem;
  templateInfo: {
    name: string;
    badge: string;
    isCustom: boolean;
    themeColor: string;
  };
  onOpenProperty: (prop: PropertyItem) => void;
  onDeleteProperty: (id: string) => void;
  onOpenTemplateSelector: (id: string) => void;
}

export function HistoryPropertyCard({
  property: p,
  templateInfo: tpl,
  onOpenProperty,
  onDeleteProperty,
  onOpenTemplateSelector,
}: HistoryPropertyCardProps) {
  const primaryImg = p.images?.find((img) => img.id === p.primaryId) || p.images?.[0];
  const statusColor = (STATUS_COLORS as Record<string, string>)[p.status] || "#64748B";

  return (
    <div
      onClick={() => onOpenProperty(p)}
      className="group bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs hover:shadow-md hover:border-[#1B494E]/40 transition-all duration-200 cursor-pointer flex flex-col touch-manipulation"
    >
      {/* Image Preview Container */}
      <div className="h-44 sm:h-52 w-full bg-[#E6EEEE]/50 relative overflow-hidden flex items-center justify-center">
        {primaryImg ? (
          <img
            src={primaryImg.url}
            alt={p.data.propertyTitle || "Property"}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="flex flex-col items-center text-slate-400">
            <ImageIcon size={32} />
            <span className="text-[11px] mt-1">No Image</span>
          </div>
        )}

        {/* Status Badge & Interactive Template Badge */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap max-w-[75%] z-10">
          <span
            className="px-2.5 py-1 rounded-full text-[11px] font-extrabold text-white shadow-xs"
            style={{ backgroundColor: statusColor }}
          >
            {p.status}
          </span>

          {/* Clickable Template Badge to switch template */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenTemplateSelector(p.id);
            }}
            className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-black/75 hover:bg-black text-white backdrop-blur-xs flex items-center gap-1.5 transition-transform duration-150 ease-out active:scale-95 cursor-pointer border border-white/15 hover:border-white/40 shadow-xs group/tpl touch-manipulation min-h-[26px]"
            title="Click to switch flyer template"
          >
            {tpl.isCustom ? (
              <Sparkles size={10} className="text-amber-400 shrink-0" />
            ) : (
              <span
                className="w-2 h-2 rounded-full shrink-0 border border-white/40"
                style={{ backgroundColor: tpl.themeColor }}
              />
            )}
            <span className="truncate max-w-[95px]">{tpl.name}</span>
            <ChevronDown
              size={10}
              className="text-slate-300 group-hover/tpl:translate-y-0.5 transition-transform shrink-0"
            />
          </button>
        </div>

        <span className="absolute bottom-3 left-3 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-black/70 text-white backdrop-blur-xs flex items-center gap-1">
          <Images size={11} />
          <span>
            {p.images?.length || 1} {(p.images?.length || 1) === 1 ? "Flyer" : "Flyers"}
          </span>
        </span>

        {/* Quick Delete */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (confirm("Are you sure you want to delete this property?")) {
              onDeleteProperty(p.id);
            }
          }}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 hover:bg-red-600 text-white flex items-center justify-center opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity z-10 touch-manipulation"
          title="Delete property"
        >
          <Trash2 size={13} />
        </button>
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-extrabold text-[#1B494E] text-base group-hover:text-[#F26522] transition-colors break-words [overflow-wrap:break-word] whitespace-normal max-w-full">
            {p.data.propertyTitle || "Untitled Property"}
          </h3>
          <p className="text-xs text-slate-500 mt-1 break-words [overflow-wrap:break-word] whitespace-normal max-w-full">
            {p.data.location || "Location not specified"}
          </p>

          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-lg font-black text-[#1B494E]">
              {formatNaira(p.data.priceNGN) || "Price on Request"}
            </span>
            {p.data.bedrooms && (
              <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                {p.data.bedrooms} Bed
              </span>
            )}
          </div>
        </div>

        {/* Card Footer with Switch Template Action */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenTemplateSelector(p.id);
            }}
            className="text-slate-500 hover:text-[#1B494E] flex items-center gap-1.5 font-semibold transition-colors cursor-pointer group/switch"
            title="Switch flyer template for this property"
          >
            <Palette size={13} className="text-slate-400 group-hover/switch:text-[#1B494E] transition-colors" />
            <span>Switch Template</span>
          </button>
          <span className="font-bold text-[#F26522] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
            View Kit <ArrowRight size={13} />
          </span>
        </div>
      </div>
    </div>
  );
}
