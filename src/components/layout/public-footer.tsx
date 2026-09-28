import Link from "next/link";
import { Logo } from "@/components/shared/logo";

const COLUMNS = [
  {
    title: "Marketplace",
    links: [
      { href: "/lots", label: "Live auctions" },
      { href: "/lots?sortBy=endTime&sortOrder=asc", label: "Closing soon" },
      { href: "/how-it-works", label: "How it works" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/faq", label: "FAQ" },
      { href: "/contact", label: "Contact" },
    ],
  },
  {
    title: "Account",
    links: [
      { href: "/login", label: "Sign in" },
      { href: "/register", label: "Register your business" },
      { href: "/verify-business", label: "Business verification" },
    ],
  },
];

export function PublicFooter() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.5fr_repeat(3,1fr)]">
        <div className="space-y-3">
          <Logo />
          <p className="max-w-xs text-muted-foreground text-sm">
            Timed B2B auctions for industrial surplus. Verified buyers, Stripe-secured deposits, and anti-sniping on
            every lot.
          </p>
        </div>
        {COLUMNS.map((col) => (
          <div key={col.title} className="space-y-3">
            <h2 className="font-medium text-sm">{col.title}</h2>
            <ul className="space-y-2 text-muted-foreground text-sm">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="hover:text-foreground">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t">
        <p className="mx-auto max-w-7xl px-4 py-4 text-muted-foreground text-xs sm:px-6">
          © {new Date().getFullYear()} SurplusBid. Payments processed by Stripe.
        </p>
      </div>
    </footer>
  );
}
