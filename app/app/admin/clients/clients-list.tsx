"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { StatusChip } from "@/components/ui/status-chip";

interface ClientRow {
  id: string;
  name: string;
  notes: string | null;
  email?: string | null;
  phone?: string | null;
  status?: string | null;
  created_at: string;
}

export function ClientsList({ initialClients }: { initialClients: ClientRow[] }) {
  const [clients, setClients] = useState(initialClients);
  const [editingClient, setEditingClient] = useState<ClientRow | null>(null);
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formStatus, setFormStatus] = useState("active");
  const [formNotes, setFormNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const channel = supabase
      .channel("clients")
      .on("postgres_changes", { event: "*", schema: "public", table: "clients" }, () => {
        supabase.from("clients").select("id, name, notes, email, phone, status, created_at").order("created_at", { ascending: false }).then(({ data }) => setClients(data ?? []));
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  function startEdit(client: ClientRow) {
    setEditingClient(client);
    setFormName(client.name);
    setFormEmail(client.email ?? "");
    setFormPhone(client.phone ?? "");
    setFormStatus(client.status ?? "active");
    setFormNotes(client.notes ?? "");
  }

  async function saveClientEdits() {
    if (!editingClient || !formName.trim()) return;
    setSaving(true);
    const payload = {
      name: formName.trim(),
      email: formEmail.trim() || null,
      phone: formPhone.trim() || null,
      status: formStatus || "active",
      notes: formNotes.trim() || null,
    };
    const { error } = await supabase.from("clients").update(payload).eq("id", editingClient.id);
    setSaving(false);
    if (error) {
      console.error(error);
      return;
    }
    setClients((prev) =>
      prev.map((client) => (client.id === editingClient.id ? { ...client, ...payload } : client))
    );
    setEditingClient(null);
    router.refresh();
  }

  async function deleteClient(client: ClientRow) {
    const confirmed = window.confirm(
      `Delete client "${client.name}"? This will also remove related posts, tasks, brand kit and notes.`
    );
    if (!confirmed) return;
    setDeletingId(client.id);
    const { error } = await supabase.from("clients").delete().eq("id", client.id);
    setDeletingId(null);
    if (error) {
      console.error(error);
      return;
    }
    setClients((prev) => prev.filter((row) => row.id !== client.id));
    router.refresh();
  }

  return (
    <>
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-go-glass-border">
                <th className="px-4 py-3 text-sm font-medium text-slate-400">Name</th>
                <th className="px-4 py-3 text-sm font-medium text-slate-400">Contact</th>
                <th className="px-4 py-3 text-sm font-medium text-slate-400">Status</th>
                <th className="px-4 py-3 text-sm font-medium text-slate-400">Created</th>
                <th className="px-4 py-3 text-sm font-medium text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => (
                <tr key={c.id} className="border-b border-white/5">
                  <td className="px-4 py-3 font-medium text-white">{c.name}</td>
                  <td className="px-4 py-3 text-slate-400 text-sm">{[c.email, c.phone].filter(Boolean).join(" · ") || "—"}</td>
                  <td className="px-4 py-3">
                    <StatusChip status={c.status ?? "active"} />
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-sm">{new Date(c.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-3 text-sm">
                      <Link href={`/app/admin/clients/${c.id}`} className="text-accent-second hover:text-accent transition duration-200">
                        Open
                      </Link>
                      <button type="button" onClick={() => startEdit(c)} className="text-accent-second hover:text-accent transition duration-200">
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteClient(c)}
                        disabled={deletingId === c.id}
                        className="text-rose-400 hover:text-rose-300 disabled:opacity-50 transition duration-200"
                      >
                        {deletingId === c.id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {editingClient && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm p-4" onClick={() => setEditingClient(null)} aria-hidden>
          <div
            className="mx-auto mt-10 max-w-lg rounded-xl border border-white/10 bg-slate-900/95 p-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-white font-medium mb-3">Edit client</h3>
            <div className="space-y-3">
              <input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Client name" className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-white" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input value={formEmail} onChange={(e) => setFormEmail(e.target.value)} placeholder="Email" className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-white" />
                <input value={formPhone} onChange={(e) => setFormPhone(e.target.value)} placeholder="Phone" className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-white" />
              </div>
              <select value={formStatus} onChange={(e) => setFormStatus(e.target.value)} className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-white">
                <option value="active">active</option>
                <option value="inactive">inactive</option>
                <option value="pending_verification">pending_verification</option>
                <option value="banned">banned</option>
              </select>
              <textarea value={formNotes} onChange={(e) => setFormNotes(e.target.value)} rows={3} placeholder="Notes" className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-white" />
              <div className="flex gap-2">
                <button type="button" onClick={saveClientEdits} disabled={saving} className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-second disabled:opacity-50 transition duration-200">
                  {saving ? "Saving..." : "Save"}
                </button>
                <button type="button" onClick={() => setEditingClient(null)} className="rounded-lg bg-white/10 px-4 py-2 text-sm text-slate-300">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
