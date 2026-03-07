"use client";

const statusConfig: Record<string, { label: string; className: string }> = {
  todo: { label: "To do", className: "bg-slate-600/50 text-slate-200 border-slate-500/50" },
  in_progress: { label: "In progress", className: "bg-accent-soft text-accent-second border-accent/50" },
  review: { label: "Review", className: "bg-amber-600/50 text-amber-100 border-amber-500/50" },
  approved: { label: "Approved", className: "bg-emerald-600/50 text-emerald-100 border-emerald-500/50" },
  changes_requested: { label: "Changes requested", className: "bg-violet-600/50 text-violet-100 border-violet-500/50" },
  overdue: { label: "Overdue", className: "bg-rose-700/60 text-rose-100 border-rose-600/50" },
  active: { label: "Active", className: "bg-emerald-600/50 text-emerald-100 border-emerald-500/50" },
  inactive: { label: "Inactive", className: "bg-slate-600/50 text-slate-400 border-slate-500/50" },
  pending_verification: { label: "Pending", className: "bg-amber-600/50 text-amber-100 border-amber-500/50" },
  banned: { label: "Banned", className: "bg-rose-700/60 text-rose-100 border-rose-600/50" },
};

export function StatusChip({ status }: { status: string }) {
  const config = statusConfig[status] ?? { label: status, className: "bg-white/10 text-slate-300 border-white/10" };
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
}
