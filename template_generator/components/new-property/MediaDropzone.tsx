"use client";

import React, { RefObject } from "react";
import { UploadCloud } from "lucide-react";

export interface MediaDropzoneProps {
  onFilesSelected: (files: FileList | null) => void;
  fileInputRef: RefObject<HTMLInputElement | null>;
  multiple?: boolean;
}

export function MediaDropzone({
  onFilesSelected,
  fileInputRef,
  multiple = false,
}: MediaDropzoneProps) {
  return (
    <div
      onClick={() => fileInputRef.current?.click()}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        onFilesSelected(e.dataTransfer.files);
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

      <input
        ref={fileInputRef}
        type="file"
        multiple={multiple}
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => onFilesSelected(e.target.files)}
      />
    </div>
  );
}
