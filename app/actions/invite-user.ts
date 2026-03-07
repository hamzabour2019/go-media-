"use server";

import { createClient } from "@supabase/supabase-js";

export type InviteResult = { ok: true; message: string } | { ok: false; error: string };

export async function inviteUserByEmail(email: string, role: string): Promise<InviteResult> {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!serviceKey || !url) {
    return { ok: false, error: "Server not configured for invites. Set SUPABASE_SERVICE_ROLE_KEY and run invite from Supabase Dashboard." };
  }
  const supabase = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/login`,
  });
  if (error) return { ok: false, error: error.message };
  if (data?.user?.id) {
    await supabase.from("profiles").update({ role, email }).eq("id", data.user.id);
  }
  return { ok: true, message: "Invitation sent. User will set password from email link." };
}

export async function createUserWithPassword(email: string, password: string, role: string): Promise<InviteResult> {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!serviceKey || !url) {
    return { ok: false, error: "Server not configured. Set SUPABASE_SERVICE_ROLE_KEY." };
  }
  const supabase = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data, error } = await supabase.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) return { ok: false, error: error.message };
  if (data?.user?.id) {
    await supabase.from("profiles").update({ role, name: email.split("@")[0], email }).eq("id", data.user.id);
  }
  return { ok: true, message: "User created. They can sign in now." };
}
