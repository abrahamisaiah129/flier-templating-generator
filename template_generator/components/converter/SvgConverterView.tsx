"use client";

import React, { useState, useRef } from "react";
import { Wand2, AlertCircle } from "lucide-react";
import { AppSettings, CustomTemplateItem } from "../../types/propkit";
import {
  getStoredCustomTemplates,
  saveStoredCustomTemplate,
  deleteStoredCustomTemplate,
} from "../../utils/storage";
import { SvgUploader } from "./SvgUploader";
import { SvgPreviewPane } from "./SvgPreviewPane";
import { SavedTemplatesLibrary } from "./SavedTemplatesLibrary";

export interface SvgConverterViewProps {
  settings?: AppSettings;
  onUseTemplate?: (templateId: string) => void;
}

const SAMPLE_REAL_ESTATE_SVG = `<svg width="1080" height="1350" viewBox="0 0 1080 1350" fill="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <rect width="1080" height="1350" fill="#0E1626"/>
  <!-- Image Container Frame -->
  <rect x="50" y="50" width="980" height="720" rx="24" fill="#1E293B"/>
  <image href="{{image}}" x="50" y="50" width="980" height="720" preserveAspectRatio="xMidYMid slice" rx="24"/>
  <!-- Top Badge -->
  <rect x="90" y="90" width="220" height="48" rx="12" fill="#F26522"/>
  <text x="200" y="121" fill="#FFFFFF" font-family="Montserrat, sans-serif" font-size="20" font-weight="800" text-anchor="middle" letter-spacing="1">EXCLUSIVE LISTING</text>
  <!-- Spec Card Bottom Left -->
  <rect x="70" y="810" width="560" height="340" rx="24" fill="#152136" stroke="#223354" stroke-width="2"/>
  <text x="110" y="870" fill="#F26522" font-family="Montserrat, sans-serif" font-size="22" font-weight="900" letter-spacing="2">{{bedrooms}} BEDROOMS</text>
  <text x="110" y="925" fill="#FFFFFF" font-family="Montserrat, sans-serif" font-size="34" font-weight="800">{{title}}</text>
  <text x="110" y="975" fill="#94A3B8" font-family="Montserrat, sans-serif" font-size="22" font-weight="600">LOCATION: {{location}}</text>
  <text x="110" y="1025" fill="#38BDF8" font-family="Montserrat, sans-serif" font-size="20" font-weight="700">DOCUMENTATION: {{documentation}}</text>
  <text x="110" y="1090" fill="#F26522" font-family="Montserrat, sans-serif" font-size="22" font-weight="800">CALL: {{phone}}</text>
  <!-- Price Pill Bottom Right -->
  <rect x="660" y="810" width="350" height="180" rx="24" fill="#F26522"/>
  <text x="835" y="865" fill="#FFFFFF" fill-opacity="0.85" font-family="Montserrat, sans-serif" font-size="18" font-weight="800" text-anchor="middle" letter-spacing="2">OFFER PRICE</text>
  <text x="835" y="940" fill="#FFFFFF" font-family="Montserrat, sans-serif" font-size="46" font-weight="900" text-anchor="middle">{{price_naira}}</text>
  <!-- Bottom Brand Bar -->
  <rect x="0" y="1270" width="1080" height="80" fill="#0A0F1A"/>
  <text x="540" y="1320" fill="#94A3B8" font-family="Montserrat, sans-serif" font-size="18" font-weight="700" text-anchor="middle" letter-spacing="1">BUY 'N' MOVE IN · WWW.BUYANDMOVEIN.COM · @BUYANDMOVEIN</text>
</svg>`;

