import { requireRole } from "@/lib/auth/session";

export default async function AdminSectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole(["ADMIN", "SUPERVISOR"]);
  return children;
}
