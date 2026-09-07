"use client";

import React, { useState } from "react";
import {
  Code2,
  Sparkles,
  Copy,
  Check,
  Download,
  Trash2,
  FileCode2,
  Eye,
  Loader2,
  AlertCircle,
  ClipboardPaste,
  Wand2,
  Layers,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Palette,
  LayoutTemplate,
  UploadCloud,
} from "lucide-react";
import { AppSettings, CustomTemplateItem } from "../types/propkit";
import {
  getStoredCustomTemplates,
  saveStoredCustomTemplate,
  deleteStoredCustomTemplate,
} from "../utils/storage";

interface SvgConverterViewProps {
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
  const [generatedCode, setGeneratedCode] = useState<string>("");
  const [lastSavedTemplate, setLastSavedTemplate] = useState<CustomTemplateItem | null>(null);
  const [savedTemplates, setSavedTemplates] = useState<CustomTemplateItem[]>(() =>
    typeof window !== "undefined" ? getStoredCustomTemplates() : []
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [copiedTemplateId, setCopiedTemplateId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<"openai" | "openrouter" | "local" | null>(null);
  const [showAdvancedCode, setShowAdvancedCode] = useState<boolean>(false);
  const [activePreviewTemplate, setActivePreviewTemplate] = useState<CustomTemplateItem | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

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

      // Auto-suggest a clean luxury template name from the filename
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

      // Create new custom template item
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

      // Save directly to localStorage for history and property form use
      saveStoredCustomTemplate(newTemplateItem);
      const updatedList = getStoredCustomTemplates();
      setSavedTemplates(updatedList);
      setLastSavedTemplate(newTemplateItem);

      setGeneratedCode(data.template || "");
      setSource(data.source || "local");
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
    if (lastSavedTemplate?.id === id) {
      setLastSavedTemplate(null);
    }
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
      } else {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // ignore
    }
  };

  const handleDownloadFile = (code: string, name: string, ext = "tsx") => {
    if (!code) return;
    const safeFilename = `${(name || "FlyerTemplate").replace(/[^a-zA-Z0-9_]/g, "")}.${ext}`;
    const blob = new Blob([code], { type: "text/plain;charset=utf-8" });
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
    setGeneratedCode("");
    setError(null);
    setSource(null);
    setLastSavedTemplate(null);
  };

