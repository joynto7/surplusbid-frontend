import type { Metadata } from "next";
import { PaymentCancelled } from "@/components/payments/payment-result";
import { isUuid } from "@/lib/format";

export const metadata: Metadata = { title: "Payment cancelled" };

export default async function PaymentCancelPage({ searchParams }: PageProps<"/payment/cancel">) {
  const params = await searchParams;
  const paymentId = typeof params.payment_id === "string" && isUuid(params.payment_id) ? params.payment_id : undefined;
  const reason = params.reason === "declined" ? "Your bank declined the payment." : undefined;
  return <PaymentCancelled paymentId={paymentId} reason={reason} />;
}
