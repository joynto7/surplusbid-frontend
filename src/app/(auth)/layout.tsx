import { BadgeCheck, Gavel, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { ThemeToggle } from "@/components/shared/theme-toggle";

/** Split layout shared by sign-in, registration and verification screens. */
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="grid min-h-svh lg:grid-cols-[1fr_1.1fr]">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-primary p-10 text-primary-foreground lg:flex">
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,white/15%,transparent_45%),radial-gradient(circle_at_80%_90%,black/25%,transparent_50%)]"
        />
        <Logo className="relative [&>span:first-child]:bg-primary-foreground [&>span:first-child]:text-primary [&_.text-primary]:text-primary-foreground/80" />
        <div className="relative space-y-6">
          <h2 className="max-w-md font-semibold text-3xl leading-tight tracking-tight">
            The auction floor for industrial surplus.
          </h2>
          <ul className="space-y-3 text-primary-foreground/85">
            <li className="flex items-center gap-3">
              <BadgeCheck className="size-5" aria-hidden /> Every business verified by our team
            </li>
            <li className="flex items-center gap-3">
              <ShieldCheck className="size-5" aria-hidden /> Refundable Stripe deposit holds on every lot
            </li>
            <li className="flex items-center gap-3">
              <Gavel className="size-5" aria-hidden /> Anti-sniping extensions keep closes fair
            </li>
          </ul>
        </div>
        <p className="relative text-primary-foreground/70 text-sm">Payments are processed securely by Stripe.</p>
      </aside>
      <div className="flex flex-col">
        <div className="flex items-center justify-between p-4 lg:justify-end">
          <Logo className="lg:hidden" />
          <ThemeToggle />
        </div>
        <main id="main" className="flex flex-1 items-center justify-center px-4 pb-12 sm:px-6">
          <div className="w-full max-w-md">{children}</div>
        </main>
      </div>
    </div>
  );
}
