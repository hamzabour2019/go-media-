import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export type Role = "ADMIN" | "SUPERVISOR" | "SMM" | "DESIGNER" | "EDITOR";
export type AppProfile = {
  id: string;
  name: string;
  role: Role;
  email?: string | null;
  address?: string | null;
  phone?: string | null;
  avatar_url?: string | null;
  notes?: string | null;
  is_active?: boolean | null;
  created_at: string;
};

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
  return profile as AppProfile | null;
}

export async function requireAuth() {
  const session = await getSession();
  if (!session) redirect("/login");
  await requireProfile();
  return session;
}

export async function requireProfile() {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  if (profile.is_active === false) redirect("/login?reason=inactive");
  return profile;
}

export async function requireRole(allowedRoles: Role[]) {
  const profile = await requireProfile();
  if (!allowedRoles.includes(profile.role)) {
    redirect(await getRedirectPath(profile.role));
  }
  return profile;
}

export async function getActionProfile() {
  const profile = await getProfile();
  if (!profile || profile.is_active === false) return null;
  return profile;
}

export async function getRedirectPath(role: string): Promise<string> {
  const path = DASHBOARD_BY_ROLE[role as Role];
  return path ?? "/app/admin";
}
