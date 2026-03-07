import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { PostsList } from "./posts-list";

export default async function SMMPostsPage() {
  const supabase = await createClient();
  const { data: posts } = await supabase.from("posts").select("id, client_id, platform, type, publish_at, caption, status").order("publish_at", { ascending: false });
  const clientIds = Array.from(new Set((posts ?? []).map((p) => p.client_id)));
  const { data: clients } = clientIds.length ? await supabase.from("clients").select("id, name").in("id", clientIds) : { data: [] };
  const clientMap = Object.fromEntries((clients ?? []).map((c) => [c.id, c.name]));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Posts</h1>
      <PostsList initialPosts={posts ?? []} clientMap={clientMap} />
    </div>
  );
}
