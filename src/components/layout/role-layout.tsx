import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { homeForRole } from "@/lib/auth/tokens";
import { SessionProvider } from "@/providers/session-provider";
import type { Role } from "@/types/api";
import { DashboardShell } from "./dashboard-shell";

/**
 * Server layout shared by /admin, /seller and /buyer. The proxy already
 * redirected wrong roles; this re-checks against the backend's /users/me
 * (defense in depth) and hands the profile to client components.
 */
export async function RoleLayout({ role, children }: { role: Role; children: React.ReactNode }) {
  const me = await getCurrentUser();
  if (!me) redirect("/login");
  if (me.role !== role) redirect(homeForRole(me.role));

  const sidebarOpen = (await cookies()).get("sidebar_state")?.value !== "false";

  return (
    <SessionProvider user={me}>
      <DashboardShell defaultOpen={sidebarOpen}>{children}</DashboardShell>
    </SessionProvider>
  );
}
