"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useTransition } from "react";
import { LuArrowRight, LuChevronDown, LuLayoutDashboard, LuLogOut, LuMenu } from "react-icons/lu";
import { CategoryIcon } from "@/components/shared/category-icon";
import { Logo } from "@/components/shared/logo";
import { StatusBadge } from "@/components/shared/status-badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { logoutAction } from "@/lib/auth/actions";
import { initials } from "@/lib/format";
import { categoriesQuery } from "@/lib/queries";
import { cn } from "@/lib/utils";
import type { Role, VerificationStatus } from "@/types/api";
import { PUBLIC_LINKS, profileMenu, RESOURCE_LINKS, ROLE_LINKS, type SiteLink } from "./site-nav";

interface HeaderSession {
  role: Role | null;
  home: string | null;
  user: { companyName: string; email: string; verificationStatus: VerificationStatus } | null;
}

export function useHeaderSession() {
  return useQuery({
    queryKey: ["session-probe"],
    queryFn: async () => {
      const res = await fetch("/api/session", { cache: "no-store" });
      return (await res.json()) as HeaderSession;
    },
    staleTime: 60_000,
    meta: { errorToast: false },
  });
}

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

const linkClass = (active: boolean) =>
  cn(
    "inline-flex h-9 items-center gap-1 rounded-md px-2.5 text-sm transition-colors hover:bg-muted hover:text-foreground",
    active ? "font-medium text-foreground" : "text-muted-foreground",
  );

function NavLink({ link, className }: { link: SiteLink; className?: string }) {
  const pathname = usePathname();
  const active = isActive(pathname, link.href);
  return (
    <Link href={link.href} aria-current={active ? "page" : undefined} className={cn(linkClass(active), className)}>
      {link.label}
    </Link>
  );
}

