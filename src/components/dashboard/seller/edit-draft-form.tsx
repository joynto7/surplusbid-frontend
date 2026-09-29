"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { type Control, useForm } from "react-hook-form";
import { LuSave } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { useUpdateLot } from "@/hooks/use-seller-lots";
import { localInputToIso, toLocalInput } from "@/lib/datetime";
import { type LotDetailsValues, type LotEditValues, type LotPricingValues, lotEditSchema } from "@/lib/validation";
import type { Lot } from "@/types/api";
import { LotDetailsFields, LotPricingFields } from "./lot-fields";

/** Edit a DRAFT lot (the backend only allows edits before publishing; photos are fixed). */
export function EditDraftForm({ lot }: { lot: Lot }) {
  const router = useRouter();
  const update = useUpdateLot(lot.id);
  const form = useForm<LotEditValues>({
    resolver: zodResolver(lotEditSchema),
    defaultValues: {
      title: lot.title,
      categoryId: lot.categoryId,
      condition: lot.condition,
      quantity: lot.quantity,
      description: lot.description,
      startingPrice: lot.startingPriceCents / 100,
      reservePrice: (lot.reservePriceCents ?? lot.startingPriceCents) / 100,
      bidIncrement: lot.bidIncrementCents / 100,
      startTime: toLocalInput(new Date(lot.startTime)),
      endTime: toLocalInput(new Date(lot.endTime)),
    },
    mode: "onTouched",
  });

  const onSubmit = (v: LotEditValues) =>
    update.mutate(
      {
        title: v.title,
        categoryId: v.categoryId,
        condition: v.condition,
        quantity: v.quantity,
        description: v.description,
        startingPriceCents: Math.round(v.startingPrice * 100),
        reservePriceCents: Math.round(v.reservePrice * 100),
        bidIncrementCents: Math.round(v.bidIncrement * 100),
        startTime: localInputToIso(v.startTime),
        endTime: localInputToIso(v.endTime),
      },
      { onSuccess: () => router.push(`/seller/lots/${lot.id}`) },
    );

  // The combined form's control is a superset of each group's fields.
  const control = form.control as unknown;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent>
          <LotDetailsFields control={control as Control<LotDetailsValues>} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Pricing & schedule</CardTitle>
          <CardDescription>Photos can&apos;t be changed after creation.</CardDescription>
        </CardHeader>
        <CardContent>
          <LotPricingFields control={control as Control<LotPricingValues>} />
        </CardContent>
        <CardFooter className="justify-end gap-2 border-t">
          <Button type="button" variant="ghost" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={update.isPending || !form.formState.isDirty}>
            {update.isPending ? <Spinner /> : <LuSave />} Save draft
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
