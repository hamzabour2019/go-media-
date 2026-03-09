export const TASK_STATUSES = [
  "todo",
  "in_progress",
  "review",
  "approved",
  "changes_requested",
] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];

export const POST_STATUSES = [
  "draft",
  "pending_approval",
  "scheduled",
  "published",
] as const;

export type PostStatus = (typeof POST_STATUSES)[number];

const ASSIGNEE_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  todo: ["todo", "in_progress"],
  in_progress: ["in_progress", "review"],
  review: ["review"],
  approved: ["approved"],
  changes_requested: ["changes_requested", "in_progress"],
};

const MANAGER_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  todo: ["todo", "in_progress"],
  in_progress: ["in_progress", "review"],
  review: ["review", "approved", "changes_requested"],
  approved: ["approved"],
  changes_requested: ["changes_requested", "in_progress"],
};

export function getAllowedTaskStatusChoices(
  currentStatus: string,
  {
    isAssignee,
    isManager,
  }: {
    isAssignee: boolean;
    isManager: boolean;
  }
) {
  if (!TASK_STATUSES.includes(currentStatus as TaskStatus)) {
    return [];
  }

  const key = currentStatus as TaskStatus;
  if (isManager) return MANAGER_TRANSITIONS[key];
  if (isAssignee) return ASSIGNEE_TRANSITIONS[key];
  return [key];
}
