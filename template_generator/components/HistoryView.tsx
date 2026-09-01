"use client";

import React, { useState, useMemo } from "react";
import { Search, Filter, Image as ImageIcon, PlusCircle, ArrowRight, Trash2, ExternalLink } from "lucide-react";
import { PropertyItem } from "../types/propkit";
import { formatNaira } from "../utils/extractor";
import { STATUS_COLORS } from "../utils/constants";

interface HistoryViewProps {
  properties: PropertyItem[];
  onOpenProperty: (prop: PropertyItem) => void;
  onNewProperty: () => void;
  onDeleteProperty: (id: string) => void;
}

export function HistoryView({
  properties,
  onOpenProperty,
  onNewProperty,
  onDeleteProperty,
}: HistoryViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);

  const filteredProperties = useMemo(() => {
    return properties.filter((p) => {
      const matchQuery =
        !searchQuery.trim() ||
        (p.data.propertyTitle || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.data.location || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.data.propertyType || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.data.documentation || "").toLowerCase().includes(searchQuery.toLowerCase());

      const matchStatus = statusFilter === "ALL" || p.status === statusFilter;

      return matchQuery && matchStatus;
    });
  }, [properties, searchQuery, statusFilter]);

  return (
    <div className="max-w-6xl mx-auto py-4 px-2 sm:px-4">
      {/* Header section matching Figma Screen 4 */}
      <div className="mb-7">
        <h1 className="text-3xl sm:text-[34px] font-extrabold text-[#1B494E] tracking-tight">
          Property History
        </h1>
        <p className="text-slate-600 text-sm sm:text-base mt-2">
          Everything your desk has received, verified, built & published.
        </p>
      </div>

      {/* Search & Filter Bar matching Figma */}
      <div className="flex flex-col sm:flex-row items-center gap-3 mb-8">
        <div className="relative flex-1 w-full">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by locations, apartment or title"
            className="w-full py-3.5 pl-11 pr-24 rounded-xl bg-white border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1B494E]/30 focus:border-[#1B494E] shadow-xs transition-all"
          />
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />

          {/* Figma Dark Teal "Filter" Pill Button */}
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            <button
              type="button"
              onClick={() => setFilterMenuOpen(!filterMenuOpen)}
              className="px-4 py-1.5 rounded-lg bg-[#1B494E] hover:bg-[#14383C] text-white text-xs font-bold tracking-wider uppercase transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              <Filter size={12} />
              <span>{statusFilter === "ALL" ? "Filter" : statusFilter}</span>
            </button>

            {/* Filter Dropdown */}
            {filterMenuOpen && (
              <div className="absolute right-0 mt-2 w-44 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-30">
                {["ALL", "Published", "Ready", "Needs Review", "Draft"].map((status) => (
                  <button
                    key={status}
                    onClick={() => {
                      setStatusFilter(status);
                      setFilterMenuOpen(false);
                    }}
                    className={`w-full px-4 py-2 text-xs font-semibold text-left transition-colors flex items-center justify-between ${
                      statusFilter === status
                        ? "bg-slate-100 text-[#1B494E]"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <span>{status === "ALL" ? "All Properties" : status}</span>
                    {statusFilter === status && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#F26522]" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick New Property button */}
        <button
          onClick={onNewProperty}
          className="w-full sm:w-auto px-5 py-3.5 rounded-xl bg-[#F26522] hover:bg-[#D95315] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer flex-shrink-0"
        >
          <PlusCircle size={16} />
          <span>New Property</span>
        </button>
      </div>

      {/* Property Cards Grid (3 columns matching Figma) */}
      {filteredProperties.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-300">
          <ImageIcon size={36} className="mx-auto text-slate-400 mb-3" />
          <h3 className="font-bold text-slate-700 text-base">No properties found</h3>
          <p className="text-slate-500 text-xs mt-1">
            {searchQuery ? "Try refining your search terms." : "Get started by generating your first property flyer."}
          </p>
          <button
            onClick={onNewProperty}
            className="mt-4 px-4 py-2 rounded-lg bg-[#1B494E] text-white text-xs font-bold hover:bg-[#14383C] transition-colors"
          >
            Create Property
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProperties.map((p) => {
            const primaryImg = p.images?.find((img) => img.id === p.primaryId) || p.images?.[0];
            const statusColor = (STATUS_COLORS as Record<string, string>)[p.status] || "#64748B";

            return (
              <div
                key={p.id}
                onClick={() => onOpenProperty(p)}
                className="group bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs hover:shadow-md hover:border-[#1B494E]/40 transition-all duration-200 cursor-pointer flex flex-col"
              >
                {/* Image Preview Container */}
                <div className="h-52 w-full bg-[#E6EEEE]/50 relative overflow-hidden flex items-center justify-center">
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

                  {/* Status Badge */}
                  <div className="absolute top-3 left-3">
                    <span
                      className="px-2.5 py-1 rounded-full text-[11px] font-extrabold text-white shadow-xs"
                      style={{ backgroundColor: statusColor }}
                    >
                      {p.status}
                    </span>
                  </div>

                  {/* Quick Delete */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm("Are you sure you want to delete this property?")) {
                        onDeleteProperty(p.id);
                      }
                    }}
                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 hover:bg-red-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete property"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-extrabold text-[#1B494E] text-base line-clamp-1 group-hover:text-[#F26522] transition-colors">
                      {p.data.propertyTitle || "Untitled Property"}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-1">
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

                  {/* Card Footer */}
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
      )}
    </div>
  );
}