function CategoriesMenu() {
  const categories = useQuery(categoriesQuery());
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={linkClass(false)}>
        Categories <LuChevronDown className="size-3.5" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[min(92vw,34rem)] p-2">
        <DropdownMenuLabel className="text-muted-foreground text-xs">Browse by category</DropdownMenuLabel>
        <div className="grid gap-1 sm:grid-cols-2">
          {categories.isPending
            ? Array.from({ length: 8 }, (_, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton rows
                <Skeleton key={i} className="h-12 w-full" />
              ))
            : categories.data?.map((c) => (
                <DropdownMenuItem key={c.id} asChild className="items-start gap-3 p-2.5">
                  <Link href={`/lots?categoryId=${c.id}`}>
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <CategoryIcon slug={c.slug} className="size-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block font-medium text-sm">{c.name}</span>
                      <span className="block text-muted-foreground text-xs">
                        {c.liveLotCount ?? 0} live {c.liveLotCount === 1 ? "lot" : "lots"}
                      </span>
                    </span>
                  </Link>
                </DropdownMenuItem>
              ))}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="justify-between font-medium text-primary">
          <Link href="/lots">
            Browse all live auctions <LuArrowRight />
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ResourcesMenu() {
  const pathname = usePathname();
  const active = RESOURCE_LINKS.some((l) => isActive(pathname, l.href));
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={linkClass(active)}>
        Resources <LuChevronDown className="size-3.5" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-80 p-2">
        {RESOURCE_LINKS.map((l) => (
          <DropdownMenuItem key={l.href} asChild className="items-start gap-3 p-2.5">
            <Link href={l.href}>
              {l.icon && <l.icon className="mt-0.5 size-4 text-primary" aria-hidden />}
              <span>
                <span className="block font-medium text-sm">{l.label}</span>
                <span className="block text-muted-foreground text-xs">{l.description}</span>
              </span>
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Logged out: Home, Explore, Categories, How it works, Blog, About, Contact. Logged in: Home, Explore, Categories, Dashboard, two role links and Resources. */
export function DesktopNav() {
  const { data } = useHeaderSession();
  const role = data?.role ?? null;
  const [home, explore, howItWorks, blog, about, contact] = PUBLIC_LINKS as [
    SiteLink,
    SiteLink,
    SiteLink,
    SiteLink,
    SiteLink,
    SiteLink,
  ];
  return (
    <ul className="flex items-center gap-0.5">
      {/* Signed out, Home only fits from xl; signed in it always shows, keeping 6+ routes in the bar. */}
      <li className={role ? undefined : "hidden xl:block"}>
        <NavLink link={home} />
      </li>
      <li>
        <NavLink link={explore} />
      </li>
      <li>
        <CategoriesMenu />
      </li>
      {role ? (
        <>
          <li>
            <NavLink link={{ href: data?.home ?? "/", label: "Dashboard" }} />
          </li>
          {ROLE_LINKS[role].map((l) => (
            <li key={l.href}>
              <NavLink link={l} />
            </li>
          ))}
          <li>
            <ResourcesMenu />
          </li>
        </>
      ) : (
        [howItWorks, blog, about, contact].map((l) => (
          <li key={l.href}>
            <NavLink link={l} />
          </li>
        ))
      )}
    </ul>
  );
}

function SignOutItem() {
  const [pending, startTransition] = useTransition();
  return (
    <DropdownMenuItem
      variant="destructive"
      disabled={pending}
      onSelect={(e) => {
        e.preventDefault();
        startTransition(() => logoutAction());
      }}
    >
      <LuLogOut /> Sign out
    </DropdownMenuItem>
  );
}

/** Sign-in buttons, or the avatar with the profile menu. */
export function HeaderAuth() {
  const { data, isPending } = useHeaderSession();
  if (isPending) return <Skeleton className="h-9 w-24 rounded-full" />;
  if (data?.role && data.home) {
    const name = data.user?.companyName ?? "Your account";
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex items-center gap-2 rounded-full border bg-background py-1 pr-2.5 pl-1 text-sm transition-colors hover:bg-muted"
            aria-label="Open profile menu"
          >
            <Avatar className="size-7">
              <AvatarFallback className="bg-primary/15 font-medium text-primary text-xs">
                {initials(name)}
              </AvatarFallback>
            </Avatar>
            <span className="hidden max-w-32 truncate font-medium sm:inline lg:hidden xl:inline">{name}</span>
            <LuChevronDown className="size-3.5 text-muted-foreground" aria-hidden />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel className="space-y-1 font-normal">
            <p className="truncate font-medium text-sm">{name}</p>
            <p className="truncate text-muted-foreground text-xs">{data.user?.email}</p>
            <div className="flex gap-1.5 pt-1">
              <StatusBadge status={data.role} />
              {data.user && <StatusBadge status={data.user.verificationStatus} />}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {profileMenu(data.role).map((item) => (
            <DropdownMenuItem key={item.href} asChild>
              <Link href={item.href}>
                {item.icon && <item.icon />} {item.label}
              </Link>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <SignOutItem />
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }
  return (
    <div className="hidden items-center gap-1.5 sm:flex">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/login">Sign in</Link>
      </Button>
      <Button size="sm" asChild>
        <Link href="/register">Get started</Link>
      </Button>
    </div>
  );
}

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const { data } = useHeaderSession();
  const categories = useQuery(categoriesQuery());
  const pathname = usePathname();
  const close = () => setOpen(false);
  const role = data?.role ?? null;

  const item = (l: SiteLink) => (
    <li key={l.href}>
      <Link
        href={l.href}
        onClick={close}
        aria-current={isActive(pathname, l.href) ? "page" : undefined}
        className={cn(
          "flex items-center gap-2 rounded-md px-3 py-2.5 text-base hover:bg-muted",
          isActive(pathname, l.href) ? "font-medium text-foreground" : "text-muted-foreground",
        )}
      >
        {l.icon && <l.icon className="size-4" aria-hidden />}
        {l.label}
      </Link>
    </li>
  );

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
          <LuMenu />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-80 overflow-y-auto">
        <SheetHeader>
          <SheetTitle asChild>
            <div>
              <Logo />
            </div>
          </SheetTitle>
        </SheetHeader>
        <nav aria-label="Mobile" className="space-y-4 px-2 pb-6">
          <ul className="space-y-0.5">
            {role && data?.home && item({ href: data.home, label: "Dashboard", icon: LuLayoutDashboard })}
            {role && ROLE_LINKS[role].map(item)}
            {PUBLIC_LINKS.map(item)}
            {item({ href: "/faq", label: "Help & FAQ" })}
          </ul>
          <Separator />
          <div>
            <p className="px-3 pb-1 font-medium text-muted-foreground text-xs uppercase tracking-wide">Categories</p>
            <ul className="grid grid-cols-2 gap-0.5">
              {categories.data?.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/lots?categoryId=${c.id}`}
                    onClick={close}
                    className="flex items-center gap-2 rounded-md px-3 py-2 text-muted-foreground text-sm hover:bg-muted hover:text-foreground"
                  >
                    <CategoryIcon slug={c.slug} className="size-4 shrink-0 text-primary" />
                    <span className="truncate">{c.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <Separator />
          {role ? (
            <form action={logoutAction} className="px-1">
              <Button type="submit" variant="outline" className="w-full">
                <LuLogOut /> Sign out
              </Button>
            </form>
          ) : (
            <div className="grid gap-2 px-1">
              <Button variant="outline" asChild onClick={close}>
                <Link href="/login">Sign in</Link>
              </Button>
              <Button asChild onClick={close}>
                <Link href="/register">Get started</Link>
              </Button>
            </div>
          )}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
