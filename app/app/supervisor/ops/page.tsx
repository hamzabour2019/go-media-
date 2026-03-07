import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { CheckSquare, Users } from "lucide-react";

export default async function SupervisorOpsPage() {
  const supabase = await createClient();
  const { count: reviewCount } = await supabase.from("tasks").select("*", { count: "exact", head: true }).eq("status", "review");
  const { data: profiles } = await supabase.from("profiles").select("id, name, role");
  const { data: taskCounts } = await supabase.from("tasks").select("assignee_id");

  const byUser: Record<string, number> = {};
  (taskCounts ?? []).forEach((t) => {
    const uid = t.assignee_id ?? "unassigned";
    byUser[uid] = (byUser[uid] ?? 0) + 1;
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Ops – Team & Approvals</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href="/app/supervisor/approvals" className="glass-card p-5 hover:bg-white/5 transition flex items-center gap-4">
          <CheckSquare className="h-8 w-8 text-amber-400" />
          <div>
            <p className="text-2xl font-semibold text-white">{reviewCount ?? 0}</p>
            <p className="text-slate-400 text-sm">In Review</p>
          </div>
        </Link>
        <Link href="/app/supervisor/team" className="glass-card p-5 hover:bg-white/5 transition flex items-center gap-4">
          <Users className="h-8 w-8 text-accent-second" />
          <p className="text-slate-400 text-sm">Team</p>
        </Link>
      </div>
      <div className="glass-card p-6">
        <h2 className="font-semibold text-white mb-4">Workload</h2>
        <ul className="space-y-2">
          {(profiles ?? []).map((p) => (
            <li key={p.id} className="flex justify-between text-sm">
              <span className="text-slate-300">{p.name} ({p.role})</span>
              <span className="text-white font-medium">{byUser[p.id] ?? 0} tasks</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
