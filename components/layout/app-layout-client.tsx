"use client";

import { useState, useEffect } from "react";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppTopbar } from "@/components/layout/app-topbar";
import type { Role } from "@/lib/auth/session";

interface User {
  id: string;
  name: string;
  role: string;
}

export function AppLayoutClient({
  role,
  user,
  children,
}: {
  role: Role;
  user: User;
  children: React.ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  return (
    <div className="relative z-10 min-h-screen flex flex-col md:flex-row">
      <AppSidebar
        role={role}
        mobileOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0 md:pl-5 md:border-l border-white/10">
        <AppTopbar
          user={user}
          onMenuClick={() => setMobileMenuOpen((v) => !v)}
        />
        <div id="app-page-sticky-slot" className="px-3 pt-3 md:px-6 md:pt-4" />
        <main className="flex-1 p-3 md:p-6 overflow-auto min-h-0">{children}</main>
      </div>
    </div>
  );
}
