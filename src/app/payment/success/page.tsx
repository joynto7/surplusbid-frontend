import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PaymentSuccess } from "@/components/payments/payment-result";
import { isUuid } from "@/lib/format";

export const metadata: Metadata = { title: "Payment successful" };

/**
 * Stripe's return_url. Stripe appends payment_intent and redirect_status;
 * a failed redirect-based payment is sent on to the cancel page.
 */
export default async function PaymentSuccessPage({ searchParams }: PageProps<"/payment/success">) {
  const params = await searchParams;
  const paymentId = typeof params.payment_id === "string" ? params.payment_id : "";
  if (!isUuid(paymentId)) redirect("/buyer/payments");
  if (params.redirect_status === "failed") {
    redirect(`/payment/cancel?payment_id=${paymentId}&reason=declined`);
  }
  return <PaymentSuccess paymentId={paymentId} />;
}
