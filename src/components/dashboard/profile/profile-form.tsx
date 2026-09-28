"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { TextField } from "@/components/forms/fields";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldGroup } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { api } from "@/lib/api/client";
import { qk } from "@/lib/queries";
import { type ProfileValues, profileSchema } from "@/lib/validation";
import { useRequiredSession } from "@/providers/session-provider";

export function ProfileForm() {
  const me = useRequiredSession();
  const router = useRouter();
  const qc = useQueryClient();
  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { companyName: me.companyName, taxId: me.taxId ?? "" },
    mode: "onTouched",
  });

  const save = useMutation({
    mutationFn: (v: ProfileValues) => api.updateProfile({ companyName: v.companyName, taxId: v.taxId || undefined }),
    onSuccess: (updated) => {
      qc.setQueryData(qk.me, updated);
      form.reset({ companyName: updated.companyName, taxId: updated.taxId ?? "" });
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
          <CardDescription>Shown on your invoices and to the SurplusBid team.</CardDescription>
        </CardHeader>
        <CardContent className="py-6">
          <FieldGroup>
            <TextField control={form.control} name="companyName" label="Company name" autoComplete="organization" />
            <TextField
              control={form.control}
              name="taxId"
              label="Tax ID / VAT number"
              placeholder="e.g. 12-3456789"
              description="Optional. Letters, numbers and dashes."
            />
          </FieldGroup>
        </CardContent>
        <CardFooter className="justify-end gap-2 border-t">
          <Button type="button" variant="ghost" disabled={!form.formState.isDirty} onClick={() => form.reset()}>
            Discard
          </Button>
          <Button type="submit" disabled={!form.formState.isDirty || save.isPending}>
            {save.isPending ? <Spinner /> : <Save />} Save changes
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
