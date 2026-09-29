"use client";

import Link from "next/link";
import { LuShieldAlert, LuX } from "react-icons/lu";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useMounted } from "@/hooks/use-mounted";
import { useRequiredSession } from "@/providers/session-provider";
import { usePreferences } from "@/stores/preferences-store";

const COPY = {
  UNVERIFIED: { title: "Verify your business to start trading", cta: "Upload document", href: "/verify-business" },
  PENDING: { title: "Verification under review", cta: "View status", href: "/verification-status" },
  REJECTED: { title: "Your verification document was rejected", cta: "Upload a new one", href: "/verify-business" },
} as const;

/** Role-aware nudge for buyers/sellers who aren't verified yet. Dismissible per status. */
export function VerificationBanner() {
  const me = useRequiredSession();
  const mounted = useMounted();
  const dismissed = usePreferences((s) => s.dismissedBanners);
  const dismiss = usePreferences((s) => s.dismissBanner);
  if (me.role === "ADMIN" || me.verificationStatus === "VERIFIED") return null;
  const id = `verify-${me.verificationStatus}`;
  if (!mounted || dismissed.includes(id)) return null;
  const copy = COPY[me.verificationStatus];

  return (
    <Alert className="border-warning/40 bg-warning/5">
      <LuShieldAlert className="text-warning" />
      <AlertTitle>{copy.title}</AlertTitle>
      <AlertDescription className="flex flex-wrap items-center gap-3">
        <span>
          {me.role === "BUYER" ? "Sellers expect verified bidders." : "Buyers only see lots from verified sellers."}
        </span>
        <Button size="sm" asChild>
          <Link href={copy.href}>{copy.cta}</Link>
        </Button>
      </AlertDescription>
      <button
        type="button"
        onClick={() => dismiss(id)}
        aria-label="Dismiss"
        className="absolute top-2 right-2 rounded p-1 text-muted-foreground hover:text-foreground"
      >
        <LuX className="size-4" />
      </button>
    </Alert>
  );
}
