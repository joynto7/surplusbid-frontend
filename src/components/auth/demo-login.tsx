"use client";

import type { IconType } from "react-icons";
import { LuBuilding2, LuShieldCheck, LuStore } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import type { Role } from "@/types/api";

const DEMOS: { role: Role; title: string; description: string; icon: IconType }[] = [
  { role: "BUYER", title: "Buyer", description: "Browse, place deposits, bid and pay", icon: LuBuilding2 },
  { role: "SELLER", title: "Seller", description: "List lots, track bids and earnings", icon: LuStore },
  { role: "ADMIN", title: "Admin", description: "Verify businesses, moderate, analyse", icon: LuShieldCheck },
];

/** One button per role. The login form fills in that role's demo credentials and signs in. */
export function DemoLogin({
  onPick,
  active,
  disabled,
}: {
  onPick: (role: Role) => void;
  active: Role | null;
  disabled: boolean;
}) {
  return (
    <section aria-labelledby="demo-login" className="space-y-3">
      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <h2 id="demo-login" className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
          Or try a demo account
        </h2>
        <span className="h-px flex-1 bg-border" />
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        {DEMOS.map(({ role, title, description, icon: Icon }) => (
          <Button
            key={role}
            type="button"
            variant="outline"
            disabled={disabled}
            onClick={() => onPick(role)}
            aria-label={`Fill in the demo ${title.toLowerCase()} credentials and sign in`}
            className="h-auto flex-col gap-1.5 whitespace-normal p-3 text-center"
          >
            <span className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary">
              {active === role ? <Spinner /> : <Icon className="size-4" aria-hidden />}
            </span>
            <span className="font-medium text-sm">{title}</span>
            <span className="font-normal text-muted-foreground text-xs leading-snug">{description}</span>
          </Button>
        ))}
      </div>
    </section>
  );
}
