"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import {
  getTaskOutputDownloadUrlAction,
  saveTaskOutputAction,
  transitionTaskAction,
} from "@/app/actions/tasks";

const IMAGE_ACCEPT_ALL = "image/*,.heic,.heif,.avif,.webp,.bmp,.dib,.tif,.tiff,.ico,.jfif,.pjpeg,.pjp";
const MAX_OUTPUT_FILE_SIZE = 25 * 1024 * 1024;
const MAX_OUTPUT_FILE_NAME_LENGTH = 240;

interface TaskDetailClientProps {
  task: {
    id: string;
    type: string;
    title?: string | null;
    status: string;
    created_at: string;
    due_at: string | null;
    client_id: string;
    post_id: string | null;
    fields_json: Record<string, unknown> | null;
    output_json: Record<string, unknown> | null;
    assignee_id: string | null;
    assigned_by?: string | null;
  };
  client: { id: string; name: string } | null;
  comments: { id: string; author_id: string; body: string; created_at: string }[];
  approvals: { id: string; status: string; approver_id: string; note: string | null; created_at: string }[];
  activityLogs: { id: string; action: string; actor_id: string; meta_json: Record<string, unknown> | null; created_at: string }[];
  dynamicFieldSchema: Record<string, unknown> | null;
  profileMap: Record<string, string>;
  currentUserId: string;
  canApprove: boolean;
}

