"use client";

import React from "react";
import { PlusCircle, Home, CheckCircle2, Send, ArrowRight, Image as ImageIcon } from "lucide-react";
import { PropertyItem } from "../types/propkit";
import { formatNaira } from "../utils/extractor";
import { STATUS_COLORS } from "../utils/constants";

interface DashboardViewProps {
  properties: PropertyItem[];
  onNewProperty: () => void;
  onOpenProperty: (prop: PropertyItem) => void;
  onViewAllHistory: () => void;
}

export function DashboardView({
  properties,
  onNewProperty,
  onOpenProperty,
  onViewAllHistory,
}: DashboardViewProps) {
  const publishedCount = properties.filter((p) => p.status === "Published").length;
  const readyCount = properties.filter((p) => p.status === "Ready").length;

  return (
    <div className="max-w-6xl mx-auto py-4 px-2 sm:px-4 space-y-8">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#1B494E] to-[#163E42] text-white rounded-3xl p-8 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <span className="px-3 py-1 rounded-full bg-white/10 text-white/90 text-xs font-bold uppercase tracking-wider">
            PropKit Real Estate Automation
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Turn raw property briefs into branded marketing flyers.
          </h1>
          <p className="text-slate-200/80 text-sm leading-relaxed">
            Paste messy WhatsApp or PDF briefs, extract specs without losing accuracy, and generate ready-to-post 1080×1350 Instagram flyers with captions.
          </p>
        </div>

        <button
          onClick={onNewProperty}
          className="px-6 py-3.5 rounded-2xl bg-[#F26522] hover:bg-[#D95315] text-white font-extrabold text-sm tracking-wide shadow-lg shadow-orange-950/30 flex items-center gap-2.5 transition-all cursor-pointer flex-shrink-0"
        >
          <PlusCircle size={18} />
          <span>New Property</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#E6EEEE] flex items-center justify-center text-[#1B494E]">
            <Home size={22} />
          </div>
          <div>
            <div className="text-2xl font-black text-[#1B494E]">{properties.length}</div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Total Properties
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <CheckCircle2 size={22} />
          </div>
          <div>
            <div className="text-2xl font-black text-emerald-700">{readyCount}</div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Ready to Publish
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-[#F26522]">
            <Send size={22} />
          </div>
          <div>
            <div className="text-2xl font-black text-[#F26522]">{publishedCount}</div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Published
            </div>
          </div>
        </div>
      </div>

      {/* Recent Properties Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-[#1B494E]">Recent Properties</h2>
          <button
            onClick={onViewAllHistory}
            className="text-xs font-bold text-[#F26522] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>View all in History</span>
            <ArrowRight size={13} />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.slice(0, 3).map((p) => {
            const primaryImg = p.images?.find((img) => img.id === p.primaryId) || p.images?.[0];
            const statusColor = (STATUS_COLORS as Record<string, string>)[p.status] || "#64748B";

            return (
              <div
                key={p.id}
                onClick={() => onOpenProperty(p)}
                className="group bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs hover:shadow-md hover:border-[#1B494E]/40 transition-all duration-200 cursor-pointer flex flex-col"
              >
                <div className="h-48 w-full bg-[#E6EEEE]/50 relative overflow-hidden flex items-center justify-center">
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
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-extrabold text-[#1B494E] text-sm line-clamp-1 group-hover:text-[#F26522] transition-colors">
                      {p.data.propertyTitle || "Untitled Property"}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-1">
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
    </div>
  );
}
