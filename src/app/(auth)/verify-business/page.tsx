import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { VerificationForm } from "@/components/auth/verification-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth/session";
import { homeForRole } from "@/lib/auth/tokens";

export const metadata: Metadata = { title: "Verify your business", robots: { index: false } };

export default async function VerifyBusinessPage() {
  const me = await getCurrentUser();
  if (!me) redirect("/login?next=/verify-business");
  if (me.role === "ADMIN" || me.verificationStatus === "VERIFIED") redirect(homeForRole(me.role));
  if (me.verificationStatus === "PENDING") redirect("/verification-status");

  return (
    <Card>
      <CardHeader>
        <p className="font-mono text-muted-foreground text-xs">Step 2 of 2 · Verification</p>
        <CardTitle className="text-2xl">Verify {me.companyName}</CardTitle>
        <CardDescription>
          {me.verificationStatus === "REJECTED"
            ? "Your previous document wasn't accepted. Upload a clearer or more recent one."
            : "Upload a certificate of incorporation, trade license or tax registration. An admin reviews it, usually within one business day."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <VerificationForm />
        <p className="text-center text-muted-foreground text-sm">
          <Link href={homeForRole(me.role)} className="hover:text-foreground hover:underline">
            Skip for now and explore the dashboard
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
