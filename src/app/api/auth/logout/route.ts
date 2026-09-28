import { NextResponse } from "next/server";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/auth/tokens";

/** Clears the session cookies. Used by clients that can't call the server action (e.g. after a failed refresh). */
export async function POST() {
  const res = NextResponse.json({ success: true });
  res.cookies.delete(ACCESS_COOKIE);
  res.cookies.delete(REFRESH_COOKIE);
  return res;
}
