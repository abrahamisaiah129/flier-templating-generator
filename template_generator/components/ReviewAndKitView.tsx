"use client";

import React, { useState, useRef } from "react";
import {
  ChevronLeft,
  Download,
  Share2,
  Copy,
  Sparkles,
  Loader2,
  CheckCircle2,
  Layers,
} from "lucide-react";
import { PropertyData, AppSettings, UploadedImage, PropertyItem } from "../types/propkit";
import { FlyerCanvas, svgToPngBlob } from "./FlyerCanvas";
import { EMPTY_FIELD } from "../utils/constants";
import { generateCaption } from "../utils/extractor";

interface ReviewAndKitViewProps {
  initialStep: "review" | "kit";
  initialData: PropertyData;
  images: UploadedImage[];
  primaryId: string | null;
  settings: AppSettings;
  briefText?: string;
  briefUrl?: string;
  existingId?: string;
  existingCaption?: string;
  onSaveProperty: (property: PropertyItem) => void;
  onBackToNew: () => void;
  onDone: () => void;
}

function uid(): string {
  return Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
}

export function ReviewAndKitView({
  initialStep,
  initialData,
  images,
  primaryId,
  settings,
  briefText = "",
  briefUrl = "",
  existingId,
  existingCaption,
  onSaveProperty,
  onBackToNew,
  onDone,
}: ReviewAndKitViewProps) {
  const [step, setStep] = useState<"review" | "kit">(initialStep);
  const [data, setData] = useState<PropertyData>(initialData);
  const [caption, setCaption] = useState<string>(
    existingCaption || generateCaption(initialData, settings.captionTemplate, settings)
  );
  const [exportScale, setExportScale] = useState<number>(1);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const primaryImage =
    images.find((img) => img.id === primaryId)?.url || images[0]?.url || null;

  const updateField = <K extends keyof PropertyData>(key: K, value: PropertyData[K]) => {
    setData((prev) => {
      const updated = { ...prev, [key]: value };
      if (
        key === "bedrooms" ||
        key === "propertyType" ||
        key === "location" ||
        key === "priceNGN" ||
        key === "documentation"
      ) {
        setCaption(generateCaption(updated, settings.captionTemplate, settings));
      }
      return updated;
    });
  };

  const handleConfirmGenerate = async () => {
    setGenerating(true);
    await new Promise((r) => setTimeout(r, 400));
    setGenerating(false);

    const generatedCaption =
      caption || generateCaption(data, settings.captionTemplate, settings);

    const item: PropertyItem = {
      id: existingId || uid(),
      data,
      images,
      primaryId: primaryId || images[0]?.id || null,
      caption: generatedCaption,
      status: "Ready",
      createdAt: new Date().toISOString(),
      briefText,
      briefUrl,
      templateId: "bmi",
    };

    onSaveProperty(item);
    setStep("kit");
  };

  const handleDownloadPng = async () => {
    if (!svgRef.current) return;
    setDownloading(true);
    try {
      const blob = await svgToPngBlob(svgRef.current, exportScale);
      if (!blob) throw new Error("Could not create image blob");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const scaleSuffix = exportScale > 1 ? `@${exportScale}x-HD` : "";
      a.download = `${(data.propertyTitle || "bmi-property-flyer")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")}${scaleSuffix}.png`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Download failed", e);
    } finally {
      setDownloading(false);
    }
  };

  const handleShare = async () => {
    if (!svgRef.current) return;
    const blob = await svgToPngBlob(svgRef.current, 1);
    if (!blob) return;

    if (navigator.share && navigator.canShare) {
      const file = new File([blob], "flyer.png", { type: "image/png" });
      if (navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: data.propertyTitle || "BMI Property Creative",
            text: caption,
          });
          return;
        } catch {
          // fall through to download
        }
      }
    }
    handleDownloadPng();
  };

  const handleCopyCaption = () => {
    navigator.clipboard?.writeText(caption);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isMissing = (val: unknown) =>
    val === null || val === undefined || val === EMPTY_FIELD || val === "";

  return (
    <div className="max-w-6xl mx-auto py-4 px-2 sm:px-4">
      {/* Top Breadcrumb & Step Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={step === "kit" ? () => setStep("review") : onBackToNew}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-[#1B494E] transition-colors cursor-pointer active:scale-[0.98]"
          >
            <ChevronLeft size={16} />
            <span>{step === "kit" ? "Back to Editor" : "Back to Brief"}</span>
          </button>
          <span className="text-slate-300">/</span>
          <h2 className="text-xl font-extrabold text-[#1B494E]">
            {step === "review" ? "Verify & Customize Flyer" : "Property Marketing Kit"}
          </h2>
        </div>

        {step === "kit" && (
          <button
            type="button"
            onClick={onDone}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#1B494E] text-xs font-bold transition-all duration-150 cursor-pointer active:scale-[0.98]"
          >
            Done · Back to Dashboard
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: Controls or Kit Details */}
        <div className="lg:col-span-7 space-y-6">
          {/* STEP 1: REVIEW FIELDS */}
          {step === "review" && (
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
                  type="text"
                  value={data.propertyTitle}
                  onChange={(e) => updateField("propertyTitle", e.target.value)}
                  className="w-full py-2.5 px-3.5 rounded-lg border border-slate-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#1B494E]/20 focus:border-[#1B494E]"
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
                    type="text"
                    value={data.propertyType}
                    onChange={(e) => updateField("propertyType", e.target.value)}
                    className={`w-full py-2.5 px-3.5 rounded-lg border text-sm focus:outline-none ${
                      isMissing(data.propertyType)
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
                    type="text"
                    value={data.location}
                    onChange={(e) => updateField("location", e.target.value)}
                    className={`w-full py-2.5 px-3.5 rounded-lg border text-sm focus:outline-none ${
                      isMissing(data.location)
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
                    type="number"
                    value={data.bedrooms ?? ""}
                    onChange={(e) =>
                      updateField(
                        "bedrooms",
                        e.target.value ? parseInt(e.target.value, 10) : null
                      )
                    }
                    className={`w-full py-2.5 px-3.5 rounded-lg border text-sm focus:outline-none ${
                      isMissing(data.bedrooms)
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
                    type="number"
                    value={data.priceNGN ?? ""}
                    onChange={(e) =>
                      updateField(
                        "priceNGN",
                        e.target.value ? parseInt(e.target.value, 10) : null
                      )
                    }
                    className={`w-full py-2.5 px-3.5 rounded-lg border text-sm font-bold text-[#1B494E] focus:outline-none ${
                      isMissing(data.priceNGN)
                        ? "border-amber-300 bg-amber-50/50"
                        : "border-slate-200"
                    }`}
                  />
                </div>

                {/* Documentation */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                    Documentation / Title
                  </label>
                  <input
                    type="text"
                    value={data.documentation}
                    onChange={(e) => updateField("documentation", e.target.value)}
                    className={`w-full py-2.5 px-3.5 rounded-lg border text-sm focus:outline-none ${
                      isMissing(data.documentation)
                        ? "border-amber-300 bg-amber-50/50"
                        : "border-slate-200"
                    }`}
                  />
                </div>
              </div>

              {/* Furnished Status */}
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
                  Furnished Status
                </label>
                <div className="flex gap-2">
                  {[
                    { label: "Furnished", value: true },
                    { label: "Unfurnished", value: false },
                    { label: "Unknown", value: null },
                  ].map((opt) => (
                    <button
                      key={opt.label}
                      type="button"
                      onClick={() => updateField("furnished", opt.value)}
                      className={`px-4 py-2 rounded-lg text-xs font-bold border transition-transform duration-150 ease-out cursor-pointer active:scale-[0.98] ${
                        data.furnished === opt.value
                          ? "bg-[#F26522] border-[#F26522] text-white shadow-xs"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Features tags */}
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                  Features & Highlights (e.g. BQ, Swimming Pool, 24hr Power)
                </label>
                <input
                  type="text"
                  value={data.features.join(", ")}
                  onChange={(e) =>
                    updateField(
                      "features",
                      e.target.value
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean)
                    )
                  }
                  className="w-full py-2.5 px-3.5 rounded-lg border border-slate-200 text-sm focus:outline-none"
                />
              </div>

              {/* Actions */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onBackToNew}
                  className="px-4 py-2.5 rounded-xl text-slate-600 text-xs font-bold hover:bg-slate-100 transition-transform duration-150 ease-out cursor-pointer active:scale-[0.98]"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleConfirmGenerate}
                  disabled={generating}
                  className="px-6 py-3 rounded-xl bg-[#1B494E] hover:bg-[#14383C] text-white font-bold text-sm flex items-center gap-2 shadow-md cursor-pointer transition-transform duration-150 ease-out active:scale-[0.98] disabled:opacity-50"
                >
                  {generating ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Generating Template...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      <span>Confirm & Generate Kit</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: MARKETING KIT CONTROLS & CAPTION */}
          {step === "kit" && (
            <div className="space-y-6">
              {/* Export & Resolution Scale Bar */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Layers size={16} className="text-[#1B494E]" />
                    <h3 className="text-xs font-black uppercase tracking-wider text-[#1B494E]">
                      Export Resolution
                    </h3>
                  </div>
                  <div className="flex gap-1.5 bg-slate-100 p-1 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setExportScale(1)}
                      className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                        exportScale === 1
                          ? "bg-white text-[#1B494E] shadow-xs"
                          : "text-slate-500 hover:text-slate-900"
                      }`}
                    >
                      1x (1080×1350)
                    </button>
                    <button
                      type="button"
                      onClick={() => setExportScale(2)}
                      className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                        exportScale === 2
                          ? "bg-white text-[#1B494E] shadow-xs"
                          : "text-slate-500 hover:text-slate-900"
                      }`}
                    >
                      2x Ultra HD (2160×2700)
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={handleDownloadPng}
                    disabled={downloading}
                    className="flex-1 py-3.5 px-5 rounded-xl bg-[#1B494E] hover:bg-[#14383C] text-white font-bold text-xs tracking-wider uppercase flex items-center justify-center gap-2 shadow-md shadow-[#1B494E]/20 transition-transform duration-150 ease-out cursor-pointer active:scale-[0.98] disabled:opacity-50"
                  >
                    <Download size={16} />
                    <span>
                      {downloading
                        ? "Rendering PNG..."
                        : `Download ${exportScale === 2 ? "2x Ultra HD " : ""}PNG`}
                    </span>
                  </button>
                  <button
                    onClick={handleShare}
                    className="py-3.5 px-6 rounded-xl bg-[#F26522] hover:bg-[#D95315] text-white font-bold text-xs tracking-wider uppercase flex items-center justify-center gap-2 shadow-md shadow-orange-600/20 transition-transform duration-150 ease-out cursor-pointer active:scale-[0.98]"
                  >
                    <Share2 size={16} />
                    <span>Share</span>
                  </button>
                </div>
              </div>

              {/* Instagram Caption Card */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="font-extrabold text-[#1B494E] text-sm uppercase tracking-wider">
                    Instagram Caption
                  </h3>
                  <button
                    onClick={handleCopyCaption}
                    className="px-3.5 py-1.5 rounded-lg bg-[#E6EEEE] hover:bg-[#1B494E] hover:text-white text-[#1B494E] text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer active:scale-[0.98]"
                  >
                    {copied ? (
                      <>
                        <CheckCircle2 size={14} className="text-emerald-600" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={14} />
                        <span>Copy Caption</span>
                      </>
                    )}
                  </button>
                </div>

                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  rows={12}
                  className="w-full p-4 rounded-xl bg-[#F8FAFA] border border-slate-200 text-xs font-mono text-slate-700 leading-relaxed focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1B494E]/20"
                />

                <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-100 text-blue-900 text-xs leading-relaxed">
                  💡 <strong>Tip:</strong> Tap <strong>Copy Caption</strong> above, download or share your flyer, then paste the caption right into your Instagram post!
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: LIVE FLYER SVG CANVAS */}
        <div className="lg:col-span-5 sticky top-20 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-[#1B494E]">
              Live Flyer Preview
            </span>
            <span className="text-[11px] font-semibold text-slate-400">
              1080 × 1350 (4:5)
            </span>
          </div>

          {/* Figma BMI Template Badge */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Active Layout:
              </div>
              <div className="text-xs font-extrabold text-[#1B494E]">
                BMI Template (Figma Official)
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold tracking-wide uppercase">
              More Templates Coming Soon
            </span>
          </div>

          <FlyerCanvas
            data={data}
            settings={settings}
            svgRef={svgRef}
            primaryImage={primaryImage}
          />
        </div>
      </div>
    </div>
  );
}
