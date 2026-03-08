"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import type { Role } from "@/lib/auth/session";
import {
  LayoutDashboard,
  Users,
  Building2,
  Calendar,
  ListTodo,
  ClipboardList,
  Film,
  CheckSquare,
  FolderLock,
  User,
  Bell,
  X,
} from "lucide-react";

const commonNav = [
  { href: "/app/profile", label: "Profile", icon: User },
  { href: "/app/notifications", label: "Notifications", icon: Bell },
  { href: "/app/tasks", label: "Tasks", icon: ListTodo },
];

const navByRole: Record<
  Role,
  { href: string; label: string; icon: React.ComponentType<{ className?: string }> }[]
> = {
  ADMIN: [
    { href: "/app/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/app/admin/users", label: "Users", icon: Users },
    { href: "/app/admin/clients", label: "Clients", icon: Building2 },
    { href: "/app/admin/tasks", label: "Task Control Center", icon: ListTodo },
    { href: "/app/admin/approvals", label: "Approvals", icon: CheckSquare },
    { href: "/app/admin/reports", label: "Reports", icon: ClipboardList },
  ],
  SUPERVISOR: [
    { href: "/app/supervisor", label: "Overview", icon: LayoutDashboard },
    { href: "/app/supervisor/ops", label: "Ops", icon: Users },
    { href: "/app/supervisor/tasks", label: "Task Control Center", icon: ListTodo },
    { href: "/app/supervisor/private", label: "Private Workspace", icon: FolderLock },
  ],
  SMM: [
    { href: "/app/smm", label: "Dashboard", icon: LayoutDashboard },
    { href: "/app/smm/calendar", label: "Content Calendar", icon: Calendar },
    { href: "/app/smm/posts", label: "Posts", icon: ListTodo },
  ],
  DESIGNER: [
    { href: "/app/designer", label: "Dashboard", icon: LayoutDashboard },
  ],
  EDITOR: [
    { href: "/app/editor", label: "Dashboard", icon: LayoutDashboard },
  ],
};

export function AppSidebar({
  role,
  mobileOpen = false,
  onClose,
}: {
  role: Role;
  mobileOpen?: boolean;
  onClose?: () => void;
}) {
  const pathname = usePathname();
  const items = [...(navByRole[role] ?? []), ...commonNav];

  const linkClass = (active: boolean) =>
    `flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm min-h-[44px] md:min-h-0 transition ${
      active
        ? "bg-accent-soft text-accent-second"
        : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
    }`;

  const navContent = (
    <nav className="flex-1 p-2 md:space-y-0.5 overflow-y-auto md:overflow-visible">
      {items.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            onClick={onClose}
            aria-current={active ? "page" : undefined}
            className={linkClass(active)}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Mobile overlay backdrop */}
      <div
        aria-hidden
        className={`fixed inset-0 z-30 bg-black/50 backdrop-blur-sm transition-opacity md:hidden ${
          mobileOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />
      {/* Sidebar: drawer on mobile, static on desktop */}
      <aside
        className={`
          w-full md:w-56 shrink-0 glass-card border-b md:border-b-0 md:border-r border-go-glass-border flex flex-col
          bg-slate-900/95 md:bg-transparent
          fixed md:relative inset-y-0 left-0 z-40 md:z-auto
          w-72 max-w-[85vw] md:max-w-none
          transform transition-transform duration-200 ease-out md:transform-none
          ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        <div className="p-4 border-b border-go-glass-border flex items-center justify-between">
          <Link href="/app" className="flex items-center gap-2" onClick={onClose}>
            <Image src="/images/logo.png?v=2" alt="GO Media" width={32} height={32} className="object-contain logo-white" unoptimized />
            <span className="font-semibold text-accent-second">M-TM</span>
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="md:hidden p-2 rounded-lg text-slate-400 hover:bg-white/10 hover:text-white transition"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {navContent}
      </aside>
    </>
  );
}
