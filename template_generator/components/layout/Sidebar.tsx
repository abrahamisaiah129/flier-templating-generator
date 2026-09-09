"use client";

import React from "react";
import { Home, PlusCircle, Briefcase, X, FileCode2 } from "lucide-react";
import { ActiveView } from "../../types/propkit";

export interface SidebarProps {
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
      id: "converter" as ActiveView,
      label: "SVG to Code",
      icon: FileCode2,
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
            className="min-w-[44px] min-h-[44px] p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer active:scale-95 flex items-center justify-center touch-manipulation"
            title="Close menu"
            aria-label="Close navigation menu"
          >
            <X size={22} />
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
        <div className="font-semibold text-white/80">Built for Nigerian Realtors</div>
        <div className="text-[11px] mt-0.5">1080×1350 High-Res Graphics</div>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar: Fixed to left edge */}
      <aside className="hidden md:flex flex-col w-60 fixed inset-y-0 left-0 bg-[#1B494E] z-30 shadow-xl border-r border-teal-800/40">
        {renderNavContent(false)}
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 md:hidden transition-opacity"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Mobile Slide-in Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 w-72 sm:w-80 max-w-[85vw] bg-[#1B494E] z-50 md:hidden flex flex-col shadow-2xl transition-transform duration-200 ease-out ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label="Mobile Navigation"
      >
        {renderNavContent(true)}
      </aside>
    </>
  );
}
