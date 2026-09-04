"use client";

import React, { useRef } from "react";
import { X, Upload, DollarSign, Image as ImageIcon, FileText, Phone } from "lucide-react";
import { AppSettings } from "../types/propkit";
import { FIXED_CONTACT } from "../utils/constants";

interface SettingsModalProps {
  settings: AppSettings;
  onSaveSettings: (settings: AppSettings) => void;
  onClose: () => void;
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function SettingsModal({
  settings,
  onSaveSettings,
  onClose,
}: SettingsModalProps) {
  const logoInputRef = useRef<HTMLInputElement>(null);

  const handleRateChange = (val: string) => {
    const num = parseInt(val.replace(/[^0-9]/g, ""), 10) || 1450;
    onSaveSettings({ ...settings, usdRate: num });
  };

  const handleTemplateChange = (val: string) => {
    onSaveSettings({ ...settings, captionTemplate: val });
  };

  const handleLogoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await fileToDataUrl(file);
      onSaveSettings({ ...settings, logoUrl: url });
    } catch (err) {
      console.error("Failed to load logo file", err);
    }
  };

  const handleRemoveLogo = () => {
    onSaveSettings({ ...settings, logoUrl: null });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white rounded-3xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-xs p-6 border-b border-slate-100 flex items-center justify-between z-10">
          <div>
            <h2 className="text-xl font-extrabold text-[#1B494E]">Settings & Preferences</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Customize brand assets, currency conversion, and caption templates.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* USD Rate */}
          <div className="bg-[#F4F9F9] rounded-2xl p-5 border border-slate-200/80">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign size={18} className="text-[#1B494E]" />
              <label className="text-xs font-bold uppercase tracking-wider text-[#1B494E]">
                Naira → USD Conversion Rate
              </label>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              Used to calculate the secondary USD price on the flyer creative. (Formula: Naira ÷ Rate)
            </p>
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-slate-600">₦1 USD = ₦</span>
              <input
                type="number"
                value={settings.usdRate}
                onChange={(e) => handleRateChange(e.target.value)}
                className="w-32 py-2 px-3 rounded-lg border border-slate-300 font-bold text-[#1B494E] bg-white focus:outline-none focus:ring-2 focus:ring-[#1B494E]/20"
              />
            </div>
          </div>

          {/* Brand Logo Upload */}
          <div className="bg-[#F4F9F9] rounded-2xl p-5 border border-slate-200/80">
            <div className="flex items-center gap-2 mb-2">
              <ImageIcon size={18} className="text-[#1B494E]" />
              <label className="text-xs font-bold uppercase tracking-wider text-[#1B494E]">
                Brand Logo
              </label>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Upload a transparent PNG to replace the default vector Buy &apos;n&apos; Move In logo on generated flyers.
            </p>

            {settings.logoUrl ? (
              <div className="flex items-center gap-4 p-3 bg-white rounded-xl border border-slate-200">
                <img
                  src={settings.logoUrl}
                  alt="Custom Brand Logo"
                  className="h-10 object-contain"
                />
                <button
                  type="button"
                  onClick={handleRemoveLogo}
                  className="ml-auto text-xs font-bold text-red-600 hover:underline"
                >
                  Reset to default
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                className="px-4 py-2.5 rounded-xl border-2 border-dashed border-slate-300 hover:border-[#1B494E] text-slate-600 hover:text-[#1B494E] text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Upload size={14} />
                <span>Upload Custom Logo (PNG)</span>
              </button>
            )}
            <input
              ref={logoInputRef}
              type="file"
              accept="image/png"
              className="hidden"
              onChange={handleLogoFile}
            />
          </div>

          {/* Caption Template */}
          <div className="bg-[#F4F9F9] rounded-2xl p-5 border border-slate-200/80">
            <div className="flex items-center gap-2 mb-2">
              <FileText size={18} className="text-[#1B494E]" />
              <label className="text-xs font-bold uppercase tracking-wider text-[#1B494E]">
                Instagram Caption Template
              </label>
            </div>
            <textarea
              value={settings.captionTemplate}
              onChange={(e) => handleTemplateChange(e.target.value)}
              rows={8}
              className="w-full p-3.5 rounded-xl bg-white border border-slate-200 text-xs font-mono text-slate-700 leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#1B494E]/20"
            />
            <p className="text-[11px] text-slate-400 mt-2">
              Tags: {"{{opening}}, {{bedrooms}}, {{property_type}}, {{location}}, {{price_naira}}, {{price_usd}}, {{documentation}}, {{phone}}, {{website}}, {{email}}, {{instagram}}"}
            </p>
          </div>

          {/* Fixed Footer Constants */}
          <div className="bg-[#F4F9F9] rounded-2xl p-5 border border-slate-200/80">
            <div className="flex items-center gap-2 mb-2">
              <Phone size={18} className="text-[#1B494E]" />
              <label className="text-xs font-bold uppercase tracking-wider text-[#1B494E]">
                Company Contact Constants
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs text-slate-600 pt-1">
              <div>📞 <strong>Phone:</strong> {FIXED_CONTACT.phone}</div>
              <div>📸 <strong>IG:</strong> {FIXED_CONTACT.instagram}</div>
              <div>🌐 <strong>Web:</strong> {FIXED_CONTACT.website}</div>
              <div>✉️ <strong>Email:</strong> {FIXED_CONTACT.email}</div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-6 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-[#1B494E] hover:bg-[#14383C] text-white text-xs font-bold transition-colors cursor-pointer"
          >
            Close Settings
          </button>
        </div>
      </div>
    </div>
  );
}
