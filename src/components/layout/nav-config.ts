import {
  BadgeCheck,
  Banknote,
  FileSearch,
  Gavel,
  Heart,
  LayoutDashboard,
  ListChecks,
  type LucideIcon,
  Package,
  PackagePlus,
  Receipt,
  Scale,
  ScrollText,
  Search,
  Tags,
  UserCog,
  Users,
} from "lucide-react";
import type { Role } from "@/types/api";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Match only the exact path (for the overview item). */
  exact?: boolean;
}

export interface NavSection {
  label: string;
  items: NavItem[];
}

/** Role → sidebar. Each role only ever sees the routes the proxy lets it open. */
export const NAV: Record<Role, NavSection[]> = {
  BUYER: [
    {
      label: "Buying",
      items: [
        { href: "/buyer", label: "Overview", icon: LayoutDashboard, exact: true },
        { href: "/lots", label: "Browse auctions", icon: Search },
        { href: "/buyer/bids", label: "My bids", icon: Gavel },
        { href: "/buyer/watchlist", label: "Watchlist", icon: Heart },
        { href: "/buyer/payments", label: "Payments", icon: Receipt },
      ],
    },
    {
      label: "Account",
      items: [
        { href: "/buyer/disputes", label: "Disputes", icon: Scale },
        { href: "/buyer/profile", label: "Profile & settings", icon: UserCog },
      ],
    },
  ],
  SELLER: [
    {
      label: "Selling",
      items: [
        { href: "/seller", label: "Overview", icon: LayoutDashboard, exact: true },
        { href: "/seller/lots", label: "My listings", icon: Package },
        { href: "/seller/lots/new", label: "Create lot", icon: PackagePlus, exact: true },
        { href: "/seller/earnings", label: "Earnings", icon: Banknote },
      ],
    },
    {
      label: "Account",
      items: [
        { href: "/seller/disputes", label: "Disputes", icon: Scale },
        { href: "/seller/profile", label: "Profile & availability", icon: UserCog },
      ],
    },
  ],
  ADMIN: [
    {
      label: "Operations",
      items: [
        { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
        { href: "/admin/verifications", label: "Verification queue", icon: BadgeCheck },
        { href: "/admin/users", label: "Users", icon: Users },
        { href: "/admin/lots", label: "Lots", icon: ListChecks },
        { href: "/admin/categories", label: "Categories", icon: Tags },
      ],
    },
    {
      label: "Oversight",
      items: [
        { href: "/admin/disputes", label: "Disputes", icon: Scale },
        { href: "/admin/audit-logs", label: "Audit log & reports", icon: ScrollText },
        { href: "/lots", label: "Public catalog", icon: FileSearch },
      ],
    },
  ],
};

export const ROLE_LABEL: Record<Role, string> = { BUYER: "Buyer", SELLER: "Seller", ADMIN: "Admin" };
