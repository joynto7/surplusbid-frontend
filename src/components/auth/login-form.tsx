"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { LuLogIn } from "react-icons/lu";
import { toast } from "sonner";
import { TextField } from "@/components/forms/fields";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { loginAction } from "@/lib/auth/actions";
import { type LoginValues, loginSchema } from "@/lib/validation";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
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
        return;
      }
      toast.success("Welcome back");
      router.replace(result.redirectTo);
      router.refresh();
    });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <FieldGroup>
        <TextField
          control={form.control}
          name="email"
          label="Work email"
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          disabled={pending}
        />
        <TextField
          control={form.control}
          name="password"
          label="Password"
          type="password"
          autoComplete="current-password"
          disabled={pending}
        />
        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending ? <Spinner /> : <LuLogIn />} Sign in
        </Button>
      </FieldGroup>
    </form>
  );
}
