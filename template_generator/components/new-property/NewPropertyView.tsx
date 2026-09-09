"use client";

import React, { useState, useRef, useMemo, useEffect } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { UploadedImage, TemplateId, CustomTemplateItem } from "../../types/propkit";
import { TEMPLATES_CONFIG } from "../../utils/constants";
import { getStoredCustomTemplates } from "../../utils/storage";
import { TemplateSelectorModal } from "../TemplateSelectorModal";
import { BriefInputTabs } from "./BriefInputTabs";
import { MediaDropzone } from "./MediaDropzone";
import { ImageThumbnailGrid } from "./ImageThumbnailGrid";
import { TemplateBannerCard } from "./TemplateBannerCard";

export interface NewPropertyViewProps {
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

  const [activeBriefTab, setActiveBriefTab] = useState<number>(0);

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

  const [customTemplates, setCustomTemplates] = useState<CustomTemplateItem[]>([]);

  useEffect(() => {
    setCustomTemplates(getStoredCustomTemplates());
  }, [templateModalOpen]);

  const currentTemplate = useMemo(() => {
    const official = TEMPLATES_CONFIG.find((t) => t.id === selectedTemplateId);
    if (official) {
      return {
        id: official.id,
        name: official.name,
        badge: official.badge,
        description: official.description,
        themeColor: official.themeColor,
      };
    }
    const custom = customTemplates.find((c) => c.id === selectedTemplateId);
    if (custom) {
      return {
        id: custom.id,
        name: custom.name,
        badge: custom.badge,
        description: custom.description,
        themeColor: custom.themeColor,
      };
    }
    return {
      id: "bmi",
      name: "BMI Signature",
      badge: "Signature",
      description: "Dark luxury flyer optimized for prime Lagos listings.",
      themeColor: "#0E1626",
    };
  }, [selectedTemplateId, customTemplates]);

  const handleAddBrief = () => {
    if (briefs.length < 3) {
      const next = [...briefs, ""];
      setBriefs(next);
      setActiveBriefTab(next.length - 1);
    }
  };

  const handleRemoveBrief = (index: number) => {
    if (briefs.length > 1) {
      const next = briefs.filter((_, i) => i !== index);
      setBriefs(next);
      setActiveBriefTab((prev) => Math.min(prev, next.length - 1));
      if (images.length > next.length) {
        setImages((prev) => prev.slice(0, next.length));
      }
    }
  };

  const handleBriefChange = (index: number, text: string) => {
    setBriefs((prev) => {
      const next = [...prev];
      next[index] = text;
      return next;
    });
  };

  const handleImageFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const allowed = Array.from(files).filter((f) =>
      ["image/jpeg", "image/png", "image/webp"].includes(f.type)
    );

    const maxAllowed = briefs.length;
    const remainingSlots = Math.max(0, maxAllowed - images.length);

    if (allowed.length > remainingSlots) {
      setLocalError(
        `Only ${remainingSlots} more image(s) can be added to match your ${briefs.length} briefs (1 image per brief).`
      );
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

  const handleSubmit = async () => {
    const hasAnyText = briefs.some((b) => b.trim().length > 0);
    if (!hasAnyText) {
      setLocalError("Please enter at least one property brief.");
      return;
    }

    if (images.length === 0) {
      setLocalError("Please upload Image 1 for Brief 1.");
      return;
    }

    const filledBriefsCount = briefs.filter((b) => b.trim().length > 0).length;
    if (images.length < filledBriefsCount) {
      setLocalError(
        `You have ${filledBriefsCount} briefs but only ${images.length} image(s) uploaded. Please upload Image ${images.length + 1} for Brief ${images.length + 1} (each brief requires 1 image).`
      );
      return;
    }

    setLocalError(null);

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
      {/* Page Title & Subtitle */}
      <div className="mb-6">
        <h1 className="text-3xl sm:text-[34px] font-extrabold text-[#1B494E] tracking-tight">
          Start with the raw brief
        </h1>
        <p className="text-slate-600 text-sm sm:text-base mt-2 leading-relaxed">
          Paste the message, PDF text, or notes exactly as they arrived. We&apos;ll structure it without losing the source.
        </p>
      </div>

      {/* Source Brief Card */}
      <BriefInputTabs
        briefs={briefs}
        activeBriefTab={activeBriefTab}
        onSelectTab={setActiveBriefTab}
        onAddBrief={handleAddBrief}
        onRemoveBrief={handleRemoveBrief}
        onBriefChange={handleBriefChange}
      />

      {/* Upload Property Image Section */}
      <div className="mb-7">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
            Upload Property Image
          </label>
          <span className="text-xs font-semibold text-slate-500">
            {briefs.length === 1 ? "1 property brief added" : `${briefs.length} property briefs added`} · {images.length}/{briefs.length} image uploaded
          </span>
        </div>

        {images.length === 0 ? (
          <MediaDropzone
            onFilesSelected={handleImageFiles}
            fileInputRef={fileInputRef}
            multiple={briefs.length > 1}
          />
        ) : (
          <ImageThumbnailGrid
            images={images}
            primaryId={primaryId}
            briefsCount={briefs.length}
            onSetPrimary={setPrimaryId}
            onDeleteImage={handleDeleteImage}
            onTriggerUpload={() => fileInputRef.current?.click()}
          />
        )}
      </div>

      {/* Stage 1 Flyer Template Selection Banner */}
      <TemplateBannerCard
        templateName={currentTemplate.name}
        templateBadge={currentTemplate.badge}
        templateDescription={currentTemplate.description}
        themeColor={currentTemplate.themeColor}
        totalTemplatesCount={3 + customTemplates.length}
        onOpenModal={() => setTemplateModalOpen(true)}
      />

      {/* Error Notices */}
      {(error || localError) && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2.5">
          <AlertCircle size={18} className="flex-shrink-0 text-red-500" />
          <span>{error || localError}</span>
        </div>
      )}

      {/* Submit Action Button */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={extracting}
        className="w-full py-4 rounded-xl bg-[#F26522] hover:bg-[#D95315] text-white font-extrabold text-sm tracking-wide shadow-lg shadow-orange-950/20 transition-all duration-150 ease-out active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2.5"
      >
        {extracting ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            <span>Analyzing Brief with AI...</span>
          </>
        ) : (
          <span>Extract Specs &amp; Generate Flyer</span>
        )}
      </button>

      {/* Stage 1 Template Selector Modal */}
      {templateModalOpen && (
        <TemplateSelectorModal
          isOpen={templateModalOpen}
          onClose={() => setTemplateModalOpen(false)}
          selectedTemplateId={selectedTemplateId}
          onSelectTemplate={(tplId) => {
            setSelectedTemplateId(tplId);
            setTemplateModalOpen(false);
          }}
        />
      )}
    </div>
  );
}
