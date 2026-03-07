"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

interface PostRow {
  id: string;
  client_id: string;
  platform: string;
  type: string;
  publish_at: string;
  caption: string | null;
  status: string;
}

export function PostsList({ initialPosts, clientMap }: { initialPosts: PostRow[]; clientMap: Record<string, string> }) {
  const [posts, setPosts] = useState(initialPosts);
  const [clientFilter, setClientFilter] = useState("");
  const supabase = createClient();

  useEffect(() => {
    const channel = supabase
      .channel("smm-posts")
      .on("postgres_changes", { event: "*", schema: "public", table: "posts" }, () => {
        supabase.from("posts").select("id, client_id, platform, type, publish_at, caption, status").order("publish_at", { ascending: false }).then(({ data }) => setPosts(data ?? []));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const filtered = clientFilter ? posts.filter((p) => p.client_id === clientFilter) : posts;
  const clients = Array.from(new Set(posts.map((p) => p.client_id)));

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <select value={clientFilter} onChange={(e) => setClientFilter(e.target.value)} className="rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-white text-sm">
          <option value="">All clients</option>
          {clients.map((id) => <option key={id} value={id}>{clientMap[id] ?? id}</option>)}
        </select>
      </div>
      <div className="glass-card overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-go-glass-border">
              <th className="px-4 py-3 text-sm font-medium text-slate-400">Platform / Type</th>
              <th className="px-4 py-3 text-sm font-medium text-slate-400">Client</th>
              <th className="px-4 py-3 text-sm font-medium text-slate-400">Publish at</th>
              <th className="px-4 py-3 text-sm font-medium text-slate-400">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="border-b border-white/5">
                <td className="px-4 py-3 text-white">{p.platform} – {p.type}</td>
                <td className="px-4 py-3 text-slate-400">{clientMap[p.client_id] ?? "—"}</td>
                <td className="px-4 py-3 text-slate-400">{new Date(p.publish_at).toLocaleString()}</td>
                <td className="px-4 py-3"><span className="rounded-full bg-slate-600/50 px-2 py-0.5 text-xs">{p.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="p-8 text-center text-slate-500">No posts</div>}
      </div>
    </div>
  );
}
