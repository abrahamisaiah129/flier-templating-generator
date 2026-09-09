"use client";

import React from "react";
import { CheckCircle2, Plus, Star, Trash2 } from "lucide-react";
import { UploadedImage } from "../../types/propkit";

export interface ImageThumbnailGridProps {
  images: UploadedImage[];
  primaryId: string | null;
  briefsCount: number;
  onSetPrimary: (id: string) => void;
  onDeleteImage: (id: string) => void;
  onTriggerUpload: () => void;
}

export function ImageThumbnailGrid({
  images,
  primaryId,
  briefsCount,
  onSetPrimary,
  onDeleteImage,
  onTriggerUpload,
}: ImageThumbnailGridProps) {
  return (
    <div className="space-y-4">
      {/* Status Banner */}
      <div className="text-white py-3 px-4 sm:px-5 rounded-xl bg-[#1B494E] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-full bg-[#F26522] flex items-center justify-center text-white flex-shrink-0">
            <CheckCircle2 size={15} />
          </div>
          <div>
            <span className="font-bold text-sm tracking-wide block">
              {briefsCount === 1 ? "1 property brief added" : `${briefsCount} property briefs added`} · {images.length}/{briefsCount} image uploaded
            </span>
            <span className="text-xs text-teal-100/80 font-medium block">
              {images.length >= briefsCount
                ? "All images uploaded · Ready to generate flyer"
                : `Upload ${briefsCount - images.length} more image for Brief ${images.length + 1}`}
            </span>
          </div>
        </div>
        {images.length < briefsCount && (
          <button
            type="button"
            onClick={onTriggerUpload}
            className="w-full sm:w-auto text-xs font-bold px-3.5 py-2 bg-white/10 hover:bg-white/20 rounded-lg border border-white/20 transition-colors cursor-pointer flex items-center justify-center gap-1.5 touch-manipulation min-h-[38px]"
          >
            <Plus size={13} />
            <span>Add Photo {images.length + 1}</span>
          </button>
        )}
      </div>

      {/* Thumbnails Gallery */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-3.5">
        {images.map((img, idx) => {
          const isPrimary = img.id === primaryId;
          return (
            <div
              key={img.id}
              className={`relative group rounded-xl overflow-hidden border-2 bg-slate-100 shadow-xs transition-all touch-manipulation ${
                isPrimary ? "border-[#F26522] ring-2 ring-orange-500/20" : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <img
                src={img.url}
                alt={img.name}
                className="w-full h-28 sm:h-32 object-cover block"
              />

              {/* Brief Label & Cover Indicator */}
              <div className="absolute top-2 left-2 flex flex-col gap-1 items-start">
                <div className="bg-[#1B494E]/90 backdrop-blur-xs text-white text-[10px] sm:text-[11px] font-extrabold px-1.5 sm:px-2 py-0.5 rounded-md shadow-xs flex items-center gap-1.5 border border-white/20">
                  <span>Brief {idx + 1}</span>
                </div>
                {isPrimary ? (
                  <div className="bg-[#F26522] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-1 shadow-xs">
                    <Star size={9} fill="#ffffff" />
                    <span>COVER</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => onSetPrimary(img.id)}
                    className="opacity-90 sm:opacity-0 sm:group-hover:opacity-100 bg-black/70 hover:bg-[#F26522] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md transition-all cursor-pointer touch-manipulation"
                  >
                    Set Cover
                  </button>
                )}
              </div>

              {/* Delete Button */}
              <button
                type="button"
                onClick={() => onDeleteImage(img.id)}
                className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 hover:bg-red-600 text-white transition-colors cursor-pointer touch-manipulation min-w-[28px] min-h-[28px] flex items-center justify-center"
                title="Remove photo"
              >
                <Trash2 size={13} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
