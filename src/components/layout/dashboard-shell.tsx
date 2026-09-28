"use client";

import { ChevronsUpDown, ExternalLink, LogOut, UserCog } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useTransition } from "react";
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

function NavMenu() {
  const me = useRequiredSession();
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();

  return (
    <>
      {NAV[me.role].map((section) => (
        <SidebarGroup key={section.label}>
          <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {section.items.map((item) => {
                const active = item.exact
                  ? pathname === item.href
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);
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

function UserMenu() {
  const me = useRequiredSession();
  const [pending, startTransition] = useTransition();
  const profileHref = me.role === "ADMIN" ? "/admin/audit-logs" : `/${me.role.toLowerCase()}/profile`;

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
          <ChevronsUpDown className="ml-auto size-4" />
        </SidebarMenuButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start" className="w-(--radix-dropdown-menu-trigger-width) min-w-56">
        <DropdownMenuLabel className="flex items-center justify-between gap-2 font-normal">
          <span className="text-muted-foreground text-xs">Signed in as {ROLE_LABEL[me.role]}</span>
          <StatusBadge status={me.verificationStatus} />
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {me.role !== "ADMIN" && (
          <DropdownMenuItem asChild>
            <Link href={profileHref}>
              <UserCog /> Profile & settings
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem asChild>
          <Link href="/">
            <ExternalLink /> Public site
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
          <LogOut /> Sign out
        </DropdownMenuItem>
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
              <UserMenu />
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
          <div className="ml-auto">
            <ThemeToggle />
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
