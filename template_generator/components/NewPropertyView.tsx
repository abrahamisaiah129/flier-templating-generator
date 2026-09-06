"use client";

import React, { useState, useRef } from "react";
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
  Link as LinkIcon,
} from "lucide-react";
import { UploadedImage } from "../types/propkit";

interface NewPropertyViewProps {
  onStartExtraction: (briefs: string[], images: UploadedImage[], briefUrl?: string) => Promise<void>;
  extracting: boolean;
  error?: string | null;
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
}: NewPropertyViewProps) {
  // Up to 3 briefs supported
  const [briefs, setBriefs] = useState<string[]>([""]);
  const [briefUrl, setBriefUrl] = useState("");
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [primaryId, setPrimaryId] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const maxImages = briefs.length;
  const remainingImages = Math.max(0, maxImages - images.length);
  const isImageComplete = images.length >= maxImages && maxImages > 0;

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
      const nextBriefs = briefs.filter((_, i) => i !== index);
      setBriefs(nextBriefs);
      // Trim images if images exceed the new brief count
      setImages((prev) => {
        if (prev.length > nextBriefs.length) {
          const trimmed = prev.slice(0, nextBriefs.length);
          if (primaryId && !trimmed.some((img) => img.id === primaryId)) {
            setPrimaryId(trimmed[0]?.id || null);
          }
          return trimmed;
        }
        return prev;
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

    const currentSlots = Math.max(0, briefs.length - images.length);
    if (currentSlots === 0) {
      setLocalError(
        `All ${briefs.length} required image(s) for your ${briefs.length} brief(s) have already been uploaded. The system only takes ${briefs.length} image(s).`
      );
      return;
    }

    setLocalError(null);

    // Limit files to remainingSlots
    const filesToProcess = allowed.slice(0, currentSlots);
    if (allowed.length > currentSlots) {
      setLocalError(
        `Only ${currentSlots} more image allowed for ${briefs.length} brief(s). ${allowed.length - currentSlots} extra file(s) were not added.`
      );
    }

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
      const updated = [...prev, ...newImgs].slice(0, briefs.length);
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
    if (!hasAnyText && !briefUrl.trim()) {
      setLocalError("Please enter at least one property brief or provide a brief URL.");
      return;
    }

    if (images.length === 0) {
      setLocalError(`Please upload at least 1 property image (${briefs.length} required for ${briefs.length} brief${briefs.length > 1 ? "s" : ""}).`);
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

    await onStartExtraction(briefs, reorderedImages, briefUrl);
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
            <p className="text-xs text-slate-500 mt-1">
              The unedited version is kept with the property.
              {briefs.length > 1 && (
                <span className="ml-1 text-[#F26522] font-medium">
                  (You can paste up to three property briefs at once)
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Dynamic Brief Textareas */}
        <div className="space-y-3.5">
          {briefs.map((brief, idx) => (
            <div key={idx} className="relative group">
              <textarea
                value={brief}
                onChange={(e) => handleBriefChange(idx, e.target.value)}
                rows={idx === 0 ? 5 : 4}
                placeholder={
                  idx === 0
                    ? "Paste a whatsapp Message, notes or brief in it's unedited form.  I will extract the necessary details needed for your design template. Something like 2 bedroom apartment in VGC, Lekki..."
                    : `Paste brief ${idx + 1}...`
                }
                className="w-full p-4 rounded-xl bg-[#E6EEEE]/60 border border-slate-300/70 text-slate-800 text-sm placeholder:text-slate-500/80 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1B494E]/30 focus:border-[#1B494E] transition-all resize-y"
              />
              {briefs.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveBrief(idx)}
                  className="absolute top-3 right-3 p-1.5 rounded-md bg-white/80 hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors shadow-xs"
                  title="Remove this brief"
                >
                  <X size={15} />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Orange "+ Add another brief" Button (Figma screens 2 & 3) */}
        {briefs.length < 3 && (
          <button
            type="button"
            onClick={handleAddBrief}
            className="w-full mt-3.5 py-3 rounded-lg bg-[#F26522] hover:bg-[#D95315] text-white font-bold text-sm flex items-center justify-center gap-2 transition-transform duration-150 ease-out active:scale-[0.98] shadow-sm shadow-orange-600/10 cursor-pointer"
          >
            <Plus size={16} />
            <span>+ Add another brief</span>
          </button>
        )}
      </div>

      {/* Brief URL (optional) */}
      <div className="mb-6">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
          Brief URL (optional)
        </label>
        <div className="relative">
          <input
            type="url"
            value={briefUrl}
            onChange={(e) => setBriefUrl(e.target.value)}
            placeholder="or paste property brief URL"
            className="w-full py-3 px-4 rounded-xl bg-[#E6EEEE]/40 border border-slate-300/80 text-sm text-slate-800 placeholder:text-slate-500/80 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1B494E]/30 focus:border-[#1B494E] transition-all"
          />
          <LinkIcon
            size={16}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
        </div>
      </div>

      {/* Upload Property Image Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
            Upload Property Image
          </label>
          <span className="text-xs font-semibold text-slate-500">
            {images.length} of {maxImages} uploaded ({briefs.length} {briefs.length === 1 ? "brief" : "briefs"})
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
            className="border-2 border-dashed border-slate-300 hover:border-[#1B494E]/50 rounded-xl p-9 bg-white/50 hover:bg-white text-center cursor-pointer transition-all group"
          >
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[#E6EEEE]/80 flex items-center justify-center text-slate-600 group-hover:text-[#1B494E] group-hover:scale-105 transition-all">
              <UploadCloud size={24} />
            </div>
            <p className="text-sm font-semibold text-slate-700 group-hover:text-[#1B494E]">
              Drag & drop {maxImages > 1 ? `${maxImages} property images` : "property image"} here, or click to browse
            </p>
            <p className="text-xs font-medium text-slate-500 mt-1">
              {maxImages === 1
                ? "1 brief = 1 property image required → 1 output flyer"
                : `${maxImages} briefs = ${maxImages} property images required (1 image per brief)`}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              1 image uploaded = 1 output image · 2 images uploaded = 2 separate output images
            </p>
          </div>
        ) : (
          /* State B: Dynamic Progress Banner + Thumbnails */
          <div className="space-y-4">
            {/* Status Banner */}
            <div
              className={`text-white py-4 px-6 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm transition-colors ${
                isImageComplete ? "bg-[#1B494E]" : "bg-[#163E42]"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-[#F26522] flex items-center justify-center text-white flex-shrink-0">
                  <CheckCircle2 size={18} />
                </div>
                <div>
                  <span className="font-bold text-sm tracking-wide block">
                    {isImageComplete
                      ? "Image completed"
                      : `${images.length} ${images.length === 1 ? "image" : "images"} completed, remaining ${remainingImages}`}
                  </span>
                  <span className="text-xs text-teal-100 font-medium block">
                    {isImageComplete
                      ? images.length === 1
                        ? "1 image uploaded → 1 output image using the template"
                        : images.length === 2
                        ? "2 images uploaded → 2 separate output images using the template"
                        : `${images.length} images uploaded → ${images.length} separate output images processed individually`
                      : `${images.length} of ${maxImages} images uploaded · Please upload ${remainingImages} more image to match your ${maxImages} brief${maxImages > 1 ? "s" : ""}`}
                  </span>
                </div>
              </div>
              <span className="self-start sm:self-auto text-xs font-extrabold px-3 py-1 bg-white/10 rounded-full border border-white/20 whitespace-nowrap">
                {isImageComplete
                  ? `${images.length} ${images.length === 1 ? "Output Flyer" : "Separate Outputs"} Ready`
                  : `${images.length} / ${maxImages} Uploaded`}
              </span>
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

                    {/* Output Number Tag & Primary Indicator */}
                    <div className="absolute top-2 left-2 flex flex-col gap-1 items-start">
                      <div className="bg-[#1B494E]/90 backdrop-blur-xs text-white text-[10px] font-extrabold px-2 py-0.5 rounded-md shadow-xs">
                        Output #{idx + 1}
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

                    <div className="p-1.5 bg-white text-[11px] text-slate-600 truncate">
                      {img.name}
                    </div>
                  </div>
                );
              })}

              {/* Add remaining button if slots exist */}
              {!isImageComplete ? (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-32 rounded-xl border-2 border-dashed border-orange-300 hover:border-[#F26522] bg-orange-50/20 hover:bg-orange-50/60 flex flex-col items-center justify-center text-slate-600 hover:text-[#F26522] transition-colors p-2 text-center cursor-pointer group"
                >
                  <Plus size={22} className="mb-1 text-[#F26522] group-hover:scale-110 transition-transform duration-150" />
                  <span className="text-xs font-bold text-slate-700">Add remaining</span>
                  <span className="text-[10px] text-orange-600 font-semibold mt-0.5">
                    ({remainingImages} {remainingImages === 1 ? "image" : "images"} left)
                  </span>
                </button>
              ) : (
                <div className="h-32 rounded-xl border border-dashed border-emerald-200 bg-emerald-50/30 flex flex-col items-center justify-center text-emerald-800 p-2 text-center select-none">
                  <CheckCircle2 size={22} className="mb-1 text-emerald-600" />
                  <span className="text-xs font-bold">Image completed</span>
                  <span className="text-[10px] text-emerald-600/80 mt-0.5 font-medium">
                    {maxImages} of {maxImages} briefs matched
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          multiple={remainingImages > 1}
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => handleImageFiles(e.target.files)}
        />
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
    </div>
  );
}
