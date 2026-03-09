"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { EventContentArg, EventDropArg } from "@fullcalendar/core";
import Link from "next/link";
import { Drawer } from "@/components/ui/drawer";
import { CheckCircle2, Clock3, Facebook, FileText, Globe2, Instagram, Linkedin, Twitter } from "lucide-react";
import { toast } from "sonner";
import { createPostAction, reschedulePostAction } from "@/app/actions/posts";
import { POST_STATUSES, type PostStatus } from "@/lib/workflows";

const IMAGE_ACCEPT_ALL = "image/*,.heic,.heif,.avif,.webp,.bmp,.dib,.tif,.tiff,.ico,.jfif,.pjpeg,.pjp";
const MAX_POST_MEDIA_SIZE = 25 * 1024 * 1024;
const MAX_POST_MEDIA_NAME_LENGTH = 240;

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
  media_url?: string | null;
  status: string;
}

interface AssigneeRow {
  id: string;
  name: string;
}

export function CalendarView({
  initialClients,
  initialPosts,
  initialAssignees,
  initialPostAssignees,
}: {
  initialClients: ClientRow[];
  initialPosts: PostRow[];
  initialAssignees: AssigneeRow[];
  initialPostAssignees: Record<string, string[]>;
}) {
  const [posts, setPosts] = useState(initialPosts);
  const [clientFilter, setClientFilter] = useState<string>("");
  const [platformFilter, setPlatformFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("");
  const [selectedPost, setSelectedPost] = useState<PostRow | null>(null);
  const [requestedOpenAt, setRequestedOpenAt] = useState<string>("");
  const [postAssignees, setPostAssignees] = useState<Record<string, string[]>>(initialPostAssignees);
  const lastDateClickRef = useRef<{ key: string; at: number } | null>(null);
  const supabase = createClient();

  const assigneeNameMap = useMemo(
    () => Object.fromEntries(initialAssignees.map((a) => [a.id, a.name])),
    [initialAssignees]
  );

  const platformOptions = useMemo(
    () => Array.from(new Set(posts.map((p) => p.platform.trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b)),
    [posts]
  );

  const statusOptions = useMemo(
    () => Array.from(new Set(posts.map((p) => p.status.trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b)),
    [posts]
  );

  const events = useMemo(
    () =>
      posts
        .filter((p) => {
          if (clientFilter && p.client_id !== clientFilter) return false;
          if (platformFilter && p.platform !== platformFilter) return false;
          if (statusFilter && p.status !== statusFilter) return false;
          if (assigneeFilter) {
            const linked = postAssignees[p.id] ?? [];
            if (!linked.includes(assigneeFilter)) return false;
          }
          return true;
        })
        .map((p) => ({
          id: p.id,
          title: p.caption ?? `${p.platform} ${p.type}`,
          start: p.publish_at,
          classNames: [`calendar-post-event`, `calendar-post-status-${normalizePostStatus(p.status)}`],
          extendedProps: { post: p },
        })),
    [posts, clientFilter, platformFilter, statusFilter, assigneeFilter, postAssignees]
  );

  async function handleDrop(arg: EventDropArg) {
    const start = arg.event.start;
    if (!start) {
      arg.revert();
      return;
    }
    const dateStr = start.toISOString();
    const result = await reschedulePostAction({ postId: arg.event.id, publishAt: dateStr });
    if (!result.ok) {
      toast.error(result.error);
      arg.revert();
      return;
    }
    setPosts((prev) => prev.map((p) => (p.id === arg.event.id ? { ...p, publish_at: result.data.publish_at } : p)));
  }

  function handleDateClick(arg: { date: Date }) {
    const now = Date.now();
    const key = arg.date.toISOString();
    const last = lastDateClickRef.current;
    if (last && last.key === key && now - last.at < 350) {
      setRequestedOpenAt(toLocalDateTimeInput(arg.date));
      lastDateClickRef.current = null;
      return;
    }
    lastDateClickRef.current = { key, at: now };
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center">
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
        <select
          value={platformFilter}
          onChange={(e) => setPlatformFilter(e.target.value)}
          className="rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-white text-sm"
        >
          <option value="">All platforms</option>
          {platformOptions.map((platform) => (
            <option key={platform} value={platform}>
              {platform}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-white text-sm"
        >
          <option value="">All statuses</option>
          {statusOptions.map((status) => (
            <option key={status} value={status}>
              {status.replaceAll("_", " ")}
            </option>
          ))}
        </select>
        <select
          value={assigneeFilter}
          onChange={(e) => setAssigneeFilter(e.target.value)}
          className="rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-white text-sm"
        >
          <option value="">All assignees</option>
          {initialAssignees.map((assignee) => (
            <option key={assignee.id} value={assignee.id}>
              {assignee.name}
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
          dateClick={handleDateClick}
          eventClick={(arg) => setSelectedPost(arg.event.extendedProps.post as PostRow)}
          eventContent={(arg: EventContentArg) => (
            <div className={`calendar-post-card calendar-post-status-${normalizePostStatus(arg.event.extendedProps.post?.status)}`} title={arg.event.extendedProps.post?.caption ?? ""}>
              <div className="calendar-post-strip" />
              <div className="calendar-post-body">
                <div className="calendar-post-top">
                  <span className="calendar-post-platform-icon">{getPlatformIcon(arg.event.extendedProps.post?.platform)}</span>
                  <span className="calendar-post-title">{extractCaptionSnippet(arg.event.extendedProps.post?.caption)}</span>
                </div>
                <div className="calendar-post-meta">
                  <Clock3 className="h-3 w-3" />
                  <span>
                    {arg.event.start
                      ? new Date(arg.event.start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                      : "—"}
                  </span>
                </div>
              </div>
            </div>
          )}
          headerToolbar={{ left: "prev,next today", center: "title", right: "dayGridMonth,timeGridWeek,timeGridDay" }}
          height="auto"
        />
      </div>
      <div className="glass-card p-4">
        <h3 className="font-medium text-white mb-2">Create post</h3>
        <CreatePostForm
          clients={initialClients}
          assignees={initialAssignees}
          requestedOpenAt={requestedOpenAt}
          onRequestHandled={() => setRequestedOpenAt("")}
          onCreated={(p, assigneeId) => {
            setPosts((prev) => [...prev, p]);
            if (assigneeId) {
              setPostAssignees((prev) => ({ ...prev, [p.id]: [assigneeId] }));
            }
          }}
        />
      </div>
      <Drawer
        open={Boolean(selectedPost)}
        onClose={() => setSelectedPost(null)}
        title={selectedPost ? `${selectedPost.platform} ${selectedPost.type}` : ""}
      >
        {selectedPost && (
          <div className="space-y-4">
            {selectedPost.media_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={selectedPost.media_url} alt="Post media" className="w-full rounded-lg border border-white/10 object-cover max-h-64" />
            ) : (
              <div className="rounded-lg border border-dashed border-white/15 p-6 text-center text-slate-400 text-sm">
                No media attached
              </div>
            )}
            <div className="rounded-lg bg-white/5 p-3 text-sm text-slate-200">
              {selectedPost.caption || "No caption"}
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg bg-white/5 p-3">
                <p className="text-slate-400 text-xs mb-1">Publish time</p>
                <p className="text-white">{new Date(selectedPost.publish_at).toLocaleString()}</p>
              </div>
              <div className="rounded-lg bg-white/5 p-3">
                <p className="text-slate-400 text-xs mb-1">Status</p>
                <p className="text-white">{selectedPost.status.replaceAll("_", " ")}</p>
              </div>
            </div>
            <div className="rounded-lg bg-white/5 p-3 text-sm">
              <p className="text-slate-400 text-xs mb-1">Assignees</p>
              <p className="text-white">
                {(postAssignees[selectedPost.id] ?? []).map((id) => assigneeNameMap[id] ?? id).join(", ") || "Unassigned"}
              </p>
            </div>
            <Link
              href="/app/smm/posts"
              className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm text-white hover:bg-accent-second transition duration-200"
            >
              <FileText className="h-4 w-4" />
              Open posts list
            </Link>
          </div>
        )}
      </Drawer>
    </div>
  );
}

function CreatePostForm({
  clients,
  assignees,
  requestedOpenAt,
  onRequestHandled,
  onCreated,
}: {
  clients: ClientRow[];
  assignees: AssigneeRow[];
  requestedOpenAt: string;
  onRequestHandled: () => void;
  onCreated: (post: PostRow, assigneeId: string) => void;
}) {
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [clientId, setClientId] = useState(clients[0]?.id ?? "");
  const [platform, setPlatform] = useState("Instagram");
  const [type, setType] = useState("Post");
  const [publishAt, setPublishAt] = useState("");
  const [caption, setCaption] = useState("");
  const [status, setStatus] = useState<PostStatus>("draft");
  const [assigneeId, setAssigneeId] = useState("");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState("");
  const supabase = createClient();

  useEffect(() => {
    if (!requestedOpenAt) return;
    setShow(true);
    setPublishAt(requestedOpenAt);
    onRequestHandled();
  }, [requestedOpenAt, onRequestHandled]);

  useEffect(() => {
    if (!mediaFile) {
      setMediaPreview("");
      return;
    }
    const preview = URL.createObjectURL(mediaFile);
    setMediaPreview(preview);
    return () => URL.revokeObjectURL(preview);
  }, [mediaFile]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!publishAt) return;
    setLoading(true);
    let mediaUrl: string | null = null;
    let uploadedPath: string | null = null;

    if (mediaFile) {
      const allowedType = mediaFile.type.startsWith("image/") || mediaFile.type.startsWith("video/");
      if (!allowedType) {
        toast.error("Only image and video media are supported.");
        setLoading(false);
        return;
      }
      if (!mediaFile.size) {
        toast.error("The selected media file is empty.");
        setLoading(false);
        return;
      }
      if (mediaFile.size > MAX_POST_MEDIA_SIZE) {
        toast.error("The selected media file is too large.");
        setLoading(false);
        return;
      }
      if (mediaFile.name.length > MAX_POST_MEDIA_NAME_LENGTH) {
        toast.error("The selected media file name is too long.");
        setLoading(false);
        return;
      }
      const path = `posts/${clientId}/${Date.now()}_${mediaFile.name}`;
      const { data: upload, error: uploadError } = await supabase.storage
        .from("brand-assets")
        .upload(path, mediaFile, {
          upsert: true,
          contentType: mediaFile.type || undefined,
        });
      if (uploadError) {
        toast.error(uploadError.message);
        setLoading(false);
        return;
      }
      uploadedPath = upload.path;
      const { data: publicUrlData } = supabase.storage.from("brand-assets").getPublicUrl(upload.path);
      mediaUrl = publicUrlData.publicUrl;
    }

    const publishDate = new Date(publishAt);
    if (Number.isNaN(publishDate.getTime())) {
      toast.error("Publish time is invalid.");
      if (uploadedPath) {
        await supabase.storage.from("brand-assets").remove([uploadedPath]);
      }
      setLoading(false);
      return;
    }

    const result = await createPostAction({
      clientId,
      platform,
      type,
      publishAt: publishDate.toISOString(),
      caption,
      status,
      mediaUrl: mediaUrl || "",
      assigneeId,
    });
    if (result.ok) {
      onCreated(result.data as PostRow, assigneeId);
      setShow(false);
      setPlatform("Instagram");
      setType("Post");
      setCaption("");
      setStatus("draft");
      setAssigneeId("");
      setMediaFile(null);
      setMediaPreview("");
    } else {
      if (uploadedPath) {
        await supabase.storage.from("brand-assets").remove([uploadedPath]);
      }
      toast.error(result.error);
    }
    setLoading(false);
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setShow(true)}
        className="rounded-lg bg-accent px-4 py-2 text-sm text-white hover:bg-accent-second transition duration-200"
      >
        New post
      </button>
      {show && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm p-4" onClick={() => setShow(false)} aria-hidden>
          <div
            className="mx-auto mt-10 max-w-lg rounded-xl border border-white/10 bg-slate-900/95 p-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h4 className="mb-3 text-white font-medium">Create post</h4>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Client</label>
                <select
                  name="client_id"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  required
                  className="w-full rounded bg-white/5 border border-white/10 px-3 py-2 text-white text-sm"
                >
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Platform</label>
                  <select
                    name="platform"
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                    required
                    className="w-full rounded bg-white/5 border border-white/10 px-3 py-2 text-white text-sm"
                  >
                    {["Instagram", "Facebook", "X", "LinkedIn", "TikTok", "YouTube"].map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Type</label>
                  <input
                    name="type"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    required
                    placeholder="Post"
                    className="w-full rounded bg-white/5 border border-white/10 px-3 py-2 text-white text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Publish at</label>
                <input
                  name="publish_at"
                  type="datetime-local"
                  value={publishAt}
                  onChange={(e) => setPublishAt(e.target.value)}
                  required
                  className="w-full rounded bg-white/5 border border-white/10 px-3 py-2 text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Caption</label>
                <textarea
                  name="caption"
                  rows={2}
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  className="w-full rounded bg-white/5 border border-white/10 px-3 py-2 text-white text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as PostStatus)}
                    className="w-full rounded bg-white/5 border border-white/10 px-3 py-2 text-white text-sm"
                  >
                    {POST_STATUSES.map((postStatus) => (
                      <option key={postStatus} value={postStatus}>
                        {postStatus.replaceAll("_", " ")}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Assignee</label>
                  <select
                    value={assigneeId}
                    onChange={(e) => setAssigneeId(e.target.value)}
                    className="w-full rounded bg-white/5 border border-white/10 px-3 py-2 text-white text-sm"
                  >
                    <option value="">Unassigned</option>
                    {assignees.map((assignee) => (
                      <option key={assignee.id} value={assignee.id}>{assignee.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Media upload</label>
                <input
                  type="file"
                  accept={`${IMAGE_ACCEPT_ALL},video/*`}
                  onChange={(e) => setMediaFile(e.target.files?.[0] ?? null)}
                  className="w-full rounded bg-white/5 border border-white/10 px-3 py-2 text-white text-sm"
                />
                {mediaPreview && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={mediaPreview} alt="Preview" className="mt-2 h-24 w-24 rounded-lg object-cover border border-white/10" />
                )}
              </div>
              <div className="flex gap-2">
                <button type="submit" disabled={loading} className="rounded-lg bg-accent px-4 py-2 text-sm text-white hover:bg-accent-second disabled:opacity-50 transition duration-200">Create</button>
                <button type="button" onClick={() => setShow(false)} className="rounded-lg bg-white/10 px-4 py-2 text-sm text-slate-300">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function extractCaptionSnippet(caption?: string | null) {
  if (!caption) return "Untitled post";
  const words = caption.trim().split(/\s+/).slice(0, 3);
  return words.join(" ");
}

function toLocalDateTimeInput(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function normalizePostStatus(status: string) {
  const value = status.toLowerCase();
  if (value === "scheduled") return "scheduled";
  if (value === "pending_approval" || value === "review") return "review";
  if (value === "published") return "published";
  return "draft";
}

function getPlatformIcon(platform?: string) {
  const key = platform?.toLowerCase() ?? "";
  if (key.includes("insta")) return <Instagram className="h-3.5 w-3.5" />;
  if (key.includes("face")) return <Facebook className="h-3.5 w-3.5" />;
  if (key.includes("linked")) return <Linkedin className="h-3.5 w-3.5" />;
  if (key === "x" || key.includes("twitter")) return <Twitter className="h-3.5 w-3.5" />;
  if (key.includes("youtube")) return <CheckCircle2 className="h-3.5 w-3.5" />;
  return <Globe2 className="h-3.5 w-3.5" />;
}
