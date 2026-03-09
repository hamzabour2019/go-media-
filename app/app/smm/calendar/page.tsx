import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const CalendarView = dynamic(
  () => import("./calendar-view").then((m) => ({ default: m.CalendarView })),
  { ssr: false }
);

export default async function SMMCalendarPage() {
  const supabase = await createClient();
  const admin = createAdminClient();
  const { data: clients } = await admin.from("clients").select("id, name").order("name", { ascending: true });
  const { data: assignees } = await admin
    .from("profiles")
    .select("id, name, role, is_active")
    .in("role", ["SMM", "DESIGNER", "EDITOR"])
    .or("is_active.is.null,is_active.eq.true")
    .order("name", { ascending: true });
  const { data: linkedTasks } = await admin
    .from("tasks")
    .select("post_id, assignee_id")
    .not("post_id", "is", null)
    .not("assignee_id", "is", null);
  const { data: posts } = await supabase
    .from("posts")
    .select("id, client_id, platform, type, publish_at, caption, status, media_url")
    .order("publish_at", { ascending: true });

  const initialPostAssignees: Record<string, string[]> = {};
  for (const row of linkedTasks ?? []) {
    const postId = row.post_id as string | null;
    const assigneeId = row.assignee_id as string | null;
    if (!postId || !assigneeId) continue;
    if (!initialPostAssignees[postId]) initialPostAssignees[postId] = [];
    if (!initialPostAssignees[postId].includes(assigneeId)) {
      initialPostAssignees[postId].push(assigneeId);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Content Calendar</h1>
      <CalendarView
        initialClients={clients ?? []}
        initialPosts={posts ?? []}
        initialAssignees={(assignees ?? []).map((a) => ({ id: a.id, name: a.name }))}
        initialPostAssignees={initialPostAssignees}
      />
    </div>
  );
}
