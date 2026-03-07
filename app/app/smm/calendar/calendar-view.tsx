"use client";

import { useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { EventContentArg } from "@fullcalendar/core";

interface ClientRow {
  id: string;
  name: string;
}

interface PostRow {
  id: string;
  client_id: string;
  platform: string;
  type: string;
  publish_at: string;
  caption: string | null;
  status: string;
}

export function CalendarView({
  initialClients,
  initialPosts,
}: {
  initialClients: ClientRow[];
  initialPosts: PostRow[];
}) {
  const [posts, setPosts] = useState(initialPosts);
  const [clientFilter, setClientFilter] = useState<string>("");
  const supabase = createClient();

  const events = useMemo(
    () =>
      posts
        .filter((p) => !clientFilter || p.client_id === clientFilter)
        .map((p) => ({
          id: p.id,
          title: `${p.platform} – ${p.type}`,
          start: p.publish_at,
          extendedProps: { post: p },
        })),
    [posts, clientFilter]
  );

  async function handleDrop(arg: { event: { id: string; start: Date | null }; revert: () => void }) {
    const start = arg.event.start;
    if (!start) {
      arg.revert();
      return;
    }
    const dateStr = start.toISOString();
    await supabase.from("posts").update({ publish_at: dateStr }).eq("id", arg.event.id);
    setPosts((prev) => prev.map((p) => (p.id === arg.event.id ? { ...p, publish_at: dateStr } : p)));
    const { data: linkedTasks } = await supabase.from("tasks").select("id, type").eq("post_id", arg.event.id);
    const { data: templates } = await supabase.from("task_templates").select("post_type, rules_json");
    const publishDate = new Date(dateStr);
    for (const task of linkedTasks ?? []) {
      const template = (templates ?? []).find((t) => (t.rules_json as { tasks?: { type: string; buffer_days_before?: number }[] })?.tasks?.some((r: { type: string }) => r.type === task.type));
      const tasksConfig = (template?.rules_json as { tasks?: { type: string; buffer_days_before?: number }[] })?.tasks ?? [];
      const rule = tasksConfig.find((r: { type: string }) => r.type === task.type);
      const bufferDays = rule?.buffer_days_before ?? 0;
      const due = new Date(publishDate);
      due.setDate(due.getDate() - bufferDays);
      await supabase.from("tasks").update({ due_at: due.toISOString() }).eq("id", task.id);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 items-center">
        <label className="text-sm text-slate-400">Client:</label>
        <select
          value={clientFilter}
          onChange={(e) => setClientFilter(e.target.value)}
          className="rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-white text-sm"
        >
          <option value="">All</option>
          {initialClients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div className="glass-card p-4">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          events={events}
          editable
          droppable
          eventDrop={handleDrop}
          eventContent={(arg: EventContentArg) => (
            <div className="text-xs truncate px-1" title={arg.event.extendedProps.post?.caption ?? ""}>
              {arg.event.title}
            </div>
          )}
          headerToolbar={{ left: "prev,next today", center: "title", right: "dayGridMonth,timeGridWeek" }}
          height="auto"
        />
      </div>
      <div className="glass-card p-4">
        <h3 className="font-medium text-white mb-2">Create post</h3>
        <CreatePostForm clients={initialClients} onCreated={(p) => setPosts((prev) => [...prev, p])} />
      </div>
    </div>
  );
}

function CreatePostForm({
  clients,
  onCreated,
}: {
  clients: ClientRow[];
  onCreated: (post: PostRow) => void;
}) {
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    setLoading(true);
    const { data, error } = await supabase
      .from("posts")
      .insert({
        client_id: fd.get("client_id"),
        platform: fd.get("platform"),
        type: fd.get("type"),
        publish_at: fd.get("publish_at"),
        caption: fd.get("caption") || null,
        status: "draft",
      })
      .select()
      .single();
    if (!error && data) {
      const post = data as PostRow;
      const publishAt = new Date(post.publish_at);
      const { data: templates } = await supabase.from("task_templates").select("post_type, rules_json");
      const template = (templates ?? []).find((t) => t.post_type === post.type) ?? (templates ?? [])[0];
      const tasksConfig = (template?.rules_json as { tasks?: { type: string; role?: string; buffer_days_before?: number }[] })?.tasks ?? [];
      for (const rule of tasksConfig) {
        const due = new Date(publishAt);
        due.setDate(due.getDate() - (rule.buffer_days_before ?? 0));
        await supabase.from("tasks").insert({
          client_id: post.client_id,
          post_id: post.id,
          type: rule.type,
          due_at: due.toISOString(),
          status: "todo",
        });
      }
      onCreated(post);
      setShow(false);
      form.reset();
    }
    setLoading(false);
  }

  if (!show) {
    return (
      <button
        type="button"
        onClick={() => setShow(true)}
        className="rounded-lg bg-accent px-4 py-2 text-sm text-white hover:bg-accent-second transition duration-200"
      >
        New post
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 max-w-md">
      <div>
        <label className="block text-sm text-slate-400 mb-1">Client</label>
        <select name="client_id" required className="w-full rounded bg-white/5 border border-white/10 px-3 py-2 text-white text-sm">
          {clients.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-sm text-slate-400 mb-1">Platform</label>
          <input name="platform" required placeholder="Instagram" className="w-full rounded bg-white/5 border border-white/10 px-3 py-2 text-white text-sm" />
        </div>
        <div>
          <label className="block text-sm text-slate-400 mb-1">Type</label>
          <input name="type" required placeholder="Post" className="w-full rounded bg-white/5 border border-white/10 px-3 py-2 text-white text-sm" />
        </div>
      </div>
      <div>
        <label className="block text-sm text-slate-400 mb-1">Publish at</label>
        <input name="publish_at" type="datetime-local" required className="w-full rounded bg-white/5 border border-white/10 px-3 py-2 text-white text-sm" />
      </div>
      <div>
        <label className="block text-sm text-slate-400 mb-1">Caption</label>
        <textarea name="caption" rows={2} className="w-full rounded bg-white/5 border border-white/10 px-3 py-2 text-white text-sm" />
      </div>
      <div className="flex gap-2">
        <button type="submit" disabled={loading} className="rounded-lg bg-accent px-4 py-2 text-sm text-white hover:bg-accent-second disabled:opacity-50 transition duration-200">Create</button>
        <button type="button" onClick={() => setShow(false)} className="rounded-lg bg-white/10 px-4 py-2 text-sm text-slate-300">Cancel</button>
      </div>
    </form>
  );
}
