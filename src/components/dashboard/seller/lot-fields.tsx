"use client";

import { useQuery } from "@tanstack/react-query";
import { type Control, useFieldArray, useFormState } from "react-hook-form";
import { LuPlus, LuX } from "react-icons/lu";
import { SelectField, TextareaField, TextField } from "@/components/forms/fields";
import { Button } from "@/components/ui/button";
import { FieldDescription, FieldError, FieldGroup, FieldLegend, FieldSet } from "@/components/ui/field";
import { DEPOSIT_PERCENT } from "@/lib/config";
import { categoriesQuery } from "@/lib/queries";
import { type LotDetailsValues, type LotPricingValues, MAX_LOT_SPECS } from "@/lib/validation";

/** Field groups shared by the creation wizard and the draft editor. */

/** Label/value rows shown in the Specifications table on the lot page. */
function SpecsEditor({ control }: { control: Control<LotDetailsValues> }) {
  const { fields, append, remove } = useFieldArray({ control, name: "specs" });
  const { errors } = useFormState({ control, name: "specs" });
  return (
    <FieldSet className="gap-3">
      <FieldLegend variant="label">Specifications</FieldLegend>
      <FieldDescription>
        Key facts buyers compare: make, model, year, hours, capacity, dimensions. Up to {MAX_LOT_SPECS}.
      </FieldDescription>
      {fields.length > 0 && (
        <ul className="space-y-2">
          {fields.map((f, i) => (
            <li key={f.id} className="grid grid-cols-[1fr_1.4fr_auto] items-start gap-2">
              <TextField control={control} name={`specs.${i}.label`} label="Label" placeholder="e.g. Hours" />
              <TextField control={control} name={`specs.${i}.value`} label="Value" placeholder="e.g. 4,200" />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="mt-6"
                onClick={() => remove(i)}
                aria-label={`Remove spec ${i + 1}`}
              >
                <LuX />
              </Button>
            </li>
          ))}
        </ul>
      )}
      {errors.specs?.root && <FieldError errors={[errors.specs.root]} />}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-fit"
        disabled={fields.length >= MAX_LOT_SPECS}
        onClick={() => append({ label: "", value: "" })}
      >
        <LuPlus /> Add specification
      </Button>
    </FieldSet>
  );
}

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
      <div className="grid gap-5 sm:grid-cols-[10rem_1fr]">
        <TextField control={control} name="quantity" label="Quantity" type="number" min={1} step={1} />
        <TextField
          control={control}
          name="location"
          label="Pickup location"
          placeholder="City, ST"
          autoComplete="address-level2"
          description="Shown on the lot card. Buyers filter by it."
        />
      </div>
      <TextareaField
        control={control}
        name="description"
        label="Description"
        rows={7}
        placeholder="Specs, hours of use, maintenance history, what's included, and pickup/rigging notes."
      />
      <SpecsEditor control={control} />
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
