"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createTaskAction } from "@/app/actions/tasks";

interface Client { id: string; name: string }
interface Profile { id: string; name: string; role: string }

export function TaskControlCenter({
  clients,
  profiles,
}: {
  clients: Client[];
  profiles: Profile[];
}) {
  const [clientId, setClientId] = useState("");
  const [type, setType] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [priority, setPriority] = useState(1);
  const [created, setCreated] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleCreate() {
    if (!clientId || !type || !dueAt) return;
    setLoading(true);
    const result = await createTaskAction({
      clientId,
      type,
      assigneeId,
      dueAt: new Date(dueAt).toISOString(),
      priority,
      postId: "",
    });
    setLoading(false);
    if (!result.ok) {
      console.error(result.error);
      return;
    }
    setCreated(result.data.id);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="glass-card p-6 max-w-xl">
        <h2 className="font-semibold text-white mb-4">Create task</h2>
        <div className="grid gap-3">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Client *</label>
            <select value={clientId} onChange={(e) => setClientId(e.target.value)} className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-white text-sm">
              <option value="">Select</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Task type *</label>
            <input value={type} onChange={(e) => setType(e.target.value)} placeholder="e.g. design, edit" className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-white text-sm" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Assignee</label>
            <select value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)} className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-white text-sm">
              <option value="">Unassigned</option>
              {profiles.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.role})</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Deadline *</label>
              <input type="datetime-local" value={dueAt} onChange={(e) => setDueAt(e.target.value)} className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-white text-sm" />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Priority</label>
              <select value={priority} onChange={(e) => setPriority(Number(e.target.value))} className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-white text-sm">
                {Array.from({ length: 10 }, (_, index) => index + 1).map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button type="button" onClick={handleCreate} disabled={loading} className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-second disabled:opacity-50 transition duration-200">
            Create task
          </button>
          {!dueAt && <p className="text-amber-300 text-xs">Deadline is required.</p>}
          {created && (
            <p className="text-emerald-400 text-sm">Created. <Link href={`/app/task/${created}`} className="underline">Open task</Link></p>
          )}
        </div>
      </div>
    </div>
  );
}
