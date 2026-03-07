export type Role = "ADMIN" | "SUPERVISOR" | "SMM" | "DESIGNER" | "EDITOR";

export interface Profile {
  id: string;
  name: string;
  role: Role;
  email?: string | null;
  address?: string | null;
  phone?: string | null;
  avatar_url?: string | null;
  notes?: string | null;
  is_active?: boolean;
  created_at: string;
}

export interface Client {
  id: string;
  name: string;
  notes: string | null;
  email?: string | null;
  phone?: string | null;
  status?: string;
  created_by: string;
  created_at: string;
}

export interface BrandKit {
  client_id: string;
  logo_url: string | null;
  colors_json: Record<string, string> | null;
  fonts_json: Record<string, string> | null;
  guidelines_url: string | null;
}

export interface Post {
  id: string;
  client_id: string;
  platform: string;
  type: string;
  publish_at: string;
  caption: string | null;
  hashtags: string[] | null;
  media_url: string | null;
  status: string;
  created_at: string;
}

export type TaskStatus =
  | "todo"
  | "in_progress"
  | "review"
  | "approved"
  | "changes_requested";

export interface Task {
  id: string;
  client_id: string;
  post_id: string | null;
  type: string;
  title?: string | null;
  description?: string | null;
  status: TaskStatus;
  assignee_id: string | null;
  assigned_by?: string | null;
  start_at?: string | null;
  due_at: string | null;
  priority: number;
  fields_json: Record<string, unknown> | null;
  output_json: Record<string, unknown> | null;
  created_at: string;
}

export interface DynamicField {
  id: string;
  role: string;
  task_type: string;
  schema_json: Record<string, unknown>;
  is_active: boolean;
}

export interface Comment {
  id: string;
  task_id: string;
  author_id: string;
  body: string;
  created_at: string;
}

export interface Approval {
  id: string;
  task_id: string;
  status: string;
  approver_id: string;
  note: string | null;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  meta_json: Record<string, unknown> | null;
  is_read: boolean;
  created_at: string;
}

export interface PrivateTask {
  id: string;
  owner_id: string;
  title: string;
  status: string;
  due_at: string | null;
  notes: string | null;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  actor_id: string;
  meta_json: Record<string, unknown> | null;
  created_at: string;
}
