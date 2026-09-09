"use client";

import React, { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { SettingsModal } from "../SettingsModal";
import { usePropKit } from "../../context/PropKitContext";

export interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const {
    activeView,
    setActiveView,
    settings,
    settingsOpen,
    setSettingsOpen,
    mobileMenuOpen,
    setMobileMenuOpen,
    saveSettings,
    resetWorkflow,
  } = usePropKit();

  const handleNavigate = (view: typeof activeView) => {
    setActiveView(view);
    setMobileMenuOpen(false);
    if (view === "new") {
      resetWorkflow();
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F4F9F9] font-sans antialiased text-slate-900 overflow-x-hidden w-full">
      {/* Sidebar Navigation */}
      <Sidebar
        activeView={activeView}
        onNavigate={handleNavigate}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Column */}
      <div className="flex-1 flex flex-col min-w-0 md:pl-60 w-full overflow-x-hidden">
        <TopBar
          activeView={activeView}
          onOpenSettings={() => setSettingsOpen(true)}
          onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
        />

        <main className="flex-1 p-3 sm:p-5 lg:p-8 overflow-y-auto overflow-x-hidden min-w-0">
          {children}
        </main>
      </div>

      {/* Settings Modal */}
      {settingsOpen && (
        <SettingsModal
          settings={settings}
          onSaveSettings={saveSettings}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </div>
  );
}
