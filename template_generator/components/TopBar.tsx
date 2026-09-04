"use client";

import React from "react";
import { Settings as SettingsIcon, User, Menu } from "lucide-react";
import { ActiveView } from "../types/propkit";

interface TopBarProps {
  activeView: ActiveView;
  onOpenSettings: () => void;
  onToggleMobileMenu?: () => void;
}

export function TopBar({ activeView, onOpenSettings, onToggleMobileMenu }: TopBarProps) {
  const getBreadcrumb = () => {
    switch (activeView) {
      case "dashboard":
        return "P R O P K I T   /   D A S H B O A R D";
      case "new":
        return "P R O P K I T   /   N E W";
      case "history":
        return "P R O P K I T   /   H I S T O R Y";
      case "review":
        return "P R O P K I T   /   R E V I E W";
      case "kit":
        return "P R O P K I T   /   C R E A T I V E";
      default:
        return "P R O P K I T   /   N E W";
    }
  };

  return (
    <header className="h-16 px-4 sm:px-8 flex items-center justify-between border-b border-slate-200/70 bg-white/80 backdrop-blur-md sticky top-0 z-20">
      {/* Left: Mobile Hamburger & Figma Spaced Breadcrumb Tracker */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onToggleMobileMenu}
          className="md:hidden p-2 -ml-2 rounded-lg text-[#1B494E] hover:bg-slate-100 transition-colors flex-shrink-0 cursor-pointer"
          title="Open navigation menu"
        >
          <Menu size={22} />
        </button>
        <div className="text-[11px] font-medium tracking-[0.25em] sm:tracking-[0.35em] text-[#1B494E]/80 uppercase select-none truncate">
          {getBreadcrumb()}
        </div>
      </div>

      {/* Action Icons */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenSettings}
          title="Settings"
          className="w-9 h-9 flex items-center justify-center rounded-full text-[#1B494E]/80 hover:text-[#1B494E] hover:bg-slate-100 transition-colors"
        >
          <SettingsIcon size={19} />
        </button>
        <div
          title="User Profile"
          className="w-9 h-9 rounded-full bg-[#E6EEEE] border border-slate-300/60 flex items-center justify-center text-[#1B494E] select-none font-semibold text-xs cursor-pointer hover:ring-2 hover:ring-[#1B494E]/20 transition-all"
        >
          <User size={18} />
        </div>
      </div>
    </header>
  );
}
