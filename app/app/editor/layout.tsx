import { requireRole } from "@/lib/auth/session";

export default async function EditorSectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole(["EDITOR"]);
  return children;
}
