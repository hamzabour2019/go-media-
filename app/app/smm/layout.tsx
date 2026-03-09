import { requireRole } from "@/lib/auth/session";

export default async function SmmSectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole(["ADMIN", "SUPERVISOR", "SMM"]);
  return children;
}
