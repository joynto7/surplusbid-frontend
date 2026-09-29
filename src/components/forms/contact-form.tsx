"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { LuMail, LuSend } from "react-icons/lu";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
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

/**
 * The backend has no contact endpoint, so a valid form opens the visitor's
 * email client with the message prefilled for the support inbox.
 */
export function ContactForm() {
  const form = useForm<ContactValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: "", email: "", message: "" },
    mode: "onTouched",
  });

  const onSubmit = (v: ContactValues) => {
    const topic = TOPICS.find((t) => t.value === v.topic)?.label ?? v.topic;
    const subject = encodeURIComponent(`[${topic}] Message from ${v.name}`);
    const body = encodeURIComponent(`${v.message}\n\n${v.name}\n${v.email}`);
    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
    toast.success("Opening your email app", { description: `Your message is addressed to ${SUPPORT_EMAIL}.` });
    form.reset();
  };

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
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit">
            <LuSend /> Send message
          </Button>
          <p className="flex items-center gap-1.5 text-muted-foreground text-sm">
            <LuMail className="size-4" aria-hidden /> Opens in your email app
          </p>
        </div>
      </FieldGroup>
    </form>
  );
}
