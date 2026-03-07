"use client";

import { useMemo, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { KpiCard } from "@/components/ui/kpi-card";
import { CheckSquare, Building2 } from "lucide-react";

interface TaskRow {
  id: string;
  status: string;
  assignee_id: string | null;
  client_id: string;
  due_at: string | null;
  created_at: string;
}

export function ReportsClient({
  tasks,
  profileMap,
  clientMap,
}: {
  tasks: TaskRow[];
  profileMap: Record<string, string>;
  clientMap: Record<string, string>;
}) {
  const [dateFrom, setDateFrom] = useState(() => new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().slice(0, 10));

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      const d = new Date(t.created_at).getTime();
      return d >= new Date(dateFrom).getTime() && d <= new Date(dateTo + "T23:59:59").getTime();
    });
  }, [tasks, dateFrom, dateTo]);

  const byStatus = useMemo(() => {
    const m: Record<string, number> = {};
    filtered.forEach((t) => { m[t.status] = (m[t.status] ?? 0) + 1; });
    return Object.entries(m).map(([name, count]) => ({ name, count }));
  }, [filtered]);

  const byAssignee = useMemo(() => {
    const m: Record<string, number> = {};
    filtered.forEach((t) => {
      const name = t.assignee_id ? profileMap[t.assignee_id] ?? "Unassigned" : "Unassigned";
      m[name] = (m[name] ?? 0) + 1;
    });
    return Object.entries(m).map(([name, count]) => ({ name, count }));
  }, [filtered, profileMap]);

  const byClient = useMemo(() => {
    const m: Record<string, number> = {};
    filtered.forEach((t) => {
      const name = clientMap[t.client_id] ?? t.client_id;
      m[name] = (m[name] ?? 0) + 1;
    });
    return Object.entries(m).map(([name, count]) => ({ name, count }));
  }, [filtered, clientMap]);

  function exportCsv() {
    const headers = ["Task ID", "Status", "Assignee", "Client", "Due", "Created"];
    const rows = filtered.map((t) => [
      t.id,
      t.status,
      t.assignee_id ? profileMap[t.assignee_id] ?? "" : "",
      clientMap[t.client_id] ?? "",
      t.due_at ?? "",
      t.created_at,
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `tasks-report-${dateFrom}-${dateTo}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  const completed = filtered.filter((t) => t.status === "approved").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-sm text-slate-400">
          From
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="rounded bg-white/5 border border-white/10 px-2 py-1 text-white" />
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-400">
          To
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="rounded bg-white/5 border border-white/10 px-2 py-1 text-white" />
        </label>
        <button type="button" onClick={exportCsv} className="rounded-lg border border-white/20 px-4 py-2 text-sm font-medium text-white hover:bg-white/5">
          Export CSV
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard title="Tasks in range" value={filtered.length} icon={<CheckSquare className="h-5 w-5" />} />
        <KpiCard title="Completed (approved)" value={completed} icon={<CheckSquare className="h-5 w-5" />} variant="success" />
        <KpiCard title="Unique clients" value={Object.keys(byClient).length} icon={<Building2 className="h-5 w-5" />} />
      </div>

      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Tasks by status</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={byStatus} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip contentStyle={{ background: "rgba(15,15,35,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#e2e8f0" }} labelStyle={{ color: "#e2e8f0" }} itemStyle={{ color: "#e2e8f0" }} cursor={{ fill: "rgba(255,255,255,0.06)" }} />
              <Bar dataKey="count" fill="rgba(0, 150, 255, 0.85)" radius={[4, 4, 0, 0]} name="Tasks" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Workload by team member</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byAssignee} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip contentStyle={{ background: "rgba(15,15,35,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#e2e8f0" }} labelStyle={{ color: "#e2e8f0" }} itemStyle={{ color: "#e2e8f0" }} cursor={{ fill: "rgba(255,255,255,0.06)" }} />
                <Bar dataKey="count" fill="rgba(96, 165, 250, 0.8)" radius={[4, 4, 0, 0]} name="Tasks" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Tasks by client</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byClient} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip contentStyle={{ background: "rgba(15,15,35,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#e2e8f0" }} labelStyle={{ color: "#e2e8f0" }} itemStyle={{ color: "#e2e8f0" }} cursor={{ fill: "rgba(255,255,255,0.06)" }} />
                <Bar dataKey="count" fill="rgba(34, 197, 94, 0.8)" radius={[4, 4, 0, 0]} name="Tasks" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
