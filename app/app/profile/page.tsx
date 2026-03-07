import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "./profile-form";
import type { ProfileForForm } from "./profile-form";

export default async function ProfilePage() {
  const profile = await requireProfile();
  const supabase = await createClient();
  const { data: current } = await supabase.from("profiles").select("*").eq("id", profile.id).single();

  const formProfile: ProfileForForm = current ?? {
    id: profile.id,
    name: profile.name,
    role: profile.role,
    email: (profile as { email?: string | null }).email ?? null,
    address: null,
    phone: null,
    avatar_url: null,
    notes: null,
  };

  return (
    <div className="space-y-6 max-w-lg">
      <h1 className="text-2xl font-bold text-white">بروفايلي</h1>
      <ProfileForm profile={formProfile} />
    </div>
  );
}
