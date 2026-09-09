"use client";

import React, { useState, useRef, useMemo, useEffect } from "react";
import { ChevronLeft } from "lucide-react";
import {
  PropertyData,
  UploadedImage,
  TemplateId,
  AppSettings,
  PropertyItem,
  CustomTemplateItem,
} from "../types/propkit";
import { getStoredCustomTemplates } from "../utils/storage";
import { generateCaption } from "../utils/extractor";
import { svgToPngBlob } from "./canvas/FlyerCanvas";
import { TemplateSelectorModal } from "./TemplateSelectorModal";
import { PropertyReviewStep } from "./kit/PropertyReviewStep";
import { MarketingKitStep } from "./kit/MarketingKitStep";
import { BatchExportOffscreen } from "./kit/BatchExportOffscreen";
import { useFlyerCustomization } from "../hooks/useFlyerCustomization";

export interface ReviewAndKitViewProps {
  initialStep?: "review" | "kit";
  initialData: PropertyData;
  initialDataList?: PropertyData[];
  images: UploadedImage[];
  primaryId: string | null;
  settings: AppSettings;
  briefText: string;
  briefUrl?: string;
  existingId?: string;
  existingCaption?: string;
  initialTemplateId?: TemplateId;
  onSaveProperty: (prop: PropertyItem) => void;
  onBackToNew: () => void;
  onDone: () => void;
}

