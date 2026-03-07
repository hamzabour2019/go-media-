"use client";

import { useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/types/database";
import type { Role } from "@/lib/auth/session";
import { StatusChip } from "@/components/ui/status-chip";
import { EmptyState } from "@/components/ui/empty-state";
import { Drawer } from "@/components/ui/drawer";
import { InviteUserForm } from "./invite-user-form";
import { Users } from "lucide-react";
import { toast } from "sonner";

const ROLES: Role[] = ["ADMIN", "SUPERVISOR", "SMM", "DESIGNER", "EDITOR"];

export function UsersTable({ initialProfiles }: { initialProfiles: Profile[] }) {
  const [profiles, setProfiles] = useState(initialProfiles);
  const [updating, setUpdating] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [inviteOpen, setInviteOpen] = useState(false);
  const supabase = createClient();

  const filtered = useMemo(() => {
    return profiles.filter((p) => {
      if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !(p.email ?? "").toLowerCase().includes(search.toLowerCase())) return false;
      if (roleFilter && p.role !== roleFilter) return false;
      if (statusFilter === "active" && !(p.is_active !== false)) return false;
      if (statusFilter === "inactive" && p.is_active !== false) return false;
      return true;
    });
  }, [profiles, search, roleFilter, statusFilter]);

  async function updateRole(id: string, role: Role) {
    setUpdating(id);
    const { error } = await supabase.from("profiles").update({ role }).eq("id", id);
    if (error) toast.error(error.message);
    else setProfiles((prev) => prev.map((p) => (p.id === id ? { ...p, role } : p)));
    setUpdating(null);
  }

  async function toggleActive(id: string, current: boolean) {
    setUpdating(id);
    const { error } = await supabase.from("profiles").update({ is_active: !current }).eq("id", id);
    if (error) toast.error(error.message);
    else {
      setProfiles((prev) => prev.map((p) => (p.id === id ? { ...p, is_active: !current } : p)));
      toast.success(current ? "User deactivated" : "User activated");
    }
    setUpdating(null);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="search"
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder-slate-500 w-56"
        />
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white">
          <option value="">All roles</option>
          {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white">
          <option value="">All status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <button type="button" onClick={() => setInviteOpen(true)} className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-second transition duration-200">
          Invite / Create user
        </button>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-go-glass-border">
                <th className="px-4 py-3 text-sm font-medium text-slate-400">Name</th>
                <th className="px-4 py-3 text-sm font-medium text-slate-400">Email</th>
                <th className="px-4 py-3 text-sm font-medium text-slate-400">Role</th>
                <th className="px-4 py-3 text-sm font-medium text-slate-400">Status</th>
                <th className="px-4 py-3 text-sm font-medium text-slate-400">Created</th>
                <th className="px-4 py-3 text-sm font-medium text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-b border-white/5">
                  <td className="px-4 py-3 font-medium text-white">{p.name}</td>
                  <td className="px-4 py-3 text-slate-400 text-sm">{p.email ?? "—"}</td>
                  <td className="px-4 py-3">
                    <select
                      value={p.role}
                      disabled={updating === p.id}
                      onChange={(e) => updateRole(p.id, e.target.value as Role)}
                      className="rounded bg-white/10 border border-white/10 px-2 py-1 text-sm text-white"
                    >
                      {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <StatusChip status={p.is_active === false ? "inactive" : "active"} />
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-sm">{new Date(p.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      disabled={updating === p.id}
                      onClick={() => toggleActive(p.id, p.is_active !== false)}
                      className="text-sm text-slate-400 hover:text-white"
                    >
                      {p.is_active === false ? "Activate" : "Deactivate"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <EmptyState
            title="No users match"
            description={profiles.length === 0 ? "Invite or create a user to get started." : "Try changing search or filters."}
            actionLabel={profiles.length === 0 ? "Invite user" : undefined}
            onAction={profiles.length === 0 ? () => setInviteOpen(true) : undefined}
            icon={<Users className="h-12 w-12" />}
          />
        )}
      </div>

      <Drawer open={inviteOpen} onClose={() => setInviteOpen(false)} title="Invite / Create user" width="md">
        <InviteUserForm onSuccess={() => { setInviteOpen(false); window.location.reload(); }} />
      </Drawer>
    </div>
  );
}
