"use client";

import React from "react";
import { Search, Filter, PlusCircle } from "lucide-react";

export interface HistoryFilterBarProps {
  searchQuery: string;
  onSearchQueryChange: (q: string) => void;
  statusFilter: string;
  onStatusFilterChange: (s: string) => void;
  onNewProperty: () => void;
}

const STATUS_OPTIONS = [
  { id: "ALL", label: "All Properties" },
  { id: "Ready", label: "Ready to Publish" },
  { id: "Published", label: "Published" },
  { id: "Needs Review", label: "Needs Review" },
  { id: "Draft", label: "Draft" },
];

export function HistoryFilterBar({
  searchQuery,
  onSearchQueryChange,
  statusFilter,
  onStatusFilterChange,
  onNewProperty,
}: HistoryFilterBarProps) {
  return (
    <div className="flex flex-col sm:flex-row items-center gap-3 mb-8">
      {/* Search Input */}
      <div className="relative flex-1 w-full">
        <Search
          size={18}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchQueryChange(e.target.value)}
          placeholder="Search by title, location, type, or documentation..."
          className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white border border-slate-200 text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1B494E]/20 shadow-xs transition-all"
        />
      </div>

      {/* Status Filter Dropdown / Pills */}
      <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
        <div className="flex items-center gap-1.5 bg-white p-1 rounded-2xl border border-slate-200 shadow-xs">
          <Filter size={15} className="text-slate-400 ml-2 mr-1 flex-shrink-0" />
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => onStatusFilterChange(opt.id)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === opt.id
                  ? "bg-[#1B494E] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={onNewProperty}
          className="py-3 px-4 rounded-2xl bg-[#F26522] hover:bg-[#d95315] text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-orange-950/20 cursor-pointer whitespace-nowrap flex-shrink-0"
        >
          <PlusCircle size={15} />
          <span>New Property</span>
        </button>
      </div>
    </div>
  );
}