  return (
    <div className="max-w-6xl mx-auto py-4 px-2 sm:px-6 space-y-8">
      {/* Big Header matching exact prompt requirement */}
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
        {/* Template Metadata Setup (Simplified for Non-Technical Users) */}
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

        {/* Two-Column Editor: Raw SVG Input (Left) & Real-time Live Preview (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Raw SVG Text Input */}
          <div className="lg:col-span-7 flex flex-col h-[520px]">
            <div className="flex items-center justify-between pb-3 mb-2">
              <div className="flex items-center gap-2">
                <FileCode2 size={17} className="text-[#F26522]" />
                <span className="font-bold text-sm text-[#1B494E]">Raw SVG Code</span>
                {svgCode && (
                  <span className="text-[11px] font-semibold text-slate-400">
                    ({svgCode.length} characters)
                  </span>
                )}
              </div>

              {/* Quick Action Shortcuts */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  title="Upload an .svg or .txt vector file"
                  className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-[#1B494E] border border-teal-200/80 flex items-center gap-1.5 transition-transform duration-150 ease-out active:scale-[0.98] cursor-pointer"
                >
                  <UploadCloud size={13} className="text-[#1B494E]" />
                  <span>Upload SVG</span>
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFile(e.target.files[0]);
                      e.target.value = "";
                    }
                  }}
                  accept=".svg,.txt,image/svg+xml,text/plain"
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={handlePasteClipboard}
                  title="Paste from clipboard"
                  className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1.5 transition-transform duration-150 ease-out active:scale-[0.98] cursor-pointer"
                >
                  <ClipboardPaste size={13} />
                  <span>Paste</span>
                </button>
                <button
                  type="button"
                  onClick={handleLoadSample}
                  title="Load a complete real estate flyer template SVG sample"
                  className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-orange-50 hover:bg-orange-100 text-[#F26522] flex items-center gap-1.5 transition-transform duration-150 ease-out active:scale-[0.98] cursor-pointer"
                >
                  <Sparkles size={13} />
                  <span>Sample</span>
                </button>
                {svgCode && (
                  <button
                    type="button"
                    onClick={handleClear}
                    title="Clear text area"
                    className="text-xs font-semibold p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Monospace Code Editor Area with Drag-and-Drop Dropzone */}
            <div
              onDragOver={handleDragOver}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`relative flex-1 flex flex-col rounded-xl overflow-hidden transition-all duration-150 ${
                isDragging
                  ? "ring-2 ring-[#F26522] border-2 border-dashed border-[#F26522]"
                  : "border border-slate-800"
              }`}
            >
              <textarea
                value={svgCode}
                onChange={(e) => {
                  setSvgCode(e.target.value);
                  if (error) setError(null);
                }}
                placeholder={`<svg width="1080" height="1350" viewBox="0 0 1080 1350" fill="none" ...>\n  <!-- Paste raw SVG code or drag & drop an .svg file directly here -->\n</svg>`}
                className="flex-1 w-full p-4 bg-slate-950 text-emerald-400 font-mono text-xs leading-relaxed resize-none focus:outline-none placeholder:text-slate-600 select-text"
                spellCheck={false}
              />

              {/* Drag-and-Drop Active Overlay */}
              {isDragging && (
                <div className="absolute inset-0 z-20 bg-[#0B2854]/95 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center text-white border-2 border-dashed border-[#F26522] rounded-xl pointer-events-none">
                  <div className="w-16 h-16 rounded-2xl bg-orange-500/20 text-[#F26522] flex items-center justify-center mb-3">
                    <UploadCloud size={36} />
                  </div>
                  <h3 className="text-lg font-extrabold text-white tracking-tight">
                    Drop your SVG file here
                  </h3>
                  <p className="text-xs text-slate-300 mt-1 max-w-xs">
                    Release to load vector code into the template generator
                  </p>
                </div>
              )}

              {/* Bottom Drag & Drop Helper / File Upload Tip Bar */}
              <div className="px-3.5 py-1.5 bg-slate-900 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                <div className="flex items-center gap-1.5 truncate">
                  <UploadCloud size={12} className="text-[#F26522] flex-shrink-0" />
                  <span className="truncate">Drag &amp; drop an .svg or .txt file directly into this box</span>
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-[#F26522] hover:underline font-bold ml-2 cursor-pointer flex-shrink-0"
                >
                  Browse file
                </button>
              </div>
            </div>

            {/* Primary Action Button */}
            <div className="pt-4">
              <button
                type="button"
                onClick={handleGenerate}
                disabled={loading || !svgCode.trim()}
                className="w-full py-3.5 rounded-xl bg-[#F26522] hover:bg-[#D95315] text-white font-bold text-sm tracking-wide flex items-center justify-center gap-2.5 shadow-md shadow-orange-600/20 transition-transform duration-150 ease-out active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Analyzing &amp; Saving Template...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    <span>Generate Template</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right: Live Preview & Immediate Status */}
          <div className="lg:col-span-5 flex flex-col h-[520px] bg-slate-50 rounded-2xl border border-slate-200/80 p-4">
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-200/80">
              <div className="flex items-center gap-2">
                <Eye size={16} className="text-[#1B494E]" />
                <span className="font-bold text-xs uppercase tracking-wider text-[#1B494E]">
                  Live Visual Preview
                </span>
              </div>
              {source && (
                <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                  {source === "openrouter" ? "GPT-4o Ready" : "Parsed & Saved"}
                </span>
              )}
            </div>

            {/* SVG Render Box */}
            <div className="flex-1 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center p-3 overflow-hidden relative">
              {svgCode.trim() ? (
                <div
                  className="max-w-full max-h-full flex items-center justify-center pointer-events-none [&>svg]:max-h-[380px] [&>svg]:w-auto [&>svg]:h-auto shadow-lg"
                  dangerouslySetInnerHTML={{
                    __html: svgCode.includes("<svg") ? svgCode : `<svg><text>Invalid</text></svg>`,
                  }}
                />
              ) : (
                <div className="text-center p-6 text-slate-500">
                  <LayoutTemplate size={32} className="mx-auto mb-2 text-slate-600" />
                  <p className="text-xs font-semibold text-slate-400">Preview will render here</p>
                  <p className="text-[11px] text-slate-500 mt-1 max-w-[200px]">
                    Paste an SVG or click &quot;Load Sample Flyer&quot; to test the layout.
                  </p>
                </div>
              )}
            </div>

            {/* Success State Indicator */}
            {lastSavedTemplate && (
              <div className="mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" />
                  <div className="truncate">
                    <div className="text-xs font-bold text-emerald-900 truncate">
                      Saved to Template Library!
                    </div>
                    <div className="text-[10px] text-emerald-700 truncate">
                      Available in Property Form
                    </div>
                  </div>
                </div>

                {onUseTemplate && (
                  <button
                    type="button"
                    onClick={() => onUseTemplate(lastSavedTemplate.id)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 transition-transform duration-150 active:scale-[0.98] cursor-pointer shadow-xs flex-shrink-0"
                  >
                    <span>Use Now</span>
                    <ArrowRight size={12} />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Error Notice */}
        {error && (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-sm flex items-start gap-3">
            <AlertCircle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <div>{error}</div>
          </div>
        )}
      </div>

      {/* SAVED CUSTOM TEMPLATES LIBRARY (History for Form Selection) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <Layers size={18} className="text-[#1B494E]" />
              <h2 className="text-lg font-extrabold text-[#1B494E]">
                Custom Templates Library ({savedTemplates.length})
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              All templates generated here are stored in history and can be selected when customizing
              any property flyer.
            </p>
          </div>

          <div className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl self-start sm:self-auto">
            {savedTemplates.length} Custom · 3 Official (BMI, Eko, Enose)
          </div>
        </div>

        {savedTemplates.length === 0 ? (
          <div className="text-center py-10 px-4 bg-slate-50/70 rounded-2xl border border-dashed border-slate-200">
            <Palette size={32} className="mx-auto text-slate-400 mb-2" />
            <p className="text-sm font-bold text-slate-700">No custom templates created yet</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              Paste your raw SVG code above and click &quot;Generate Template&quot; to build your
              first custom flyer layout.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {savedTemplates.map((item) => {
              const isLastCreated = lastSavedTemplate?.id === item.id;
              return (
                <div
                  key={item.id}
                  className={`rounded-2xl border p-4 flex flex-col justify-between transition-all duration-150 ${
                    isLastCreated
                      ? "border-[#F26522] bg-orange-50/10 ring-2 ring-orange-500/20 shadow-sm"
                      : "border-slate-200 bg-white hover:border-slate-300 shadow-xs"
                  }`}
                >
                  <div>
                    {/* Header Info */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-black/10 flex-shrink-0"
                          style={{ backgroundColor: item.accentColor || item.themeColor }}
                        />
                        <span className="text-xs font-black text-[#1B494E] truncate">
                          {item.name}
                        </span>
                      </div>
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 flex-shrink-0">
                        {item.badge || "Custom"}
                      </span>
                    </div>

                    {/* SVG Thumbnail Container */}
                    <div className="relative aspect-[4/5] rounded-xl bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center p-2 mb-3 group">
                      <div
                        className="max-w-full max-h-full flex items-center justify-center pointer-events-none [&>svg]:max-h-full [&>svg]:w-auto [&>svg]:h-auto"
                        dangerouslySetInnerHTML={{ __html: item.svgMarkup }}
                      />

                      <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => setActivePreviewTemplate(item)}
                          className="px-3 py-1.5 rounded-lg bg-white/90 text-slate-800 text-xs font-bold hover:bg-white flex items-center gap-1 cursor-pointer transition-transform duration-100 active:scale-[0.98]"
                        >
                          <Eye size={13} />
                          <span>Preview</span>
                        </button>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed mb-4">
                      {item.description}
                    </p>
                  </div>

                  {/* Card Actions */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleCopy(item.svgMarkup, item.id)}
                        title="Copy raw SVG string"
                        className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 text-xs font-semibold cursor-pointer transition-colors"
                      >
                        {copiedTemplateId === item.id ? (
                          <Check size={14} className="text-emerald-600" />
                        ) : (
                          <Copy size={14} />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteTemplate(item.id)}
                        title="Delete template from library"
                        className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 text-xs font-semibold cursor-pointer transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    {onUseTemplate && (
                      <button
                        type="button"
                        onClick={() => onUseTemplate(item.id)}
                        className="py-1.5 px-3 rounded-xl bg-[#1B494E] hover:bg-[#14383C] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-transform duration-150 active:scale-[0.98] shadow-xs"
                      >
                        <span>Use in Flyer</span>
                        <ArrowRight size={13} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Expandable Advanced Developer Code Accordion */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={() => setShowAdvancedCode(!showAdvancedCode)}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50/80 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <Code2 size={17} className="text-slate-500" />
            <div className="text-left">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Developer / React Component Code Inspector
              </div>
              <div className="text-[11px] text-slate-400">
                Optional TSX code export for developer handoff and custom component integration
              </div>
            </div>
          </div>
          <div className="text-slate-400">
            {showAdvancedCode ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
        </button>

        {showAdvancedCode && (
          <div className="p-6 border-t border-slate-100 bg-slate-900 text-white space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-mono text-emerald-400">
                {templateName.replace(/[^a-zA-Z0-9]/g, "") || "Template"}.tsx
              </span>
              {generatedCode && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopy(generatedCode)}
                    className="text-xs font-semibold px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1.5 cursor-pointer"
                  >
                    {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                    <span>{copied ? "Copied" : "Copy Code"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownloadFile(generatedCode, templateName, "tsx")}
                    className="text-xs font-semibold px-2.5 py-1 rounded bg-[#F26522] hover:bg-[#D95315] text-white flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download size={12} />
                    <span>Export TSX</span>
                  </button>
                </div>
              )}
            </div>

            {generatedCode ? (
              <pre className="overflow-auto max-h-[350px] p-2 text-xs font-mono text-emerald-300 leading-relaxed select-text">
                <code>{generatedCode}</code>
              </pre>
            ) : (
              <div className="py-6 text-center text-xs text-slate-500">
                Click &quot;Generate Template&quot; above to inspect the React component code.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal / Overlay for Full Screen Template Preview */}
      {activePreviewTemplate && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-extrabold text-[#1B494E]">
                  {activePreviewTemplate.name}
                </h3>
                <span className="text-xs text-slate-500">{activePreviewTemplate.badge}</span>
              </div>
              <button
                type="button"
                onClick={() => setActivePreviewTemplate(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="max-h-[65vh] overflow-auto rounded-xl bg-slate-950 flex items-center justify-center p-4">
              <div
                className="max-w-full max-h-full [&>svg]:max-h-[550px] [&>svg]:w-auto [&>svg]:h-auto"
                dangerouslySetInnerHTML={{ __html: activePreviewTemplate.svgMarkup }}
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setActivePreviewTemplate(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Close
              </button>
              {onUseTemplate && (
                <button
                  type="button"
                  onClick={() => {
                    const id = activePreviewTemplate.id;
                    setActivePreviewTemplate(null);
                    onUseTemplate(id);
                  }}
                  className="px-5 py-2 rounded-xl bg-[#F26522] hover:bg-[#D95315] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <span>Use This Template</span>
                  <ArrowRight size={13} />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
