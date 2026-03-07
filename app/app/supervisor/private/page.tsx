import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { PrivateTasksList } from "./private-tasks-list";

export default async function SupervisorPrivatePage() {
  const profile = await requireProfile();
  const supabase = await createClient();
  const { data: privateTasks } = await supabase
    .from("private_tasks")
    .select("id, title, status, due_at, notes, owner_id, created_at")
    .eq("owner_id", profile.id)
    .order("due_at", { ascending: true });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Private Workspace</h1>
      <PrivateTasksList initialTasks={privateTasks ?? []} />
    </div>
  );
}
