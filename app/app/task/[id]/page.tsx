import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { requireProfile } from "@/lib/auth/session";
import { TaskDetailClient } from "./task-detail-client";

export default async function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data: task } = await supabase.from("tasks").select("*").eq("id", id).single();
  if (!task) notFound();

  const [{ data: client }, { data: comments }, { data: approvals }, { data: activityLogs }, { data: dynamicFields }, { data: profiles }] = await Promise.all([
    task.client_id ? supabase.from("clients").select("id, name").eq("id", task.client_id).single() : { data: null },
    supabase.from("comments").select("id, author_id, body, created_at").eq("task_id", id).order("created_at", { ascending: true }),
    supabase.from("approvals").select("id, status, approver_id, note, created_at").eq("task_id", id).order("created_at", { ascending: false }),
    supabase.from("activity_logs").select("id, action, actor_id, meta_json, created_at").eq("entity_type", "task").eq("entity_id", id).order("created_at", { ascending: false }).limit(20),
    supabase.from("dynamic_fields").select("*").eq("role", profile.role).eq("task_type", task.type).eq("is_active", true).maybeSingle(),
    supabase.from("profiles").select("id, name"),
  ]);

  const profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p.name]));

  return (
    <TaskDetailClient
      task={task}
      client={client}
      comments={comments ?? []}
      approvals={approvals ?? []}
      activityLogs={activityLogs ?? []}
      dynamicFieldSchema={dynamicFields?.schema_json ?? null}
      profileMap={profileMap}
      currentUserId={profile.id}
      canApprove={profile.role === "ADMIN" || profile.role === "SUPERVISOR"}
    />
  );
}
