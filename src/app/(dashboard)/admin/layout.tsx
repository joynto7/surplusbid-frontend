import type { Metadata } from "next";
import { RoleLayout } from "@/components/layout/role-layout";

export const metadata: Metadata = { robots: { index: false } };

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return <RoleLayout area="ADMIN">{children}</RoleLayout>;
}
