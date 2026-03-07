import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { NotificationsList } from "@/components/notifications/notifications-list";

export default async function NotificationsPage() {
  await requireProfile();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: items } = await supabase
    .from("notifications")
    .select("id, user_id, type, title, body, meta_json, is_read, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Notifications</h1>
      <NotificationsList initialItems={items ?? []} />
    </div>
  );
}
