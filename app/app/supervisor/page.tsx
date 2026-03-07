import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { CheckSquare, Users, FolderLock } from "lucide-react";

export default async function SupervisorDashboard() {
  const supabase = await createClient();
  const { count: reviewCount } = await supabase
    .from("tasks")
    .select("*", { count: "exact", head: true })
    .eq("status", "review");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Supervisor Overview</h1>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link href="/app/supervisor/approvals" className="glass-card p-5 hover:bg-white/5 transition flex items-center gap-4">
          <CheckSquare className="h-8 w-8 text-amber-400" />
          <div>
            <p className="text-2xl font-semibold text-white">{reviewCount ?? 0}</p>
            <p className="text-slate-400 text-sm">In Review</p>
          </div>
        </Link>
        <Link href="/app/supervisor/team" className="glass-card p-5 hover:bg-white/5 transition flex items-center gap-4">
          <Users className="h-8 w-8 text-accent-second" />
          <div>
            <p className="text-slate-400 text-sm">Team</p>
          </div>
        </Link>
        <Link href="/app/supervisor/private" className="glass-card p-5 hover:bg-white/5 transition flex items-center gap-4">
          <FolderLock className="h-8 w-8 text-accent-second" />
          <div>
            <p className="text-slate-400 text-sm">Private Workspace</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
