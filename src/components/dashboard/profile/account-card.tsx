"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { LuMonitor, LuMoon, LuSun } from "react-icons/lu";
import { StatusBadge } from "@/components/shared/status-badge";
import { ToggleGroupLite } from "@/components/shared/toggle-group-lite";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useMounted } from "@/hooks/use-mounted";
import { formatDate } from "@/lib/format";
import { useRequiredSession } from "@/providers/session-provider";

export function AccountCard() {
  const me = useRequiredSession();
  return (
    <Card>
      <CardHeader>
        <CardTitle>Account</CardTitle>
        <CardDescription>Managed by SurplusBid. Contact support to change your email.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <dl className="divide-y rounded-lg border text-sm">
          <Row label="Email">{me.email}</Row>
          <Row label="Role">
            <StatusBadge status={me.role} />
          </Row>
          <Row label="Verification">
            <StatusBadge status={me.verificationStatus} />
          </Row>
          <Row label="Sign-in method">{me.authProvider === "GOOGLE" ? "Google" : "Email & password"}</Row>
          <Row label="Member since">{formatDate(me.createdAt)}</Row>
        </dl>
        {me.verificationStatus !== "VERIFIED" && (
          <Button variant="outline" className="w-full" asChild>
            <Link href="/verification-status">Check verification status</Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 p-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="truncate font-medium">{children}</dd>
    </div>
  );
}

export function AppearanceCard() {
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();
  return (
    <Card>
      <CardHeader>
        <CardTitle>Appearance</CardTitle>
        <CardDescription>Saved on this device.</CardDescription>
      </CardHeader>
      <CardContent className="flex items-center justify-between">
        <span className="text-sm">Theme</span>
        <ToggleGroupLite
          label="Theme"
          value={(mounted ? theme : "system") as "light" | "dark" | "system"}
          onChange={setTheme}
          options={[
            { value: "light", label: "Light", icon: LuSun },
            { value: "dark", label: "Dark", icon: LuMoon },
            { value: "system", label: "System", icon: LuMonitor },
          ]}
        />
      </CardContent>
    </Card>
  );
}
