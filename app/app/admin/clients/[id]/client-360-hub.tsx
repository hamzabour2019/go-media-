"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { formatDistanceToNow } from "date-fns";
import { Building2, Calendar, Download, FileText, Filter, Plus, Search, Upload } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { KpiCard } from "@/components/ui/kpi-card";
import { StatusChip } from "@/components/ui/status-chip";
import { Drawer } from "@/components/ui/drawer";
import { BrandKitForm } from "./brand-kit-form";

type ClientRow = {
  id: string;
  name: string;
  status?: string | null;
  email?: string | null;
  phone?: string | null;
  created_by?: string | null;
  created_at: string;
};

type BrandKit = {
  logo_url?: string | null;
  guidelines_url?: string | null;
  colors_json?: Record<string, string> | null;
  fonts_json?: Record<string, string> | null;
} | null;

type TaskRow = {
  id: string;
  type: string;
  title?: string | null;
  description?: string | null;
  status: string;
  assignee_id: string | null;
  assigned_by?: string | null;
  due_at: string | null;
  priority: number;
  created_at: string;
  start_at?: string | null;
  post_id?: string | null;
};

type PostRow = {
  id: string;
  platform: string;
  type: string;
  publish_at: string;
  status: string;
  caption?: string | null;
  hashtags?: string[] | null;
  media_url?: string | null;
  created_at?: string;
};

type NoteRow = {
  id: string;
  author_id: string;
  body: string;
  created_at: string;
};

type ApprovalRow = {
  id: string;
  task_id: string;
  status: string;
  created_at: string;
};

type ActivityRow = {
  id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  actor_id: string | null;
  created_at: string;
};

interface Client360HubProps {
  client: ClientRow;
  brandKit: BrandKit;
  tasks: TaskRow[];
  posts: PostRow[];
  notes: NoteRow[];
  approvals: ApprovalRow[];
  activities: ActivityRow[];
  profiles: { id: string; name: string; role?: string }[];
  canManageNotes: boolean;
}

type TabKey = "overview" | "posts" | "tasks" | "assets" | "notes";

