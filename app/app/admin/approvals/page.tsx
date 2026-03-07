import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { ApprovalList } from "./approval-list";

export default async function AdminApprovalsPage() {
  const supabase = await createClient();
  const { data: tasks } = await supabase
    .from("tasks")
    .select("id, type, status, due_at, client_id, assignee_id, output_json, fields_json")
    .eq("status", "review")
    .order("due_at", { ascending: true });

  const clientIds = Array.from(new Set((tasks ?? []).map((t) => t.client_id)));
  const { data: clients } = await supabase.from("clients").select("id, name").in("id", clientIds);
  const clientMap = Object.fromEntries((clients ?? []).map((c) => [c.id, c.name]));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Approval Hub</h1>
      <ApprovalList initialTasks={tasks ?? []} clientMap={clientMap} showPreview />
    </div>
  );
}
