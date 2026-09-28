import { Logo } from "@/components/shared/logo";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { HeaderAuth, MobileNav, NavLinks } from "./public-nav";

export const PUBLIC_NAV = [
  { href: "/lots", label: "Auctions" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/faq", label: "FAQ" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
] as const;

/** Server-rendered shell; only the nav highlighting and auth buttons are client islands. */
export function PublicHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur supports-backdrop-filter:bg-background/70">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-6 px-4 sm:px-6">
        <Logo />
        <nav aria-label="Main" className="hidden md:block">
          <NavLinks items={PUBLIC_NAV} />
        </nav>
        <div className="ml-auto flex items-center gap-1.5">
          <ThemeToggle />
          <HeaderAuth />
          <MobileNav items={PUBLIC_NAV} />
        </div>
      </div>
    </header>
  );
}