export function SvgConverterView({ settings, onUseTemplate }: SvgConverterViewProps) {
  const [svgCode, setSvgCode] = useState<string>("");
  const [templateName, setTemplateName] = useState<string>("Signature Modern Flyer");
  const [templateBadge, setTemplateBadge] = useState<string>("Custom Style");
  const [savedTemplates, setSavedTemplates] = useState<CustomTemplateItem[]>(() =>
    typeof window !== "undefined" ? getStoredCustomTemplates() : []
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [copiedTemplateId, setCopiedTemplateId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activePreviewTemplate, setActivePreviewTemplate] = useState<CustomTemplateItem | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFile = (file: File) => {
    if (!file) return;

    const validExts = [".svg", ".txt"];
    const fileNameLower = file.name.toLowerCase();
    const isValidExt =
      validExts.some((ext) => fileNameLower.endsWith(ext)) ||
      file.type.includes("svg") ||
      file.type.includes("text");

    if (!isValidExt) {
      setError("Please upload an SVG file (.svg) or text file (.txt) containing SVG code.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = (e.target?.result as string) || "";
      if (!content.trim()) {
        setError("The selected file is empty.");
        return;
      }

      if (!content.includes("<svg") && !content.includes("<SVG")) {
        setError(
          "The uploaded file does not contain an <svg> tag. Please ensure it is valid SVG vector code."
        );
        return;
      }

      setSvgCode(content);
      setError(null);

      const cleanFileName = file.name
        .replace(/\.(svg|txt)$/i, "")
        .replace(/SVG\s*Code/i, "")
        .replace(/[-_]+/g, " ")
        .trim();

      if (cleanFileName && (!templateName || templateName === "Signature Modern Flyer")) {
        const prettyName = cleanFileName
          .split(" ")
          .filter(Boolean)
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" ");
        setTemplateName(prettyName);
      }
    };

    reader.onerror = () => {
      setError("Failed to read the selected file. Please try again or paste the code directly.");
    };

    reader.readAsText(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleGenerate = async () => {
    if (!svgCode.trim()) {
      setError("Please paste your raw SVG code into the text area first.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/convert-svg", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          svgCode,
          framework: "React (TSX)",
          componentName: templateName.trim() || "PropertyTemplate",
          useCurrentColor: false,
          apiKey: settings?.openaiApiKey,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || "Template conversion failed");
      }

      const cleanSvg = data.svgMarkup || svgCode;
      const themeColor = data.themeColor || "#1B494E";
      const accentColor = data.accentColor || "#F26522";
      const finalName = (data.templateName || templateName).trim() || "Custom Flyer Template";
      const finalBadge = data.badge || templateBadge || "Custom Style";
      const finalDescription =
        data.description || "Custom SVG flyer template generated and saved to library";

      const newTemplateItem: CustomTemplateItem = {
        id: `custom-tpl-${Date.now()}`,
        name: finalName,
        badge: finalBadge,
        description: finalDescription,
        themeColor,
        accentColor,
        svgMarkup: cleanSvg,
        createdAt: new Date().toISOString(),
      };

      saveStoredCustomTemplate(newTemplateItem);
      const updatedList = getStoredCustomTemplates();
      setSavedTemplates(updatedList);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "An unexpected error occurred during template creation.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTemplate = (id: string) => {
    deleteStoredCustomTemplate(id);
    const updated = getStoredCustomTemplates();
    setSavedTemplates(updated);
    if (activePreviewTemplate?.id === id) {
      setActivePreviewTemplate(null);
    }
  };

  const handleCopy = async (textToCopy: string, templateId?: string) => {
    if (!textToCopy) return;
    try {
      await navigator.clipboard.writeText(textToCopy);
      if (templateId) {
        setCopiedTemplateId(templateId);
        setTimeout(() => setCopiedTemplateId(null), 2000);
      }
    } catch {
      // ignore
    }
  };

  const handleDownloadFile = (code: string, name: string, ext = "svg") => {
    if (!code) return;
    const safeFilename = `${(name || "FlyerTemplate").replace(/[^a-zA-Z0-9_]/g, "")}.${ext}`;
    const blob = new Blob([code], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = safeFilename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setSvgCode(text);
        setError(null);
      }
    } catch {
      setError("Clipboard access blocked by browser. Please paste directly into the box.");
    }
  };

  const handleLoadSample = () => {
    setSvgCode(SAMPLE_REAL_ESTATE_SVG);
    setTemplateName("Modern Horizon Luxury Flyer");
    setTemplateBadge("Dark Horizon");
    setError(null);
  };

  const handleClear = () => {
    setSvgCode("");
    setError(null);
  };

  const previewMarkup = activePreviewTemplate ? activePreviewTemplate.svgMarkup : svgCode;

  return (
    <div className="max-w-6xl mx-auto py-4 px-2 sm:px-6 space-y-8">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100/80 border border-orange-200/80 text-[#F26522] text-xs font-bold uppercase tracking-wider mb-2">
          <Wand2 size={13} />
          <span>SVG to Code · Template Generator</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1B494E] tracking-tight">
          Paste SVG to Create Template
        </h1>
        <p className="text-slate-600 text-sm sm:text-base mt-2 max-w-3xl leading-relaxed">
          Paste raw vector code from Figma, Illustrator, or Canva to generate a custom property flyer
          template. The template is automatically saved into your library and immediately available
          in the property form alongside the official templates.
        </p>
      </div>

      {/* Main Creation Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-6">
        {/* Template Metadata Setup */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-5 border-b border-slate-100">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
              Template Name
            </label>
            <input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="e.g. Minimalist Lekki Villa Flyer"
              className="w-full py-2.5 px-3.5 rounded-xl bg-slate-50 border border-slate-300 text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1B494E]/30 focus:border-[#1B494E] transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
              Style / Badge Label
            </label>
            <input
              type="text"
              value={templateBadge}
              onChange={(e) => setTemplateBadge(e.target.value)}
              placeholder="e.g. Luxury Editorial, Minimalist, Dark Edition"
              className="w-full py-2.5 px-3.5 rounded-xl bg-slate-50 border border-slate-300 text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1B494E]/30 focus:border-[#1B494E] transition-all"
            />
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2.5">
            <AlertCircle size={18} className="flex-shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Two-Column Editor: Raw SVG Input (Left) & Real-time Live Preview (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7">
            <SvgUploader
              svgCode={svgCode}
              onSvgCodeChange={setSvgCode}
              isDragging={isDragging}
              loading={loading}
              error={error}
              fileInputRef={fileInputRef}
              onFileUpload={handleFile}
              onDragOver={handleDragOver}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onPasteClipboard={handlePasteClipboard}
              onLoadSample={handleLoadSample}
              onClear={handleClear}
              onGenerate={handleGenerate}
            />
          </div>

          <div className="lg:col-span-5">
            <SvgPreviewPane
              svgMarkup={previewMarkup}
              activePreviewTemplate={activePreviewTemplate}
              onClearActivePreview={() => setActivePreviewTemplate(null)}
              onUseTemplate={onUseTemplate}
            />
          </div>
        </div>
      </div>

      {/* Saved Custom Templates Library */}
      <SavedTemplatesLibrary
        savedTemplates={savedTemplates}
        activePreviewId={activePreviewTemplate?.id}
        copiedTemplateId={copiedTemplateId}
        onPreview={(tpl) => setActivePreviewTemplate(tpl)}
        onUseTemplate={onUseTemplate}
        onCopy={handleCopy}
        onDownload={handleDownloadFile}
        onDelete={handleDeleteTemplate}
      />
    </div>
  );
}
