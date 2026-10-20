"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { LuLogIn } from "react-icons/lu";
import { toast } from "sonner";
import { TextField } from "@/components/forms/fields";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { demoCredentialsAction, loginAction } from "@/lib/auth/actions";
import { type LoginValues, loginSchema } from "@/lib/validation";
import type { Role } from "@/types/api";
import { DemoLogin } from "./demo-login";
import { GoogleButton } from "./google-button";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [demoRole, setDemoRole] = useState<Role | null>(null);
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
    mode: "onTouched",
  });

  useEffect(() => {
    if (params.get("expired")) toast.warning("Your session expired. Please sign in again.");
    if (params.get("signedOut")) toast.success("You've been signed out.");
    if (params.get("error") === "oauth") toast.error("Google sign-in didn't complete. Try again.");
  }, [params]);

  const onSubmit = (values: LoginValues) =>
    startTransition(async () => {
      const result = await loginAction(values, params.get("next") ?? undefined);
      if (!result.ok) {
        form.setError("password", { message: result.message });
        toast.error("Sign-in failed", { description: result.message });
        setDemoRole(null);
        return;
      }
      toast.success("Welcome back");
      router.replace(result.redirectTo);
      router.refresh();
    });

  /** Types the demo credentials into the fields (so it's visible what's happening), then submits. */
  const fillDemo = async (role: Role) => {
    setDemoRole(role);
    const creds = await demoCredentialsAction(role);
    if (!creds.ok) {
      toast.error("Demo login unavailable", { description: creds.message });
      setDemoRole(null);
      return;
    }
    form.clearErrors();
    for (const [name, value] of [
      ["email", creds.email],
      ["password", creds.password],
    ] as const) {
      for (let i = 1; i <= value.length; i++) {
        form.setValue(name, value.slice(0, i), { shouldDirty: true });
        await sleep(14);
      }
    }
    await form.handleSubmit(onSubmit, () => setDemoRole(null))();
  };

  const busy = pending || demoRole !== null;

  return (
    <div className="space-y-5">
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <FieldGroup>
          <TextField
            control={form.control}
            name="email"
            label="Work email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            readOnly={busy}
          />
          <TextField
            control={form.control}
            name="password"
            label="Password"
            type="password"
            autoComplete="current-password"
            readOnly={busy}
          />
          <Button type="submit" size="lg" className="w-full" disabled={busy}>
            {pending && !demoRole ? <Spinner /> : <LuLogIn />} Sign in
          </Button>
        </FieldGroup>
      </form>
      <GoogleButton />
      <DemoLogin onPick={fillDemo} active={demoRole} disabled={busy} />
    </div>
  );
}
