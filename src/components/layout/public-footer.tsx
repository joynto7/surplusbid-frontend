import Link from "next/link";
import type { IconType } from "react-icons";
import { LuClock, LuGithub, LuLinkedin, LuMail, LuMapPin, LuPhone, LuTwitter, LuYoutube } from "react-icons/lu";
import { Logo } from "@/components/shared/logo";
import { SUPPORT_EMAIL, SUPPORT_PHONE } from "@/lib/config";

const COLUMNS = [
  {
    title: "Marketplace",
    links: [
      { href: "/lots", label: "Live auctions" },
      { href: "/lots?sort=ending", label: "Closing soon" },
      { href: "/lots?sort=popular", label: "Most popular" },
      { href: "/lots?status=SOLD", label: "Recent results" },
      { href: "/how-it-works", label: "How it works" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About us" },
      { href: "/blog", label: "Blog" },
      { href: "/contact", label: "Contact" },
      { href: "/faq", label: "Help & FAQ" },
    ],
  },
  {
    title: "Account",
    links: [
      { href: "/login", label: "Sign in" },
      { href: "/register?role=BUYER", label: "Register as a buyer" },
      { href: "/register?role=SELLER", label: "Register as a seller" },
      { href: "/verification-status", label: "Verification status" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/privacy", label: "Privacy policy" },
      { href: "/terms", label: "Terms of service" },
      { href: "/faq#disputes", label: "Dispute policy" },
    ],
  },
];

const SOCIAL: { href: string; label: string; icon: IconType }[] = [
  { href: "https://www.linkedin.com/", label: "SurplusBid on LinkedIn", icon: LuLinkedin },
  { href: "https://x.com/", label: "SurplusBid on X", icon: LuTwitter },
  { href: "https://www.youtube.com/", label: "SurplusBid on YouTube", icon: LuYoutube },
  { href: "https://github.com/joynto7/surplusbid-frontend", label: "SurplusBid source on GitHub", icon: LuGithub },
];

export function PublicFooter() {
  return (
    <footer className="w-full border-t bg-muted/30">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.4fr_repeat(4,1fr)]">
        <div className="space-y-5">
          <Logo />
          <p className="max-w-xs text-muted-foreground text-sm">
            Timed B2B auctions for industrial surplus. Verified businesses, refundable Stripe deposit holds and
            anti-sniping on every lot.
          </p>
          <ul className="space-y-2.5 text-muted-foreground text-sm">
            <li className="flex gap-2.5">
              <LuMapPin className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
              <span>
                350 N Orleans St, Suite 900
                <br />
                Chicago, IL 60654
              </span>
            </li>
            <li>
              <a href={`mailto:${SUPPORT_EMAIL}`} className="flex items-center gap-2.5 hover:text-foreground">
                <LuMail className="size-4 shrink-0 text-primary" aria-hidden /> {SUPPORT_EMAIL}
              </a>
            </li>
            <li>
              <a
                href={`tel:${SUPPORT_PHONE.replace(/[^+\d]/g, "")}`}
                className="flex items-center gap-2.5 hover:text-foreground"
              >
                <LuPhone className="size-4 shrink-0 text-primary" aria-hidden /> {SUPPORT_PHONE}
              </a>
            </li>
            <li className="flex items-center gap-2.5">
              <LuClock className="size-4 shrink-0 text-primary" aria-hidden /> Mon–Fri, 8:00–18:00 CT
            </li>
          </ul>
          <ul className="flex gap-2" aria-label="Social media">
            {SOCIAL.map((s) => (
              <li key={s.href}>
                <a
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="flex size-9 items-center justify-center rounded-lg border bg-background text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
                >
                  <s.icon className="size-4" aria-hidden />
                </a>
              </li>
            ))}
          </ul>
        </div>
        {COLUMNS.map((col) => (
          <div key={col.title} className="space-y-3">
            <h2 className="font-semibold text-sm">{col.title}</h2>
            <ul className="space-y-2.5 text-muted-foreground text-sm">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="transition-colors hover:text-foreground">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-muted-foreground text-xs sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>© {new Date().getFullYear()} SurplusBid. Payments are processed securely by Stripe.</p>
          <p className="flex gap-4">
            <Link href="/privacy" className="hover:text-foreground">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-foreground">
              Terms
            </Link>
            <Link href="/contact" className="hover:text-foreground">
              Support
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
