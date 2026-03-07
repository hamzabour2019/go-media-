import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth/session";
import { TaskControlCenter } from "@/app/app/admin/tasks/task-control-center";

export default async function SupervisorTasksPage() {
  await requireProfile();
  const supabase = await createClient();
  const { data: clients } = await supabase.from("clients").select("id, name").order("name");
  const { data: profiles } = await supabase.from("profiles").select("id, name, role").order("name");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Task Control Center</h1>
      <TaskControlCenter clients={clients ?? []} profiles={profiles ?? []} />
    </div>
  );
}
