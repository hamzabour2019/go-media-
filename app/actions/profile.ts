"use server";

import { z } from "zod";
import { getActionProfile } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";

type ActionResult = { ok: true; message: string } | { ok: false; error: string };

const profileSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120, "Name is too long"),
  address: z.string().trim().max(240, "Address is too long").optional().or(z.literal("")),
  email: z.string().trim().email("Invalid contact email").max(160, "Email is too long").optional().or(z.literal("")),
  phone: z.string().trim().max(40, "Phone is too long").optional().or(z.literal("")),
  notes: z.string().trim().max(1000, "Notes are too long").optional().or(z.literal("")),
});

const avatarSchema = z.object({
  avatarUrl: z.string().url("Invalid avatar URL"),
});

export async function updateMyProfile(input: z.infer<typeof profileSchema>): Promise<ActionResult> {
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid profile data." };
  }

  const profile = await getActionProfile();
  if (!profile) {
    return { ok: false, error: "Your session is no longer active." };
  }

  try {
    const admin = createAdminClient();
    const { error } = await admin
      .from("profiles")
      .update({
        name: parsed.data.name,
        address: parsed.data.address || null,
        email: parsed.data.email || null,
        phone: parsed.data.phone || null,
        notes: parsed.data.notes || null,
      })
      .eq("id", profile.id);

    if (error) {
      return { ok: false, error: error.message };
    }

    return { ok: true, message: "Profile updated." };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Failed to update profile." };
  }
}

export async function updateMyAvatar(input: z.infer<typeof avatarSchema>): Promise<ActionResult> {
  const parsed = avatarSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid avatar URL." };
  }

  const profile = await getActionProfile();
  if (!profile) {
    return { ok: false, error: "Your session is no longer active." };
  }

  try {
    const admin = createAdminClient();
    const { error } = await admin
      .from("profiles")
      .update({ avatar_url: parsed.data.avatarUrl })
      .eq("id", profile.id);

    if (error) {
      return { ok: false, error: error.message };
    }

    return { ok: true, message: "Avatar updated." };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Failed to update avatar." };
  }
}
