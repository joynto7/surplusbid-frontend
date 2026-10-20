import type { IconType } from "react-icons";
import {
  LuBookOpen,
  LuCircleHelp,
  LuGavel,
  LuHeart,
  LuInfo,
  LuLayoutDashboard,
  LuMail,
  LuPackage,
  LuPackagePlus,
  LuScale,
  LuShieldCheck,
  LuSparkles,
  LuUserCog,
  LuUsers,
} from "react-icons/lu";
import type { Role } from "@/types/api";

export interface SiteLink {
  href: string;
  label: string;
  icon?: IconType;
  description?: string;
}

/** Top-level routes for everyone. Categories and Resources render as dropdowns next to these. */
export const PUBLIC_LINKS: SiteLink[] = [
  { href: "/", label: "Home" },
  { href: "/lots", label: "Explore" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/blog", label: "Blog" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export const RESOURCE_LINKS: SiteLink[] = [
  { href: "/blog", label: "Blog", icon: LuBookOpen, description: "Guides on buying and selling surplus" },
  { href: "/faq", label: "Help & FAQ", icon: LuCircleHelp, description: "Deposits, bidding, payments, disputes" },
  { href: "/about", label: "About SurplusBid", icon: LuInfo, description: "Who we are and how we vet businesses" },
  { href: "/contact", label: "Contact support", icon: LuMail, description: "We reply within one business day" },
];

/** Extra routes a signed-in user gets in the main nav, after Dashboard. */
export const ROLE_LINKS: Record<Role, SiteLink[]> = {
  BUYER: [
    { href: "/buyer/bids", label: "My bids", icon: LuGavel },
    { href: "/buyer/watchlist", label: "Watchlist", icon: LuHeart },
  ],
  SELLER: [
    { href: "/seller/lots", label: "My listings", icon: LuPackage },
    { href: "/seller/lots/new", label: "Sell a lot", icon: LuPackagePlus },
  ],
  ADMIN: [
    { href: "/admin/insights", label: "AI insights", icon: LuSparkles },
    { href: "/admin/users", label: "Users", icon: LuUsers },
  ],
};

/** Items in the signed-in profile menu. */
export function profileMenu(role: Role): SiteLink[] {
  const base = `/${role.toLowerCase()}`;
  return [
    { href: base, label: "Dashboard", icon: LuLayoutDashboard },
    { href: `${base}/profile`, label: "Profile & settings", icon: LuUserCog },
    ...(role === "ADMIN"
      ? [
          { href: "/admin/disputes", label: "Disputes", icon: LuScale },
          { href: "/admin/verifications", label: "Verification queue", icon: LuShieldCheck },
        ]
      : ROLE_LINKS[role]),
  ];
}
