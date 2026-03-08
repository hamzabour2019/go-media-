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
}

export function TaskListDesigner({ initialTasks, userId }: { initialTasks: TaskRow[]; userId?: string }) {
  const [tasks, setTasks] = useState(initialTasks);
  const [filter, setFilter] = useState<string>("");
  const supabase = createClient();

  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel("designer-tasks")
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, () => {
        supabase.from("tasks").select("id, type, status, due_at, client_id").eq("assignee_id", userId).order("due_at", { ascending: true }).then(({ data }) => {
          if (data) setTasks(data);
        });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const filtered = filter ? tasks.filter((t) => t.status === filter) : tasks;
  const dueRemaining = (value: string | null, status: string) => {
    if (["approved", "done", "completed"].includes(status)) return "Completed";
    if (!value) return "No deadline";
    const due = new Date(value);
    const now = new Date();
    if (due <= now) return `Overdue ${formatDistanceToNow(due, { addSuffix: true })}`;
    return formatDistanceToNow(due, { addSuffix: true });
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setFilter("")}
          className={`rounded-lg px-3 py-1.5 text-sm transition duration-200 ${!filter ? "bg-accent text-white" : "bg-white/5 text-slate-400"}`}
        >
          All
        </button>
        {["todo", "in_progress", "review", "approved", "changes_requested"].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setFilter(s)}
            className={`rounded-lg px-3 py-1.5 text-sm transition duration-200 ${filter === s ? "bg-accent text-white" : "bg-white/5 text-slate-400"}`}
          >
            {s.replace("_", " ")}
          </button>
        ))}
      </div>
      <div className="glass-card overflow-hidden">
        <div className="divide-y divide-white/5">
          {filtered.map((t) => (
            <Link
              key={t.id}
              href={`/app/task/${t.id}`}
              className="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-3 items-center px-4 py-3 hover:bg-white/5 transition"
            >
              <span className="text-white">{t.type}</span>
              <span className={`inline-flex min-h-[26px] items-center justify-center rounded-full px-3 py-1 text-sm status-${t.status}`}>{t.status}</span>
              <div className="text-sm text-slate-500">
                <p>{t.due_at ? new Date(t.due_at).toLocaleString() : "—"}</p>
                <p className="text-xs">{dueRemaining(t.due_at, t.status)}</p>
              </div>
            </Link>
          ))}
        </div>
        {filtered.length === 0 && (
          <div className="p-8 text-center text-slate-500">No tasks</div>
        )}
      </div>
    </div>
  );
}
