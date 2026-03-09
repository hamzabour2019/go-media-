import { requireRole } from "@/lib/auth/session";

export default async function DesignerSectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole(["DESIGNER"]);
  return children;
}
