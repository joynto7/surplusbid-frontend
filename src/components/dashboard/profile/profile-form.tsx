"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { LuSave } from "react-icons/lu";
import { toast } from "sonner";
import { TextareaField, TextField } from "@/components/forms/fields";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldGroup } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { api } from "@/lib/api/client";
import { qk } from "@/lib/queries";
import { type ProfileValues, profileSchema } from "@/lib/validation";
import { useRequiredSession } from "@/providers/session-provider";
import type { Me } from "@/types/api";

const toValues = (me: Me): ProfileValues => ({
  companyName: me.companyName,
  taxId: me.taxId ?? "",
  contactName: me.contactName ?? "",
  phone: me.phone ?? "",
  location: me.location ?? "",
  bio: me.bio ?? "",
});

const BIO_HELP = {
  SELLER: "Shown in the “About the seller” card on every lot you list.",
  BUYER: "Shown to sellers when you win one of their lots.",
  ADMIN: "Shown to colleagues in the audit log.",
} as const;

export function ProfileForm() {
  const me = useRequiredSession();
  const router = useRouter();
  const qc = useQueryClient();
  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: toValues(me),
    mode: "onTouched",
  });
  const bio = useWatch({ control: form.control, name: "bio" }) ?? "";

  const save = useMutation({
    // Empty strings clear optional fields on the backend.
    mutationFn: (v: ProfileValues) => api.updateProfile({ ...v, taxId: v.taxId || undefined }),
    onSuccess: (updated) => {
      qc.setQueryData(qk.me, updated);
      form.reset(toValues(updated));
      toast.success("Profile saved");
      router.refresh(); // re-render server layouts so the sidebar shows the new name
    },
    meta: { errorToast: "Couldn't save your profile" },
  });

  return (
    <Card>
      <form onSubmit={form.handleSubmit((v) => save.mutate(v))} noValidate>
        <CardHeader>
          <CardTitle>Company profile</CardTitle>
          <CardDescription>Shown on your invoices, reviews and to the SurplusBid team.</CardDescription>
        </CardHeader>
        <CardContent className="py-6">
          <FieldGroup>
            <div className="grid gap-5 sm:grid-cols-2">
              <TextField control={form.control} name="companyName" label="Company name" autoComplete="organization" />
              <TextField
                control={form.control}
                name="taxId"
                label="Tax ID / VAT number"
                placeholder="e.g. 12-3456789"
                description="Optional. Letters, numbers and dashes."
              />
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <TextField
                control={form.control}
                name="contactName"
                label="Contact person"
                autoComplete="name"
                placeholder="e.g. Dana Whitfield"
              />
              <TextField
                control={form.control}
                name="phone"
                label="Phone"
                type="tel"
                autoComplete="tel"
                placeholder="+1 (312) 555-0142"
              />
            </div>
            <TextField
              control={form.control}
              name="location"
              label="Location"
              autoComplete="address-level2"
              placeholder="City, ST"
              description="Used as the default pickup location for new lots."
            />
            <TextareaField
              control={form.control}
              name="bio"
              label="About your company"
              rows={4}
              placeholder="What you sell or buy, your industries, and how you handle pickup."
              description={`${BIO_HELP[me.role]} ${bio.length}/500 characters.`}
            />
          </FieldGroup>
        </CardContent>
        <CardFooter className="justify-end gap-2 border-t">
          <Button type="button" variant="ghost" disabled={!form.formState.isDirty} onClick={() => form.reset()}>
            Discard
          </Button>
          <Button type="submit" disabled={!form.formState.isDirty || save.isPending}>
            {save.isPending ? <Spinner /> : <LuSave />} Save changes
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
