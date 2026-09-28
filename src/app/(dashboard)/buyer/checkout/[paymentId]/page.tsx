import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Checkout } from "@/components/payments/checkout";
import { PageHeader } from "@/components/shared/page-header";
import { ApiError } from "@/lib/api/errors";
import { serverApi } from "@/lib/api/server";
import { isUuid } from "@/lib/format";

export const metadata: Metadata = { title: "Checkout" };

export default async function CheckoutPage({ params }: PageProps<"/buyer/checkout/[paymentId]">) {
  const { paymentId } = await params;
  if (!isUuid(paymentId)) notFound();
  const payment = await serverApi.payment(paymentId).catch((error) => {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  });
  const lot = await serverApi.lot(payment.lotId).catch(() => null);

  return (
    <div className="space-y-6">
      <PageHeader title="Checkout" description="Pay the balance for your winning bid." />
      <Checkout payment={payment} lot={lot} />
    </div>
  );
}
