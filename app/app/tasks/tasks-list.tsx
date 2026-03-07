"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

interface TaskRow {
  id: string;
  type: string;
  status: string;
  due_at: string | null;
  client_id: string;
  assignee_id: string | null;
  priority?: number;
}

export function TasksList({
  initialTasks,
  clientMap,
  profileMap,
  isAdminOrSupervisor,
}: {
  initialTasks: TaskRow[];
  clientMap: Record<string, string>;
  profileMap: Record<string, string>;
  isAdminOrSupervisor: boolean;
}) {
  const [tasks, setTasks] = useState(initialTasks);
  const [statusFilter, setStatusFilter] = useState("");
  const [clientFilter, setClientFilter] = useState("");
  const supabase = createClient();

  useEffect(() => {
    const channel = supabase
      .channel("app-tasks")
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, () => {
        supabase.from("tasks").select("id, type, status, due_at, client_id, assignee_id, priority").order("due_at", { ascending: true }).then(({ data }) => {
          if (data) setTasks(data);
        });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const filtered = tasks.filter((t) => {
    if (statusFilter && t.status !== statusFilter) return false;
    if (clientFilter && t.client_id !== clientFilter) return false;
    return true;
  });

  const statuses = ["todo", "in_progress", "review", "approved", "changes_requested"];
  const clients = Array.from(new Set(tasks.map((t) => t.client_id).filter(Boolean)));
  const dueRemaining = (value: string | null) => {
    if (!value) return "No deadline";
    const due = new Date(value);
    const now = new Date();
    if (due <= now) return `Overdue ${formatDistanceToNow(due, { addSuffix: true })}`;
    return formatDistanceToNow(due, { addSuffix: true });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-white text-sm">
          <option value="">All statuses</option>
          {statuses.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
        </select>
        {isAdminOrSupervisor && (
          <select value={clientFilter} onChange={(e) => setClientFilter(e.target.value)} className="rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-white text-sm">
            <option value="">All clients</option>
            {clients.map((id) => <option key={id} value={id}>{clientMap[id] ?? id}</option>)}
          </select>
        )}
      </div>
      <div className="glass-card overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-go-glass-border">
              <th className="px-4 py-3 text-sm font-medium text-slate-400">Task</th>
              <th className="px-4 py-3 text-sm font-medium text-slate-400">Client</th>
              {isAdminOrSupervisor && <th className="px-4 py-3 text-sm font-medium text-slate-400">Assignee</th>}
              <th className="px-4 py-3 text-sm font-medium text-slate-400">Status</th>
              <th className="px-4 py-3 text-sm font-medium text-slate-400">Due</th>
              <th className="px-4 py-3 text-sm font-medium text-slate-400">Remaining</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t) => (
              <tr key={t.id} className="border-b border-white/5">
                <td className="px-4 py-3">
                  <Link href={`/app/task/${t.id}`} className="text-accent-second hover:text-accent transition duration-200">{t.type}</Link>
                </td>
                <td className="px-4 py-3 text-slate-400">{clientMap[t.client_id] ?? "—"}</td>
                {isAdminOrSupervisor && <td className="px-4 py-3 text-slate-400">{t.assignee_id ? profileMap[t.assignee_id] ?? "—" : "Unassigned"}</td>}
                <td className="px-4 py-3"><span className={`status-${t.status} rounded-full px-2 py-0.5 text-xs`}>{t.status}</span></td>
                <td className="px-4 py-3 text-slate-500 text-sm">{t.due_at ? new Date(t.due_at).toLocaleDateString() : "—"}</td>
                <td className="px-4 py-3 text-slate-500 text-sm">{dueRemaining(t.due_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="p-8 text-center text-slate-500">No tasks</div>}
      </div>
    </div>
  );
}
