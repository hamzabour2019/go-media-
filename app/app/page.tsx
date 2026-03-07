import { redirect } from "next/navigation";
import { requireProfile, getRedirectPath } from "@/lib/auth/session";

export default async function AppRoot() {
  const profile = await requireProfile();
  const path = await getRedirectPath(profile.role);
  redirect(path);
}
