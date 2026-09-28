import type { Metadata } from "next";
import { RoleLayout } from "@/components/layout/role-layout";

export const metadata: Metadata = { robots: { index: false } };

export default function BuyerLayout({ children }: LayoutProps<"/buyer">) {
  return <RoleLayout role="BUYER">{children}</RoleLayout>;
}
