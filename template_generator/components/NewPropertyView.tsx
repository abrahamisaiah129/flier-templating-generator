"use client";

import React, { useState, useRef, useMemo } from "react";
import {
  UploadCloud,
  CheckCircle2,
  FileText,
  Trash2,
  Star,
  Plus,
  Loader2,
  AlertCircle,
  X,
  Layout,
  Palette,
} from "lucide-react";
import { UploadedImage, TemplateId, CustomTemplateItem } from "../types/propkit";
import { TEMPLATES_CONFIG } from "../utils/constants";
import { getStoredCustomTemplates } from "../utils/storage";
import { TemplateSelectorModal } from "./TemplateSelectorModal";

interface NewPropertyViewProps {
  onStartExtraction: (
    briefs: string[],
    images: UploadedImage[],
    briefUrl?: string,
    templateId?: TemplateId
  ) => Promise<void>;
  extracting: boolean;
  error?: string | null;
  initialTemplateId?: TemplateId;
}

function uid(): string {
  return Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function NewPropertyView({
  onStartExtraction,
  extracting,
  error,
  initialTemplateId = "bmi",
}: NewPropertyViewProps) {
  // Up to 3 briefs supported - auto-ingests from ?brief=...
  const [briefs, setBriefs] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      const p = new URLSearchParams(window.location.search).get("brief");
      if (p && p.trim()) return [p.trim()];
    }
    return [""];
  });

  // Brief URL - auto-ingests from ?url=... or ?briefUrl=...
  const [briefUrl, setBriefUrl] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const u = params.get("url") || params.get("briefUrl");
      if (u && u.trim()) return u.trim();
    }
    return "";
  });

  // Images - auto-ingests from ?image=... or ?images=... or ?bg=...
  const [images, setImages] = useState<UploadedImage[]>(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const imgParam = params.get("image") || params.get("img") || params.get("bg");
      const imagesParam = params.get("images");
      const urls: string[] = [];
      if (imagesParam) {
        urls.push(...imagesParam.split(",").map((s) => s.trim()).filter(Boolean));
      } else if (imgParam) {
        urls.push(imgParam.trim());
      }
      if (urls.length > 0) {
        return urls.map((u, i) => ({
          id: uid(),
          url: u,
          name: `Property Photo ${i + 1}`,
        }));
      }
    }
    return [];
  });

  const [primaryId, setPrimaryId] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Stage 1 Template Selection state
  const [selectedTemplateId, setSelectedTemplateId] = useState<TemplateId>(
    initialTemplateId || "bmi"
  );
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const customTemplates: CustomTemplateItem[] =
    typeof window !== "undefined" ? getStoredCustomTemplates() : [];

  const currentTemplate = useMemo(() => {
    const all = [
      ...TEMPLATES_CONFIG.map((t) => ({
        id: t.id,
        name: t.name,
        badge: t.badge,
        themeColor: t.themeColor,
        description: t.description,
      })),
      ...customTemplates.map((c) => ({
        id: c.id,
        name: c.name,
        badge: c.badge || "Custom Template",
        themeColor: c.themeColor || "#0E1626",
        description: c.description || "Custom SVG flyer template from your personal library",
      })),
    ];
    return (
      all.find((t) => t.id === selectedTemplateId) || {
        id: "bmi",
        name: "BMI Signature",
        badge: "",
        themeColor: "#0B2854",
        description: "",
      }
    );
  }, [selectedTemplateId, customTemplates.length]);

  const handleBriefChange = (index: number, val: string) => {
    setBriefs((prev) => {
      const copy = [...prev];
      copy[index] = val;
      return copy;
    });
  };

  const handleAddBrief = () => {
    if (briefs.length < 3) {
      setBriefs((prev) => [...prev, ""]);
    }
  };

  const handleRemoveBrief = (index: number) => {
    if (briefs.length > 1) {
      setBriefs((prev) => prev.filter((_, i) => i !== index));
      setImages((prev) => {
        const next = prev.filter((_, i) => i !== index);
        if (primaryId && !next.some((img) => img.id === primaryId)) {
          setPrimaryId(next[0]?.id || null);
        }
        return next;
      });
    }
  };

  const handleImageFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const allowed = Array.from(fileList).filter((f) =>
      /image\/(jpeg|jpg|png|webp)/i.test(f.type)
    );

    if (allowed.length === 0) {
      setLocalError("Please upload valid image files (JPG, PNG, or WEBP).");
      return;
    }

    // Strictly enforce 1 image per brief (cannot upload 2 or 3 images for just 1 brief)
    const maxAllowed = Math.min(3, briefs.length);
    if (images.length >= maxAllowed) {
      if (briefs.length === 1) {
        setLocalError(
          "You cannot upload 2 or 3 images for just 1 brief. Please add another brief below first to attach Photo #2."
        );
      } else {
        setLocalError(
          `You currently have ${briefs.length} briefs, so a maximum of ${briefs.length} images can be uploaded (1 per brief). Add another brief to upload more.`
        );
      }
      return;
    }

    const remainingSlots = Math.max(0, maxAllowed - images.length);
    if (allowed.length > remainingSlots) {
      if (briefs.length === 1) {
        setLocalError(
          "You cannot upload 2 or 3 images for just 1 brief. Only 1 image was attached for Brief #1. Click '+ Add another brief' to attach Photo #2."
        );
      } else {
        setLocalError(
          `Only ${remainingSlots} more brief image(s) could be added to match your ${briefs.length} briefs (1 image per brief).`
        );
      }
    } else {
      setLocalError(null);
    }

    const filesToProcess = allowed.slice(0, remainingSlots);
    const newImgs: UploadedImage[] = [];
    for (const f of filesToProcess) {
      try {
        const url = await fileToDataUrl(f);
        newImgs.push({ id: uid(), url, name: f.name });
      } catch (e) {
        console.error("Error reading file", e);
      }
    }

    setImages((prev) => {
      const updated = [...prev, ...newImgs].slice(0, maxAllowed);
      if (!primaryId && updated.length > 0) {
        setPrimaryId(updated[0].id);
      }
      return updated;
    });
  };

  const handleDeleteImage = (id: string) => {
    setImages((prev) => {
      const next = prev.filter((img) => img.id !== id);
      if (primaryId === id) {
        setPrimaryId(next.length > 0 ? next[0].id : null);
      }
      return next;
    });
  };

  const handleSetPrimary = (id: string) => {
    setPrimaryId(id);
  };

  const handleSubmit = async () => {
    const hasAnyText = briefs.some((b) => b.trim().length > 0);
    if (!hasAnyText) {
      setLocalError("Please enter at least one property brief.");
      return;
    }

    if (images.length === 0) {
      setLocalError("Please upload Image #1 for Brief #1.");
      return;
    }

    const filledBriefsCount = briefs.filter((b) => b.trim().length > 0).length;
    if (images.length < filledBriefsCount) {
      setLocalError(
        `You have ${filledBriefsCount} briefs but only ${images.length} image(s) uploaded. Please upload Image #${images.length + 1} for Brief #${images.length + 1} (each brief requires 1 image).`
      );
      return;
    }

    setLocalError(null);

    // Ensure images are sorted so primary image is first
    const reorderedImages = [...images];
    if (primaryId) {
      const idx = reorderedImages.findIndex((img) => img.id === primaryId);
      if (idx > 0) {
        const [primaryItem] = reorderedImages.splice(idx, 1);
        reorderedImages.unshift(primaryItem);
      }
    }

    await onStartExtraction(briefs, reorderedImages, briefUrl, selectedTemplateId);
  };

  return (
    <div className="max-w-3xl mx-auto py-4 px-2 sm:px-4">
      {/* Page Title & Subtitle matching Figma */}
      <div className="mb-6">
        <h1 className="text-3xl sm:text-[34px] font-extrabold text-[#1B494E] tracking-tight">
          Start with the raw brief
        </h1>
        <p className="text-slate-600 text-sm sm:text-base mt-2 leading-relaxed">
          Paste the message, PDF text, or notes exactly as they arrived. We&apos;ll structure it without losing the source.
        </p>
      </div>

      {/* Source Brief Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm mb-6 transition-all">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-orange-100/80 flex items-center justify-center text-[#F26522]">
            <FileText size={18} />
          </div>
          <div>
            <h3 className="font-bold text-[#1B494E] text-base leading-none">
              Source brief
            </h3>
            {briefs.length > 1 && (
              <p className="text-xs text-[#F26522] font-medium mt-1">
                (You can paste up to three property briefs at once)
              </p>
            )}
          </div>
        </div>

        {/* Dynamic Brief Textareas */}
        <div className="space-y-3.5">
          {briefs.map((brief, idx) => (
            <div key={idx} className="relative group">
              {briefs.length > 1 && (
                <div className="flex items-center justify-between mb-1.5 px-1">
                  <span className="text-xs font-bold text-[#1B494E] flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-[#1B494E] text-white text-[10px] font-black flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span>Brief #{idx + 1}</span>
                    <span className="text-[10px] font-semibold text-[#F26522]">
                      (Paired with Image #{idx + 1})
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveBrief(idx)}
                    className="text-xs font-semibold text-slate-400 hover:text-red-600 flex items-center gap-1 cursor-pointer"
                    title={`Remove brief #${idx + 1}`}
                  >
                    <X size={13} />
                    <span>Remove</span>
                  </button>
                </div>
              )}
              <textarea
                value={brief}
                onChange={(e) => handleBriefChange(idx, e.target.value)}
                rows={idx === 0 ? 5 : 4}
                placeholder={
                  idx === 0
                    ? "Paste raw text, WhatsApp messages, or notes here. We'll automatically structure the details for your flyer."
                    : `Paste raw text, WhatsApp messages, or notes for brief #${idx + 1} here...`
                }
                className="w-full p-4 rounded-xl bg-[#E6EEEE]/60 border border-slate-300/70 text-slate-800 text-sm placeholder:text-slate-500/80 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1B494E]/30 focus:border-[#1B494E] transition-all resize-y"
              />
            </div>
          ))}
        </div>

        {/* Action Button: "+ Add Property Brief" */}
        {briefs.length < 3 && (
          <button
            type="button"
            onClick={handleAddBrief}
            className="w-full mt-3.5 py-3 rounded-lg bg-[#F26522] hover:bg-[#D95315] text-white font-bold text-sm flex items-center justify-center gap-2 transition-transform duration-150 ease-out active:scale-[0.98] shadow-sm shadow-orange-600/10 cursor-pointer"
          >
            <Plus size={16} />
            <span>Add Property Brief</span>
          </button>
        )}
      </div>

      {/* Upload Property Image Section (Swapped to come before Flyer Design Template) */}
      <div className="mb-7">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
            Upload Property Image
          </label>
          <span className="text-xs font-semibold text-slate-500">
            {briefs.length === 1 ? "1 property brief added" : `${briefs.length} property briefs added`} · {images.length}/{briefs.length} image uploaded
          </span>
        </div>

        {/* State A: Dropzone when no images uploaded */}
        {images.length === 0 ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              handleImageFiles(e.dataTransfer.files);
            }}
            className="border-2 border-dashed border-slate-300 hover:border-[#1B494E]/50 rounded-xl p-8 bg-white/50 hover:bg-white text-center cursor-pointer transition-all group"
          >
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[#E6EEEE]/80 flex items-center justify-center text-slate-600 group-hover:text-[#1B494E] group-hover:scale-105 transition-all">
              <UploadCloud size={24} />
            </div>
            <p className="text-sm font-bold text-slate-800 group-hover:text-[#1B494E]">
              Upload Cover Photo
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Drag and drop your image here, or browse files (JPG, PNG, WebP)
            </p>
          </div>
        ) : (
          /* State B: Thumbnails Gallery + Add Button */
          <div className="space-y-4">
            {/* Status Banner */}
            <div className="text-white py-3 px-5 rounded-xl bg-[#1B494E] flex items-center justify-between gap-3 shadow-sm transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-[#F26522] flex items-center justify-center text-white flex-shrink-0">
                  <CheckCircle2 size={15} />
                </div>
                <div>
                  <span className="font-bold text-sm tracking-wide block">
                    {briefs.length === 1 ? "1 property brief added" : `${briefs.length} property briefs added`} · {images.length}/{briefs.length} image uploaded
                  </span>
                  <span className="text-xs text-teal-100/80 font-medium block">
                    {images.length >= briefs.length
                      ? "All images uploaded · Ready to generate flyer"
                      : `Upload ${briefs.length - images.length} more image for Brief #${images.length + 1}`}
                  </span>
                </div>
              </div>
              {images.length < briefs.length && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs font-bold px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg border border-white/20 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Plus size={13} />
                  <span>Add Photo #{images.length + 1}</span>
                </button>
              )}
            </div>

            {/* Thumbnails Gallery */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              {images.map((img, idx) => {
                const isPrimary = img.id === primaryId;
                return (
                  <div
                    key={img.id}
                    className={`relative group rounded-xl overflow-hidden border-2 bg-slate-100 shadow-xs transition-all ${
                      isPrimary ? "border-[#F26522] ring-2 ring-orange-500/20" : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <img
                      src={img.url}
                      alt={img.name}
                      className="w-full h-32 object-cover block"
                    />

                    {/* Image Number Tag & Primary Indicator: Marked 1, 2, 3 for each brief */}
                    <div className="absolute top-2 left-2 flex flex-col gap-1 items-start">
                      <div className="bg-[#1B494E]/90 backdrop-blur-xs text-white text-[11px] font-extrabold px-2 py-0.5 rounded-md shadow-xs flex items-center gap-1.5 border border-white/20">
                        <span className="w-4 h-4 rounded-full bg-[#F26522] text-white text-[10px] flex items-center justify-center font-black">
                          {idx + 1}
                        </span>
                        <span>Brief #{idx + 1}</span>
                      </div>
                      {isPrimary ? (
                        <div className="bg-[#F26522] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-1 shadow-xs">
                          <Star size={9} fill="#ffffff" />
                          <span>COVER</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSetPrimary(img.id)}
                          className="bg-black/60 hover:bg-[#F26522] text-white text-[9px] font-medium px-1.5 py-0.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 cursor-pointer"
                        >
                          <Star size={9} />
                          <span>Make Cover</span>
                        </button>
                      )}
                    </div>

                    {/* Delete action */}
                    <button
                      type="button"
                      onClick={() => handleDeleteImage(img.id)}
                      className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 hover:bg-red-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      title="Delete image"
                    >
                      <Trash2 size={12} />
                    </button>

                    <div className="p-2 bg-white flex flex-col gap-0.5 border-t border-slate-100">
                      <div className="text-[11px] font-bold text-slate-800 truncate">
                        {img.name}
                      </div>
                      <div className="text-[10px] text-[#F26522] font-extrabold flex items-center gap-1">
                        <span>Image #{idx + 1}</span>
                        <span className="text-slate-400">·</span>
                        <span className="text-[#1B494E]">Brief #{idx + 1}</span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Add Photo Button Tile (shown if less images than briefs) */}
              {images.length < briefs.length ? (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-32 rounded-xl border-2 border-dashed border-slate-300 hover:border-[#1B494E] bg-slate-50/50 hover:bg-slate-50 flex flex-col items-center justify-center text-slate-500 hover:text-[#1B494E] transition-colors p-2 text-center cursor-pointer group"
                >
                  <Plus size={22} className="mb-1 text-slate-400 group-hover:text-[#1B494E] group-hover:scale-110 transition-transform duration-150" />
                  <span className="text-xs font-bold text-slate-700">Add Photo #{images.length + 1}</span>
                  <span className="text-[10px] text-slate-400 font-medium mt-0.5">For Brief #{images.length + 1}</span>
                </button>
              ) : briefs.length < 3 ? (
                <button
                  type="button"
                  onClick={handleAddBrief}
                  className="h-32 rounded-xl border-2 border-dashed border-orange-200 hover:border-[#F26522] bg-orange-50/30 hover:bg-orange-50/60 flex flex-col items-center justify-center text-[#F26522] transition-colors p-2 text-center cursor-pointer group"
                  title="Add another brief to attach another image"
                >
                  <Plus size={22} className="mb-1 text-[#F26522] group-hover:scale-110 transition-transform duration-150" />
                  <span className="text-xs font-bold text-slate-700">Add Property Brief</span>
                  <span className="text-[10px] text-slate-500 font-medium mt-0.5">To upload Photo #{briefs.length + 1}</span>
                </button>
              ) : null}
            </div>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          multiple={briefs.length > 1}
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => handleImageFiles(e.target.files)}
        />
      </div>

      {/* Stage 1 Flyer Template Selection */}
      <div className="mb-7">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
            Flyer Design Template
          </label>
          <span className="text-xs font-semibold text-slate-500">
            {customTemplates.length > 0
              ? `${3 + customTemplates.length} templates available`
              : "3 official templates available"}
          </span>
        </div>

        <div
          onClick={() => setTemplateModalOpen(true)}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 p-4 rounded-2xl bg-white border border-slate-200/90 hover:border-[#1B494E]/60 shadow-xs hover:shadow-sm cursor-pointer transition-all duration-150 group"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border border-black/10 shadow-2xs group-hover:scale-105 transition-transform duration-150 motion-reduce:transform-none"
              style={{ backgroundColor: currentTemplate.themeColor }}
            >
              <Layout size={20} className="text-white" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-sm sm:text-base font-extrabold text-[#1B494E] group-hover:text-[#F26522] transition-colors">
                  {currentTemplate.name}
                </h4>
                {currentTemplate.badge ? (
                  <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 shrink-0">
                    {currentTemplate.badge}
                  </span>
                ) : null}
              </div>
              {currentTemplate.description ? (
                <p className="text-xs text-slate-500 truncate mt-0.5">
                  {currentTemplate.description}
                </p>
              ) : null}
            </div>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setTemplateModalOpen(true);
            }}
            className="self-start sm:self-auto shrink-0 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-[#1B494E] text-slate-700 hover:text-white font-bold text-xs flex items-center gap-2 transition-all duration-150 ease-out active:scale-[0.98] motion-reduce:transform-none cursor-pointer shadow-2xs"
          >
            <Palette size={14} />
            <span>Change Template</span>
          </button>
        </div>
      </div>

      {/* Error Notices */}
      {(error || localError) && (
        <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-sm flex items-start gap-3">
          <AlertCircle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <div>{error || localError}</div>
        </div>
      )}

      {/* Bottom Actions - Figma "Extract Details" Dark Teal Button */}
      <div className="flex justify-end pt-2 pb-12">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={extracting}
          className="px-8 py-3.5 rounded-xl bg-[#1B494E] hover:bg-[#14383C] text-white font-bold text-sm tracking-wide shadow-md shadow-[#1B494E]/20 transition-transform duration-150 ease-out active:scale-[0.98] flex items-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {extracting ? (
            <>
              <Loader2 size={17} className="animate-spin" />
              <span>Extracting Details...</span>
            </>
          ) : (
            <span>Extract Details</span>
          )}
        </button>
      </div>

      {/* Template Selector Modal Popup */}
      <TemplateSelectorModal
        isOpen={templateModalOpen}
        onClose={() => setTemplateModalOpen(false)}
        selectedTemplateId={selectedTemplateId}
        onSelectTemplate={(id) => setSelectedTemplateId(id)}
      />
    </div>
  );
}
