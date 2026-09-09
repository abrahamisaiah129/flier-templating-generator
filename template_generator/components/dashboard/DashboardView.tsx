"use client";

import React from "react";
import { PlusCircle } from "lucide-react";
import { PropertyItem } from "../../types/propkit";
import { QuickStats } from "./QuickStats";
import { RecentPropertiesGrid } from "./RecentPropertiesGrid";

export interface DashboardViewProps {
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
    <div className="max-w-6xl mx-auto py-2 sm:py-4 px-1 sm:px-4 space-y-6 sm:space-y-8">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#1B494E] to-[#163E42] text-white rounded-3xl p-5 sm:p-7 lg:p-8 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-5 sm:gap-6">
        <div className="space-y-2 max-w-xl">
          <span className="inline-block px-3 py-1 rounded-full bg-white/10 text-white/90 text-xs font-bold uppercase tracking-wider">
            PropKit Real Estate Automation
          </span>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight leading-tight">
            Turn raw property briefs into branded marketing flyers.
          </h1>
          <p className="text-slate-200/80 text-xs sm:text-sm leading-relaxed">
            Paste messy WhatsApp or PDF briefs, extract specs without losing accuracy, and generate ready-to-post 1080×1350 Instagram flyers with captions.
          </p>
        </div>

        <button
          type="button"
          onClick={onNewProperty}
          className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-[#F26522] hover:bg-[#D95315] text-white font-extrabold text-sm tracking-wide shadow-lg shadow-orange-950/30 flex items-center justify-center gap-2.5 transition-all cursor-pointer flex-shrink-0 touch-manipulation min-h-[48px]"
        >
          <PlusCircle size={18} />
          <span>New Property</span>
        </button>
      </div>

      {/* Metrics Row */}
      <QuickStats
        totalCount={properties.length}
        readyCount={readyCount}
        publishedCount={publishedCount}
      />

      {/* Recent Properties Section */}
      <RecentPropertiesGrid
        properties={properties}
        onOpenProperty={onOpenProperty}
        onViewAllHistory={onViewAllHistory}
      />
    </div>
  );
}
