import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/server";

const CalendarView = dynamic(
  () => import("./calendar-view").then((m) => ({ default: m.CalendarView })),
  { ssr: false }
);

export default async function SMMCalendarPage() {
  const supabase = await createClient();
  const { data: clients } = await supabase.from("clients").select("id, name");
  const { data: assignees } = await supabase
    .from("profiles")
    .select("id, name, role, is_active")
    .in("role", ["SMM", "DESIGNER", "EDITOR"])
    .or("is_active.is.null,is_active.eq.true")
    .order("name", { ascending: true });
  const { data: posts } = await supabase
    .from("posts")
    .select("id, client_id, platform, type, publish_at, caption, status, media_url")
    .order("publish_at", { ascending: true });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Content Calendar</h1>
      <CalendarView
        initialClients={clients ?? []}
        initialPosts={posts ?? []}
        initialAssignees={(assignees ?? []).map((a) => ({ id: a.id, name: a.name }))}
      />
    </div>
  );
}
