"use client";

import React from "react";
import { Home, CheckCircle2, Send } from "lucide-react";

export interface QuickStatsProps {
  totalCount: number;
  readyCount: number;
  publishedCount: number;
}

export function QuickStats({
  totalCount,
  readyCount,
  publishedCount,
}: QuickStatsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-[#E6EEEE] flex items-center justify-center text-[#1B494E]">
          <Home size={22} />
        </div>
        <div>
          <div className="text-2xl font-black text-[#1B494E]">{totalCount}</div>
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
  );
}
