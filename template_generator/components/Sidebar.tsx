"use client";

import React from "react";
import { Home, PlusCircle, Briefcase, X } from "lucide-react";
import { ActiveView } from "../types/propkit";

interface SidebarProps {
  activeView: ActiveView;
  onNavigate: (view: ActiveView) => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export function Sidebar({
  activeView,
  onNavigate,
  mobileOpen = false,
  onCloseMobile,
}: SidebarProps) {
  const navItems = [
    {
      id: "dashboard" as ActiveView,
      label: "Dashboard",
      icon: Home,
    },
    {
      id: "new" as ActiveView,
      label: "New Property",
      icon: PlusCircle,
    },
    {
      id: "history" as ActiveView,
      label: "History",
      icon: Briefcase,
    },
  ];

  const renderNavContent = (isMobile = false) => (
    <>
      {/* Brand Header */}
      <div className="px-6 pt-8 pb-10 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span
            className="text-3xl font-normal tracking-wide text-white select-none"
            style={{ fontFamily: "'Playfair Display', Georgia, serif", fontStyle: "italic" }}
          >
            PropKit
          </span>
        </div>

        {/* Close button for mobile drawer */}
        {isMobile && (
          <button
            type="button"
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer active:scale-95"
            title="Close menu"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            activeView === item.id ||
            (item.id === "new" && (activeView === "review" || activeView === "kit"));

          return (
            <button
              key={item.id}
              onClick={() => {
                onNavigate(item.id);
                if (isMobile && onCloseMobile) {
                  onCloseMobile();
                }
              }}
              className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-sm font-semibold text-left cursor-pointer transition-transform duration-150 ease-out active:scale-[0.98] ${
                isActive
                  ? "bg-[#F26522] text-white shadow-md shadow-orange-950/20"
                  : "text-slate-200/90 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon size={18} className="flex-shrink-0" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Sidebar Footer Info */}
      <div className="p-5 border-t border-white/10 text-xs text-white/50">
        <p className="font-medium text-white/70">Buy &apos;n&apos; Move In</p>
        <p className="text-[11px] mt-0.5">Marketing Automation v2.0</p>
      </div>
    </>
  );

  return (
    <>
      {/* 1. DESKTOP SIDEBAR: Strictly Fixed on desktop, hidden on mobile */}
      <aside className="hidden md:flex fixed top-0 left-0 bottom-0 w-60 h-screen bg-[#1B494E] text-white flex-col flex-shrink-0 select-none shadow-xl z-30 overflow-y-auto">
        {renderNavContent(false)}
      </aside>

      {/* 2. MOBILE DRAWER: Responsive slide-in drawer with backdrop */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={onCloseMobile}
          />

          {/* Drawer Panel */}
          <aside className="relative w-64 max-w-[80vw] h-full bg-[#1B494E] text-white flex flex-col select-none shadow-2xl z-10 overflow-y-auto animate-in slide-in-from-left duration-200">
            {renderNavContent(true)}
          </aside>
        </div>
      )}
    </>
  );
}
