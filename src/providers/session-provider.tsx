"use client";

import { useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useEffect } from "react";
import { toast } from "sonner";
import { SESSION_EXPIRED_EVENT } from "@/lib/api/client";
import type { Me, Role } from "@/types/api";

const SessionContext = createContext<Me | null>(null);

/**
 * Hands the server-fetched user to client components (the layout reads it
 * from the cookie session). Also reacts to a 401 from any client request by
 * sending the user back to /login.
 */
export function SessionProvider({ user, children }: { user: Me | null; children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();

  useEffect(() => {
    const onExpired = () => {
      queryClient.clear();
      toast.warning("Your session expired", { description: "Sign in again to continue." });
      router.replace(`/login?next=${encodeURIComponent(pathname)}&expired=1`);
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
  }, [pathname, queryClient, router]);

  return <SessionContext.Provider value={user}>{children}</SessionContext.Provider>;
}

export function useSession() {
  return useContext(SessionContext);
}

/** Throws in dashboard components that must have a user (the proxy guarantees one). */
export function useRequiredSession() {
  const me = useContext(SessionContext);
  if (!me) throw new Error("useRequiredSession must be used inside a signed-in layout");
  return me;
}

export function useHasRole(...roles: Role[]) {
  const me = useSession();
  return !!me && roles.includes(me.role);
}
