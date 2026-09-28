import type { Metadata } from "next";
import { RoleLayout } from "@/components/layout/role-layout";

export const metadata: Metadata = { robots: { index: false } };

export default function SellerLayout({ children }: LayoutProps<"/seller">) {
  return <RoleLayout role="SELLER">{children}</RoleLayout>;
}
