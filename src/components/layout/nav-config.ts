import type { IconType } from "react-icons";
import {
  LuBadgeCheck,
  LuBanknote,
  LuFileSearch,
  LuGavel,
  LuHeart,
  LuLayoutDashboard,
  LuListChecks,
  LuPackage,
  LuPackagePlus,
  LuReceipt,
  LuScale,
  LuScrollText,
  LuSearch,
  LuTags,
  LuUserCog,
  LuUsers,
} from "react-icons/lu";
import type { Role } from "@/types/api";

export interface NavItem {
  href: string;
  label: string;
  icon: IconType;
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
        { href: "/buyer", label: "Overview", icon: LuLayoutDashboard, exact: true },
        { href: "/lots", label: "Browse auctions", icon: LuSearch },
        { href: "/buyer/bids", label: "My bids", icon: LuGavel },
        { href: "/buyer/watchlist", label: "Watchlist", icon: LuHeart },
        { href: "/buyer/payments", label: "Payments", icon: LuReceipt },
      ],
    },
    {
      label: "Account",
      items: [
        { href: "/buyer/disputes", label: "Disputes", icon: LuScale },
        { href: "/buyer/profile", label: "Profile & settings", icon: LuUserCog },
      ],
    },
  ],
  SELLER: [
    {
      label: "Selling",
      items: [
        { href: "/seller", label: "Overview", icon: LuLayoutDashboard, exact: true },
        { href: "/seller/lots", label: "My listings", icon: LuPackage },
        { href: "/seller/lots/new", label: "Create lot", icon: LuPackagePlus, exact: true },
        { href: "/seller/earnings", label: "Earnings", icon: LuBanknote },
      ],
    },
    {
      label: "Account",
      items: [
        { href: "/seller/disputes", label: "Disputes", icon: LuScale },
        { href: "/seller/profile", label: "Profile & availability", icon: LuUserCog },
      ],
    },
  ],
  ADMIN: [
    {
      label: "Operations",
      items: [
        { href: "/admin", label: "Overview", icon: LuLayoutDashboard, exact: true },
        { href: "/admin/verifications", label: "Verification queue", icon: LuBadgeCheck },
        { href: "/admin/users", label: "Users", icon: LuUsers },
        { href: "/admin/lots", label: "Lots", icon: LuListChecks },
        { href: "/admin/categories", label: "Categories", icon: LuTags },
      ],
    },
    {
      label: "Oversight",
      items: [
        { href: "/admin/disputes", label: "Disputes", icon: LuScale },
        { href: "/admin/audit-logs", label: "Audit log & reports", icon: LuScrollText },
        { href: "/lots", label: "Public catalog", icon: LuFileSearch },
      ],
    },
  ],
};

export const ROLE_LABEL: Record<Role, string> = { BUYER: "Buyer", SELLER: "Seller", ADMIN: "Admin" };
