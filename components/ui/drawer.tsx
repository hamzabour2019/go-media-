"use client";

import { useEffect } from "react";

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  width?: "sm" | "md" | "lg" | "xl";
}

const widthClass: Record<string, string> = { sm: "max-w-sm", md: "max-w-md", lg: "max-w-lg", xl: "max-w-xl", "2xl": "max-w-2xl" };

export function Drawer({ open, onClose, title, children, width = "lg" }: DrawerProps) {
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
        className={`fixed top-0 right-0 z-50 h-full w-full ${widthClass[width] || widthClass.lg} flex flex-col glass-card border-l border-go-glass-border shadow-2xl animate-in slide-in-from-right`}
      >
        <div className="flex items-center justify-between p-4 border-b border-go-glass-border shrink-0">
          {title && <h2 id="drawer-title" className="text-lg font-semibold text-white">{title}</h2>}
          <button
            type="button"
            onClick={onClose}
            className="ml-auto p-2 rounded-lg text-slate-400 hover:bg-white/5 hover:text-white transition"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="flex-1 overflow-auto p-4">{children}</div>
      </div>
    </>
  );
}
