"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getActionProfile } from "@/lib/auth/session";
import { TASK_STATUSES, type TaskStatus } from "@/lib/workflows";

type TaskActionResult<T = undefined> =
  | { ok: true; data: T; message?: string }
  | { ok: false; error: string };

const createTaskSchema = z.object({
  clientId: z.string().uuid("Invalid client"),
  type: z.string().trim().min(1, "Task type is required").max(120, "Task type is too long"),
  assigneeId: z.string().uuid("Invalid assignee").optional().or(z.literal("")),
  dueAt: z.string().datetime("Invalid deadline"),
  priority: z.number().int().min(1).max(10),
  postId: z.string().uuid("Invalid post").optional().or(z.literal("")),
});

const reassignTaskSchema = z.object({
  taskId: z.string().uuid("Invalid task"),
  assigneeId: z.string().uuid("Invalid assignee").optional().or(z.literal("")),
});

const transitionTaskSchema = z.object({
  taskId: z.string().uuid("Invalid task"),
  targetStatus: z.enum(TASK_STATUSES),
  note: z.string().trim().max(500, "Note is too long").optional().or(z.literal("")),
});

const taskOutputSchema = z.object({
  taskId: z.string().uuid("Invalid task"),
  outputUrl: z.string().trim().url("Invalid output URL").optional().or(z.literal("")),
  filePath: z.string().trim().max(400, "File path is too long").optional().or(z.literal("")),
  fileName: z.string().trim().max(240, "File name is too long").optional().or(z.literal("")),
});

const signedUrlSchema = z.object({
  taskId: z.string().uuid("Invalid task"),
});

export async function createTaskAction(
  input: z.infer<typeof createTaskSchema>
): Promise<TaskActionResult<{ id: string }>> {
  const parsed = createTaskSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid task data." };
  }

  const profile = await getActionProfile();
  if (!profile) return { ok: false, error: "Your session is no longer active." };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_task_workflow", {
    p_client_id: parsed.data.clientId,
    p_type: parsed.data.type,
    p_title: parsed.data.type,
    p_assignee_id: parsed.data.assigneeId || null,
    p_due_at: parsed.data.dueAt,
    p_priority: parsed.data.priority,
    p_post_id: parsed.data.postId || null,
  });

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Failed to create task." };
  }
  const row = Array.isArray(data) ? data[0] : data;

  return { ok: true, data: { id: row.id as string }, message: "Task created." };
}

export async function reassignTaskAction(
  input: z.infer<typeof reassignTaskSchema>
): Promise<TaskActionResult<{ assignee_id: string | null }>> {
  const parsed = reassignTaskSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid task assignment." };
  }

  const profile = await getActionProfile();
  if (!profile) return { ok: false, error: "Your session is no longer active." };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("reassign_task_workflow", {
    p_task_id: parsed.data.taskId,
    p_assignee_id: parsed.data.assigneeId || null,
  });

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Failed to update assignee." };
  }
  const row = Array.isArray(data) ? data[0] : data;

  return {
    ok: true,
    data: { assignee_id: (row.assignee_id as string | null) ?? null },
    message: "Task assignment updated.",
  };
}

export async function transitionTaskAction(
  input: z.infer<typeof transitionTaskSchema>
): Promise<TaskActionResult<{ status: TaskStatus }>> {
  const parsed = transitionTaskSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid task transition." };
  }

  const profile = await getActionProfile();
  if (!profile) return { ok: false, error: "Your session is no longer active." };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("transition_task_workflow", {
    p_task_id: parsed.data.taskId,
    p_target_status: parsed.data.targetStatus,
    p_note: parsed.data.note || null,
  });

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Failed to update task status." };
  }
  const row = Array.isArray(data) ? data[0] : data;

  return {
    ok: true,
    data: { status: row.status as TaskStatus },
    message: "Task updated.",
  };
}

export async function saveTaskOutputAction(
  input: z.infer<typeof taskOutputSchema>
): Promise<TaskActionResult<{ output_json: Record<string, unknown> | null }>> {
  const parsed = taskOutputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid task output." };
  }

  const profile = await getActionProfile();
  if (!profile) return { ok: false, error: "Your session is no longer active." };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("save_task_output_workflow", {
    p_task_id: parsed.data.taskId,
    p_output_url: parsed.data.outputUrl || null,
    p_file_path: parsed.data.filePath || null,
    p_file_name: parsed.data.fileName || null,
  });

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Failed to save task output." };
  }
  const row = Array.isArray(data) ? data[0] : data;

  return {
    ok: true,
    data: { output_json: (row.output_json as Record<string, unknown> | null) ?? null },
    message: "Task output saved.",
  };
}

export async function getTaskOutputDownloadUrlAction(
  input: z.infer<typeof signedUrlSchema>
): Promise<TaskActionResult<{ signedUrl: string }>> {
  const parsed = signedUrlSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid task file request." };
  }

  const profile = await getActionProfile();
  if (!profile) return { ok: false, error: "Your session is no longer active." };

  const supabase = await createClient();
  const { data: task, error } = await supabase
    .from("tasks")
    .select("output_json")
    .eq("id", parsed.data.taskId)
    .single();

  if (error || !task) {
    return { ok: false, error: error?.message ?? "Task output not found." };
  }

  const filePath = (task.output_json as { file_path?: string } | null)?.file_path;
  if (!filePath) {
    return { ok: false, error: "No private file is attached to this task." };
  }

  const { data: signed, error: signedError } = await supabase.storage
    .from("task-outputs")
    .createSignedUrl(filePath, 60 * 10);

  if (signedError || !signed?.signedUrl) {
    return { ok: false, error: signedError?.message ?? "Failed to open file." };
  }

  return { ok: true, data: { signedUrl: signed.signedUrl } };
}
