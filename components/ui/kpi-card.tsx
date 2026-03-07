"use client";

import Link from "next/link";

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  href?: string;
  icon: React.ReactNode;
  trend?: "up" | "down" | "neutral";
  trendLabel?: string;
  variant?: "default" | "warning" | "success" | "danger";
}

const variantStyles = {
  default: "text-accent-second",
  warning: "text-amber-400",
  success: "text-emerald-400",
  danger: "text-rose-400",
};

export function KpiCard({ title, value, subtitle, href, icon, trend, trendLabel, variant = "default" }: KpiCardProps) {
  const content = (
    <div className="glass-card p-5 transition duration-200 ease-out group">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-400 text-sm font-medium">{title}</p>
          <p className="text-2xl font-semibold text-white mt-1">{value}</p>
          {(subtitle || trendLabel) && (
            <p className="text-slate-500 text-xs mt-1">
              {subtitle}
              {trendLabel && (
                <span className={trend === "up" ? "text-emerald-400" : trend === "down" ? "text-rose-400" : "text-slate-400"}>
                  {" "}{trendLabel}
                </span>
              )}
            </p>
          )}
        </div>
        <div className={`p-2 rounded-lg bg-white/5 ${variantStyles[variant]}`}>
          {icon}
        </div>
      </div>
    </div>
  );

  if (href) {
    return <Link href={href} className="block">{content}</Link>;
  }
  return content;
}
