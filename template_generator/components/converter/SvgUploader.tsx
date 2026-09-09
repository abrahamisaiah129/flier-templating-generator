"use client";

import React, { RefObject } from "react";
import {
  FileCode2,
  UploadCloud,
  ClipboardPaste,
  Sparkles,
  Trash2,
  Loader2,
} from "lucide-react";

export interface SvgUploaderProps {
  svgCode: string;
  onSvgCodeChange: (code: string) => void;
  isDragging: boolean;
  loading: boolean;
  error?: string | null;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onFileUpload: (file: File) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragEnter: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onPasteClipboard: () => void;
  onLoadSample: () => void;
  onClear: () => void;
  onGenerate: () => void;
}

export function SvgUploader({
  svgCode,
  onSvgCodeChange,
  isDragging,
  loading,
  error,
  fileInputRef,
  onFileUpload,
  onDragOver,
  onDragEnter,
  onDragLeave,
  onDrop,
  onPasteClipboard,
  onLoadSample,
  onClear,
  onGenerate,
}: SvgUploaderProps) {
  return (
    <div className="flex flex-col min-h-[320px] sm:min-h-[420px] lg:h-[520px]">
      <div className="flex items-center justify-between pb-3 mb-2 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <FileCode2 size={17} className="text-[#F26522]" />
          <span className="font-bold text-sm text-[#1B494E]">Raw SVG Code</span>
          {svgCode && (
            <span className="text-[11px] font-semibold text-slate-400">
              ({svgCode.length} chars)
            </span>
          )}
        </div>

        {/* Action Shortcuts */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Upload an .svg or .txt vector file"
            className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-[#1B494E] border border-teal-200/80 flex items-center gap-1.5 cursor-pointer touch-manipulation min-h-[34px]"
          >
            <UploadCloud size={13} className="text-[#1B494E]" />
            <span>Upload SVG</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                onFileUpload(e.target.files[0]);
                e.target.value = "";
              }
            }}
            accept=".svg,.txt,image/svg+xml,text/plain"
            className="hidden"
          />

          <button
            type="button"
            onClick={onPasteClipboard}
            className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1.5 cursor-pointer touch-manipulation min-h-[34px]"
          >
            <ClipboardPaste size={13} />
            <span>Paste</span>
          </button>
          <button
            type="button"
            onClick={onLoadSample}
            className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-orange-50 hover:bg-orange-100 text-[#F26522] flex items-center gap-1.5 cursor-pointer touch-manipulation min-h-[34px]"
          >
            <Sparkles size={13} />
            <span>Sample</span>
          </button>
          {svgCode && (
            <button
              type="button"
              onClick={onClear}
              className="text-xs font-semibold p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer touch-manipulation min-h-[34px] min-w-[34px] flex items-center justify-center"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Editor Area with Drag-and-Drop */}
      <div
        onDragOver={onDragOver}
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`relative flex-1 flex flex-col rounded-xl overflow-hidden transition-all duration-150 ${
          isDragging
            ? "ring-2 ring-[#F26522] border-2 border-dashed border-[#F26522]"
            : "border border-slate-800"
        }`}
      >
        <textarea
          value={svgCode}
          onChange={(e) => onSvgCodeChange(e.target.value)}
          placeholder={`<svg width="1080" height="1350" viewBox="0 0 1080 1350" fill="none" ...>\n  <!-- Paste raw SVG code or drag & drop an .svg file directly here -->\n</svg>`}
          className="flex-1 w-full p-4 bg-slate-950 text-emerald-400 font-mono text-xs leading-relaxed resize-none focus:outline-none placeholder:text-slate-600 select-text"
          spellCheck={false}
        />

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
          onClick={onGenerate}
          disabled={loading || !svgCode.trim()}
          className="w-full py-4 rounded-xl bg-[#F26522] hover:bg-[#D95315] text-white font-bold text-sm tracking-wide flex items-center justify-center gap-2.5 shadow-md shadow-orange-600/20 transition-transform duration-150 ease-out active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer min-h-[50px] touch-manipulation"
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
  );
}
