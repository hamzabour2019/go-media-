"use client";

import Link from "next/link";

interface EmptyStateProps {
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export function EmptyState({ title, description, actionLabel, actionHref, onAction, icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {icon && <div className="text-slate-500 mb-4">{icon}</div>}
      <h3 className="text-lg font-medium text-white">{title}</h3>
      {description && <p className="mt-1 text-sm text-slate-400 max-w-sm">{description}</p>}
      {(actionLabel && (actionHref || onAction)) && (
        <div className="mt-4">
          {actionHref ? (
            <Link href={actionHref} className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-second transition duration-200">
              {actionLabel}
            </Link>
          ) : (
            <button type="button" onClick={onAction} className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-second transition duration-200">
              {actionLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
