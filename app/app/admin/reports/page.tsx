import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/session";

const ReportsClient = dynamic(
  () => import("./reports-client").then((m) => ({ default: m.ReportsClient })),
  { ssr: false }
);

export default async function AdminReportsPage() {
  await requireRole(["ADMIN"]);
  const supabase = await createClient();
  const [
    { data: tasks },
    { data: profiles },
    { data: clients },
  ] = await Promise.all([
    supabase.from("tasks").select("id, status, assignee_id, client_id, due_at, created_at").order("created_at", { ascending: false }),
    supabase.from("profiles").select("id, name, role"),
    supabase.from("clients").select("id, name"),
  ]);

  const profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p.name]));
  const clientMap = Object.fromEntries((clients ?? []).map((c) => [c.id, c.name]));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Reports</h1>
      <ReportsClient tasks={tasks ?? []} profileMap={profileMap} clientMap={clientMap} />
    </div>
  );
}
