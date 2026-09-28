import { z } from "zod";

/**
 * Form schemas. Each mirrors the matching surplusbid-backend Zod schema
 * (src/modules/*\/*.validation.ts) so the frontend rejects exactly what the
 * API would, with friendlier messages.
 */

export const loginSchema = z.object({
  email: z.email("Enter a valid work email"),
  password: z.string().min(1, "Enter your password"),
});
export type LoginValues = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    role: z.enum(["BUYER", "SELLER"], { error: "Choose how you'll use SurplusBid" }),
    companyName: z.string().trim().min(2, "Company name must be at least 2 characters"),
    email: z.email("Enter a valid work email"),
    password: z
      .string()
      .min(8, "Use at least 8 characters")
      .regex(/[A-Za-z]/, "Include at least one letter")
      .regex(/\d/, "Include at least one number"),
    confirmPassword: z.string(),
    terms: z.literal(true, { error: "You must accept the terms to continue" }),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });
export type RegisterValues = z.infer<typeof registerSchema>;

export const profileSchema = z.object({
  companyName: z.string().trim().min(2, "Company name must be at least 2 characters"),
  taxId: z
    .string()
    .trim()
    .max(32, "Tax ID is too long")
    .regex(/^[A-Za-z0-9-]*$/, "Use letters, numbers and dashes only"),
});
export type ProfileValues = z.infer<typeof profileSchema>;

const MAX_FILE_BYTES = 5 * 1024 * 1024; // backend multer limit
const DOC_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"];

export const verificationSchema = z.object({
  document: z
    .instanceof(File, { message: "Attach a business registration document" })
    .refine((f) => f.size <= MAX_FILE_BYTES, "File must be 5 MB or smaller")
    .refine((f) => DOC_TYPES.includes(f.type), "Upload a PDF, JPG, PNG or WebP file"),
  confirm: z.literal(true, { error: "Confirm the document belongs to your company" }),
});
export type VerificationValues = z.infer<typeof verificationSchema>;

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const MAX_LOT_IMAGES = 5;

const money = (label: string) =>
  z
    .number({ error: `Enter the ${label}` })
    .positive(`${label[0].toUpperCase()}${label.slice(1)} must be greater than $0`)
    .max(10_000_000, `${label[0].toUpperCase()}${label.slice(1)} is too large`);

/** Wizard step 1: what is being sold. */
export const lotDetailsSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Title must be at least 3 characters")
    .max(120, "Keep the title under 120 characters"),
  categoryId: z.uuid("Choose a category"),
  condition: z.string().trim().min(2, "Describe the condition"),
  quantity: z
    .number({ error: "Enter a quantity" })
    .int("Quantity must be a whole number")
    .positive("Quantity must be at least 1"),
  description: z.string().trim().min(10, "Description must be at least 10 characters"),
});

/** Wizard step 2: photos (only at creation; the backend can't add them later). */
export const lotPhotosSchema = z.object({
  images: z
    .array(
      z
        .instanceof(File)
        .refine((f) => IMAGE_TYPES.includes(f.type), "Photos must be JPG, PNG or WebP")
        .refine((f) => f.size <= MAX_FILE_BYTES, "Each photo must be 5 MB or smaller"),
    )
    .min(1, "Add at least one photo")
    .max(MAX_LOT_IMAGES, `Up to ${MAX_LOT_IMAGES} photos`),
});

const pricingBase = z.object({
  startingPrice: money("starting price"),
  reservePrice: money("reserve price"),
  bidIncrement: money("bid increment"),
  startTime: z.string().min(1, "Choose when bidding opens"),
  endTime: z.string().min(1, "Choose when bidding closes"),
});

/** Wizard step 3: pricing & schedule. Dollar amounts; converted to cents on submit. */
export const lotPricingSchema = pricingBase
  .refine((v) => v.reservePrice >= v.startingPrice, {
    message: "Reserve can't be lower than the starting price",
    path: ["reservePrice"],
  })
  .refine((v) => v.bidIncrement <= v.startingPrice, {
    message: "Increment should not exceed the starting price",
    path: ["bidIncrement"],
  })
  .refine((v) => new Date(v.endTime) > new Date(v.startTime), {
    message: "Closing time must be after the opening time",
    path: ["endTime"],
  })
  .refine((v) => new Date(v.endTime).getTime() > Date.now(), {
    message: "Closing time must be in the future",
    path: ["endTime"],
  });

export const lotEditSchema = lotDetailsSchema.and(lotPricingSchema);

export type LotDetailsValues = z.infer<typeof lotDetailsSchema>;
export type LotPhotosValues = z.infer<typeof lotPhotosSchema>;
export type LotPricingValues = z.infer<typeof lotPricingSchema>;
export type LotEditValues = z.infer<typeof lotEditSchema>;

export const categorySchema = z.object({
  name: z.string().trim().min(2, "Category name must be at least 2 characters").max(40, "Keep it under 40 characters"),
});
export type CategoryValues = z.infer<typeof categorySchema>;

export const disputeSchema = z.object({
  lotId: z.uuid("Choose the lot this dispute is about"),
  reason: z.string().min(3, "Choose a reason"),
  description: z
    .string()
    .trim()
    .min(10, "Describe what happened in at least 10 characters")
    .max(2000, "Keep it under 2000 characters"),
});
export type DisputeValues = z.infer<typeof disputeSchema>;

export const resolveDisputeSchema = z.object({
  disputeId: z.uuid("Enter the dispute ID (a UUID)"),
  status: z.enum(["RESOLVED", "REJECTED"]),
  resolutionNote: z.string().trim().min(3, "Add a resolution note of at least 3 characters"),
});
export type ResolveDisputeValues = z.infer<typeof resolveDisputeSchema>;

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Enter your name"),
  email: z.email("Enter a valid email"),
  topic: z.enum(["buying", "selling", "verification", "payments", "other"], { error: "Choose a topic" }),
  message: z.string().trim().min(20, "Tell us a bit more (at least 20 characters)").max(2000),
});
export type ContactValues = z.infer<typeof contactSchema>;

/** Bid amount in dollars, validated against the live minimum. */
export const bidSchema = (minimumCents: number) =>
  z.object({
    amount: z.number({ error: "Enter a bid amount" }).refine((v) => Math.round(v * 100) >= minimumCents, {
      message: `Bid at least $${(minimumCents / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
    }),
  });
export type BidValues = z.infer<ReturnType<typeof bidSchema>>;
