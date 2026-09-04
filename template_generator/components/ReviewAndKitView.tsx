"use client";

import React, { useState, useRef } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Share2,
  Copy,
  Sparkles,
  Loader2,
  CheckCircle2,
  Layers,
  Layout,
  FolderArchive,
  Eye,
  Images,
} from "lucide-react";
import { PropertyData, AppSettings, UploadedImage, PropertyItem, TemplateId } from "../types/propkit";
import { FlyerCanvas, svgToPngBlob } from "./FlyerCanvas";
import { EMPTY_FIELD, TEMPLATES_CONFIG } from "../utils/constants";
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
  initialTemplateId?: TemplateId;
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
  initialTemplateId,
  onSaveProperty,
  onBackToNew,
  onDone,
}: ReviewAndKitViewProps) {
  const [step, setStep] = useState<"review" | "kit">(initialStep);
  const [data, setData] = useState<PropertyData>(initialData);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId>(
    initialTemplateId || "bmi"
  );
  const [caption, setCaption] = useState<string>(
    existingCaption || generateCaption(initialData, settings.captionTemplate, settings)
  );
  const [exportScale, setExportScale] = useState<number>(1);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [batchDownloading, setBatchDownloading] = useState(false);
  const [batchProgress, setBatchProgress] = useState<string | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [generating, setGenerating] = useState(false);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const offscreenSvgs = useRef<(SVGSVGElement | null)[]>([]);

  // Bound index safely within images range
  const safeActiveIndex =
    images.length > 0
      ? Math.min(Math.max(0, activeImageIndex), images.length - 1)
      : 0;

  const currentActiveImage =
    images.length > 0
      ? images[safeActiveIndex]?.url || null
      : images.find((img) => img.id === primaryId)?.url || null;

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
      templateId: selectedTemplate,
    };

    onSaveProperty(item);
    setStep("kit");
  };

  const handleDownloadPng = async (overrideIndex?: number) => {
    const targetIndex = typeof overrideIndex === "number" ? overrideIndex : safeActiveIndex;
    const isMainCanvas = targetIndex === safeActiveIndex && svgRef.current;
    const svgEl = isMainCanvas ? svgRef.current : offscreenSvgs.current[targetIndex] || svgRef.current;
    if (!svgEl) return;

    setDownloading(true);
    try {
      const blob = await svgToPngBlob(svgEl, exportScale);
      if (!blob) throw new Error("Could not create image blob");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const scaleSuffix = exportScale > 1 ? `@${exportScale}x-HD` : "";
      const outputSuffix = images.length > 1 ? `-flyer-${targetIndex + 1}` : "";
      a.download = `${(data.propertyTitle || "property-flyer")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")}${outputSuffix}-${selectedTemplate}${scaleSuffix}.png`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Download failed", e);
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadAllZip = async () => {
    if (images.length === 0) return;
    setBatchDownloading(true);
    setBatchProgress(`Initializing ${images.length} flyers...`);
    try {
      const JSZipModule = await import("jszip");
      const JSZip = JSZipModule.default;
      const zip = new JSZip();
      const titleSlug = (data.propertyTitle || "property-flyer")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-");

      for (let i = 0; i < images.length; i++) {
        setBatchProgress(`Rendering flyer ${i + 1} of ${images.length}...`);
        const svgEl =
          i === safeActiveIndex && svgRef.current
            ? svgRef.current
            : offscreenSvgs.current[i] || svgRef.current;
        if (svgEl) {
          const blob = await svgToPngBlob(svgEl, exportScale);
          if (blob) {
            const scaleSuffix = exportScale > 1 ? `@${exportScale}x-HD` : "";
            const filename = `${titleSlug}-flyer-${i + 1}-${selectedTemplate}${scaleSuffix}.png`;
            zip.file(filename, blob);
          }
        }
      }

      if (caption) {
        zip.file("instagram-caption.txt", caption);
      }

      setBatchProgress("Compressing ZIP bundle...");
      const zipBlob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${titleSlug}-${selectedTemplate}-all-${images.length}-flyers.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Batch ZIP export failed", e);
    } finally {
      setBatchDownloading(false);
      setBatchProgress(null);
    }
  };

  const handleDownloadAllSeparate = async () => {
    if (images.length === 0) return;
    setBatchDownloading(true);
    try {
      const titleSlug = (data.propertyTitle || "property-flyer")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-");

      for (let i = 0; i < images.length; i++) {
        setBatchProgress(`Downloading flyer ${i + 1} of ${images.length}...`);
        const svgEl =
          i === safeActiveIndex && svgRef.current
            ? svgRef.current
            : offscreenSvgs.current[i] || svgRef.current;
        if (svgEl) {
          const blob = await svgToPngBlob(svgEl, exportScale);
          if (blob) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            const scaleSuffix = exportScale > 1 ? `@${exportScale}x-HD` : "";
            a.download = `${titleSlug}-flyer-${i + 1}-${selectedTemplate}${scaleSuffix}.png`;
            a.click();
            URL.revokeObjectURL(url);
            await new Promise((r) => setTimeout(r, 450));
          }
        }
      }
    } catch (e) {
      console.error("Batch sequential download failed", e);
    } finally {
      setBatchDownloading(false);
      setBatchProgress(null);
    }
  };

  const handleShare = async () => {
    if (!svgRef.current) return;
    const blob = await svgToPngBlob(svgRef.current, 1);
    if (!blob) return;

    if (navigator.share && navigator.canShare) {
      const file = new File([blob], `flyer-${safeActiveIndex + 1}.png`, { type: "image/png" });
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
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
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
                    onClick={() => handleDownloadPng()}
                    disabled={downloading || batchDownloading}
                    className="flex-1 py-3.5 px-5 rounded-xl bg-[#1B494E] hover:bg-[#14383C] text-white font-bold text-xs tracking-wider uppercase flex items-center justify-center gap-2 shadow-md shadow-[#1B494E]/20 transition-transform duration-120 ease-out cursor-pointer active:scale-[0.98] disabled:opacity-50"
                  >
                    <Download size={16} />
                    <span>
                      {downloading
                        ? "Rendering PNG..."
                        : images.length > 1
                        ? `Download Flyer #${safeActiveIndex + 1} PNG`
                        : `Download ${exportScale === 2 ? "2x Ultra HD " : ""}PNG`}
                    </span>
                  </button>
                  <button
                    onClick={handleShare}
                    disabled={downloading || batchDownloading}
                    className="py-3.5 px-6 rounded-xl bg-[#F26522] hover:bg-[#D95315] text-white font-bold text-xs tracking-wider uppercase flex items-center justify-center gap-2 shadow-md shadow-orange-600/20 transition-transform duration-120 ease-out cursor-pointer active:scale-[0.98] disabled:opacity-50"
                  >
                    <Share2 size={16} />
                    <span>Share</span>
                  </button>
                </div>

                {/* Batch Export Options for Multi-Image Generation */}
                {images.length > 1 && (
                  <div className="pt-3 border-t border-slate-100 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700">
                        Batch Export All {images.length} Outputs
                      </span>
                      {batchProgress && (
                        <span className="text-[11px] font-semibold text-orange-600 flex items-center gap-1.5">
                          <Loader2 size={12} className="animate-spin" />
                          {batchProgress}
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={handleDownloadAllZip}
                        disabled={batchDownloading || downloading}
                        className="py-3 px-4 rounded-xl bg-orange-50 hover:bg-orange-100 text-[#F26522] border border-orange-200 font-bold text-xs flex items-center justify-center gap-2 transition-transform duration-120 cursor-pointer active:scale-[0.98] disabled:opacity-50"
                      >
                        <FolderArchive size={16} />
                        <span>Download All ({images.length}) as ZIP</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleDownloadAllSeparate}
                        disabled={batchDownloading || downloading}
                        className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition-transform duration-120 cursor-pointer active:scale-[0.98] disabled:opacity-50"
                      >
                        <Download size={16} />
                        <span>Download All Separately</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* All Generated Outputs Gallery Grid (Multi-Image Processed Individually) */}
              {images.length > 1 && (
                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div>
                      <h3 className="font-extrabold text-[#1B494E] text-xs uppercase tracking-wider flex items-center gap-1.5">
                        <Images size={15} />
                        <span>All Generated Outputs ({images.length} Flyers)</span>
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Each uploaded image was processed individually using the {selectedTemplate.toUpperCase()} template.
                      </p>
                    </div>
                    <span className="text-[10px] font-bold text-slate-600 px-2 py-0.5 bg-slate-100 rounded-md">
                      {images.length} Outputs
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {images.map((img, idx) => {
                      const isCurrent = idx === safeActiveIndex;
                      return (
                        <div
                          key={img.id || idx}
                          className={`p-2 rounded-xl border transition-all flex flex-col justify-between ${
                            isCurrent
                              ? "border-[#F26522] bg-orange-50/20 ring-1 ring-[#F26522]"
                              : "border-slate-200 bg-white hover:border-slate-300"
                          }`}
                        >
                          <div className="relative aspect-[4/5] rounded-lg overflow-hidden bg-slate-100 mb-2">
                            <img
                              src={img.url}
                              alt={`Flyer ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute top-1.5 left-1.5 bg-[#1B494E]/90 backdrop-blur-xs text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded shadow-xs">
                              Flyer #{idx + 1}
                            </div>
                            {idx === 0 && (
                              <div className="absolute top-1.5 right-1.5 bg-[#F26522] text-white text-[8px] font-bold px-1 py-0.5 rounded shadow-xs">
                                COVER
                              </div>
                            )}
                          </div>

                          <div className="space-y-1.5">
                            <button
                              type="button"
                              onClick={() => setActiveImageIndex(idx)}
                              className={`w-full py-1.5 rounded-md text-[11px] font-bold flex items-center justify-center gap-1 transition-transform duration-120 cursor-pointer active:scale-[0.98] ${
                                isCurrent
                                  ? "bg-[#1B494E] text-white"
                                  : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                              }`}
                            >
                              <Eye size={12} />
                              <span>{isCurrent ? "Active" : "Preview"}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDownloadPng(idx)}
                              disabled={downloading || batchDownloading}
                              className="w-full py-1.5 rounded-md bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-[11px] font-bold flex items-center justify-center gap-1 transition-transform duration-120 cursor-pointer active:scale-[0.98] disabled:opacity-50"
                            >
                              <Download size={11} />
                              <span>PNG</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

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
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-[#1B494E]">
                Live Flyer Preview
              </span>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#1B494E] text-white">
                {images.length === 0
                  ? "1 Output"
                  : images.length === 1
                  ? "1 Output Flyer"
                  : images.length === 2
                  ? "2 Separate Outputs"
                  : `${images.length} Outputs (Individual)`}
              </span>
            </div>
            <span className="text-[11px] font-semibold text-slate-400">
              1080 × 1350 (4:5)
            </span>
          </div>

          {/* 3-Template Selection Switcher */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Layout size={14} className="text-[#1B494E]" />
                <span className="text-[11px] font-black uppercase tracking-wider text-[#1B494E]">
                  Choose Flyer Template
                </span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                {TEMPLATES_CONFIG.length} Templates
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {TEMPLATES_CONFIG.map((tmpl) => {
                const isSelected = selectedTemplate === tmpl.id;
                return (
                  <button
                    key={tmpl.id}
                    type="button"
                    onClick={() => setSelectedTemplate(tmpl.id)}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition-transform duration-120 active:scale-[0.98] ${
                      isSelected
                        ? "border-[#1B494E] bg-[#1B494E]/5 ring-2 ring-[#1B494E]/20 shadow-xs"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{
                          backgroundColor:
                            tmpl.accentColor === "#FFFFFF"
                              ? tmpl.themeColor
                              : tmpl.accentColor,
                        }}
                      />
                      <span className="text-[9px] font-extrabold uppercase px-1 py-0.2 rounded bg-slate-100 text-slate-600">
                        {tmpl.badge}
                      </span>
                    </div>
                    <div className="text-xs font-extrabold text-[#1B494E] truncate">
                      {tmpl.name}
                    </div>
                    <div className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                      {tmpl.description}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Multi-Image Flyer Pager Bar (Shown when images.length > 1) */}
          {images.length > 1 && (
            <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-orange-100 text-[#F26522] flex items-center justify-center font-black text-xs">
                    {safeActiveIndex + 1}
                  </div>
                  <div>
                    <div className="text-xs font-extrabold text-[#1B494E] leading-tight">
                      Output Flyer {safeActiveIndex + 1} of {images.length}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Processed individually · {selectedTemplate.toUpperCase()}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setActiveImageIndex((prev) => Math.max(0, prev - 1))}
                    disabled={safeActiveIndex === 0}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-transform duration-120 active:scale-[0.98] cursor-pointer"
                    title="Previous flyer"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveImageIndex((prev) => Math.min(images.length - 1, prev + 1))}
                    disabled={safeActiveIndex === images.length - 1}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-transform duration-120 active:scale-[0.98] cursor-pointer"
                    title="Next flyer"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>

              {/* Thumbnails Quick Switcher Strip */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5">
                {images.map((img, idx) => {
                  const isActive = idx === safeActiveIndex;
                  return (
                    <button
                      key={img.id || idx}
                      type="button"
                      onClick={() => setActiveImageIndex(idx)}
                      className={`relative flex-shrink-0 w-12 h-14 rounded-lg overflow-hidden border-2 transition-transform duration-120 cursor-pointer active:scale-[0.98] ${
                        isActive
                          ? "border-[#F26522] ring-2 ring-orange-500/30 scale-105 shadow-xs"
                          : "border-slate-200 opacity-70 hover:opacity-100"
                      }`}
                    >
                      <img
                        src={img.url}
                        alt={`Flyer ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute bottom-0 inset-x-0 bg-black/70 text-white text-[9px] font-bold text-center py-0.5">
                        #{idx + 1}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Main Flyer Canvas */}
          <FlyerCanvas
            data={data}
            settings={settings}
            svgRef={svgRef}
            primaryImage={currentActiveImage}
            templateId={selectedTemplate}
          />
        </div>
      </div>

      {/* Offscreen SVG Canvases for Instant Multi-Flyer PNG & ZIP Export */}
      <div
        style={{
          position: "absolute",
          left: -9999,
          top: -9999,
          width: 1080,
          height: 1350,
          overflow: "hidden",
          pointerEvents: "none",
          visibility: "hidden",
        }}
        aria-hidden="true"
      >
        {images.map((img, idx) => (
          <div
            key={img.id || idx}
            ref={(el) => {
              if (el) {
                const svg = el.querySelector("svg");
                if (svg) offscreenSvgs.current[idx] = svg;
              }
            }}
          >
            <FlyerCanvas
              data={data}
              settings={settings}
              primaryImage={img.url}
              templateId={selectedTemplate}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
