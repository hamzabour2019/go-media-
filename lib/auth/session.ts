import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export type Role = "ADMIN" | "SUPERVISOR" | "SMM" | "DESIGNER" | "EDITOR";

export const DASHBOARD_BY_ROLE: Record<Role, string> = {
  ADMIN: "/app/admin",
  SUPERVISOR: "/app/supervisor",
  SMM: "/app/smm",
  DESIGNER: "/app/designer",
  EDITOR: "/app/editor",
};

export async function getSession() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
}

export async function getProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  return profile as { id: string; name: string; role: Role; created_at: string } | null;
}

export async function requireAuth() {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

export async function requireProfile() {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  return profile;
}

export async function getRedirectPath(role: string): Promise<string> {
  const path = DASHBOARD_BY_ROLE[role as Role];
  return path ?? "/app/admin";
}
