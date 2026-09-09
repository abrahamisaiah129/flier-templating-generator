"use client";

import React from "react";
import { FileText, Plus, X } from "lucide-react";

export interface BriefInputTabsProps {
  briefs: string[];
  activeBriefTab: number;
  onSelectTab: (index: number) => void;
  onAddBrief: () => void;
  onRemoveBrief: (index: number) => void;
  onBriefChange: (index: number, text: string) => void;
}

export function BriefInputTabs({
  briefs,
  activeBriefTab,
  onSelectTab,
  onAddBrief,
  onRemoveBrief,
  onBriefChange,
}: BriefInputTabsProps) {
  const safeTab = Math.min(Math.max(0, activeBriefTab), Math.max(0, briefs.length - 1));

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm mb-6 transition-all">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-orange-100/80 flex items-center justify-center text-[#F26522]">
            <FileText size={18} />
          </div>
          <div>
            <h3 className="font-bold text-[#1B494E] text-base leading-none">
              Source brief
            </h3>
          </div>
        </div>
        {briefs.length < 3 && briefs.length > 1 && (
          <button
            type="button"
            onClick={onAddBrief}
            className="text-xs font-bold px-3 py-1.5 rounded-lg bg-orange-50 text-[#F26522] hover:bg-orange-100 border border-orange-200/60 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Plus size={14} />
            <span>Add Property Brief</span>
          </button>
        )}
      </div>

      {briefs.length > 1 ? (
        <div>
          {/* Tabs Header */}
          <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-1">
            {briefs.map((b, idx) => {
              const isActive = safeTab === idx;
              const hasContent = b.trim().length > 0;
              return (
                <div
                  key={idx}
                  className={`flex items-center rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
                    isActive
                      ? "bg-[#1B494E] text-white shadow-xs"
                      : "bg-slate-100 hover:bg-slate-200/80 text-slate-700"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onSelectTab(idx)}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <span
                      className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-black ${
                        isActive ? "bg-[#F26522] text-white" : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <span>Brief {idx + 1}</span>
                    {hasContent && (
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isActive ? "bg-teal-300" : "bg-emerald-500"
                        }`}
                        title="Brief has text"
                      />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveBrief(idx);
                    }}
                    className={`ml-2.5 p-0.5 rounded-md hover:bg-black/10 transition-colors cursor-pointer ${
                      isActive ? "text-teal-200 hover:text-white" : "text-slate-400 hover:text-red-600"
                    }`}
                    title={`Remove Brief ${idx + 1}`}
                  >
                    <X size={13} />
                  </button>
                </div>
              );
            })}
            {briefs.length < 3 && (
              <button
                type="button"
                onClick={onAddBrief}
                className="px-3 py-2 rounded-xl text-xs font-bold border border-dashed border-slate-300 hover:border-[#1B494E]/50 text-slate-600 hover:text-[#1B494E] flex items-center gap-1.5 transition-colors cursor-pointer bg-white"
              >
                <Plus size={13} />
                <span>Add Brief</span>
              </button>
            )}
          </div>

          {/* Active Brief Textarea */}
          <div className="relative">
            <textarea
              value={briefs[safeTab] || ""}
              onChange={(e) => onBriefChange(safeTab, e.target.value)}
              rows={5}
              placeholder={
                safeTab === 0
                  ? "Paste raw text, WhatsApp messages, or notes here. We'll automatically structure the details for your flyer."
                  : `Paste raw text, WhatsApp messages, or notes for brief ${safeTab + 1} here...`
              }
              className="w-full p-4 rounded-xl bg-[#E6EEEE]/60 border border-slate-300/70 text-slate-800 text-sm placeholder:text-slate-500/80 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1B494E]/30 focus:border-[#1B494E] transition-all resize-y"
            />
          </div>
        </div>
      ) : (
        /* Single Brief view */
        <div>
          <textarea
            value={briefs[0] || ""}
            onChange={(e) => onBriefChange(0, e.target.value)}
            rows={5}
            placeholder="Paste raw text, WhatsApp messages, or notes here. We'll automatically structure the details for your flyer."
            className="w-full p-4 rounded-xl bg-[#E6EEEE]/60 border border-slate-300/70 text-slate-800 text-sm placeholder:text-slate-500/80 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1B494E]/30 focus:border-[#1B494E] transition-all resize-y"
          />
          <button
            type="button"
            onClick={onAddBrief}
            className="w-full mt-3.5 py-3 rounded-lg bg-[#F26522] hover:bg-[#D95315] text-white font-bold text-sm flex items-center justify-center gap-2 transition-transform duration-150 ease-out active:scale-[0.98] shadow-sm shadow-orange-600/10 cursor-pointer"
          >
            <Plus size={16} />
            <span>Add Property Brief</span>
          </button>
        </div>
      )}
    </div>
  );
}
