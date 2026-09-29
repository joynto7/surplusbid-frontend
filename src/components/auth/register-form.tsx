"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { LuBuilding2, LuStore, LuUserPlus } from "react-icons/lu";
import { toast } from "sonner";
import { TextField } from "@/components/forms/fields";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldError, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import { Progress } from "@/components/ui/progress";
import { Spinner } from "@/components/ui/spinner";
import { registerAction } from "@/lib/auth/actions";
import { cn } from "@/lib/utils";
import { type RegisterValues, registerSchema } from "@/lib/validation";

const ROLES = [
  { value: "BUYER", title: "I want to buy", body: "Bid on surplus lots", icon: LuBuilding2 },
  { value: "SELLER", title: "I want to sell", body: "List surplus inventory", icon: LuStore },
] as const;

function passwordStrength(pw: string) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return { percent: (score / 5) * 100, label: ["Too weak", "Weak", "Fair", "Good", "Strong", "Very strong"][score] };
}

export function RegisterForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const presetRole = params.get("role");
  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: presetRole === "SELLER" || presetRole === "BUYER" ? presetRole : undefined,
      companyName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
    mode: "onTouched",
  });
  const password = useWatch({ control: form.control, name: "password" }) ?? "";
  const strength = passwordStrength(password);

  const onSubmit = (values: RegisterValues) =>
    startTransition(async () => {
      const result = await registerAction(values);
      if (!result.ok) {
        toast.error("Registration failed", { description: result.message });
        if (/email/i.test(result.message)) form.setError("email", { message: result.message });
        return;
      }
      toast.success("Account created", { description: "Next, verify your business." });
      router.replace(result.redirectTo);
      router.refresh();
    });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <FieldGroup>
        <Controller
          control={form.control}
          name="role"
          render={({ field, fieldState }) => (
            <FieldSet data-invalid={fieldState.invalid}>
              <FieldLegend variant="label">Account type</FieldLegend>
              <div role="radiogroup" className="grid grid-cols-2 gap-2">
                {ROLES.map((r) => {
                  const selected = field.value === r.value;
                  return (
                    // biome-ignore lint/a11y/useSemanticElements: card-style radio built on a button for the larger hit area
                    <button
                      key={r.value}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => field.onChange(r.value)}
                      className={cn(
                        "flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-colors",
                        selected ? "border-primary bg-primary/5 ring-2 ring-primary/30" : "hover:bg-muted",
                      )}
                    >
                      <r.icon className={cn("size-5", selected ? "text-primary" : "text-muted-foreground")} />
                      <span className="font-medium text-sm">{r.title}</span>
                      <span className="text-muted-foreground text-xs">{r.body}</span>
                    </button>
                  );
                })}
              </div>
              <FieldError errors={[fieldState.error]} />
            </FieldSet>
          )}
        />
        <TextField
          control={form.control}
          name="companyName"
          label="Company name"
          autoComplete="organization"
          placeholder="Acme Manufacturing Ltd."
        />
        <TextField
          control={form.control}
          name="email"
          label="Work email"
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
        />
        <div className="space-y-2">
          <TextField
            control={form.control}
            name="password"
            label="Password"
            type="password"
            autoComplete="new-password"
            description="At least 8 characters, with a letter and a number."
          />
          {password && (
            <div className="flex items-center gap-2" aria-live="polite">
              <Progress value={strength.percent} className="h-1.5" aria-label="Password strength" />
              <span className="w-24 shrink-0 text-muted-foreground text-xs">{strength.label}</span>
            </div>
          )}
        </div>
        <TextField
          control={form.control}
          name="confirmPassword"
          label="Confirm password"
          type="password"
          autoComplete="new-password"
        />
        <Controller
          control={form.control}
          name="terms"
          render={({ field, fieldState }) => (
            <Field orientation="horizontal" data-invalid={fieldState.invalid}>
              <Checkbox
                id="terms"
                checked={field.value === true}
                onCheckedChange={(c) => field.onChange(c === true ? true : undefined)}
                aria-invalid={fieldState.invalid}
              />
              <div className="space-y-1">
                <FieldLabel htmlFor="terms" className="font-normal">
                  I confirm I&apos;m registering on behalf of a business and accept the{" "}
                  <Link href="/faq" className="text-primary underline">
                    auction rules
                  </Link>
                  .
                </FieldLabel>
                <FieldError errors={[fieldState.error]} />
              </div>
            </Field>
          )}
        />
        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending ? <Spinner /> : <LuUserPlus />} Create account
        </Button>
      </FieldGroup>
    </form>
  );
}
