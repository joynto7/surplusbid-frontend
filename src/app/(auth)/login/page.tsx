import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { DemoLogin } from "@/components/auth/demo-login";
import { GoogleButton } from "@/components/auth/google-button";
import { LoginForm } from "@/components/auth/login-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to SurplusBid to bid on, list and manage industrial surplus auctions.",
  alternates: { canonical: "/login" },
};

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Welcome back</CardTitle>
          <CardDescription>Log in to your account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Suspense fallback={<Skeleton className="h-52 w-full" />}>
            <LoginForm />
          </Suspense>
          <GoogleButton />
          <p className="text-center text-muted-foreground text-sm">
            New to SurplusBid?{" "}
            <Link href="/register" className="font-medium text-primary hover:underline">
              Register your business
            </Link>
          </p>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3 text-muted-foreground text-xs uppercase">
        <Separator className="flex-1" /> or <Separator className="flex-1" />
      </div>

      <DemoLogin />
    </div>
  );
}
