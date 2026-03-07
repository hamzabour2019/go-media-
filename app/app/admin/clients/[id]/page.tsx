import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { requireProfile } from "@/lib/auth/session";
import { Client360Hub } from "./client-360-hub";

export default async function ClientEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const me = await requireProfile();
  const supabase = await createClient();
  const { data: client } = await supabase
    .from("clients")
    .select("id, name, status, email, phone, created_by, created_at")
    .eq("id", id)
    .single();
  if (!client) notFound();

  const [{ data: brandKit }, { data: clientTasks }, { data: clientPosts }, { data: clientNotes }, { data: profiles }] = await Promise.all([
    supabase.from("brand_kits").select("*").eq("client_id", id).single(),
    supabase.from("tasks").select("id, type, title, description, status, assignee_id, assigned_by, due_at, priority, created_at, start_at, post_id").eq("client_id", id).order("due_at", { ascending: true }),
    supabase.from("posts").select("id, platform, type, publish_at, status, caption, hashtags, media_url, created_at").eq("client_id", id).order("publish_at", { ascending: false }),
    supabase.from("client_notes").select("id, author_id, body, created_at").eq("client_id", id).order("created_at", { ascending: false }).limit(100),
    supabase.from("profiles").select("id, name, role"),
  ]);

  const taskIds = (clientTasks ?? []).map((t) => t.id);
  const postIds = (clientPosts ?? []).map((p) => p.id);

  const [{ data: taskActivities }, { data: postActivities }, { data: approvals }] = await Promise.all([
    taskIds.length
      ? supabase
          .from("activity_logs")
          .select("id, entity_type, entity_id, action, actor_id, created_at")
          .eq("entity_type", "task")
          .in("entity_id", taskIds)
          .order("created_at", { ascending: false })
          .limit(100)
      : Promise.resolve({ data: [] as { id: string; entity_type: string; entity_id: string; action: string; actor_id: string | null; created_at: string }[] }),
    postIds.length
      ? supabase
          .from("activity_logs")
          .select("id, entity_type, entity_id, action, actor_id, created_at")
          .eq("entity_type", "post")
          .in("entity_id", postIds)
          .order("created_at", { ascending: false })
          .limit(100)
      : Promise.resolve({ data: [] as { id: string; entity_type: string; entity_id: string; action: string; actor_id: string | null; created_at: string }[] }),
    taskIds.length
      ? supabase
          .from("approvals")
          .select("id, task_id, status, created_at")
          .in("task_id", taskIds)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] as { id: string; task_id: string; status: string; created_at: string }[] }),
  ]);

  const activities = [...(taskActivities ?? []), ...(postActivities ?? [])]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 100);

  return (
    <Client360Hub
      client={client}
      brandKit={brandKit}
      tasks={clientTasks ?? []}
      posts={clientPosts ?? []}
      notes={clientNotes ?? []}
      approvals={approvals ?? []}
      activities={activities}
      profiles={profiles ?? []}
      canManageNotes={me.role === "ADMIN" || me.role === "SUPERVISOR" || me.role === "SMM"}
    />
  );
}