export function TaskDetailClient({
  task: initialTask,
  client,
  comments: initialComments,
  approvals: initialApprovals,
  activityLogs: initialActivityLogs,
  dynamicFieldSchema,
  profileMap,
  currentUserId,
  canApprove,
}: TaskDetailClientProps) {
  const [task, setTask] = useState(initialTask);
  const [comments, setComments] = useState(initialComments);
  const [newComment, setNewComment] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editedCommentBody, setEditedCommentBody] = useState("");
  const [commentBusyId, setCommentBusyId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [approvalNote, setApprovalNote] = useState("");
  const [outputUrl, setOutputUrl] = useState((initialTask.output_json as { url?: string })?.url ?? "");
  const [outputSaving, setOutputSaving] = useState(false);
  const supabase = createClient();
  const router = useRouter();
  const canSubmitForReview =
    task.assignee_id === currentUserId &&
    (task.status === "in_progress" || task.status === "changes_requested");

  useEffect(() => {
    const channel = supabase
      .channel(`task-${task.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks", filter: `id=eq.${task.id}` }, (payload) => {
        setTask((prev) => ({ ...prev, ...payload.new as object }));
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "comments" }, () => {
        supabase.from("comments").select("id, author_id, body, created_at").eq("task_id", task.id).order("created_at", { ascending: true }).then(({ data }) => setComments(data ?? []));
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [task.id]);

  async function submitComment() {
    if (!newComment.trim()) return;
    setSubmitting(true);
    const { error } = await supabase.from("comments").insert({ task_id: task.id, author_id: currentUserId, body: newComment.trim() });
    setNewComment("");
    setSubmitting(false);
    if (!error) router.refresh();
  }

  function startEditComment(commentId: string, body: string) {
    setEditingCommentId(commentId);
    setEditedCommentBody(body);
  }

  function cancelEditComment() {
    setEditingCommentId(null);
    setEditedCommentBody("");
  }

  async function saveComment(commentId: string) {
    if (!editedCommentBody.trim()) return;
    setCommentBusyId(commentId);
    const { error } = await supabase
      .from("comments")
      .update({ body: editedCommentBody.trim() })
      .eq("id", commentId)
      .eq("author_id", currentUserId);
    setCommentBusyId(null);
    if (error) {
      console.error(error);
      return;
    }
    setComments((prev) => prev.map((c) => (c.id === commentId ? { ...c, body: editedCommentBody.trim() } : c)));
    cancelEditComment();
    router.refresh();
  }

  async function deleteComment(commentId: string) {
    const confirmed = window.confirm("Delete this comment?");
    if (!confirmed) return;
    setCommentBusyId(commentId);
    const { error } = await supabase.from("comments").delete().eq("id", commentId).eq("author_id", currentUserId);
    setCommentBusyId(null);
    if (error) {
      console.error(error);
      return;
    }
    setComments((prev) => prev.filter((c) => c.id !== commentId));
    if (editingCommentId === commentId) cancelEditComment();
    router.refresh();
  }

  async function submitForReview() {
    const result = await transitionTaskAction({ taskId: task.id, targetStatus: "review", note: "" });
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setTask((prev) => ({ ...prev, status: result.data.status }));
    router.refresh();
  }

  async function saveOutput() {
    setOutputSaving(true);
    const currentOutput = (task.output_json as { file_path?: string; file_name?: string } | null) ?? null;
    const result = await saveTaskOutputAction({
      taskId: task.id,
      outputUrl,
      filePath: currentOutput?.file_path ?? "",
      fileName: currentOutput?.file_name ?? "",
    });
    setOutputSaving(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setTask((prev) => ({ ...prev, output_json: result.data.output_json }));
    router.refresh();
  }

  async function onOutputFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowedType = file.type.startsWith("image/") || file.type.startsWith("video/");
    if (!allowedType) {
      toast.error("Only image and video outputs are supported.");
      return;
    }
    if (file.size > MAX_OUTPUT_FILE_SIZE) {
      toast.error("The selected file is too large.");
      return;
    }
    if (!file.size) {
      toast.error("The selected file is empty.");
      return;
    }
    if (file.name.length > MAX_OUTPUT_FILE_NAME_LENGTH) {
      toast.error("The file name is too long.");
      return;
    }
    const path = `tasks/${task.id}/${Date.now()}_${file.name}`;
    const { data: upload, error: upErr } = await supabase.storage.from("task-outputs").upload(path, file, {
      upsert: true,
      contentType: file.type || undefined,
    });
    if (upErr) {
      console.error(upErr);
      toast.error(upErr.message);
      return;
    }
    const persistedUrl = ((task.output_json as { url?: string } | null)?.url ?? "").trim();
    const result = await saveTaskOutputAction({
      taskId: task.id,
      outputUrl: persistedUrl,
      filePath: upload.path,
      fileName: file.name,
    });
    if (!result.ok) {
      await supabase.storage.from("task-outputs").remove([upload.path]);
      toast.error(result.error);
      return;
    }
    setTask((prev) => ({ ...prev, output_json: result.data.output_json }));
    toast.success("Output file uploaded.");
    router.refresh();
  }

  async function approve(status: "approved" | "changes_requested") {
    const result = await transitionTaskAction({
      taskId: task.id,
      targetStatus: status,
      note: approvalNote,
    });
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setTask((prev) => ({ ...prev, status: result.data.status }));
    setApprovalNote("");
    router.refresh();
  }

  async function openUploadedFile() {
    const privateFilePath = (task.output_json as { file_path?: string } | null)?.file_path;

    if (privateFilePath) {
      const result = await getTaskOutputDownloadUrlAction({ taskId: task.id });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      window.open(result.data.signedUrl, "_blank", "noopener,noreferrer");
      return;
    }
    toast.error("This task does not have a downloadable private file.");
  }

  const fields = (dynamicFieldSchema as { fields?: { key: string; label: string; type: string }[] })?.fields ?? [];
  const fieldValues = (task.fields_json ?? {}) as Record<string, string>;
  const assigneeName = task.assignee_id ? profileMap[task.assignee_id] ?? task.assignee_id : "Unassigned";
  const assignedByName = task.assigned_by ? profileMap[task.assigned_by] ?? task.assigned_by : "—";

  function formatDateTime(value: string | null) {
    if (!value) return "—";
    return new Date(value).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  }

  function getDeadlineRemaining(value: string | null, status: string) {
    if (["approved", "done", "completed"].includes(status)) return "Completed";
    if (!value) return "No deadline";
    const due = new Date(value);
    const now = new Date();
    if (Number.isNaN(due.getTime())) return "—";
    if (due <= now) return `Overdue ${formatDistanceToNow(due, { addSuffix: true })}`;
    return `Remaining ${formatDistanceToNow(due, { addSuffix: true })}`;
  }

  const outputData = (task.output_json as { url?: string; file_path?: string; file_name?: string } | null) ?? null;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/app" className="text-slate-400 hover:text-white text-sm">← Back</Link>
          <h1 className="text-2xl font-bold text-white mt-1">{task.title || task.type}</h1>
          <p className="text-white text-base font-medium mt-1">
            Client: {client ? client.name : "—"}
          </p>
        </div>
        <span className={`rounded-full px-3 py-1 text-sm status-${task.status}`}>{task.status}</span>
      </div>

      <div className="glass-card p-6">
        <h2 className="font-semibold text-white mb-4">Details</h2>
        <dl className="grid grid-cols-2 gap-2 text-sm">
          <dt className="text-slate-500">Assigned to</dt>
          <dd className="text-white font-medium">{assigneeName}</dd>
          <dt className="text-slate-500">Assigned by</dt>
          <dd className="text-white">{assignedByName}</dd>
          <dt className="text-slate-500">Created at</dt>
          <dd className="text-white">{formatDateTime(task.created_at)}</dd>
          <dt className="text-slate-500">Deadline</dt>
          <dd className="text-white">{formatDateTime(task.due_at)}</dd>
          <dt className="text-slate-500">Time left</dt>
          <dd className="text-white">{getDeadlineRemaining(task.due_at, task.status)}</dd>
          {fields.map((f) => (
            <span key={f.key}>
              <dt className="text-slate-500">{f.label}</dt>
              <dd className="text-white">{String(fieldValues[f.key] ?? "—")}</dd>
            </span>
          ))}
        </dl>
      </div>

      {task.assignee_id === currentUserId && (
        <div className="glass-card p-6">
          <h2 className="font-semibold text-white mb-4">Deliverables / Output</h2>
          <p className="text-slate-400 text-sm mb-2">Attach a link or file for review.</p>
          <input
            value={outputUrl}
            onChange={(e) => setOutputUrl(e.target.value)}
            placeholder="Output URL (e.g. Figma, drive link)"
            className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-white mb-2"
          />
          <input type="file" accept={`${IMAGE_ACCEPT_ALL},video/*`} onChange={onOutputFileChange} className="text-slate-400 text-sm mb-2" />
          <button type="button" onClick={saveOutput} disabled={outputSaving} className="rounded-lg bg-accent px-4 py-2 text-sm text-white hover:bg-accent-second disabled:opacity-50 transition duration-200">Save output</button>
          {outputData?.file_path && (
            <button
              type="button"
              onClick={openUploadedFile}
              className="mt-2 text-sm text-accent-second hover:text-accent transition duration-200"
            >
              {outputData?.file_name ? `Open ${outputData.file_name}` : "Open uploaded file"}
            </button>
          )}
        </div>
      )}

      {canSubmitForReview && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={submitForReview}
            className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-500"
          >
            Submit for approval
          </button>
        </div>
      )}

      {canApprove && task.status === "review" && (
        <div className="glass-card p-6">
          <h2 className="font-semibold text-white mb-2">Approve / Request changes</h2>
          <textarea
            value={approvalNote}
            onChange={(e) => setApprovalNote(e.target.value)}
            placeholder="Note (optional)"
            rows={2}
            className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-white mb-2"
          />
          <div className="flex gap-2">
            <button type="button" onClick={() => approve("approved")} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white hover:bg-emerald-500">Approve</button>
            <button type="button" onClick={() => approve("changes_requested")} className="rounded-lg bg-rose-600 px-4 py-2 text-sm text-white hover:bg-rose-500">Request changes</button>
          </div>
        </div>
      )}

      <div className="glass-card p-6">
        <h2 className="font-semibold text-white mb-4">Comments</h2>
        <div className="space-y-3 mb-4">
          {comments.map((c) => (
            <div key={c.id} className="rounded-lg bg-white/5 p-3">
              {editingCommentId === c.id ? (
                <div className="space-y-2">
                  <textarea
                    value={editedCommentBody}
                    onChange={(e) => setEditedCommentBody(e.target.value)}
                    rows={2}
                    className="w-full rounded-lg bg-white/10 border border-white/10 px-3 py-2 text-white text-sm"
                  />
                  <div className="flex gap-2">
                    <button type="button" onClick={() => saveComment(c.id)} disabled={commentBusyId === c.id} className="rounded-lg bg-accent px-3 py-1.5 text-xs text-white disabled:opacity-50">
                      Save
                    </button>
                    <button type="button" onClick={cancelEditComment} className="rounded-lg bg-white/10 px-3 py-1.5 text-xs text-slate-300">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-slate-300 text-sm">{c.body}</p>
              )}
              <p className="text-slate-500 text-xs mt-1">{profileMap[c.author_id] ?? c.author_id} · {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}</p>
              {c.author_id === currentUserId && editingCommentId !== c.id && (
                <div className="mt-2 flex gap-3 text-xs">
                  <button type="button" onClick={() => startEditComment(c.id, c.body)} className="text-accent-second hover:text-accent transition duration-200">
                    Edit
                  </button>
                  <button type="button" onClick={() => deleteComment(c.id)} disabled={commentBusyId === c.id} className="text-rose-400 hover:text-rose-300 disabled:opacity-50 transition duration-200">
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="flex-1 rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-white"
          />
          <button type="button" onClick={submitComment} disabled={submitting} className="rounded-lg bg-accent px-4 py-2 text-sm text-white hover:bg-accent-second disabled:opacity-50 transition duration-200">Send</button>
        </div>
      </div>

      {initialApprovals.length > 0 && (
        <div className="glass-card p-6">
          <h2 className="font-semibold text-white mb-4">Approval history</h2>
          <ul className="space-y-2">
            {initialApprovals.map((a) => (
              <li key={a.id} className="text-sm text-slate-300">
                {a.status} {a.note && `– ${a.note}`} by {profileMap[a.approver_id] ?? a.approver_id} · {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="glass-card p-6">
        <h2 className="font-semibold text-white mb-4">Activity</h2>
        <ul className="space-y-2 text-sm text-slate-400">
          {initialActivityLogs.map((log) => (
            <li key={log.id}>
              {log.action} · {profileMap[log.actor_id] ?? log.actor_id} · {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
