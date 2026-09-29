"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { LuCalendarClock } from "react-icons/lu";
import { toast } from "sonner";
import { TextField } from "@/components/forms/fields";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldGroup } from "@/components/ui/field";
import { useMounted } from "@/hooks/use-mounted";
import { type SellerDefaultsValues, sellerDefaultsSchema } from "@/lib/validation";
import { DEFAULT_SELLER_DEFAULTS, usePreferences } from "@/stores/preferences-store";

/** Seller "availability": how soon and for how long new lots run by default. Prefills the lot wizard. */
export function SellerDefaultsForm() {
  const mounted = useMounted();
  const defaults = usePreferences((s) => s.sellerDefaults);
  const save = usePreferences((s) => s.setSellerDefaults);
  const form = useForm<SellerDefaultsValues>({
    resolver: zodResolver(sellerDefaultsSchema),
    defaultValues: DEFAULT_SELLER_DEFAULTS,
    mode: "onTouched",
  });

  // Load the persisted values once the store has rehydrated on the client.
  useEffect(() => {
    if (mounted) form.reset(defaults);
  }, [mounted, defaults, form]);

  return (
    <Card>
      <form
        onSubmit={form.handleSubmit((v) => {
          save(v);
          toast.success("Auction defaults saved", { description: "New lots will start from these values." });
        })}
        noValidate
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LuCalendarClock className="size-4" aria-hidden /> Availability & auction defaults
          </CardTitle>
          <CardDescription>
            When your lots usually open and how long they run. Saved on this device and used to prefill the lot wizard.
          </CardDescription>
        </CardHeader>
        <CardContent className="py-6">
          <FieldGroup className="grid gap-5 sm:grid-cols-2">
            <TextField
              control={form.control}
              name="startDelayHours"
              label="Open bidding after (hours)"
              type="number"
              min={0}
              description="0 opens immediately on publish."
            />
            <TextField control={form.control} name="durationDays" label="Auction length (days)" type="number" min={1} />
            <TextField
              control={form.control}
              name="bidIncrement"
              label="Default bid increment (USD)"
              type="number"
              step="0.01"
            />
            <TextField control={form.control} name="condition" label="Typical condition" />
          </FieldGroup>
        </CardContent>
        <CardFooter className="justify-end gap-2 border-t">
          <Button type="button" variant="ghost" onClick={() => form.reset(DEFAULT_SELLER_DEFAULTS)}>
            Reset
          </Button>
          <Button type="submit">Save defaults</Button>
        </CardFooter>
      </form>
    </Card>
  );
}
