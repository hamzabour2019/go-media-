"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getActionProfile } from "@/lib/auth/session";
import { POST_STATUSES } from "@/lib/workflows";

type PostActionResult<T = undefined> =
  | { ok: true; data: T; message?: string }
  | { ok: false; error: string };

const createPostSchema = z.object({
  clientId: z.string().uuid("Invalid client"),
  platform: z.string().trim().min(1, "Platform is required").max(60, "Platform is too long"),
  type: z.string().trim().min(1, "Post type is required").max(100, "Post type is too long"),
  publishAt: z.string().datetime("Invalid publish time"),
  caption: z.string().trim().max(2000, "Caption is too long").optional().or(z.literal("")),
  status: z.enum(POST_STATUSES),
  mediaUrl: z.string().trim().url("Invalid media URL").optional().or(z.literal("")),
  assigneeId: z.string().uuid("Invalid assignee").optional().or(z.literal("")),
});

const rescheduleSchema = z.object({
  postId: z.string().uuid("Invalid post"),
  publishAt: z.string().datetime("Invalid publish time"),
});

export async function createPostAction(
  input: z.infer<typeof createPostSchema>
): Promise<
  PostActionResult<{
    id: string;
    client_id: string;
    platform: string;
    type: string;
    publish_at: string;
    caption: string | null;
    status: string;
    media_url: string | null;
    created_at?: string;
  }>
> {
  const parsed = createPostSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid post data." };
  }

  const profile = await getActionProfile();
  if (!profile) return { ok: false, error: "Your session is no longer active." };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_post_with_tasks_workflow", {
    p_client_id: parsed.data.clientId,
    p_platform: parsed.data.platform,
    p_type: parsed.data.type,
    p_publish_at: parsed.data.publishAt,
    p_caption: parsed.data.caption || null,
    p_status: parsed.data.status,
    p_media_url: parsed.data.mediaUrl || null,
    p_assignee_id: parsed.data.assigneeId || null,
  });

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Failed to create post." };
  }
  const row = Array.isArray(data) ? data[0] : data;

  return { ok: true, data: row };
}

export async function reschedulePostAction(
  input: z.infer<typeof rescheduleSchema>
): Promise<PostActionResult<{ publish_at: string }>> {
  const parsed = rescheduleSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid post schedule." };
  }

  const profile = await getActionProfile();
  if (!profile) return { ok: false, error: "Your session is no longer active." };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("reschedule_post_with_tasks_workflow", {
    p_post_id: parsed.data.postId,
    p_publish_at: parsed.data.publishAt,
  });

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Failed to reschedule post." };
  }
  const row = Array.isArray(data) ? data[0] : data;

  return {
    ok: true,
    data: { publish_at: row.publish_at as string },
    message: "Post schedule updated.",
  };
}
