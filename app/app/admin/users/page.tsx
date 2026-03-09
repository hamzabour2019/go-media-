import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/session";
import { UsersTable } from "./users-table";

export default async function AdminUsersPage() {
  await requireRole(["ADMIN"]);
  const supabase = await createClient();
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, name, role, email, is_active, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Users</h1>
      <UsersTable initialProfiles={profiles ?? []} />
    </div>
  );
}
