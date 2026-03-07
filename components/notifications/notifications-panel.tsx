"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Notification } from "@/lib/types/database";
import { formatDistanceToNow } from "date-fns";

export function NotificationsPanel({ onClose }: { onClose: () => void }) {
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchNotifications() {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      setItems((data as Notification[]) ?? []);
      setLoading(false);
    }
    fetchNotifications();

    const channel = supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications" },
        () => fetchNotifications()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function markRead(id: string) {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  }

  return (
    <div
      className="absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-1rem)] max-h-[70vh] overflow-auto glass-card border border-go-glass-border rounded-xl shadow-xl z-50"
      role="dialog"
      aria-label="Notifications"
    >
      <div className="p-3 border-b border-go-glass-border flex items-center justify-between">
        <h3 className="font-medium text-sm">Notifications</h3>
        <button
          type="button"
          onClick={onClose}
          className="text-slate-500 hover:text-slate-300 text-sm"
        >
          Close
        </button>
      </div>
      <div className="divide-y divide-white/5">
        {loading ? (
          <div className="p-4 text-center text-slate-500 text-sm">Loading…</div>
        ) : items.length === 0 ? (
          <div className="p-4 text-center text-slate-500 text-sm">No notifications</div>
        ) : (
          items.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => markRead(n.id)}
              className={`w-full text-left p-3 hover:bg-white/5 transition duration-200 ${!n.is_read ? "bg-accent-soft" : ""}`}
            >
              <p className="text-sm font-medium text-slate-200">{n.title}</p>
              <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.body}</p>
              <p className="text-xs text-slate-600 mt-1">
                {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
              </p>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
