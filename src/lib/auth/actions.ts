"use server";

import { redirect } from "next/navigation";
import { ApiError, parseEnvelope } from "@/lib/api/errors";
import { API_BASE_URL } from "@/lib/config";
import { type LoginValues, loginSchema, type RegisterValues, registerSchema } from "@/lib/validation";
import type { AuthTokens, Role } from "@/types/api";
import { clearSessionCookies, setSessionCookies } from "./session";
import { homeForRole, safeNext } from "./tokens";

export type AuthResult = { ok: true; redirectTo: string } | { ok: false; message: string; errors?: string[] };

async function authenticate(path: "/auth/login" | "/auth/register", body: unknown): Promise<AuthTokens> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  return parseEnvelope<AuthTokens>(res);
}

function failure(error: unknown): AuthResult {
  if (error instanceof ApiError) {
    const message = error.status === 401 ? "Email or password is incorrect" : error.message;
    return { ok: false, message, errors: error.errors };
  }
  return { ok: false, message: "Couldn't reach the SurplusBid API. Try again in a moment." };
}

/** Validates again on the server: never trust the client-side check alone. */
export async function loginAction(values: LoginValues, next?: string): Promise<AuthResult> {
  const parsed = loginSchema.safeParse(values);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid input" };
  try {
    const { user, accessToken, refreshToken } = await authenticate("/auth/login", parsed.data);
    await setSessionCookies(accessToken, refreshToken);
    const home = homeForRole(user.role);
    const target = safeNext(next);
    // Don't bounce a seller to a buyer-only page they were sent from.
    const otherArea = target && /^\/(admin|seller|buyer)(\/|$)/.test(target) && !target.startsWith(home);
    return { ok: true, redirectTo: target && !otherArea ? target : home };
  } catch (error) {
    return failure(error);
  }
}

const DEMO_ACCOUNTS: Record<Role, { email?: string; password?: string }> = {
  ADMIN: { email: process.env.DEMO_ADMIN_EMAIL, password: process.env.DEMO_ADMIN_PASSWORD },
  SELLER: { email: process.env.DEMO_SELLER_EMAIL, password: process.env.DEMO_SELLER_PASSWORD },
  BUYER: { email: process.env.DEMO_BUYER_EMAIL, password: process.env.DEMO_BUYER_PASSWORD },
};

export type DemoCredentials = { ok: true; email: string; password: string } | { ok: false; message: string };

/**
 * Credentials for the demo account of a role, so the login form can fill them
 * in and sign in like any user would. They're public by design (the README
 * lists them); keeping them in env lets each deployment rotate them.
 */
export async function demoCredentialsAction(role: Role): Promise<DemoCredentials> {
  const account = DEMO_ACCOUNTS[role];
  if (!account?.email || !account.password) {
    return { ok: false, message: `The ${role.toLowerCase()} demo account isn't configured on this deployment.` };
  }
  return { ok: true, email: account.email, password: account.password };
}

export async function registerAction(values: RegisterValues): Promise<AuthResult> {
  const parsed = registerSchema.safeParse(values);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid input" };
  const { email, password, role, companyName } = parsed.data;
  try {
    const { accessToken, refreshToken } = await authenticate("/auth/register", { email, password, role, companyName });
    await setSessionCookies(accessToken, refreshToken);
    return { ok: true, redirectTo: "/verify-business" };
  } catch (error) {
    if (error instanceof ApiError && error.status === 409) {
      return { ok: false, message: "An account with this email already exists. Sign in instead." };
    }
    return failure(error);
  }
}

export async function logoutAction() {
  // The backend's logout is stateless; clearing the cookies ends the session.
  await fetch(`${API_BASE_URL}/auth/logout`, { method: "POST", cache: "no-store" }).catch(() => undefined);
  await clearSessionCookies();
  redirect("/login?signedOut=1");
}
