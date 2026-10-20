"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { LuCircleCheck, LuLoaderCircle, LuSend } from "react-icons/lu";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { api } from "@/lib/api/client";
import { SUPPORT_EMAIL } from "@/lib/config";
import { type ContactValues, contactSchema } from "@/lib/validation";
import { SelectField, TextareaField, TextField } from "./fields";

const TOPICS = [
  { value: "buying", label: "Buying & bidding" },
  { value: "selling", label: "Selling a lot" },
  { value: "verification", label: "Business verification" },
  { value: "payments", label: "Deposits & payments" },
  { value: "other", label: "Something else" },
];

/** Posts to the support inbox (POST /contact); admins read and triage messages from their dashboard. */
export function ContactForm() {
  const [sentTo, setSentTo] = useState<string | null>(null);
  const form = useForm<ContactValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: "", email: "", message: "" },
    mode: "onTouched",
  });

  const onSubmit = async (v: ContactValues) => {
    try {
      await api.sendContact(v);
      setSentTo(v.email);
      form.reset();
    } catch (error) {
      toast.error("Your message wasn't sent", {
        description: error instanceof Error ? error.message : `Please try again, or email ${SUPPORT_EMAIL}.`,
      });
    }
  };

  if (sentTo)
    return (
      <output className="flex flex-col items-center gap-3 py-10 text-center">
        <LuCircleCheck className="size-12 text-success" aria-hidden />
        <p className="font-semibold text-lg">Message sent</p>
        <p className="max-w-sm text-muted-foreground text-sm">
          Thanks for getting in touch. We reply to {sentTo} within one business day.
        </p>
        <Button variant="outline" onClick={() => setSentTo(null)}>
          Send another message
        </Button>
      </output>
    );

  const submitting = form.formState.isSubmitting;
  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <FieldGroup>
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField control={form.control} name="name" label="Your name" autoComplete="name" />
          <TextField control={form.control} name="email" label="Work email" type="email" autoComplete="email" />
        </div>
        <SelectField control={form.control} name="topic" label="Topic" options={TOPICS} placeholder="Choose a topic" />
        <TextareaField
          control={form.control}
          name="message"
          label="Message"
          rows={6}
          placeholder="Include the lot code (e.g. LOT-3F9A2C) if your question is about a specific lot."
        />
        <Button type="submit" disabled={submitting} className="w-fit">
          {submitting ? <LuLoaderCircle className="animate-spin" /> : <LuSend />}
          {submitting ? "Sending…" : "Send message"}
        </Button>
      </FieldGroup>
    </form>
  );
}
