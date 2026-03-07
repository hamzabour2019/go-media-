import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { TasksList } from "./tasks-list";

export default async function AppTasksPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const isAdminOrSupervisor = profile.role === "ADMIN" || profile.role === "SUPERVISOR";
  let query = supabase.from("tasks").select("id, type, status, due_at, client_id, assignee_id, priority");

  if (!isAdminOrSupervisor) {
    query = query.eq("assignee_id", profile.id);
  }
  const { data: tasks } = await query.order("due_at", { ascending: true });

  const clientIds = Array.from(new Set((tasks ?? []).map((t) => t.client_id).filter(Boolean)));
  const { data: clients } = clientIds.length ? await supabase.from("clients").select("id, name").in("id", clientIds) : { data: [] };
  const clientMap = Object.fromEntries((clients ?? []).map((c) => [c.id, c.name]));

  const { data: profiles } = await supabase.from("profiles").select("id, name");
  const profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p.name]));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Tasks</h1>
      <TasksList
        initialTasks={tasks ?? []}
        clientMap={clientMap}
        profileMap={profileMap ?? {}}
        isAdminOrSupervisor={isAdminOrSupervisor}
      />
    </div>
  );
}
