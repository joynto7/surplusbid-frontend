import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to SurplusBid to bid on, list and manage industrial surplus auctions.",
  alternates: { canonical: "/login" },
};

export default function LoginPage() {
  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Welcome back</CardTitle>
        <CardDescription>Log in to your account</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <Suspense fallback={<Skeleton className="h-[30rem] w-full" />}>
          <LoginForm />
        </Suspense>
        <p className="text-center text-muted-foreground text-sm">
          New to SurplusBid?{" "}
          <Link href="/register" className="font-medium text-primary hover:underline">
            Register your business
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
