import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Users, Building2, CheckSquare, ListTodo, Calendar } from "lucide-react";
import { KpiCard } from "@/components/ui/kpi-card";

const AdminDashboardCharts = dynamic(
  () => import("./admin-dashboard-charts").then((m) => ({ default: m.AdminDashboardCharts })),
  { ssr: false }
);

export default async function AdminDashboard() {
  const supabase = await createClient();
  const [
    { count: usersCount },
    { count: clientsCount },
    { count: reviewCount },
    { count: overdueCount },
    { count: inProgressCount },
    { count: completedToday },
    { data: tasksForChart },
    { data: overdueTasksForChart },
    { data: profiles },
  ] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("clients").select("id", { count: "exact", head: true }),
    supabase.from("tasks").select("id", { count: "exact", head: true }).eq("status", "review"),
    supabase.from("tasks").select("id", { count: "exact", head: true }).lt("due_at", new Date().toISOString()).in("status", ["todo", "in_progress"]),
    supabase.from("tasks").select("id", { count: "exact", head: true }).eq("status", "in_progress"),
    supabase.from("tasks").select("id", { count: "exact", head: true }).eq("status", "approved").gte("created_at", new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
    supabase.from("tasks").select("assignee_id, status").in("status", ["todo", "in_progress", "review"]),
    supabase.from("tasks").select("assignee_id, status").lt("due_at", new Date().toISOString()).in("status", ["todo", "in_progress", "review", "changes_requested"]),
    supabase.from("profiles").select("id, name"),
  ]);
  const workloadByUser: Record<string, number> = {};
  (tasksForChart ?? []).forEach((t) => {
    const uid = t.assignee_id ?? "unassigned";
    workloadByUser[uid] = (workloadByUser[uid] ?? 0) + 1;
  });
  const workloadData = (profiles ?? []).map((p) => ({ name: p.name, count: workloadByUser[p.id] ?? 0 }));
  const overdueByUser: Record<string, number> = {};
  (overdueTasksForChart ?? []).forEach((t) => {
    if (!t.assignee_id) return;
    overdueByUser[t.assignee_id] = (overdueByUser[t.assignee_id] ?? 0) + 1;
  });
  const overdueByUserData = (profiles ?? [])
    .map((p) => ({ name: p.name, count: overdueByUser[p.id] ?? 0 }))
    .filter((p) => p.count > 0);
  const statusByCount: Record<string, number> = {};
  (tasksForChart ?? []).forEach((t) => {
    statusByCount[t.status] = (statusByCount[t.status] ?? 0) + 1;
  });
  const statusData = Object.entries(statusByCount).map(([name, count]) => ({ name, count }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
        <p className="text-slate-400 text-sm">READY. SET. GO.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        <KpiCard href="/app/admin/users" title="Users" value={usersCount ?? 0} icon={<Users className="h-5 w-5" />} />
        <KpiCard href="/app/admin/clients" title="Clients" value={clientsCount ?? 0} icon={<Building2 className="h-5 w-5" />} />
        <KpiCard href="/app/admin/approvals" title="In Review" value={reviewCount ?? 0} icon={<CheckSquare className="h-5 w-5" />} variant="warning" />
        <KpiCard href="/app/admin/tasks" title="Overdue" value={overdueCount ?? 0} icon={<ListTodo className="h-5 w-5" />} variant="danger" />
        <KpiCard title="In Progress" value={inProgressCount ?? 0} icon={<ListTodo className="h-5 w-5" />} variant="warning" />
        <KpiCard title="Completed Today" value={completedToday ?? 0} icon={<CheckSquare className="h-5 w-5" />} variant="success" />
      </div>

      <AdminDashboardCharts
        workloadData={workloadData}
        overdueByUserData={overdueByUserData}
        statusData={statusData}
      />

      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Quick actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/app/admin/tasks" className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-second transition duration-200">
            Add task
          </Link>
          <Link href="/app/admin/clients/new" className="rounded-lg border border-white/20 px-4 py-2 text-sm font-medium text-white hover:bg-white/5 transition">
            Add client
          </Link>
          <Link href="/app/admin/approvals" className="rounded-lg bg-amber-600/80 px-4 py-2 text-sm font-medium text-white hover:bg-amber-500 transition">
            Approval hub
          </Link>
          <Link href="/app/smm/calendar" className="rounded-lg border border-white/20 px-4 py-2 text-sm font-medium text-white hover:bg-white/5 transition">
            <Calendar className="inline h-4 w-4 mr-1.5" /> Calendar
          </Link>
          <Link href="/app/admin/reports" className="rounded-lg border border-white/20 px-4 py-2 text-sm font-medium text-white hover:bg-white/5 transition">
            Reports
          </Link>
        </div>
      </div>
    </div>
  );
}
