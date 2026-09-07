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
  Link as LinkIcon,
  Sparkles,
  Layout,
  Palette,
} from "lucide-react";
import { UploadedImage, TemplateId, CustomTemplateItem } from "../types/propkit";
import { TEMPLATES_CONFIG } from "../utils/constants";
import { getStoredCustomTemplates } from "../utils/storage";
import { parseDocumentText } from "../utils/documentParser";
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

  // Unified Assistant & Brief URL state
  const [activeAssistantTab, setActiveAssistantTab] = useState<"writeup" | "url" | null>(null);
  const [uploadedDocName, setUploadedDocName] = useState<string | null>(null);
  const [uploadedDocSize, setUploadedDocSize] = useState<string | null>(null);
  const [writeupText, setWriteupText] = useState("");
  const [isGeneratingBrief, setIsGeneratingBrief] = useState(false);
  const [aiSuccessMessage, setAiSuccessMessage] = useState<string | null>(null);
  const [isDraggingDoc, setIsDraggingDoc] = useState(false);
  const docFileInputRef = useRef<HTMLInputElement>(null);

  // Slot-based indexed image upload state
  const [activeUploadSlot, setActiveUploadSlot] = useState<number | null>(null);
  const slotFileInputRef = useRef<HTMLInputElement>(null);

  const triggerSlotUpload = (idx: number) => {
    setActiveUploadSlot(idx);
    if (slotFileInputRef.current) {
      slotFileInputRef.current.value = "";
      slotFileInputRef.current.click();
    }
  };

  const handleSlotImageFile = async (idx: number, fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const file = fileList[0];
    if (!/image\/(jpeg|jpg|png|webp)/i.test(file.type)) {
      setLocalError("Please upload a valid image file (JPG, PNG, or WEBP).");
      return;
    }
    try {
      const url = await fileToDataUrl(file);
      const newImg: UploadedImage = { id: uid(), url, name: file.name };
      setImages((prev) => {
        const updated = [...prev];
        updated[idx] = newImg;
        if (idx === 0 || !primaryId) {
          setPrimaryId(updated[0]?.id || newImg.id);
        }
        return updated;
      });
      setLocalError(null);
    } catch (err) {
      console.error("Error reading file", err);
    }
  };

  const handleRemoveSlotImage = (idx: number) => {
    setImages((prev) => {
      const updated = prev.filter((_, i) => i !== idx);
      if (primaryId && !updated.find((img) => img.id === primaryId)) {
        setPrimaryId(updated[0]?.id || null);
      }
      return updated;
    });
  };

  const isImageComplete = images.length > 0;

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
        const nextImages = prev.filter((_, i) => i !== index);
        if (primaryId && !nextImages.some((img) => img.id === primaryId)) {
          setPrimaryId(nextImages[0]?.id || null);
        }
        return nextImages;
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

  const handleDocFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const file = fileList[0];
    const validExts = [".txt", ".docx", ".pdf", ".md", ".rtf", ".csv"];
    const ext = "." + (file.name.split(".").pop()?.toLowerCase() || "");
    if (!validExts.includes(ext) && !file.type.startsWith("text/")) {
      setLocalError("Unsupported document format. Please upload .txt, .docx, .pdf, .md, or paste text.");
      return;
    }

    setLocalError(null);
    setUploadedDocName(file.name);
    setUploadedDocSize(
      file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(file.size / 1024)} KB`
    );

    try {
      const extractedText = await parseDocumentText(file);
      setWriteupText(extractedText);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to read file text.";
      setLocalError(msg);
    }
  };

  const handleGenerateBriefWithAi = async (mode?: "writeup" | "url") => {
    const targetMode = mode || activeAssistantTab || "writeup";
    const hasWriteup = writeupText.trim().length > 0 || !!uploadedDocName;
    const hasUrl = briefUrl.trim().length > 0;

    if (targetMode === "writeup" && !hasWriteup) {
      setLocalError("Please upload a document or paste property notes first.");
      return;
    }
    if (targetMode === "url" && !hasUrl) {
      setLocalError("Please enter a property listing URL first.");
      return;
    }

    setLocalError(null);
    setAiSuccessMessage(null);
    setIsGeneratingBrief(true);

    try {
      const res = await fetch("/api/extract-brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          writeupText: targetMode === "writeup" ? writeupText : undefined,
          url: targetMode === "url" ? briefUrl : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to generate brief.");
      }

      if (data.briefs && Array.isArray(data.briefs) && data.briefs.length > 0) {
        setBriefs(data.briefs);
        setAiSuccessMessage(
          `Brief successfully generated and loaded into Source Brief above.`
        );
      } else {
        throw new Error("No brief could be generated. Please check your content.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to generate brief with AI.";
      setLocalError(msg);
    } finally {
      setIsGeneratingBrief(false);
    }
  };

  const handleSubmit = async () => {
    const hasAnyText = briefs.some((b) => b.trim().length > 0);
    if (!hasAnyText && !briefUrl.trim()) {
      setLocalError("Please enter at least one property brief or provide a brief URL.");
      return;
    }

    if (images.length === 0) {
      setLocalError("Please upload at least 1 property image (Photo #1).");
      return;
    }

    // Validate that each filled brief has an associated image so no field is blank
    const missingBriefIdx = briefs.findIndex((b, idx) => b.trim().length > 0 && !images[idx]);
    if (missingBriefIdx !== -1) {
      setLocalError(
        `Brief #${missingBriefIdx + 1} has prompt text but no photo uploaded. Please upload Photo #${missingBriefIdx + 1} so the flyer field is not blank.`
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

        {/* Dynamic Brief Prompts with Indexed Image Slots */}
        <div className="space-y-4">
          {briefs.map((brief, idx) => {
            const slotImage = images[idx] || null;
            const isCover = idx === 0;

            return (
              <div
                key={idx}
                className="p-4 sm:p-5 rounded-2xl bg-[#F8FAFC] border border-slate-200 space-y-3 transition-all"
              >
                {/* Prompt Header with Indexed Image Indicator */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#1B494E] text-white text-xs font-black flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-extrabold text-[#1B494E] uppercase tracking-wider">
                      {briefs.length > 1 ? `Property Brief #${idx + 1} · Flyer #${idx + 1}` : "Property Brief Prompt"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {slotImage ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                        <CheckCircle2 size={12} className="text-emerald-600" />
                        <span>Photo #{idx + 1} Attached</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                        <AlertCircle size={12} className="text-amber-600" />
                        <span>Photo #{idx + 1} Required</span>
                      </span>
                    )}

                    {briefs.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveBrief(idx)}
                        className="p-1 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                        title="Remove this brief"
                      >
                        <X size={15} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Prompt Textarea */}
                <textarea
                  value={brief}
                  onChange={(e) => handleBriefChange(idx, e.target.value)}
                  rows={idx === 0 ? 4 : 3}
                  placeholder={
                    idx === 0
                      ? "Paste a whatsapp message, notes or brief in its unedited form. We will extract the necessary details for your design template. Something like 2 bedroom apartment in VGC, Lekki..."
                      : `Paste brief ${idx + 1}...`
                  }
                  className="w-full p-3.5 rounded-xl bg-white border border-slate-300/70 text-slate-800 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1B494E]/20 focus:border-[#1B494E] transition-all resize-y"
                />

                {/* Indexed Image Slot for this prompt */}
                <div className="pt-2 border-t border-slate-200">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Required Image for Field #{idx + 1}:
                    </span>
                    {isCover && (
                      <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-orange-100 text-[#F26522]">
                        Cover Photo
                      </span>
                    )}
                  </div>

                  {slotImage ? (
                    /* Attached State: User knows which image is selected */
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={slotImage.url}
                          alt={slotImage.name}
                          className="w-12 h-12 rounded-lg object-cover border border-slate-200 shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-800 truncate">
                            {slotImage.name}
                          </div>
                          <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 mt-0.5">
                            <CheckCircle2 size={12} />
                            <span>Photo #{idx + 1} Selected for Flyer #{idx + 1}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => triggerSlotUpload(idx)}
                          className="px-2.5 py-1 rounded-lg text-xs font-bold text-slate-600 hover:text-[#1B494E] hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
                        >
                          Change
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveSlotImage(idx)}
                          className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          title="Remove image"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Empty State: Direct upload into this slot so field is not blank */
                    <div
                      onClick={() => triggerSlotUpload(idx)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        handleSlotImageFile(idx, e.dataTransfer.files);
                      }}
                      className="flex items-center justify-between p-3 rounded-xl border-2 border-dashed border-slate-300 hover:border-[#1B494E] bg-white hover:bg-slate-50 cursor-pointer transition-all group"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-[#1B494E]/10 text-slate-500 group-hover:text-[#1B494E] flex items-center justify-center transition-colors">
                          <UploadCloud size={16} />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-700 group-hover:text-[#1B494E]">
                            Upload Photo #{idx + 1} for this brief
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Required to prevent blank flyer image · Click or drop JPG, PNG, WEBP
                          </div>
                        </div>
                      </div>

                      <span className="text-xs font-bold text-[#F26522] group-hover:underline shrink-0">
                        + Select Image
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
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

      {/* Smart Brief & URL Tools: Unified Clean Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs mb-6 transition-all">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-xs sm:text-sm font-medium text-slate-700">
            Extract brief details automatically from a listing link or document write-up.
          </p>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                setActiveAssistantTab((prev) => (prev === "url" ? null : "url"));
                setLocalError(null);
              }}
              className={`py-2 px-3.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all duration-150 ease-out cursor-pointer ${
                activeAssistantTab === "url"
                  ? "bg-[#1B494E] text-white shadow-xs"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700"
              }`}
            >
              <LinkIcon size={14} />
              <span>Brief URL</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveAssistantTab((prev) => (prev === "writeup" ? null : "writeup"));
                setLocalError(null);
              }}
              className={`py-2 px-3.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all duration-150 ease-out cursor-pointer ${
                activeAssistantTab === "writeup"
                  ? "bg-[#1B494E] text-white shadow-xs"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700"
              }`}
            >
              <Sparkles size={14} />
              <span>AI Assistant</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Brief URL Drawer */}
        {activeAssistantTab === "url" && (
          <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
            <div className="relative">
              <input
                type="url"
                value={briefUrl}
                onChange={(e) => setBriefUrl(e.target.value)}
                placeholder="https://... paste listing URL (PropertyPro, Nigeria Property Centre, etc.)"
                className="w-full py-2.5 pl-4 pr-10 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1B494E]/20 focus:border-[#1B494E] transition-all"
              />
              <LinkIcon
                size={16}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                disabled={isGeneratingBrief || !briefUrl.trim()}
                onClick={() => handleGenerateBriefWithAi("url")}
                className="py-2 px-4 rounded-xl bg-[#1B494E] hover:bg-[#14383C] disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-xs flex items-center gap-2 transition-transform duration-150 ease-out active:scale-[0.98] cursor-pointer"
              >
                {isGeneratingBrief ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>Extracting from URL...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={13} />
                    <span>Generate Brief from URL</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: AI Document / Write-up Drawer */}
        {activeAssistantTab === "writeup" && (
          <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
            <input
              ref={docFileInputRef}
              type="file"
              accept=".txt,.docx,.pdf,.md,.rtf,.csv,text/plain"
              className="hidden"
              onChange={(e) => handleDocFiles(e.target.files)}
            />

            {!uploadedDocName ? (
              <div
                onClick={() => docFileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDraggingDoc(true);
                }}
                onDragLeave={() => setIsDraggingDoc(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDraggingDoc(false);
                  handleDocFiles(e.dataTransfer.files);
                }}
                className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all duration-150 ${
                  isDraggingDoc
                    ? "border-[#1B494E] bg-slate-100"
                    : "border-slate-200 hover:border-[#1B494E]/50 bg-slate-50/50 hover:bg-slate-50"
                }`}
              >
                <div className="w-8 h-8 mx-auto mb-1.5 rounded-full bg-white shadow-2xs border border-slate-200 flex items-center justify-center text-slate-500">
                  <UploadCloud size={16} />
                </div>
                <p className="text-xs font-semibold text-slate-700">
                  Click to upload or drag & drop document (.txt, .docx, .pdf)
                </p>
              </div>
            ) : (
              <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center text-slate-700 shrink-0">
                    <FileText size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">{uploadedDocName}</p>
                    <p className="text-[11px] text-slate-500 font-medium">
                      {uploadedDocSize} • Ready
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setUploadedDocName(null);
                    setUploadedDocSize(null);
                    setWriteupText("");
                  }}
                  className="p-1 text-slate-400 hover:text-red-500 rounded-md hover:bg-white transition-colors cursor-pointer"
                  title="Remove file"
                >
                  <X size={15} />
                </button>
              </div>
            )}

            <textarea
              value={writeupText}
              onChange={(e) => setWriteupText(e.target.value)}
              rows={writeupText ? 4 : 2}
              placeholder="Or paste property writeup, brochure text, or WhatsApp listing message here..."
              className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1B494E]/20 transition-all resize-y"
            />

            <div className="flex justify-end">
              <button
                type="button"
                disabled={isGeneratingBrief || (!writeupText.trim() && !uploadedDocName)}
                onClick={() => handleGenerateBriefWithAi("writeup")}
                className="py-2 px-4 rounded-xl bg-[#1B494E] hover:bg-[#14383C] disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-xs flex items-center gap-2 transition-transform duration-150 ease-out active:scale-[0.98] cursor-pointer"
              >
                {isGeneratingBrief ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>Extracting brief...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={13} />
                    <span>Extract Brief from Write-up</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* AI Success Notification */}
        {aiSuccessMessage && (
          <div className="mt-3 p-3 rounded-xl bg-slate-100 border border-slate-200 flex items-center gap-2.5 text-xs text-slate-800 font-medium">
            <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
            <span className="flex-1">{aiSuccessMessage}</span>
            <button
              type="button"
              onClick={() => setAiSuccessMessage(null)}
              className="text-slate-500 hover:text-slate-800 cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>
        )}
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

      {/* Upload Property Image Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
            Upload Property Image
          </label>
          <span className="text-xs font-semibold text-slate-500">
            {images.length > 0
              ? `${images.length} ${images.length === 1 ? "image" : "images"} uploaded`
              : "JPG, PNG, or WEBP"}
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
            <p className="text-sm font-semibold text-slate-700 group-hover:text-[#1B494E]">
              Drag & drop property image here, or click to browse
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Supports JPG, PNG, or WEBP (high-resolution recommended)
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
                    {images.length === 1 ? "1 image uploaded" : `${images.length} images uploaded`}
                  </span>
                  <span className="text-xs text-teal-100/80 font-medium block">
                    Ready to generate flyer
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs font-bold px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg border border-white/20 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Plus size={13} />
                <span>Add More</span>
              </button>
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

                    {/* Image Number Tag & Primary Indicator */}
                    <div className="absolute top-2 left-2 flex flex-col gap-1 items-start">
                      <div className="bg-black/65 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs">
                        Photo #{idx + 1} · Brief #{idx + 1}
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

              {/* Missing Slot Indicators */}
              {Array.from({ length: Math.max(0, briefs.length - images.length) }).map((_, i) => {
                const slotNum = images.length + i + 1;
                return (
                  <div
                    key={`missing-${slotNum}`}
                    onClick={() => triggerSlotUpload(slotNum - 1)}
                    className="h-32 rounded-xl border-2 border-dashed border-amber-300 bg-amber-50/50 hover:bg-amber-50 flex flex-col items-center justify-center text-amber-800 transition-colors p-2 text-center cursor-pointer group"
                  >
                    <UploadCloud size={20} className="mb-1 text-amber-500 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-bold">Photo #{slotNum} Required</span>
                    <span className="text-[10px] text-amber-600 font-medium mt-0.5">For Brief #{slotNum}</span>
                  </div>
                );
              })}

              {/* Add Photo Button Tile */}
              {images.length < briefs.length && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-32 rounded-xl border-2 border-dashed border-slate-300 hover:border-[#1B494E] bg-slate-50/50 hover:bg-slate-50 flex flex-col items-center justify-center text-slate-500 hover:text-[#1B494E] transition-colors p-2 text-center cursor-pointer group"
                >
                  <Plus size={22} className="mb-1 text-slate-400 group-hover:text-[#1B494E] group-hover:scale-110 transition-transform duration-150" />
                  <span className="text-xs font-bold text-slate-700">Add Photo</span>
                  <span className="text-[10px] text-slate-400 font-medium mt-0.5">JPG, PNG, WEBP</span>
                </button>
              )}
            </div>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => handleImageFiles(e.target.files)}
        />

        <input
          ref={slotFileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            if (activeUploadSlot !== null && e.target.files && e.target.files.length > 0) {
              handleSlotImageFile(activeUploadSlot, e.target.files);
            }
          }}
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
