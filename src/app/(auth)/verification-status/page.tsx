import { CheckCircle2, Clock, FileWarning, type LucideIcon, ShieldQuestion } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth/session";
import { homeForRole } from "@/lib/auth/tokens";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { VerificationStatus } from "@/types/api";

export const metadata: Metadata = { title: "Verification status", robots: { index: false } };

const COPY: Record<VerificationStatus, { icon: LucideIcon; tone: string; title: string; body: string }> = {
  UNVERIFIED: {
    icon: ShieldQuestion,
    tone: "bg-muted text-muted-foreground",
    title: "Verification not started",
    body: "Upload your business registration document to start trading.",
  },
  PENDING: {
    icon: Clock,
    tone: "bg-warning/10 text-warning",
    title: "Under review",
    body: "An admin is reviewing your document. You can explore your dashboard in the meantime. We'll update this page as soon as it's decided.",
  },
  VERIFIED: {
    icon: CheckCircle2,
    tone: "bg-success/10 text-success",
    title: "You're verified",
    body: "Your business is approved. You have full access to bidding or listing.",
  },
  REJECTED: {
    icon: FileWarning,
    tone: "bg-destructive/10 text-destructive",
    title: "Document not accepted",
    body: "We couldn't verify your business from the document provided. Please upload a clearer or more recent one.",
  },
};

export default async function VerificationStatusPage() {
  const me = await getCurrentUser();
  if (!me) redirect("/login?next=/verification-status");
  if (me.role === "ADMIN") redirect("/admin");
  const copy = COPY[me.verificationStatus];

  return (
    <Card>
      <CardHeader className="items-center text-center">
        <span className={cn("mx-auto mb-2 flex size-14 items-center justify-center rounded-full", copy.tone)}>
          <copy.icon className="size-7" aria-hidden />
        </span>
        <CardTitle className="text-2xl">{copy.title}</CardTitle>
        <CardDescription>{copy.body}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <dl className="divide-y rounded-lg border text-sm">
          <div className="flex justify-between gap-4 p-3">
            <dt className="text-muted-foreground">Company</dt>
            <dd className="font-medium">{me.companyName}</dd>
          </div>
          <div className="flex justify-between gap-4 p-3">
            <dt className="text-muted-foreground">Account</dt>
            <dd className="font-medium">{me.email}</dd>
          </div>
          <div className="flex justify-between gap-4 p-3">
            <dt className="text-muted-foreground">Role</dt>
            <dd>
              <StatusBadge status={me.role} />
            </dd>
          </div>
          <div className="flex justify-between gap-4 p-3">
            <dt className="text-muted-foreground">Status</dt>
            <dd>
              <StatusBadge status={me.verificationStatus} />
            </dd>
          </div>
          <div className="flex justify-between gap-4 p-3">
            <dt className="text-muted-foreground">Member since</dt>
            <dd>{formatDate(me.createdAt)}</dd>
          </div>
        </dl>
        <div className="grid gap-2 sm:grid-cols-2">
          {(me.verificationStatus === "UNVERIFIED" || me.verificationStatus === "REJECTED") && (
            <Button asChild>
              <Link href="/verify-business">Upload document</Link>
            </Button>
          )}
          <Button
            variant={me.verificationStatus === "VERIFIED" ? "default" : "outline"}
            asChild
            className="sm:col-span-1"
          >
            <Link href={homeForRole(me.role)}>Go to dashboard</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
