"use client";

import { useQuery } from "@tanstack/react-query";
import type { Control } from "react-hook-form";
import { SelectField, TextareaField, TextField } from "@/components/forms/fields";
import { FieldGroup } from "@/components/ui/field";
import { DEPOSIT_PERCENT } from "@/lib/config";
import { categoriesQuery } from "@/lib/queries";
import type { LotDetailsValues, LotPricingValues } from "@/lib/validation";

/** Field groups shared by the creation wizard and the draft editor. */

export function LotDetailsFields({ control }: { control: Control<LotDetailsValues> }) {
  const categories = useQuery(categoriesQuery());
  return (
    <FieldGroup>
      <TextField
        control={control}
        name="title"
        label="Lot title"
        placeholder="e.g. Haas VF-2 CNC vertical machining center"
        description="Lead with make, model and quantity. Buyers search by title."
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <SelectField
          control={control}
          name="categoryId"
          label="Category"
          placeholder={categories.isPending ? "Loading…" : "Choose a category"}
          options={(categories.data ?? []).map((c) => ({ value: c.id, label: c.name }))}
        />
        <TextField control={control} name="condition" label="Condition" placeholder="Used - good" />
      </div>
      <TextField
        control={control}
        name="quantity"
        label="Quantity"
        type="number"
        min={1}
        step={1}
        className="sm:max-w-40"
      />
      <TextareaField
        control={control}
        name="description"
        label="Description"
        rows={6}
        placeholder="Specs, hours of use, maintenance history, what's included, and pickup/rigging notes."
      />
    </FieldGroup>
  );
}

export function LotPricingFields({ control }: { control: Control<LotPricingValues> }) {
  return (
    <FieldGroup>
      <div className="grid gap-5 sm:grid-cols-3">
        <TextField
          control={control}
          name="startingPrice"
          label="Starting price (USD)"
          type="number"
          step="0.01"
          min={0}
          description={`Buyers put a ${DEPOSIT_PERCENT}% hold on this.`}
        />
        <TextField
          control={control}
          name="reservePrice"
          label="Reserve price (USD)"
          type="number"
          step="0.01"
          min={0}
          description="Private. Only you see it."
        />
        <TextField
          control={control}
          name="bidIncrement"
          label="Bid increment (USD)"
          type="number"
          step="0.01"
          min={0}
          description="Minimum raise per bid."
        />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField control={control} name="startTime" label="Bidding opens" type="datetime-local" />
        <TextField
          control={control}
          name="endTime"
          label="Bidding closes"
          type="datetime-local"
          description="Late bids extend the close by 2 minutes."
        />
      </div>
    </FieldGroup>
  );
}
