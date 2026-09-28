"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { FileDropzone } from "@/components/forms/file-dropzone";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Progress } from "@/components/ui/progress";
import { uploadWithProgress } from "@/lib/api/client";
import { errorMessage } from "@/lib/api/errors";
import { type VerificationValues, verificationSchema } from "@/lib/validation";
import type { Me } from "@/types/api";

/** Uploads the registration document (Cloudinary via the backend) with a live progress bar. */
export function VerificationForm() {
  const router = useRouter();
  const [progress, setProgress] = useState<number | null>(null);
  const form = useForm<VerificationValues>({ resolver: zodResolver(verificationSchema), mode: "onChange" });

  const onSubmit = async ({ document }: VerificationValues) => {
    const body = new FormData();
    body.append("document", document);
    setProgress(0);
    try {
      await uploadWithProgress<Me>("/users/verify", body, setProgress);
      toast.success("Document submitted", { description: "An admin will review it shortly." });
      router.replace("/verification-status");
      router.refresh();
    } catch (error) {
      setProgress(null);
      toast.error("Upload failed", { description: errorMessage(error) });
    }
  };

  const uploading = progress !== null;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <FieldGroup>
        <Controller
          control={form.control}
          name="document"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Business registration document</FieldLabel>
              <FileDropzone
                files={field.value ? [field.value] : []}
                onChange={(files) => field.onChange(files[0])}
                accept="application/pdf,image/jpeg,image/png,image/webp"
                hint="PDF, JPG, PNG or WebP · up to 5 MB"
                invalid={fieldState.invalid}
                disabled={uploading}
              />
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
        <Controller
          control={form.control}
          name="confirm"
          render={({ field, fieldState }) => (
            <Field orientation="horizontal" data-invalid={fieldState.invalid}>
              <Checkbox
                id="confirm"
                checked={field.value === true}
                onCheckedChange={(c) => field.onChange(c === true ? true : undefined)}
                disabled={uploading}
              />
              <div className="space-y-1">
                <FieldLabel htmlFor="confirm" className="font-normal">
                  This document belongs to the company I registered, and I&apos;m authorized to submit it.
                </FieldLabel>
                <FieldError errors={[fieldState.error]} />
              </div>
            </Field>
          )}
        />
        {uploading && (
          <div className="space-y-1.5" aria-live="polite">
            <div className="flex justify-between text-sm">
              <span>{progress < 100 ? "Uploading…" : "Processing…"}</span>
              <span className="font-mono tabular-nums">{progress}%</span>
            </div>
            <Progress value={progress} aria-label="Upload progress" />
          </div>
        )}
        <Button type="submit" size="lg" className="w-full" disabled={uploading}>
          <Upload /> Submit for review
        </Button>
      </FieldGroup>
    </form>
  );
}
