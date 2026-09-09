"use client";

import React, { useState } from "react";
import { Copy, CheckCircle2, Sparkles } from "lucide-react";

export interface CaptionGeneratorCardProps {
  caption: string;
  onCaptionChange: (caption: string) => void;
}

export function CaptionGeneratorCard({
  caption,
  onCaptionChange,
}: CaptionGeneratorCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!caption) return;
    try {
      await navigator.clipboard.writeText(caption);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-6 shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <h3 className="font-extrabold text-[#1B494E] text-sm uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles size={16} className="text-[#F26522]" />
          <span>Instagram Caption</span>
        </h3>
        <button
          type="button"
          onClick={handleCopy}
          className="px-3.5 py-1.5 rounded-lg bg-[#E6EEEE] hover:bg-[#1B494E] hover:text-white text-[#1B494E] text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer active:scale-[0.98] min-h-[38px] touch-manipulation"
        >
          {copied ? (
            <>
              <CheckCircle2 size={14} className="text-emerald-600" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy size={14} />
              <span>Copy Caption</span>
            </>
          )}
        </button>
      </div>

      <textarea
        value={caption}
        onChange={(e) => onCaptionChange(e.target.value)}
        rows={8}
        className="w-full p-3.5 sm:p-4 rounded-xl bg-[#F8FAFA] border border-slate-200 text-xs font-mono text-slate-700 leading-relaxed focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1B494E]/20 resize-y"
        placeholder="Crafting professional Instagram real estate caption..."
      />

      <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-100 text-blue-900 text-xs leading-relaxed">
        💡 <strong>Tip:</strong> Tap <strong>Copy Caption</strong> above, download or share your flyer, then paste the caption right into your Instagram post!
      </div>
    </div>
  );
}
