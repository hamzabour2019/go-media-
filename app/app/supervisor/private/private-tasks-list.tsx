"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { PrivateTask } from "@/lib/types/database";

export function PrivateTasksList({ initialTasks }: { initialTasks: PrivateTask[] }) {
  const [tasks, setTasks] = useState(initialTasks);
  const [showForm, setShowForm] = useState(false);
  const supabase = createClient();

  async function addTask(title: string, notes: string) {
    const { data } = await supabase.auth.getUser();
    const user = data?.user;
    if (!user) return;
    const { data: newTask } = await supabase
      .from("private_tasks")
      .insert({ owner_id: user.id, title, notes: notes || null, status: "todo" })
      .select()
      .single();
    if (newTask) setTasks((prev) => [...prev, newTask as PrivateTask]);
    setShowForm(false);
  }

  async function updateStatus(id: string, status: string) {
    await supabase.from("private_tasks").update({ status }).eq("id", id);
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
  }

  async function deleteTask(id: string) {
    await supabase.from("private_tasks").delete().eq("id", id);
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={() => setShowForm(true)}
        className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-second transition duration-200"
      >
        New private task
      </button>
      {showForm && (
        <AddPrivateTaskForm
          onAdd={addTask}
          onCancel={() => setShowForm(false)}
        />
      )}
      <div className="glass-card divide-y divide-white/5">
        {tasks.map((t) => (
          <div key={t.id} className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="text-white font-medium">{t.title}</p>
              {t.notes && <p className="text-slate-500 text-sm">{t.notes}</p>}
            </div>
            <div className="flex items-center gap-2">
              <select
                value={t.status}
                onChange={(e) => updateStatus(t.id, e.target.value)}
                className="rounded bg-white/10 border border-white/10 px-2 py-1 text-sm text-white"
              >
                <option value="todo">Todo</option>
                <option value="in_progress">In progress</option>
                <option value="done">Done</option>
              </select>
              <button
                type="button"
                onClick={() => deleteTask(t.id)}
                className="text-rose-400 hover:text-rose-300 text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AddPrivateTaskForm({
  onAdd,
  onCancel,
}: {
  onAdd: (title: string, notes: string) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");

  return (
    <div className="glass-card p-4 max-w-md">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title"
        className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-white mb-2"
      />
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Notes"
        rows={2}
        className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-white mb-2"
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onAdd(title, notes)}
          className="rounded-lg bg-accent px-4 py-2 text-sm text-white hover:bg-accent-second transition duration-200"
        >
          Add
        </button>
        <button type="button" onClick={onCancel} className="rounded-lg bg-white/10 px-4 py-2 text-sm text-slate-300">
          Cancel
        </button>
      </div>
    </div>
  );
}
