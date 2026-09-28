import type { Metadata } from "next";
import { Logo } from "@/components/shared/logo";
import { ThemeToggle } from "@/components/shared/theme-toggle";

export const metadata: Metadata = { robots: { index: false } };

/** Minimal chrome for Stripe return pages: no sidebar, focus on the outcome. */
export default function PaymentLayout({ children }: LayoutProps<"/payment">) {
  return (
    <div className="flex min-h-svh flex-col bg-muted/30">
      <header className="flex h-14 items-center justify-between border-b bg-background px-4 sm:px-6">
        <Logo href="/buyer" />
        <ThemeToggle />
      </header>
      <main id="main" className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg">{children}</div>
      </main>
    </div>
  );
}
