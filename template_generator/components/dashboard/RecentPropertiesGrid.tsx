"use client";

import React from "react";
import { ArrowRight, Image as ImageIcon, Images } from "lucide-react";
import { PropertyItem } from "../../types/propkit";
import { formatNaira } from "../../utils/extractor";
import { STATUS_COLORS } from "../../utils/constants";

export interface RecentPropertiesGridProps {
  properties: PropertyItem[];
  onOpenProperty: (prop: PropertyItem) => void;
  onViewAllHistory: () => void;
}

export function RecentPropertiesGrid({
  properties,
  onOpenProperty,
  onViewAllHistory,
}: RecentPropertiesGridProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-extrabold text-[#1B494E]">Recent Properties</h2>
        <button
          type="button"
          onClick={onViewAllHistory}
          className="text-xs font-bold text-[#F26522] hover:underline flex items-center gap-1 cursor-pointer"
        >
          <span>View all in History</span>
          <ArrowRight size={13} />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {properties.slice(0, 3).map((p) => {
          const primaryImg = p.images?.find((img) => img.id === p.primaryId) || p.images?.[0];
          const statusColor = (STATUS_COLORS as Record<string, string>)[p.status] || "#64748B";

          return (
            <div
              key={p.id}
              onClick={() => onOpenProperty(p)}
              className="group bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs hover:shadow-md hover:border-[#1B494E]/40 transition-all duration-200 cursor-pointer flex flex-col touch-manipulation"
            >
              <div className="h-44 sm:h-48 w-full bg-[#E6EEEE]/50 relative overflow-hidden flex items-center justify-center">
                {primaryImg ? (
                  <img
                    src={primaryImg.url}
                    alt={p.data.propertyTitle}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <ImageIcon size={32} className="text-slate-400" />
                )}
                <span
                  className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[11px] font-extrabold text-white shadow-xs"
                  style={{ backgroundColor: statusColor }}
                >
                  {p.status}
                </span>
                <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-black/60 text-white backdrop-blur-xs">
                  {p.templateId === "eko"
                    ? "Eko Luxury"
                    : p.templateId === "enose"
                    ? "Enose Luxury"
                    : "BMI Signature"}
                </span>
                <span className="absolute bottom-3 left-3 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-black/70 text-white backdrop-blur-xs flex items-center gap-1">
                  <Images size={11} />
                  <span>
                    {p.images?.length || 1} {(p.images?.length || 1) === 1 ? "Flyer" : "Flyers"}
                  </span>
                </span>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-extrabold text-[#1B494E] text-sm group-hover:text-[#F26522] transition-colors break-words [overflow-wrap:break-word] whitespace-normal max-w-full">
                    {p.data.propertyTitle || "Untitled Property"}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 break-words [overflow-wrap:break-word] whitespace-normal max-w-full">
                    {p.data.location}
                  </p>
                  <div className="mt-3 text-base font-black text-[#1B494E]">
                    {formatNaira(p.data.priceNGN) || "Price on Request"}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                  <span>{new Date(p.createdAt).toLocaleDateString()}</span>
                  <span className="font-bold text-[#F26522] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    View Kit <ArrowRight size={13} />
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
