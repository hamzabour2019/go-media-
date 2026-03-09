import { requireRole } from "@/lib/auth/session";

export default async function SupervisorSectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole(["SUPERVISOR"]);
  return children;
}
