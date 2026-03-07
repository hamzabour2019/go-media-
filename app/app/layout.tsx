import { requireProfile } from "@/lib/auth/session";
import { AppLayoutClient } from "@/components/layout/app-layout-client";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireProfile();

  return (
    <AppLayoutClient role={profile.role} user={profile}>
      {children}
    </AppLayoutClient>
  );
}
