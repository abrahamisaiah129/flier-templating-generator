"use client";

import React from "react";
import { Settings, Menu } from "lucide-react";
import { ActiveView } from "../../types/propkit";

export interface TopBarProps {
  activeView: ActiveView;
  onOpenSettings: () => void;
  onToggleMobileMenu?: () => void;
}

const VIEW_TITLES: Record<ActiveView, string> = {
  dashboard: "Dashboard",
  new: "New Property",
  converter: "SVG to Code",
  history: "History",
  review: "Review Details",
  kit: "Marketing Kit",
};

export function TopBar({
  activeView,
  onOpenSettings,
  onToggleMobileMenu,
}: TopBarProps) {
  return (
    <header className="h-16 px-3 sm:px-6 lg:px-8 bg-[#F4F9F9] flex items-center justify-between sticky top-0 z-20">
      {/* Left side: Hamburger button on mobile + Current View Title */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          type="button"
          onClick={onToggleMobileMenu}
          className="md:hidden min-w-[44px] min-h-[44px] p-2 rounded-xl text-slate-700 hover:bg-slate-200/70 hover:text-slate-900 transition-colors cursor-pointer active:scale-95 flex items-center justify-center touch-manipulation"
          aria-label="Open navigation menu"
        >
          <Menu size={22} />
        </button>

        <h1 className="text-lg sm:text-2xl font-black tracking-tight text-[#1B494E] truncate">
          {VIEW_TITLES[activeView] || "PropKit"}
        </h1>
      </div>

      {/* Settings Gear Action */}
      <button
        type="button"
        onClick={onOpenSettings}
        className="min-w-[44px] min-h-[44px] p-2.5 rounded-xl text-slate-500 hover:text-[#1B494E] hover:bg-slate-200/60 transition-transform duration-150 ease-out active:scale-95 cursor-pointer flex items-center justify-center touch-manipulation"
        title="Settings & Exchange Rates"
        aria-label="Settings and Exchange Rates"
      >
        <Settings size={20} />
      </button>
    </header>
  );
}
