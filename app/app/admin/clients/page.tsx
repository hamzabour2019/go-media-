import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Plus } from "lucide-react";
import { ClientsList } from "./clients-list";

export default async function AdminClientsPage() {
  const supabase = await createClient();
  const { data: clients } = await supabase
    .from("clients")
    .select("id, name, notes, email, phone, status, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Clients</h1>
        <Link
          href="/app/admin/clients/new"
          className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-second transition duration-200"
        >
          <Plus className="h-4 w-4" /> Add Client
        </Link>
      </div>
      <ClientsList initialClients={clients ?? []} />
    </div>
  );
}
