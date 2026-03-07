import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getProfile, getRedirectPath } from "@/lib/auth/session";

export default async function Home() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  const profile = await getProfile();
  if (!profile) {
    redirect("/login");
  }
  const path = await getRedirectPath(profile.role);
  redirect(path);
}
