"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

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
  const [priority, setPriority] = useState(0);
  const [created, setCreated] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  async function handleCreate() {
    if (!clientId || !type || !dueAt) return;
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    // datetime-local has no timezone. Convert to ISO to preserve user's intended local time.
    const dueAtIso = new Date(dueAt).toISOString();
    const { data: task, error } = await supabase
      .from("tasks")
      .insert({
        client_id: clientId,
        post_id: null,
        type,
        title: type,
        assignee_id: assigneeId || null,
        due_at: dueAtIso,
        priority,
        assigned_by: user?.id ?? null,
      })
      .select("id")
      .single();
    setLoading(false);
    if (error) {
      console.error(error);
      return;
    }
    if (task) {
      await supabase.from("activity_logs").insert({
        entity_type: "task",
        entity_id: task.id,
        action: "created",
        actor_id: user?.id ?? null,
        meta_json: { type, client_id: clientId },
      });
      setCreated(task.id);
    }
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
              <input type="number" value={priority} onChange={(e) => setPriority(Number(e.target.value))} className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-white text-sm" />
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
