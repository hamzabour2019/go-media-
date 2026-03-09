import { redirect } from "next/navigation";
import { getRedirectPath, requireProfile } from "@/lib/auth/session";

export default async function Home() {
  const profile = await requireProfile();
  const path = await getRedirectPath(profile.role);
  redirect(path);
}
