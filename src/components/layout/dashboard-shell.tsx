"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useTransition } from "react";
import { LuChevronsUpDown, LuExternalLink, LuLayoutDashboard, LuLogOut, LuUserCog } from "react-icons/lu";
import { toast } from "sonner";
import { Logo } from "@/components/shared/logo";
import { StatusBadge } from "@/components/shared/status-badge";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { logoutAction } from "@/lib/auth/actions";
import { initials } from "@/lib/format";
import { useRequiredSession } from "@/providers/session-provider";
import { NAV, ROLE_LABEL } from "./nav-config";
import { ROLE_LINKS } from "./site-nav";

function NavMenu() {
  const me = useRequiredSession();
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();

  // Highlight only the most specific match, so /seller/lots/new marks "Create lot" and not "My listings" too.
  const items = NAV[me.role].flatMap((s) => s.items);
  const activeHref = items
    .filter((i) => (i.exact ? pathname === i.href : pathname === i.href || pathname.startsWith(`${i.href}/`)))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;

  return (
    <>
      {NAV[me.role].map((section) => (
        <SidebarGroup key={section.label}>
          <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {section.items.map((item) => {
                const active = item.href === activeHref;
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={active} tooltip={item.label}>
                      <Link href={item.href} onClick={() => setOpenMobile(false)}>
                        <item.icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ))}
    </>
  );
}

/** Items shared by the sidebar account menu and the top-bar profile menu. */
function UserMenuItems() {
  const me = useRequiredSession();
  const [pending, startTransition] = useTransition();
  const base = `/${me.role.toLowerCase()}`;

  return (
    <>
      <DropdownMenuLabel className="flex items-center justify-between gap-2 font-normal">
        <span className="text-muted-foreground text-xs">Signed in as {ROLE_LABEL[me.role]}</span>
        <StatusBadge status={me.verificationStatus} />
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuItem asChild>
        <Link href={base}>
          <LuLayoutDashboard /> Overview
        </Link>
      </DropdownMenuItem>
      <DropdownMenuItem asChild>
        <Link href={`${base}/profile`}>
          <LuUserCog /> Profile & settings
        </Link>
      </DropdownMenuItem>
      {ROLE_LINKS[me.role].map((l) => (
        <DropdownMenuItem key={l.href} asChild>
          <Link href={l.href}>
            {l.icon && <l.icon />} {l.label}
          </Link>
        </DropdownMenuItem>
      ))}
      <DropdownMenuItem asChild>
        <Link href="/">
          <LuExternalLink /> Public site
        </Link>
      </DropdownMenuItem>
      <DropdownMenuSeparator />
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
    </>
  );
}

function SidebarUserMenu() {
  const me = useRequiredSession();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent">
          <Avatar className="size-8 rounded-lg">
            <AvatarFallback className="rounded-lg bg-primary/15 font-medium text-primary">
              {initials(me.companyName)}
            </AvatarFallback>
          </Avatar>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-medium">{me.companyName}</span>
            <span className="truncate text-muted-foreground text-xs">{me.email}</span>
          </div>
          <LuChevronsUpDown className="ml-auto size-4" />
        </SidebarMenuButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start" className="w-(--radix-dropdown-menu-trigger-width) min-w-56">
        <UserMenuItems />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Avatar button in the dashboard top bar. */
function ProfileMenu() {
  const me = useRequiredSession();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`Account menu for ${me.companyName}`}
          className="rounded-full outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <Avatar className="size-8">
            <AvatarFallback className="bg-primary font-medium text-primary-foreground text-xs">
              {initials(me.companyName)}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <div className="flex items-center gap-3 px-2 py-2">
          <Avatar className="size-9">
            <AvatarFallback className="bg-primary/15 font-medium text-primary text-xs">
              {initials(me.companyName)}
            </AvatarFallback>
          </Avatar>
          <div className="grid min-w-0 text-sm leading-tight">
            <span className="truncate font-medium">{me.companyName}</span>
            <span className="truncate text-muted-foreground text-xs">{me.email}</span>
          </div>
        </div>
        <DropdownMenuSeparator />
        <UserMenuItems />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Tells the user why they landed here when the proxy bounced them from another role's area. */
function DeniedNotice() {
  const params = useSearchParams();
  const denied = params.get("denied");
  useEffect(() => {
    if (denied) toast.error("Access denied", { description: `The ${denied} area isn't available for your role.` });
  }, [denied]);
  return null;
}

export function DashboardShell({ children, defaultOpen }: { children: React.ReactNode; defaultOpen: boolean }) {
  const me = useRequiredSession();
  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <Sidebar collapsible="icon">
        <SidebarHeader className="h-14 justify-center border-b px-3">
          <Logo
            href={`/${me.role.toLowerCase()}`}
            className="group-data-[collapsible=icon]:[&>span:last-child]:hidden"
          />
        </SidebarHeader>
        <SidebarContent>
          <NavMenu />
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarUserMenu />
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
      <SidebarInset className="min-w-0">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background/85 px-4 backdrop-blur">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-1 data-[orientation=vertical]:h-4" />
          <span className="font-medium text-sm">{ROLE_LABEL[me.role]} workspace</span>
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <ProfileMenu />
          </div>
        </header>
        {/* SidebarInset already renders <main>; this is the skip-link target. */}
        <div id="main" className="mx-auto w-full max-w-7xl flex-1 p-4 sm:p-6">
          <Suspense>
            <DeniedNotice />
          </Suspense>
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
