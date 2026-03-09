"use server";

import { z } from "zod";
import { getActionProfile, type Role } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";

export type InviteResult = { ok: true; message: string } | { ok: false; error: string };

const assignableRoleSchema = z.enum(["ADMIN", "SUPERVISOR", "SMM", "DESIGNER", "EDITOR"]);
const inviteSchema = z.object({
  email: z.string().trim().email("Invalid email").max(160, "Email is too long"),
  role: assignableRoleSchema,
});
const createUserSchema = inviteSchema.extend({
  password: z.string().min(6, "Password must be at least 6 characters").max(72, "Password is too long"),
});
const updateRoleSchema = z.object({
  id: z.string().uuid("Invalid user id"),
  role: assignableRoleSchema,
});
const updateActiveSchema = z.object({
  id: z.string().uuid("Invalid user id"),
  isActive: z.boolean(),
});

async function requireAdminAccess() {
  const profile = await getActionProfile();
  if (!profile) {
    return { ok: false as const, error: "Your session is no longer active." };
  }
  if (profile.role !== "ADMIN") {
    return { ok: false as const, error: "Only administrators can manage users." };
  }
  return { ok: true as const, profile };
}

export async function inviteUserByEmail(email: string, role: Role): Promise<InviteResult> {
  const authz = await requireAdminAccess();
  if (!authz.ok) return authz;

  const parsed = inviteSchema.safeParse({ email, role });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid invite data." };
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Server not configured for invites." };
  }

  const { data, error } = await admin.auth.admin.inviteUserByEmail(parsed.data.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/login`,
  });
  if (error) return { ok: false, error: error.message };
  if (data?.user?.id) {
    const { error: profileError } = await admin
      .from("profiles")
      .update({ role: parsed.data.role, email: parsed.data.email })
      .eq("id", data.user.id);
    if (profileError) {
      return { ok: false, error: profileError.message };
    }
  }
  return { ok: true, message: "Invitation sent. User will set password from email link." };
}

export async function createUserWithPassword(email: string, password: string, role: Role): Promise<InviteResult> {
  const authz = await requireAdminAccess();
  if (!authz.ok) return authz;

  const parsed = createUserSchema.safeParse({ email, password, role });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid user data." };
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Server not configured." };
  }

  const { data, error } = await admin.auth.admin.createUser({
    email: parsed.data.email,
    password: parsed.data.password,
    email_confirm: true,
  });
  if (error) return { ok: false, error: error.message };
  if (data?.user?.id) {
    const { error: profileError } = await admin
      .from("profiles")
      .update({
        role: parsed.data.role,
        name: parsed.data.email.split("@")[0],
        email: parsed.data.email,
        is_active: true,
      })
      .eq("id", data.user.id);
    if (profileError) {
      return { ok: false, error: profileError.message };
    }
  }
  return { ok: true, message: "User created. They can sign in now." };
}

export async function updateUserRole(id: string, role: Role): Promise<InviteResult> {
  const authz = await requireAdminAccess();
  if (!authz.ok) return authz;

  const parsed = updateRoleSchema.safeParse({ id, role });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid role update." };
  }

  try {
    const admin = createAdminClient();
    const { error } = await admin.from("profiles").update({ role: parsed.data.role }).eq("id", parsed.data.id);
    if (error) return { ok: false, error: error.message };
    return { ok: true, message: "User role updated." };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Failed to update user role." };
  }
}

export async function setUserActiveState(id: string, isActive: boolean): Promise<InviteResult> {
  const authz = await requireAdminAccess();
  if (!authz.ok) return authz;

  const parsed = updateActiveSchema.safeParse({ id, isActive });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid user status update." };
  }

  try {
    const admin = createAdminClient();
    const { error } = await admin
      .from("profiles")
      .update({ is_active: parsed.data.isActive })
      .eq("id", parsed.data.id);
    if (error) return { ok: false, error: error.message };
    return { ok: true, message: parsed.data.isActive ? "User activated." : "User deactivated." };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Failed to update user status." };
  }
}
