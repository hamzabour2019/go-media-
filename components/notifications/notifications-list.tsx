"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Notification } from "@/lib/types/database";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

export function NotificationsList({ initialItems }: { initialItems: Notification[] }) {
  const [items, setItems] = useState(initialItems);
  const supabase = createClient();

  useEffect(() => {
    const channel = supabase
      .channel("notifications-page")
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications" }, async () => {
        const { data } = await supabase.auth.getUser();
        if (!data.user) return;
        const { data: list } = await supabase.from("notifications").select("id, user_id, type, title, body, meta_json, is_read, created_at").eq("user_id", data.user.id).order("created_at", { ascending: false }).limit(50);
        setItems(list ?? []);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  async function markRead(id: string) {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  }

  return (
    <div className="glass-card divide-y divide-white/5">
      {items.length === 0 ? (
        <div className="p-8 text-center text-slate-500">No notifications</div>
      ) : (
        items.map((n) => (
          <div
            key={n.id}
            className={`p-4 hover:bg-white/5 transition duration-200 ${!n.is_read ? "bg-accent-soft" : ""}`}
          >
            <button type="button" onClick={() => markRead(n.id)} className="w-full text-left">
              <p className="font-medium text-slate-200">{n.title}</p>
              <p className="text-sm text-slate-500 mt-1">{n.body}</p>
              <p className="text-xs text-slate-600 mt-2">{formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}</p>
            </button>
            {n.meta_json && typeof (n.meta_json as { task_id?: string }).task_id === "string" && (
              <Link href={`/app/task/${(n.meta_json as { task_id: string }).task_id}`} className="text-accent-second hover:text-accent text-sm mt-2 inline-block transition duration-200">View task</Link>
            )}
          </div>
        ))
      )}
    </div>
  );
}
