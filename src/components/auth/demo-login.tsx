"use client";

import { Building2, type LucideIcon, ShieldCheck, Store } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { demoLoginAction } from "@/lib/auth/actions";
import type { Role } from "@/types/api";

const DEMOS: { role: Role; title: string; description: string; icon: LucideIcon }[] = [
  { role: "ADMIN", title: "Admin", description: "Verify businesses, manage categories, audit", icon: ShieldCheck },
  { role: "BUYER", title: "Buyer", description: "Browse, place deposits, bid and pay", icon: Building2 },
  { role: "SELLER", title: "Seller", description: "List lots, publish, track bids & earnings", icon: Store },
];

/** One click per role: the server action signs in with that role's demo account. */
export function DemoLogin() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [active, setActive] = useState<Role | null>(null);

  const signIn = (role: Role) => {
    setActive(role);
    startTransition(async () => {
      const result = await demoLoginAction(role);
      if (!result.ok) {
        toast.error("Demo login failed", { description: result.message });
        setActive(null);
        return;
      }
      toast.success(`Signed in as the demo ${role.toLowerCase()}`);
      router.replace(result.redirectTo);
      router.refresh();
    });
  };

  return (
    <section aria-labelledby="demo-login" className="space-y-3">
      <h2 id="demo-login" className="text-center font-medium text-sm">
        🚀 Quick demo login
      </h2>
      <div className="grid gap-2 sm:grid-cols-3">
        {DEMOS.map(({ role, title, description, icon: Icon }) => (
          <div key={role} className="flex flex-col items-center gap-2 rounded-lg border bg-card p-3 text-center">
            <span className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Icon className="size-4" aria-hidden />
            </span>
            <div>
              <p className="font-medium text-sm">{title}</p>
              <p className="text-muted-foreground text-xs leading-snug">{description}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="mt-auto w-full"
              disabled={pending}
              onClick={() => signIn(role)}
              aria-label={`Demo login as ${title}`}
            >
              {pending && active === role ? <Spinner /> : null} Demo login
            </Button>
          </div>
        ))}
      </div>
    </section>
  );
}
