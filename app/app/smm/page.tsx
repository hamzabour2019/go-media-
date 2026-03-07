import Link from "next/link";
import { Calendar } from "lucide-react";

export default function SMMDashboard() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">SMM Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href="/app/smm/calendar" className="glass-card p-6 hover:bg-white/5 transition flex items-center gap-4">
          <Calendar className="h-10 w-10 text-accent-second" />
          <div>
            <p className="font-semibold text-white">Content Calendar</p>
            <p className="text-slate-400 text-sm">Schedule and manage posts</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