export function Client360Hub({
  client,
  brandKit,
  tasks: initialTasks,
  posts: initialPosts,
  notes: initialNotes,
  approvals,
  activities,
  profiles,
  canManageNotes,
}: Client360HubProps) {
  const supabase = createClient();
  const router = useRouter();
  const [tab, setTab] = useState<TabKey>("overview");
  const [globalSearch, setGlobalSearch] = useState("");
  const [tasks, setTasks] = useState(initialTasks);
  const [posts, setPosts] = useState(initialPosts);
  const [notes, setNotes] = useState(initialNotes);

  const [taskStatusFilter, setTaskStatusFilter] = useState("");
  const [assigneeFilter, setAssigneeFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [onlyOverdue, setOnlyOverdue] = useState(false);

  const [postStatusFilter, setPostStatusFilter] = useState("");
  const [platformFilter, setPlatformFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const [taskDrawerId, setTaskDrawerId] = useState<string | null>(null);
  const [postDrawerId, setPostDrawerId] = useState<string | null>(null);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [showBrandKit, setShowBrandKit] = useState(false);
  const [showExport, setShowExport] = useState(false);

  const [newTaskType, setNewTaskType] = useState("");
  const [newTaskAssigneeId, setNewTaskAssigneeId] = useState("");
  const [newTaskDueAt, setNewTaskDueAt] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState(1);

  const [newPostPlatform, setNewPostPlatform] = useState("instagram");
  const [newPostType, setNewPostType] = useState("post");
  const [newPostPublishAt, setNewPostPublishAt] = useState("");
  const [newPostCaption, setNewPostCaption] = useState("");
  const [newPostStatus, setNewPostStatus] = useState("scheduled");

  const [newNoteBody, setNewNoteBody] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteBody, setEditingNoteBody] = useState("");
  const [noteBusyId, setNoteBusyId] = useState<string | null>(null);
  const [headerSlot, setHeaderSlot] = useState<HTMLElement | null>(null);

  const profileMap = useMemo(
    () => Object.fromEntries(profiles.map((p) => [p.id, p.name])),
    [profiles]
  );

  useEffect(() => {
    setHeaderSlot(document.getElementById("app-page-sticky-slot"));
    return () => {
      const slot = document.getElementById("app-page-sticky-slot");
      if (slot) slot.innerHTML = "";
    };
  }, []);

  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - 7);
  const monthStart = new Date(now);
  monthStart.setMonth(now.getMonth() - 1);

  const postsThisWeek = posts.filter((p) => new Date(p.publish_at) >= weekStart).length;
  const postsThisMonth = posts.filter((p) => new Date(p.publish_at) >= monthStart).length;
  const overdueCount = tasks.filter(
    (t) =>
      t.due_at &&
      new Date(t.due_at) < now &&
      ["todo", "in_progress", "review", "changes_requested"].includes(t.status)
  ).length;
  const inProgressCount = tasks.filter((t) => t.status === "in_progress").length;
  const inReviewCount = tasks.filter((t) => t.status === "review").length;

  const avgCompletionHours = useMemo(() => {
    const byTaskApproval = new Map<string, string>();
    approvals
      .filter((a) => a.status === "approved")
      .forEach((a) => {
        if (!byTaskApproval.has(a.task_id)) byTaskApproval.set(a.task_id, a.created_at);
      });
    const durations = tasks
      .filter((t) => t.status === "approved" && byTaskApproval.has(t.id))
      .map((t) => {
        const end = new Date(byTaskApproval.get(t.id)!);
        const start = new Date(t.start_at || t.created_at);
        return (end.getTime() - start.getTime()) / 36e5;
      })
      .filter((h) => h >= 0);
    if (!durations.length) return null;
    return durations.reduce((a, b) => a + b, 0) / durations.length;
  }, [tasks, approvals]);

  const approvalSlaHours = useMemo(() => {
    const reviewEvents = activities.filter((a) => /review/i.test(a.action));
    const approvalsMap = new Map<string, string>();
    approvals
      .filter((a) => a.status === "approved")
      .forEach((a) => {
        if (!approvalsMap.has(a.task_id)) approvalsMap.set(a.task_id, a.created_at);
      });
    const durations = reviewEvents
      .map((event) => {
        const approvedAt = approvalsMap.get(event.entity_id);
        if (!approvedAt) return null;
        const start = new Date(event.created_at).getTime();
        const end = new Date(approvedAt).getTime();
        if (end < start) return null;
        return (end - start) / 36e5;
      })
      .filter((v): v is number => typeof v === "number");
    if (!durations.length) return null;
    return durations.reduce((a, b) => a + b, 0) / durations.length;
  }, [activities, approvals]);

  const searchText = globalSearch.trim().toLowerCase();
  const searchedTasks = useMemo(
    () =>
      tasks.filter((t) => {
        if (!searchText) return true;
        return (
          `${t.title || t.type} ${t.description || ""}`.toLowerCase().includes(searchText) ||
          (t.assignee_id ? (profileMap[t.assignee_id] || "").toLowerCase().includes(searchText) : false)
        );
      }),
    [tasks, searchText, profileMap]
  );
  const filteredTasks = searchedTasks.filter((t) => {
    if (taskStatusFilter && t.status !== taskStatusFilter) return false;
    if (assigneeFilter && t.assignee_id !== assigneeFilter) return false;
    if (priorityFilter && String(t.priority) !== priorityFilter) return false;
    if (onlyOverdue) {
      if (!t.due_at || new Date(t.due_at) >= now) return false;
    }
    return true;
  });

  const searchedPosts = useMemo(
    () =>
      posts.filter((p) => {
        if (!searchText) return true;
        return `${p.platform} ${p.type} ${p.caption || ""}`.toLowerCase().includes(searchText);
      }),
    [posts, searchText]
  );
  const filteredPosts = searchedPosts.filter((p) => {
    if (postStatusFilter && p.status !== postStatusFilter) return false;
    if (platformFilter && p.platform !== platformFilter) return false;
    if (typeFilter && p.type !== typeFilter) return false;
    return true;
  });

  const filteredNotes = notes.filter((n) =>
    !searchText
      ? true
      : `${n.body} ${profileMap[n.author_id] ?? ""}`.toLowerCase().includes(searchText)
  );

  const nextDeadlinesTasks = [...tasks]
    .filter((t) => t.due_at && new Date(t.due_at) > now)
    .sort((a, b) => new Date(a.due_at!).getTime() - new Date(b.due_at!).getTime())
    .slice(0, 5);
  const nextDeadlinesPosts = [...posts]
    .filter((p) => new Date(p.publish_at) > now)
    .sort((a, b) => new Date(a.publish_at).getTime() - new Date(b.publish_at).getTime())
    .slice(0, 5);

  const recentActivity = [...activities]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 10);

  const selectedTask = taskDrawerId ? tasks.find((t) => t.id === taskDrawerId) ?? null : null;
  const selectedPost = postDrawerId ? posts.find((p) => p.id === postDrawerId) ?? null : null;

  function humanRemaining(value: string | null, status?: string) {
    if (status && ["approved", "done", "completed"].includes(status)) return "Completed";
    if (!value) return "No deadline";
    const due = new Date(value);
    if (due <= new Date()) return `Overdue ${formatDistanceToNow(due, { addSuffix: true })}`;
    return formatDistanceToNow(due, { addSuffix: true });
  }

  async function createPost() {
    if (!newPostPublishAt) return;
    const publishAt = new Date(newPostPublishAt).toISOString();
    const { data, error } = await supabase
      .from("posts")
      .insert({
        client_id: client.id,
        platform: newPostPlatform,
        type: newPostType,
        publish_at: publishAt,
        caption: newPostCaption || null,
        status: newPostStatus,
      })
      .select("id, platform, type, publish_at, status, caption, hashtags, media_url, created_at")
      .single();
    if (!error && data) {
      setPosts((prev) => [data as PostRow, ...prev]);
      setShowCreatePost(false);
      setNewPostCaption("");
      setNewPostPublishAt("");
      router.refresh();
    }
  }

  async function createTask() {
    if (!newTaskType || !newTaskDueAt) return;
    const { data: authData } = await supabase.auth.getUser();
    const dueAtIso = new Date(newTaskDueAt).toISOString();
    const { data, error } = await supabase
      .from("tasks")
      .insert({
        client_id: client.id,
        type: newTaskType,
        title: newTaskType,
        assignee_id: newTaskAssigneeId || null,
        due_at: dueAtIso,
        priority: newTaskPriority,
        assigned_by: authData.user?.id ?? null,
      })
      .select("id, type, title, description, status, assignee_id, assigned_by, due_at, priority, created_at, start_at, post_id")
      .single();
    if (!error && data) {
      setTasks((prev) => [data as TaskRow, ...prev]);
      setShowCreateTask(false);
      setNewTaskType("");
      setNewTaskDueAt("");
      setNewTaskAssigneeId("");
      setNewTaskPriority(1);
      router.refresh();
    }
  }

  async function addNote() {
    if (!newNoteBody.trim()) return;
    const { data: authData } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("client_notes")
      .insert({ client_id: client.id, author_id: authData.user?.id, body: newNoteBody.trim() })
      .select("id, author_id, body, created_at")
      .single();
    if (!error && data) {
      setNotes((prev) => [data as NoteRow, ...prev]);
      setNewNoteBody("");
      router.refresh();
    }
  }

  function startEditNote(note: NoteRow) {
    setEditingNoteId(note.id);
    setEditingNoteBody(note.body);
  }

  function cancelEditNote() {
    setEditingNoteId(null);
    setEditingNoteBody("");
  }

  async function saveNote(noteId: string) {
    if (!editingNoteBody.trim()) return;
    setNoteBusyId(noteId);
    const { error } = await supabase.from("client_notes").update({ body: editingNoteBody.trim() }).eq("id", noteId);
    setNoteBusyId(null);
    if (error) {
      console.error(error);
      return;
    }
    setNotes((prev) => prev.map((n) => (n.id === noteId ? { ...n, body: editingNoteBody.trim() } : n)));
    cancelEditNote();
    router.refresh();
  }

  async function deleteNote(noteId: string) {
    const confirmed = window.confirm("Delete this note?");
    if (!confirmed) return;
    setNoteBusyId(noteId);
    const { error } = await supabase.from("client_notes").delete().eq("id", noteId);
    setNoteBusyId(null);
    if (error) {
      console.error(error);
      return;
    }
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
    if (editingNoteId === noteId) cancelEditNote();
    router.refresh();
  }

  async function updateTaskStatus(taskId: string, status: string) {
    const { error } = await supabase.from("tasks").update({ status }).eq("id", taskId);
    if (!error) {
      setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status } : t)));
      router.refresh();
    }
  }

  async function reassignTask(taskId: string, assigneeId: string) {
    const { error } = await supabase
      .from("tasks")
      .update({ assignee_id: assigneeId || null })
      .eq("id", taskId);
    if (!error) {
      setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, assignee_id: assigneeId || null } : t)));
      router.refresh();
    }
  }

  async function duplicatePost(post: PostRow) {
    const { data, error } = await supabase
      .from("posts")
      .insert({
        client_id: client.id,
        platform: post.platform,
        type: post.type,
        publish_at: new Date(post.publish_at).toISOString(),
        caption: post.caption || null,
        status: "draft",
      })
      .select("id, platform, type, publish_at, status, caption, hashtags, media_url, created_at")
      .single();
    if (!error && data) {
      setPosts((prev) => [data as PostRow, ...prev]);
      router.refresh();
    }
  }

  function exportCsv(kind: "tasks" | "posts") {
    const rows =
      kind === "tasks"
        ? filteredTasks.map((t) => ({
            id: t.id,
            title: t.title || t.type,
            status: t.status,
            assignee: t.assignee_id ? profileMap[t.assignee_id] ?? t.assignee_id : "Unassigned",
            priority: t.priority,
            created_at: t.created_at,
            deadline: t.due_at ?? "",
          }))
        : filteredPosts.map((p) => ({
            id: p.id,
            platform: p.platform,
            type: p.type,
            status: p.status,
            publish_at: p.publish_at,
            caption: p.caption || "",
          }));
    if (!rows.length) return;
    const headers = Object.keys(rows[0]);
    const csv = [
      headers.join(","),
      ...rows.map((r) => headers.map((h) => `"${String(r[h as keyof typeof r]).replace(/"/g, "\"\"")}"`).join(",")),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${client.name.replace(/\s+/g, "_")}_${kind}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const hubHeader = (
    <header className="sticky top-16 z-10 glass-card p-4 md:p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="h-14 w-14 rounded-xl bg-white/10 overflow-hidden flex items-center justify-center">
              {brandKit?.logo_url ? (
                <img src={brandKit.logo_url} alt={client.name} className="h-full w-full object-cover" />
              ) : (
                <span className="text-white font-semibold text-lg">{client.name.slice(0, 2).toUpperCase()}</span>
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{client.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <StatusChip status={client.status ?? "active"} />
                <span className="text-sm text-slate-400">
                  Owner: {client.created_by ? profileMap[client.created_by] ?? "—" : "—"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setShowCreatePost(true)} className="btn-primary inline-flex items-center gap-2">
              <Plus className="h-4 w-4" /> New Post
            </button>
            <button type="button" onClick={() => setShowCreateTask(true)} className="btn-primary inline-flex items-center gap-2">
              <Plus className="h-4 w-4" /> New Task
            </button>
            <button type="button" onClick={() => setShowBrandKit(true)} className="rounded-lg border border-white/15 px-4 py-2 text-sm text-white hover:bg-white/5 inline-flex items-center gap-2">
              <Upload className="h-4 w-4" /> Update Brand Kit
            </button>
            <div className="relative">
              <button type="button" onClick={() => setShowExport((v) => !v)} className="rounded-lg border border-white/15 px-4 py-2 text-sm text-white hover:bg-white/5 inline-flex items-center gap-2">
                <Download className="h-4 w-4" /> Export
              </button>
              {showExport && (
                <div className="absolute right-0 mt-2 w-44 rounded-lg border border-white/10 bg-[#0f172a] shadow-lg p-1 z-20">
                  <button type="button" onClick={() => exportCsv("tasks")} className="w-full text-left px-3 py-2 rounded text-sm text-white hover:bg-white/10">Export Tasks CSV</button>
                  <button type="button" onClick={() => exportCsv("posts")} className="w-full text-left px-3 py-2 rounded text-sm text-white hover:bg-white/10">Export Posts CSV</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
  );

  return (
    <div className="space-y-6">
      {headerSlot ? createPortal(hubHeader, headerSlot) : hubHeader}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KpiCard title="Posts (7d)" value={postsThisWeek} icon={<Calendar className="h-5 w-5" />} />
        <KpiCard title="Posts (30d)" value={postsThisMonth} icon={<Calendar className="h-5 w-5" />} />
        <KpiCard title="Overdue tasks" value={overdueCount} icon={<FileText className="h-5 w-5" />} variant="danger" />
        <KpiCard title="In progress" value={inProgressCount} icon={<FileText className="h-5 w-5" />} variant="warning" />
        <KpiCard title="In review" value={inReviewCount} icon={<FileText className="h-5 w-5" />} variant="warning" />
        <KpiCard
          title="Avg completion / SLA"
          value={`${avgCompletionHours ? `${avgCompletionHours.toFixed(1)}h` : "Not configured"} / ${approvalSlaHours ? `${approvalSlaHours.toFixed(1)}h` : "Not configured"}`}
          icon={<Building2 className="h-5 w-5" />}
          subtitle="Completion time / approval SLA"
        />
      </div>

      <div className="glass-card p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-2">
            {([
              ["overview", "Overview"],
              ["posts", "Calendar / Posts"],
              ["tasks", "Tasks (Production)"],
              ["assets", "Assets / Brand Kit"],
              ["notes", "Notes"],
            ] as [TabKey, string][]).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={`rounded-lg px-3 py-2 text-sm transition ${tab === key ? "bg-accent text-white" : "bg-white/5 text-slate-300 hover:bg-white/10"}`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="relative w-full md:w-96">
            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              placeholder="Search posts, tasks, notes..."
              className="w-full rounded-lg bg-white/5 border border-white/10 pl-9 pr-3 py-2 text-sm text-white"
            />
          </div>
        </div>
      </div>

      {tab === "overview" && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div className="glass-card p-5">
            <h3 className="text-lg font-semibold text-white mb-3">Recent activity</h3>
            <ul className="space-y-2">
              {recentActivity.map((a) => (
                <li key={a.id} className="text-sm text-white/90 border-b border-white/5 pb-2">
                  <span className="font-medium">{a.action}</span>{" "}
                  <span className="text-slate-500">by {a.actor_id ? profileMap[a.actor_id] ?? a.actor_id : "System"}</span>
                  <div className="text-xs text-slate-500 mt-1">{new Date(a.created_at).toLocaleString()}</div>
                </li>
              ))}
              {recentActivity.length === 0 && <li className="text-sm text-slate-500">No recent activity</li>}
            </ul>
          </div>
          <div className="glass-card p-5">
            <h3 className="text-lg font-semibold text-white mb-3">Next deadlines</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-accent-second font-medium mb-1">Tasks</p>
                {nextDeadlinesTasks.map((t) => (
                  <button key={t.id} type="button" onClick={() => setTaskDrawerId(t.id)} className="block w-full text-left text-sm py-1 text-white hover:text-accent-second">
                    {t.title || t.type} · {new Date(t.due_at!).toLocaleString()} · {humanRemaining(t.due_at, t.status)}
                  </button>
                ))}
                {nextDeadlinesTasks.length === 0 && <p className="text-sm text-slate-500">No upcoming task deadlines</p>}
              </div>
              <div>
                <p className="text-sm text-accent-second font-medium mb-1">Posts</p>
                {nextDeadlinesPosts.map((p) => (
                  <button key={p.id} type="button" onClick={() => setPostDrawerId(p.id)} className="block w-full text-left text-sm py-1 text-white hover:text-accent-second">
                    {p.platform} - {p.type} · {new Date(p.publish_at).toLocaleString()}
                  </button>
                ))}
                {nextDeadlinesPosts.length === 0 && <p className="text-sm text-slate-500">No scheduled posts</p>}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "posts" && (
        <div className="glass-card p-5 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <select value={postStatusFilter} onChange={(e) => setPostStatusFilter(e.target.value)} className="rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white">
              <option value="">All statuses</option>
              {["draft", "scheduled", "published", "approved"].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={platformFilter} onChange={(e) => setPlatformFilter(e.target.value)} className="rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white">
              <option value="">All platforms</option>
              {Array.from(new Set(posts.map((p) => p.platform))).map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white">
              <option value="">All types</option>
              {Array.from(new Set(posts.map((p) => p.type))).map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-3 py-2 text-sm text-slate-400">Post</th>
                  <th className="px-3 py-2 text-sm text-slate-400">Publish at</th>
                  <th className="px-3 py-2 text-sm text-slate-400">Status</th>
                  <th className="px-3 py-2 text-sm text-slate-400">Production</th>
                  <th className="px-3 py-2 text-sm text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPosts.map((p) => {
                  const linked = tasks.filter((t) => t.post_id === p.id);
                  return (
                    <tr key={p.id} className="border-b border-white/5">
                      <td className="px-3 py-2 text-white">{p.platform} - {p.type}</td>
                      <td className="px-3 py-2 text-slate-500 text-sm">{new Date(p.publish_at).toLocaleString()}</td>
                      <td className="px-3 py-2"><StatusChip status={p.status} /></td>
                      <td className="px-3 py-2 text-slate-500 text-sm">{linked.length ? linked.map((t) => t.status).join(", ") : "No linked tasks"}</td>
                      <td className="px-3 py-2">
                        <div className="flex gap-2">
                          <button type="button" onClick={() => setPostDrawerId(p.id)} className="text-accent-second text-sm hover:text-accent">Details</button>
                          <button type="button" onClick={() => duplicatePost(p)} className="text-accent-second text-sm hover:text-accent">Duplicate</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredPosts.length === 0 && <p className="text-slate-500 text-sm p-4">No posts found. Create first post.</p>}
          </div>
        </div>
      )}

      {tab === "tasks" && (
        <div className="glass-card p-5 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <select value={taskStatusFilter} onChange={(e) => setTaskStatusFilter(e.target.value)} className="rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white">
              <option value="">All statuses</option>
              {["todo", "in_progress", "review", "approved", "changes_requested"].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={assigneeFilter} onChange={(e) => setAssigneeFilter(e.target.value)} className="rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white">
              <option value="">All assignees</option>
              {profiles.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white">
              <option value="">Any priority</option>
              {Array.from({ length: 10 }, (_, index) => index + 1).map((p) => <option key={p} value={String(p)}>{p}</option>)}
            </select>
            <label className="inline-flex items-center gap-2 text-sm text-white">
              <input type="checkbox" checked={onlyOverdue} onChange={(e) => setOnlyOverdue(e.target.checked)} />
              Overdue only
            </label>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-3 py-2 text-sm text-slate-400">Task</th>
                  <th className="px-3 py-2 text-sm text-slate-400">Assignee</th>
                  <th className="px-3 py-2 text-sm text-slate-400">Status</th>
                  <th className="px-3 py-2 text-sm text-slate-400">Deadline</th>
                  <th className="px-3 py-2 text-sm text-slate-400">Priority</th>
                  <th className="px-3 py-2 text-sm text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.map((t) => (
                  <tr key={t.id} className="border-b border-white/5">
                    <td className="px-3 py-2 text-white">{t.title || t.type}</td>
                    <td className="px-3 py-2 text-slate-500 text-sm">{t.assignee_id ? profileMap[t.assignee_id] ?? t.assignee_id : "Unassigned"}</td>
                    <td className="px-3 py-2">
                      <select value={t.status} onChange={(e) => updateTaskStatus(t.id, e.target.value)} className="rounded bg-white/10 border border-white/10 px-2 py-1 text-sm text-white">
                        {["todo", "in_progress", "review", "approved", "changes_requested"].map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="px-3 py-2 text-slate-500 text-sm">{t.due_at ? `${new Date(t.due_at).toLocaleString()} · ${humanRemaining(t.due_at, t.status)}` : "—"}</td>
                    <td className="px-3 py-2 text-slate-500 text-sm">{t.priority}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => setTaskDrawerId(t.id)} className="text-accent-second text-sm hover:text-accent">Details</button>
                        <select value={t.assignee_id ?? ""} onChange={(e) => reassignTask(t.id, e.target.value)} className="rounded bg-white/10 border border-white/10 px-2 py-1 text-sm text-white">
                          <option value="">Unassigned</option>
                          {profiles.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredTasks.length === 0 && <p className="text-slate-500 text-sm p-4">No tasks found. Add first task.</p>}
          </div>
        </div>
      )}

      {tab === "assets" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="glass-card p-5 space-y-3">
            <h3 className="text-lg font-semibold text-white">Brand Kit</h3>
            <p className="text-sm text-white">Logo and guidelines for this client.</p>
            {brandKit?.logo_url ? <img src={brandKit.logo_url} alt="Brand logo" className="h-24 object-contain" /> : <p className="text-slate-500 text-sm">No logo uploaded</p>}
            <p className="text-sm text-slate-500">Guidelines: {brandKit?.guidelines_url ? <a className="text-accent-second hover:text-accent" href={brandKit.guidelines_url}>{brandKit.guidelines_url}</a> : "—"}</p>
            <pre className="text-xs bg-white/5 rounded p-2 text-white overflow-auto">{JSON.stringify(brandKit?.colors_json ?? {}, null, 2)}</pre>
            <pre className="text-xs bg-white/5 rounded p-2 text-white overflow-auto">{JSON.stringify(brandKit?.fonts_json ?? {}, null, 2)}</pre>
          </div>
          <div className="glass-card p-5">
            <h3 className="text-lg font-semibold text-white">Assets library</h3>
            <p className="text-slate-500 text-sm mt-2">Asset library not configured. Currently showing Brand Kit assets only.</p>
          </div>
        </div>
      )}

      {tab === "notes" && (
        <div className="glass-card p-5 space-y-4">
          <h3 className="text-lg font-semibold text-white">Internal Notes</h3>
          {canManageNotes && (
            <div className="flex gap-2">
              <input
                value={newNoteBody}
                onChange={(e) => setNewNoteBody(e.target.value)}
                placeholder="Add note..."
                className="flex-1 rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-white"
              />
              <button type="button" onClick={addNote} className="btn-primary">Add</button>
            </div>
          )}
          <ul className="space-y-2">
            {filteredNotes.map((n) => (
              <li key={n.id} className="rounded-lg bg-white/5 p-3">
                {editingNoteId === n.id ? (
                  <div className="space-y-2">
                    <textarea
                      value={editingNoteBody}
                      onChange={(e) => setEditingNoteBody(e.target.value)}
                      rows={2}
                      className="w-full rounded-lg bg-white/10 border border-white/10 px-3 py-2 text-white text-sm"
                    />
                    <div className="flex gap-2">
                      <button type="button" onClick={() => saveNote(n.id)} disabled={noteBusyId === n.id} className="rounded-lg bg-accent px-3 py-1.5 text-xs text-white disabled:opacity-50">
                        Save
                      </button>
                      <button type="button" onClick={cancelEditNote} className="rounded-lg bg-white/10 px-3 py-1.5 text-xs text-slate-300">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-white text-sm">{n.body}</p>
                )}
                <p className="text-xs text-slate-500 mt-1">{profileMap[n.author_id] ?? n.author_id} · {new Date(n.created_at).toLocaleString()}</p>
                {canManageNotes && editingNoteId !== n.id && (
                  <div className="mt-2 flex gap-3 text-xs">
                    <button type="button" onClick={() => startEditNote(n)} className="text-accent-second hover:text-accent transition duration-200">
                      Edit
                    </button>
                    <button type="button" onClick={() => deleteNote(n.id)} disabled={noteBusyId === n.id} className="text-rose-400 hover:text-rose-300 disabled:opacity-50 transition duration-200">
                      Delete
                    </button>
                  </div>
                )}
              </li>
            ))}
            {filteredNotes.length === 0 && <li className="text-slate-500 text-sm">No notes yet.</li>}
          </ul>
        </div>
      )}

      <Drawer open={showCreatePost} onClose={() => setShowCreatePost(false)} title="New Post" width="md">
        <div className="space-y-3">
          <select value={newPostPlatform} onChange={(e) => setNewPostPlatform(e.target.value)} className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-white">
            {["instagram", "facebook", "tiktok", "linkedin", "youtube"].map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <input value={newPostType} onChange={(e) => setNewPostType(e.target.value)} placeholder="Type" className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-white" />
          <input type="datetime-local" value={newPostPublishAt} onChange={(e) => setNewPostPublishAt(e.target.value)} className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-white" />
          <textarea value={newPostCaption} onChange={(e) => setNewPostCaption(e.target.value)} placeholder="Caption" rows={3} className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-white" />
          <select value={newPostStatus} onChange={(e) => setNewPostStatus(e.target.value)} className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-white">
            {["draft", "scheduled", "published", "approved"].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <button type="button" onClick={createPost} className="btn-primary w-full">Create Post</button>
        </div>
      </Drawer>

      <Drawer open={showCreateTask} onClose={() => setShowCreateTask(false)} title="New Task" width="md">
        <div className="space-y-3">
          <input value={newTaskType} onChange={(e) => setNewTaskType(e.target.value)} placeholder="Task title/type" className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-white" />
          <select value={newTaskAssigneeId} onChange={(e) => setNewTaskAssigneeId(e.target.value)} className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-white">
            <option value="">Unassigned</option>
            {profiles.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <input type="datetime-local" value={newTaskDueAt} onChange={(e) => setNewTaskDueAt(e.target.value)} className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-white" />
          <select value={newTaskPriority} onChange={(e) => setNewTaskPriority(Number(e.target.value))} className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-white">
            {Array.from({ length: 10 }, (_, index) => index + 1).map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
          <button type="button" onClick={createTask} className="btn-primary w-full">Create Task</button>
        </div>
      </Drawer>

      <Drawer open={showBrandKit} onClose={() => setShowBrandKit(false)} title="Update Brand Kit" width="lg">
        <BrandKitForm
          clientId={client.id}
          initialData={
            brandKit
              ? {
                  logo_url: brandKit.logo_url ?? undefined,
                  guidelines_url: brandKit.guidelines_url ?? undefined,
                }
              : null
          }
        />
      </Drawer>

      <Drawer open={Boolean(selectedTask)} onClose={() => setTaskDrawerId(null)} title="Task Details" width="lg">
        {selectedTask && (
          <div className="space-y-3 text-sm">
            <p className="text-white font-semibold">{selectedTask.title || selectedTask.type}</p>
            <p className="text-slate-500">Assignee: {selectedTask.assignee_id ? profileMap[selectedTask.assignee_id] ?? selectedTask.assignee_id : "Unassigned"}</p>
            <p className="text-slate-500">Status: {selectedTask.status}</p>
            <p className="text-slate-500">Created: {new Date(selectedTask.created_at).toLocaleString()}</p>
            <p className="text-slate-500">Deadline: {selectedTask.due_at ? new Date(selectedTask.due_at).toLocaleString() : "—"}</p>
            <p className="text-slate-500">Remaining: {humanRemaining(selectedTask.due_at, selectedTask.status)}</p>
            {selectedTask.description && <p className="text-white/90">{selectedTask.description}</p>}
            <Link href={`/app/task/${selectedTask.id}`} className="text-accent-second hover:text-accent">Open full task page</Link>
          </div>
        )}
      </Drawer>

      <Drawer open={Boolean(selectedPost)} onClose={() => setPostDrawerId(null)} title="Post Details" width="lg">
        {selectedPost && (
          <div className="space-y-3 text-sm">
            <p className="text-white font-semibold">{selectedPost.platform} - {selectedPost.type}</p>
            <p className="text-slate-500">Publish at: {new Date(selectedPost.publish_at).toLocaleString()}</p>
            <p className="text-slate-500">Status: {selectedPost.status}</p>
            <p className="text-white/90">{selectedPost.caption || "No caption"}</p>
            {selectedPost.hashtags?.length ? <p className="text-slate-500">#{selectedPost.hashtags.join(" #")}</p> : null}
            {selectedPost.media_url ? <a href={selectedPost.media_url} className="text-accent-second hover:text-accent">Open media</a> : null}
            <div className="pt-2 border-t border-white/10">
              <p className="text-white font-medium mb-1">Linked production tasks</p>
              <ul className="space-y-1">
                {tasks.filter((t) => t.post_id === selectedPost.id).map((t) => (
                  <li key={t.id} className="text-slate-500">{t.title || t.type} · {t.status}</li>
                ))}
                {tasks.filter((t) => t.post_id === selectedPost.id).length === 0 && <li className="text-slate-500">No linked tasks</li>}
              </ul>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}