export function ReviewAndKitView({
  initialStep = "review",
  initialData,
  initialDataList = [],
  images,
  primaryId,
  settings,
  briefText,
  briefUrl,
  existingId,
  existingCaption,
  initialTemplateId = "bmi",
  onSaveProperty,
  onBackToNew,
  onDone,
}: ReviewAndKitViewProps) {
  const [step, setStep] = useState<"review" | "kit">(initialStep);

  // Multi-property data state
  const [propertiesData, setPropertiesData] = useState<PropertyData[]>(() => {
    if (initialDataList && initialDataList.length > 0) {
      return initialDataList;
    }
    return [initialData];
  });
  const [activePropertyIndex, setActivePropertyIndex] = useState<number>(0);

  // Images state
  const [localImages, setLocalImages] = useState<UploadedImage[]>(images);
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);

  // Template state
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId>(initialTemplateId);
  const [templateSelectorOpen, setTemplateSelectorOpen] = useState<boolean>(false);

  // Canvas selection & interaction state
  const [selectedCanvasItemId, setSelectedCanvasItemId] = useState<string | null>(null);
  const [selectedCanvasItemType, setSelectedCanvasItemType] = useState<"text" | "image" | null>(null);

  // Export state
  const [exportScale, setExportScale] = useState<number>(2);
  const [downloading, setDownloading] = useState<boolean>(false);
  const [batchDownloading, setBatchDownloading] = useState<boolean>(false);
  const [batchProgress, setBatchProgress] = useState<string | null>(null);

  // Caption state
  const [caption, setCaption] = useState<string>(() => {
    if (existingCaption) return existingCaption;
    return generateCaption(initialData, settings?.captionTemplate || "", settings);
  });

  const svgRef = useRef<SVGSVGElement | null>(null);
  const offscreenSvgs = useRef<Array<SVGSVGElement | null>>([]);

  const safePropIndex = Math.min(Math.max(0, activePropertyIndex), Math.max(0, propertiesData.length - 1));
  const currentData = propertiesData[safePropIndex] || initialData;

  const safeActiveIndex = localImages.length > 0
    ? Math.min(Math.max(0, activeImageIndex), localImages.length - 1)
    : 0;
  const currentActiveImage = localImages.length > 0 ? localImages[safeActiveIndex]?.url || null : null;

  const customTemplates: CustomTemplateItem[] =
    typeof window !== "undefined" ? getStoredCustomTemplates() : [];
  const currentSelectedCustomTemplate = customTemplates.find((t) => t.id === selectedTemplate);

  // Customization hook for offsets, widths, wrap, font-sizes, and scales
  const customization = useFlyerCustomization({
    selectedTemplate,
    activePropertyIndex: safePropIndex,
    propertiesCount: propertiesData.length,
    hasMultipleImages: localImages.length > 1,
    hasThreeImages: localImages.length > 2,
    selectedCanvasItemId,
    currentPropertyData: currentData,
  });

  // Re-generate caption when current data changes
  useEffect(() => {
    if (!existingCaption) {
      setCaption(generateCaption(currentData, settings?.captionTemplate || "", settings));
    }
  }, [currentData, settings, existingCaption]);

  const handleUpdateField = (field: keyof PropertyData, value: unknown) => {
    setPropertiesData((prev) => {
      const copy = [...prev];
      const target = copy[safePropIndex] || { ...initialData };
      copy[safePropIndex] = { ...target, [field]: value };
      return copy;
    });
  };

  const handleAddFeature = (feat: string) => {
    const currentFeats = currentData.features || [];
    handleUpdateField("features", [...currentFeats, feat]);
  };

  const handleRemoveFeature = (idx: number) => {
    const currentFeats = currentData.features || [];
    handleUpdateField("features", currentFeats.filter((_, i) => i !== idx));
  };

  const handleSetPrimaryImage = (id: string) => {
    const foundIdx = localImages.findIndex((img) => img.id === id);
    if (foundIdx !== -1) {
      setActiveImageIndex(foundIdx);
      const reordered = [
        localImages[foundIdx],
        ...localImages.filter((_, i) => i !== foundIdx),
      ];
      setLocalImages(reordered);
    }
  };

  const handleDeleteImage = (id: string) => {
    setLocalImages((prev) => prev.filter((img) => img.id !== id));
  };

  const handleUploadImages = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const newItems: UploadedImage[] = [];
    Array.from(files).forEach((file, i) => {
      const url = URL.createObjectURL(file);
      newItems.push({
        id: `img-${Date.now()}-${i}`,
        url,
        name: file.name,
      });
    });
    setLocalImages((prev) => [...prev, ...newItems]);
  };

  const handleSelectPropertyTab = (index: number) => {
    setActivePropertyIndex(index);
    setActiveImageIndex(index);
    setSelectedCanvasItemId(null);
    setSelectedCanvasItemType(null);
  };

  const handleSelectImageIndex = (index: number) => {
    setActiveImageIndex(index);
    if (index < propertiesData.length) {
      setActivePropertyIndex(index);
    }
  };

  const handleSelectCanvasItem = (itemId: string | null, itemType: "text" | "image") => {
    setSelectedCanvasItemId(itemId);
    setSelectedCanvasItemType(itemType);
  };

  const handleProceedToKit = () => {
    const item: PropertyItem = {
      id: existingId || `prop-${Date.now()}`,
      data: currentData,
      images: localImages,
      primaryId: primaryId || localImages[0]?.id || null,
      caption,
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
      const outputSuffix = localImages.length > 1 ? `-flyer-${targetIndex + 1}` : "";
      const targetProp = propertiesData[targetIndex] || currentData;
      a.download = `${(targetProp.propertyTitle || "property-flyer")
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
    if (localImages.length === 0) return;
    setBatchDownloading(true);
    setBatchProgress(`Initializing ${localImages.length} flyers...`);
    try {
      const JSZipModule = await import("jszip");
      const JSZip = JSZipModule.default;
      const zip = new JSZip();
      const primaryProp = propertiesData[0] || currentData;
      const titleSlug = (primaryProp.propertyTitle || "property-flyer")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-");

      for (let i = 0; i < localImages.length; i++) {
        setBatchProgress(`Rendering flyer ${i + 1} of ${localImages.length}...`);
        const targetProp = propertiesData[i] || propertiesData[0] || currentData;
        const targetTitleSlug = (targetProp.propertyTitle || "property-flyer")
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-");
        const svgEl =
          i === safeActiveIndex && svgRef.current
            ? svgRef.current
            : offscreenSvgs.current[i] || svgRef.current;
        if (svgEl) {
          const blob = await svgToPngBlob(svgEl, exportScale);
          if (blob) {
            const scaleSuffix = exportScale > 1 ? `@${exportScale}x-HD` : "";
            const filename = `${targetTitleSlug}-flyer-${i + 1}-${selectedTemplate}${scaleSuffix}.png`;
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
      a.download = `${titleSlug}-${selectedTemplate}-all-${localImages.length}-flyers.zip`;
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
    if (localImages.length === 0) return;
    setBatchDownloading(true);
    try {
      for (let i = 0; i < localImages.length; i++) {
        setBatchProgress(`Downloading flyer ${i + 1} of ${localImages.length}...`);
        const targetProp = propertiesData[i] || propertiesData[0] || currentData;
        const targetTitleSlug = (targetProp.propertyTitle || "property-flyer")
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-");
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
            a.download = `${targetTitleSlug}-flyer-${i + 1}-${selectedTemplate}${scaleSuffix}.png`;
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

      {/* Multi-Property Tabs Bar */}
      {propertiesData.length > 1 && (
        <div className="bg-white p-2 sm:p-2.5 rounded-2xl border border-slate-200/90 shadow-xs mb-6">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-black uppercase tracking-wider text-[#1B494E] px-1">
                Select Property:
              </span>
              <div className="flex items-center gap-2 flex-wrap">
                {propertiesData.map((prop, pIdx) => {
                  const isActive = safePropIndex === pIdx;
                  return (
                    <button
                      key={pIdx}
                      type="button"
                      onClick={() => handleSelectPropertyTab(pIdx)}
                      className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all duration-150 cursor-pointer ${
                        isActive
                          ? "bg-[#1B494E] text-white shadow-sm ring-2 ring-[#1B494E]/20"
                          : "bg-slate-100 hover:bg-slate-200/80 text-slate-700"
                      }`}
                    >
                      <span
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                          isActive ? "bg-[#F26522] text-white" : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        {pIdx + 1}
                      </span>
                      <span>Property {pIdx + 1}</span>
                      {prop.propertyTitle && (
                        <span
                          className={`text-[11px] font-medium truncate max-w-[140px] hidden sm:inline ${
                            isActive ? "text-teal-200" : "text-slate-500"
                          }`}
                        >
                          · {prop.propertyTitle}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="text-[11px] font-semibold text-slate-500 px-1 hidden md:block">
              Select tab to update specifications &amp; flyer preview for each property
            </div>
          </div>
        </div>
      )}

      {/* Main Content: Step 1 vs Step 2 */}
      {step === "review" ? (
        <PropertyReviewStep
          data={currentData}
          propertiesData={propertiesData}
          safePropIndex={safePropIndex}
          localImages={localImages}
          selectedCanvasItemId={selectedCanvasItemId}
          onSelectCanvasItem={handleSelectCanvasItem}
          onUpdateField={handleUpdateField}
          onAddFeature={handleAddFeature}
          onRemoveFeature={handleRemoveFeature}
          onSetPrimaryImage={handleSetPrimaryImage}
          onDeleteImage={handleDeleteImage}
          onUploadImages={handleUploadImages}
          onSelectPropertyTab={handleSelectPropertyTab}
          onProceedToKit={handleProceedToKit}
        />
      ) : (
        <MarketingKitStep
          data={currentData}
          propertiesData={propertiesData}
          safePropIndex={safePropIndex}
          localImages={localImages}
          safeActiveIndex={safeActiveIndex}
          currentActiveImage={currentActiveImage}
          selectedTemplate={selectedTemplate}
          currentSelectedCustomTemplate={currentSelectedCustomTemplate}
          effectiveSettings={settings}
          svgRef={svgRef}
          selectedCanvasItemId={selectedCanvasItemId}
          selectedCanvasItemType={selectedCanvasItemType}
          currentItemDefaultBox={customization.currentItemDefaultBox}
          currentItemOffsets={customization.currentItemOffsets}
          currentItemWidths={customization.currentItemWidths}
          currentItemWrap={customization.currentItemWrap}
          currentItemFontSizes={customization.currentItemFontSizes}
          currentItemScales={customization.currentItemScales}
          activeItemWidth={customization.activeItemWidth}
          isItemWrapActive={customization.isItemWrapActive}
          activeItemFontSize={customization.activeItemFontSize}
          activeItemScale={customization.activeItemScale}
          hasCustomFormatting={customization.hasCustomFormatting}
          exportScale={exportScale}
          downloading={downloading}
          batchDownloading={batchDownloading}
          batchProgress={batchProgress}
          caption={caption}
          onCaptionChange={setCaption}
          onSelectImageIndex={handleSelectImageIndex}
          onSelectCanvasItem={handleSelectCanvasItem}
          onItemOffsetsChange={customization.handleItemOffsetsChange}
          onItemWidthChange={customization.handleItemWidthChange}
          onStepItemWidth={customization.handleStepItemWidth}
          onToggleItemWrap={customization.handleToggleItemWrap}
          onStepItemFontSize={customization.handleStepItemFontSize}
          onStepItemScale={customization.handleStepItemScale}
          onAutoFitActiveItem={customization.handleAutoFitActiveItem}
          onResetActiveItemPosition={customization.handleResetActiveItemPosition}
          onResetActiveItemFormatting={customization.handleResetActiveItemFormatting}
          onResetAllPositions={customization.handleResetAllPositions}
          onSetExportScale={setExportScale}
          onDownloadPng={handleDownloadPng}
          onDownloadAllZip={handleDownloadAllZip}
          onDownloadAllSeparate={handleDownloadAllSeparate}
          onOpenTemplateModal={() => setTemplateSelectorOpen(true)}
        />
      )}

      {/* Offscreen SVG Canvases for Instant Multi-Flyer PNG & ZIP Export */}
      <BatchExportOffscreen
        localImages={localImages}
        propertiesData={propertiesData}
        defaultData={currentData}
        settings={settings}
        selectedTemplate={selectedTemplate}
        customTemplate={currentSelectedCustomTemplate}
        itemOffsetsMap={customization.itemOffsetsMap}
        itemWidthsMap={customization.itemWidthsMap}
        itemWrapMap={customization.itemWrapMap}
        itemFontSizesMap={customization.itemFontSizesMap}
        itemScalesMap={customization.itemScalesMap}
        offscreenSvgs={offscreenSvgs}
      />

      {/* Template Selector Modal */}
      {templateSelectorOpen && (
        <TemplateSelectorModal
          isOpen={templateSelectorOpen}
          onClose={() => setTemplateSelectorOpen(false)}
          selectedTemplateId={selectedTemplate}
          onSelectTemplate={(tplId) => {
            setSelectedTemplate(tplId);
            setTemplateSelectorOpen(false);
          }}
        />
      )}
    </div>
  );
}
