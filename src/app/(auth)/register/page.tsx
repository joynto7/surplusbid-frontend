import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { GoogleButton } from "@/components/auth/google-button";
import { RegisterForm } from "@/components/auth/register-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Register your business",
  description: "Create a SurplusBid buyer or seller account. Business verification is required before trading.",
  alternates: { canonical: "/register" },
};

export default function RegisterPage() {
  return (
    <Card>
      <CardHeader>
        <p className="font-mono text-muted-foreground text-xs">Step 1 of 2 · Account</p>
        <CardTitle className="text-2xl">Register your business</CardTitle>
        <CardDescription>You&apos;ll upload a verification document on the next step.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Suspense fallback={<Skeleton className="h-[520px] w-full" />}>
          <RegisterForm />
        </Suspense>
        <GoogleButton label="Sign up with Google" />
        <p className="text-center text-muted-foreground text-sm">
          Already registered?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
