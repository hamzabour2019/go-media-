"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

interface TaskRow {
  id: string;
  type: string;
  status: string;
  due_at: string | null;
  client_id: string;
  output_json?: Record<string, unknown> | null;
  fields_json?: Record<string, unknown> | null;
}

export function ApprovalList({
  initialTasks,
  clientMap,
  showPreview,
}: {
  initialTasks: TaskRow[];
  clientMap: Record<string, string>;
  showPreview?: boolean;
}) {
  const [tasks, setTasks] = useState(initialTasks);
  const supabase = createClient();

  useEffect(() => {
    const channel = supabase
      .channel("tasks-review")
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks", filter: "status=eq.review" }, () => {
        supabase.from("tasks").select("id, type, status, due_at, client_id, output_json, fields_json").eq("status", "review").order("due_at", { ascending: true }).then(({ data }) => setTasks(data ?? []));
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="glass-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-go-glass-border">
              <th className="px-4 py-3 text-sm font-medium text-slate-400">Task</th>
              <th className="px-4 py-3 text-sm font-medium text-slate-400">Client</th>
              <th className="px-4 py-3 text-sm font-medium text-slate-400">Due</th>
              {showPreview && <th className="px-4 py-3 text-sm font-medium text-slate-400">Output preview</th>}
              <th className="px-4 py-3 text-sm font-medium text-slate-400">Action</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((t) => (
              <tr key={t.id} className="border-b border-white/5">
                <td className="px-4 py-3 text-white">{t.type}</td>
                <td className="px-4 py-3 text-slate-400">{clientMap[t.client_id] ?? "—"}</td>
                <td className="px-4 py-3 text-slate-400">{t.due_at ? new Date(t.due_at).toLocaleDateString() : "—"}</td>
                {showPreview && (
                  <td className="px-4 py-3 text-slate-500 text-xs max-w-[200px] truncate">
                    {t.output_json && typeof t.output_json === "object"
                      ? (t.output_json.url ? String(t.output_json.url) : t.output_json.file_url ? String(t.output_json.file_url) : JSON.stringify(t.output_json).slice(0, 80) + "...")
                      : "—"}
                  </td>
                )}
                <td className="px-4 py-3">
                  <Link href={`/app/task/${t.id}`} className="text-accent-second hover:text-accent transition duration-200 text-sm">
                    Review
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {tasks.length === 0 && (
        <div className="p-8 text-center text-slate-500">No tasks in review.</div>
      )}
    </div>
  );
}
