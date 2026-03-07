"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
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
  const supabase = createClient();

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

  return (
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
                  <Link href={`/app/admin/clients/${c.id}`} className="text-accent-second hover:text-accent transition duration-200 text-sm">
                    Edit / Brand Kit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
