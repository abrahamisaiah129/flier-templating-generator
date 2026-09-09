"use client";

import React, { useRef } from "react";
import {
  Sparkles,
  AlertCircle,
  Plus,
  Trash2,
  Upload,
  CheckCircle2,
  Star,
  Image as ImageIcon,
  ArrowRight,
} from "lucide-react";
import { PropertyData, UploadedImage, TemplateId } from "../../types/propkit";
import { EMPTY_FIELD } from "../../utils/constants";

export interface PropertyReviewStepProps {
  data: PropertyData;
  propertiesData: PropertyData[];
  safePropIndex: number;
  localImages: UploadedImage[];
  selectedCanvasItemId: string | null;
  onSelectCanvasItem: (itemId: string | null, itemType: "text" | "image") => void;
  onUpdateField: (field: keyof PropertyData, value: unknown) => void;
  onAddFeature: (feat: string) => void;
  onRemoveFeature: (idx: number) => void;
  onSetPrimaryImage: (id: string) => void;
  onDeleteImage: (id: string) => void;
  onUploadImages: (files: FileList | null) => void;
  onSelectPropertyTab: (idx: number) => void;
  onProceedToKit: () => void;
}

export function PropertyReviewStep({
  data,
  propertiesData,
  safePropIndex,
  localImages,
  selectedCanvasItemId,
  onSelectCanvasItem,
  onUpdateField,
  onAddFeature,
  onRemoveFeature,
  onSetPrimaryImage,
  onDeleteImage,
  onUploadImages,
  onSelectPropertyTab,
  onProceedToKit,
}: PropertyReviewStepProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newFeatureText, setNewFeatureText] = React.useState("");

  const isMissing = (val: unknown) =>
    val === null || val === undefined || val === EMPTY_FIELD || val === "";

  const handleAddFeatureSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newFeatureText.trim()) {
      onAddFeature(newFeatureText.trim());
      setNewFeatureText("");
    }
  };

  return (
    <div className="space-y-6">
      {/* Property Specifications Form */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <h3 className="text-xs font-black uppercase tracking-wider text-[#1B494E] pb-3 border-b border-slate-100">
          Property Specifications
        </h3>

        {/* Property Title */}
        <div>
          <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
            Property Title
          </label>
          <input
            id="spec-field-propertyTitle"
            type="text"
            value={data.propertyTitle || ""}
            onFocus={() => onSelectCanvasItem("propertyTitle", "text")}
            onChange={(e) => onUpdateField("propertyTitle", e.target.value)}
            className={`w-full py-2.5 px-3.5 rounded-lg border text-sm font-semibold transition-all focus:outline-none ${
              selectedCanvasItemId === "propertyTitle"
                ? "ring-2 ring-[#F26522] border-[#F26522] bg-orange-50/20 shadow-xs"
                : "border-slate-200 focus:ring-2 focus:ring-[#1B494E]/20 focus:border-[#1B494E]"
            }`}
          />
        </div>

        {/* 2-Column Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Property Type */}
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
              Property Type
            </label>
            <input
              id="spec-field-propertyType"
              type="text"
              value={data.propertyType || ""}
              onFocus={() => onSelectCanvasItem("propertyTitle", "text")}
              onChange={(e) => onUpdateField("propertyType", e.target.value)}
              className={`w-full py-2.5 px-3.5 rounded-lg border text-sm transition-all focus:outline-none ${
                selectedCanvasItemId === "propertyTitle"
                  ? "ring-2 ring-[#F26522] border-[#F26522] bg-orange-50/20 shadow-xs"
                  : isMissing(data.propertyType)
                  ? "border-amber-300 bg-amber-50/50"
                  : "border-slate-200"
              }`}
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
              Location
            </label>
            <input
              id="spec-field-location"
              type="text"
              value={data.location || ""}
              onFocus={() => onSelectCanvasItem("location", "text")}
              onChange={(e) => onUpdateField("location", e.target.value)}
              className={`w-full py-2.5 px-3.5 rounded-lg border text-sm transition-all focus:outline-none ${
                selectedCanvasItemId === "location"
                  ? "ring-2 ring-[#F26522] border-[#F26522] bg-orange-50/20 shadow-xs"
                  : isMissing(data.location)
                  ? "border-amber-300 bg-amber-50/50"
                  : "border-slate-200"
              }`}
            />
          </div>

          {/* Bedrooms */}
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
              Bedrooms
            </label>
            <input
              id="spec-field-bedrooms"
              type="number"
              value={data.bedrooms ?? ""}
              onFocus={() => onSelectCanvasItem("bedrooms", "text")}
              onChange={(e) =>
                onUpdateField(
                  "bedrooms",
                  e.target.value ? parseInt(e.target.value, 10) : null
                )
              }
              className={`w-full py-2.5 px-3.5 rounded-lg border text-sm transition-all focus:outline-none ${
                selectedCanvasItemId === "bedrooms"
                  ? "ring-2 ring-[#F26522] border-[#F26522] bg-orange-50/20 shadow-xs"
                  : isMissing(data.bedrooms)
                  ? "border-amber-300 bg-amber-50/50"
                  : "border-slate-200"
              }`}
            />
          </div>

          {/* Price NGN */}
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
              Price (Naira)
            </label>
            <input
              id="spec-field-priceNGN"
              type="number"
              value={data.priceNGN ?? ""}
              onFocus={() => onSelectCanvasItem("priceNGN", "text")}
              onChange={(e) =>
                onUpdateField(
                  "priceNGN",
                  e.target.value ? parseInt(e.target.value, 10) : null
                )
              }
              className={`w-full py-2.5 px-3.5 rounded-lg border text-sm font-bold transition-all focus:outline-none ${
                selectedCanvasItemId === "priceNGN"
                  ? "ring-2 ring-[#F26522] border-[#F26522] bg-orange-50/20 text-[#F26522] shadow-xs"
                  : isMissing(data.priceNGN)
                  ? "border-amber-300 bg-amber-50/50 text-[#1B494E]"
                  : "border-slate-200 text-[#1B494E]"
              }`}
            />
          </div>

          {/* Documentation */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
              Documentation / Title
            </label>
            <input
              id="spec-field-documentation"
              type="text"
              value={data.documentation || ""}
              onFocus={() => onSelectCanvasItem("documentation", "text")}
              onChange={(e) => onUpdateField("documentation", e.target.value)}
              className={`w-full py-2.5 px-3.5 rounded-lg border text-sm transition-all focus:outline-none ${
                selectedCanvasItemId === "documentation"
                  ? "ring-2 ring-[#F26522] border-[#F26522] bg-orange-50/20 shadow-xs"
                  : isMissing(data.documentation)
                  ? "border-amber-300 bg-amber-50/50"
                  : "border-slate-200"
              }`}
            />
          </div>
        </div>

        {/* Features List */}
        <div>
          <label className="block text-xs font-bold uppercase text-slate-500 mb-2">
            Key Features &amp; Amenities
          </label>
          <div className="flex flex-wrap gap-2 mb-3">
            {(data.features || []).map((feat, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-teal-50 text-[#1B494E] border border-teal-200/80 text-xs font-semibold"
              >
                <span>{feat}</span>
                <button
                  type="button"
                  onClick={() => onRemoveFeature(idx)}
                  className="hover:text-red-500 transition-colors cursor-pointer ml-1"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>

          <form onSubmit={handleAddFeatureSubmit} className="flex gap-2">
            <input
              type="text"
              value={newFeatureText}
              onChange={(e) => setNewFeatureText(e.target.value)}
              placeholder="e.g. Swimming Pool, 24/7 Power, Gym"
              className="flex-1 py-2 px-3 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#1B494E]/20"
            />
            <button
              type="submit"
              className="px-3.5 py-2 rounded-lg bg-[#1B494E] text-white text-xs font-bold flex items-center gap-1 cursor-pointer hover:bg-[#163e42]"
            >
              <Plus size={14} />
              <span>Add</span>
            </button>
          </form>
        </div>
      </div>

      {/* Uploaded Property Photos Manager */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-[#1B494E]">
              Property Photos ({localImages.length})
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Select hero photo or upload high-resolution property imagery
            </p>
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1.5 rounded-lg bg-[#E6EEEE] hover:bg-[#1B494E] hover:text-white text-[#1B494E] text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Upload size={13} />
            <span>Upload Photo</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={(e) => onUploadImages(e.target.files)}
          />
        </div>

        {localImages.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {localImages.map((img, idx) => (
              <div
                key={img.id || idx}
                className="relative group aspect-[4/3] rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shadow-xs"
              >
                <img
                  src={img.url}
                  alt={img.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => onSetPrimaryImage(img.id)}
                    className="p-1.5 rounded-lg bg-white/90 text-[#F26522] hover:bg-white transition-colors cursor-pointer"
                    title="Set as Hero Photo"
                  >
                    <Star size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteImage(img.id)}
                    className="p-1.5 rounded-lg bg-white/90 text-red-600 hover:bg-white transition-colors cursor-pointer"
                    title="Delete Photo"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                {idx === 0 && (
                  <div className="absolute top-1.5 left-1.5 bg-[#F26522] text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded shadow-xs">
                    HERO PHOTO
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-200 hover:border-[#1B494E] rounded-xl p-8 text-center cursor-pointer transition-colors"
          >
            <ImageIcon className="mx-auto text-slate-300 mb-2" size={32} />
            <p className="text-xs font-bold text-slate-600">Click to upload property photos</p>
            <p className="text-[11px] text-slate-400">PNG, JPG, WEBP up to 20MB</p>
          </div>
        )}
      </div>

      {/* Primary Proceed Action */}
      <div className="pt-2">
        <button
          type="button"
          onClick={onProceedToKit}
          className="w-full py-4 rounded-2xl bg-[#F26522] hover:bg-[#d95315] text-white font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-orange-950/20 transition-transform duration-120 cursor-pointer active:scale-[0.99]"
        >
          <span>Generate Marketing Kit &amp; Flyers</span>
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
