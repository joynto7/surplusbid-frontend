"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { LuCircleCheck, LuMail, LuSend } from "react-icons/lu";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { api } from "@/lib/api/client";
import { errorMessage } from "@/lib/api/errors";

const schema = z.object({ email: z.email("Enter a valid work email") });
type Values = z.infer<typeof schema>;

export function NewsletterSection() {
  const [done, setDone] = useState<string | null>(null);
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { email: "" } });
  const subscribe = useMutation({
    mutationFn: (v: Values) => api.subscribe(v.email),
    onSuccess: (res) => {
      setDone(res.email);
      form.reset();
      toast.success("You're subscribed", { description: "The closing-soon digest arrives every Monday." });
    },
    meta: { errorToast: false },
    onError: (e) => form.setError("email", { message: errorMessage(e) }),
  });
  const error = form.formState.errors.email?.message;

  return (
    <section aria-labelledby="newsletter-heading" className="border-y bg-muted/30">
      <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 py-16 sm:px-6 lg:grid-cols-2">
        <div className="space-y-3">
          <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <LuMail className="size-5" aria-hidden />
          </span>
          <h2 id="newsletter-heading" className="font-bold text-3xl tracking-tight">
            The weekly closing-soon digest
          </h2>
          <p className="max-w-lg text-lg text-muted-foreground">
            Every Monday: the lots closing that week in your categories, recent results and new sellers. One email,
            unsubscribe anytime.
          </p>
        </div>
        {done ? (
          <output className="flex items-start gap-3 rounded-xl border border-success/30 bg-success/10 p-5">
            <LuCircleCheck className="mt-0.5 size-5 shrink-0 text-success" aria-hidden />
            <div>
              <p className="font-medium">You're on the list</p>
              <p className="text-muted-foreground text-sm">
                We'll send the next digest to <span className="font-medium text-foreground">{done}</span>.
              </p>
              <button type="button" onClick={() => setDone(null)} className="mt-2 text-primary text-sm hover:underline">
                Subscribe another address
              </button>
            </div>
          </output>
        ) : (
          <form onSubmit={form.handleSubmit((v) => subscribe.mutate(v))} noValidate className="space-y-2">
            <div className="flex flex-col gap-2 sm:flex-row">
              <label htmlFor="newsletter-email" className="sr-only">
                Work email
              </label>
              <input
                id="newsletter-email"
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                aria-invalid={!!error}
                aria-describedby={error ? "newsletter-error" : undefined}
                className="h-12 flex-1 rounded-lg border bg-background px-4 text-base outline-none transition focus-visible:ring-[3px] focus-visible:ring-ring/40 aria-invalid:border-destructive"
                {...form.register("email")}
              />
              <Button type="submit" size="lg" className="h-12 px-6" disabled={subscribe.isPending}>
                {subscribe.isPending ? <Spinner /> : <LuSend />} Subscribe
              </Button>
            </div>
            <p id="newsletter-error" className="min-h-5 text-destructive text-sm" role={error ? "alert" : undefined}>
              {error}
            </p>
            <p className="text-muted-foreground text-xs">
              We never share your address. Read our{" "}
              <a href="/privacy" className="underline hover:text-foreground">
                privacy policy
              </a>
              .
            </p>
          </form>
        )}
      </div>
    </section>
  );
}
