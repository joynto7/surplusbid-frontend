"use client";

import { useQuery } from "@tanstack/react-query";
import { LayoutDashboard, Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { Role } from "@/types/api";

type NavItem = { readonly href: string; readonly label: string };

export function NavLinks({
  items,
  onNavigate,
  vertical,
}: {
  items: readonly NavItem[];
  onNavigate?: () => void;
  vertical?: boolean;
}) {
  const pathname = usePathname();
  return (
    <ul className={cn("flex gap-1", vertical && "flex-col")}>
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "block rounded-md px-3 py-1.5 text-sm transition-colors hover:bg-muted hover:text-foreground",
                active ? "font-medium text-foreground" : "text-muted-foreground",
                vertical && "py-2.5 text-base",
              )}
            >
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function useHeaderSession() {
  return useQuery({
    queryKey: ["session-probe"],
    queryFn: async () => {
      const res = await fetch("/api/session", { cache: "no-store" });
      return (await res.json()) as { role: Role | null; home: string | null };
    },
    staleTime: 60_000,
    meta: { errorToast: false },
  });
}

export function HeaderAuth() {
  const { data, isPending } = useHeaderSession();
  if (isPending) return <Skeleton className="h-8 w-36" />;
  if (data?.home) {
    return (
      <Button size="sm" asChild>
        <Link href={data.home}>
          <LayoutDashboard /> Dashboard
        </Link>
      </Button>
    );
  }
  return (
    <div className="hidden items-center gap-1.5 sm:flex">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/login">Sign in</Link>
      </Button>
      <Button size="sm" asChild>
        <Link href="/register">Get verified</Link>
      </Button>
    </div>
  );
}

export function MobileNav({ items }: { items: readonly NavItem[] }) {
  const [open, setOpen] = useState(false);
  const { data } = useHeaderSession();
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
          <Menu />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-72">
        <SheetHeader>
          <SheetTitle>Menu</SheetTitle>
        </SheetHeader>
        <nav aria-label="Mobile" className="px-2">
          <NavLinks items={items} vertical onNavigate={() => setOpen(false)} />
        </nav>
        {!data?.home && (
          <div className="mt-auto grid gap-2 p-4">
            <Button variant="outline" asChild onClick={() => setOpen(false)}>
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild onClick={() => setOpen(false)}>
              <Link href="/register">Get verified</Link>
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
