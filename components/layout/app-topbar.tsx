"use client";

import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { ArrowLeft, Bell, LogOut, Menu, Search } from "lucide-react";
import { NotificationsPanel } from "@/components/notifications/notifications-panel";
import { useState } from "react";

interface User {
  id: string;
  name: string;
  role: string;
}

export function AppTopbar({ user, onMenuClick }: { user: User; onMenuClick?: () => void }) {
  const router = useRouter();
  const [showNotifications, setShowNotifications] = useState(false);
  const [search, setSearch] = useState("");

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  function handleBack() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    router.push("/app");
  }

  return (
    <header className="sticky top-0 z-20 h-14 sm:h-16 shrink-0 flex items-center justify-between gap-2 sm:gap-4 px-3 sm:px-4 md:px-6 border-b border-white/10 bg-white/[0.06] backdrop-blur-xl safe-area-inset-top">
      <div className="flex items-center flex-1 min-w-0 max-w-xl gap-1 sm:gap-2">
        <button
          type="button"
          onClick={onMenuClick}
          className="md:hidden p-2.5 min-w-[44px] min-h-[44px] rounded-xl text-white hover:bg-white/10 transition duration-200 flex items-center justify-center"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={handleBack}
          className="p-2 sm:p-2.5 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 rounded-xl text-white hover:bg-white/10 transition duration-200 flex items-center justify-center mr-0 sm:mr-2"
          aria-label="Go back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="relative flex-1 min-w-0 hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
          <input
            type="search"
            placeholder="Search tasks, clients…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl bg-white/5 border border-white/10 pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-accent focus:ring-1 focus:ring-accent outline-none transition duration-200"
          />
        </div>
      </div>
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowNotifications((v) => !v)}
            className="p-2.5 rounded-xl text-slate-400 hover:bg-white/10 hover:text-white transition duration-200"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
          </button>
          {showNotifications && (
            <NotificationsPanel onClose={() => setShowNotifications(false)} />
          )}
        </div>
        <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-white/10">
          <span className="text-sm text-slate-300 font-medium truncate max-w-[140px]">
            {user.name}
          </span>
          <span className="text-xs text-slate-500">({user.role})</span>
        </div>
        <Link
          href="/login"
          onClick={(e) => {
            e.preventDefault();
            handleLogout();
          }}
          className="p-2.5 rounded-xl text-slate-400 hover:bg-white/10 hover:text-rose-300 transition duration-200"
          aria-label="Log out"
        >
          <LogOut className="h-5 w-5" />
        </Link>
      </div>
    </header>
  );
}
