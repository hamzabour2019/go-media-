import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth/session";
import { TaskListEditor } from "./task-list-editor";

export default async function EditorDashboard() {
  const profile = await requireProfile();
  const supabase = await createClient();
  const { data: tasks } = await supabase
    .from("tasks")
    .select("id, type, status, due_at, client_id")
    .eq("assignee_id", profile.id)
    .order("due_at", { ascending: true });

  const statusCounts = { todo: 0, in_progress: 0, review: 0, approved: 0, changes_requested: 0 };
  (tasks ?? []).forEach((t) => {
    if (t.status in statusCounts) (statusCounts as Record<string, number>)[t.status]++;
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">My Tasks</h1>
      <div className="flex flex-wrap gap-2">
        <span className="inline-flex min-h-[28px] items-center justify-center rounded-full bg-slate-600/50 px-3 py-1 text-sm text-slate-200">Todo: {statusCounts.todo}</span>
        <span className="inline-flex min-h-[28px] items-center justify-center rounded-full bg-amber-600/50 px-3 py-1 text-sm text-amber-100">In progress: {statusCounts.in_progress}</span>
        <span className="inline-flex min-h-[28px] items-center justify-center rounded-full bg-blue-600/50 px-3 py-1 text-sm text-blue-100">Review: {statusCounts.review}</span>
        <span className="inline-flex min-h-[28px] items-center justify-center rounded-full bg-emerald-600/50 px-3 py-1 text-sm text-emerald-100">Approved: {statusCounts.approved}</span>
        <span className="inline-flex min-h-[28px] items-center justify-center rounded-full bg-rose-600/50 px-3 py-1 text-sm text-rose-100">Changes: {statusCounts.changes_requested}</span>
      </div>
      <TaskListEditor initialTasks={tasks ?? []} userId={profile.id} />
    </div>
  );
}
