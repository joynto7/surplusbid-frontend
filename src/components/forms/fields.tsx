"use client";

import { type Control, Controller, type FieldPath, type FieldValues } from "react-hook-form";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

/**
 * React Hook Form bindings for the shadcn Field primitives. Each field wires
 * label ↔ input ids, aria-invalid and the Zod error message, so forms stay
 * declarative and accessible without repeating the plumbing.
 */

interface BaseProps<T extends FieldValues> {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  description?: React.ReactNode;
  disabled?: boolean;
}

export function TextField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  disabled,
  type = "text",
  ...input
}: BaseProps<T> & Omit<React.ComponentProps<typeof Input>, "name" | "defaultValue" | "value">) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const id = `field-${name}`;
        const numeric = type === "number";
        return (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={id}>{label}</FieldLabel>
            <Input
              {...input}
              id={id}
              type={type}
              name={field.name}
              ref={field.ref}
              onBlur={field.onBlur}
              disabled={disabled || field.disabled}
              value={field.value ?? ""}
              onChange={(e) => {
                if (!numeric) return field.onChange(e.target.value);
                field.onChange(e.target.value === "" ? undefined : e.target.valueAsNumber);
              }}
              aria-invalid={fieldState.invalid}
              aria-describedby={description ? `${id}-desc` : undefined}
            />
            {description && <FieldDescription id={`${id}-desc`}>{description}</FieldDescription>}
            <FieldError errors={[fieldState.error]} />
          </Field>
        );
      }}
    />
  );
}

export function TextareaField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  disabled,
  ...textarea
}: BaseProps<T> & Omit<React.ComponentProps<typeof Textarea>, "name" | "defaultValue" | "value">) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const id = `field-${name}`;
        return (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={id}>{label}</FieldLabel>
            <Textarea
              {...textarea}
              {...field}
              value={field.value ?? ""}
              id={id}
              disabled={disabled || field.disabled}
              aria-invalid={fieldState.invalid}
            />
            {description && <FieldDescription>{description}</FieldDescription>}
            <FieldError errors={[fieldState.error]} />
          </Field>
        );
      }}
    />
  );
}

export function SelectField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  disabled,
  placeholder = "Select…",
  options,
}: BaseProps<T> & { placeholder?: string; options: { value: string; label: string }[] }) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const id = `field-${name}`;
        return (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={id}>{label}</FieldLabel>
            <Select value={field.value ?? ""} onValueChange={field.onChange} disabled={disabled || field.disabled}>
              <SelectTrigger id={id} ref={field.ref} onBlur={field.onBlur} aria-invalid={fieldState.invalid}>
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
              <SelectContent>
                {options.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {description && <FieldDescription>{description}</FieldDescription>}
            <FieldError errors={[fieldState.error]} />
          </Field>
        );
      }}
    />
  );
}
