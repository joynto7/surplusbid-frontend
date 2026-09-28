import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { EditDraftForm } from "@/components/dashboard/seller/edit-draft-form";
import { PageHeader } from "@/components/shared/page-header";
import { ApiError } from "@/lib/api/errors";
import { serverApi } from "@/lib/api/server";
import { getClaims } from "@/lib/auth/session";
import { isUuid, lotCode } from "@/lib/format";

export const metadata: Metadata = { title: "Edit draft" };

export default async function EditDraftPage({ params }: PageProps<"/seller/lots/[id]/edit">) {
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const [lot, claims] = await Promise.all([
    serverApi.lot(id).catch((e) => {
      if (e instanceof ApiError && e.status === 404) notFound();
      throw e;
    }),
    getClaims(),
  ]);
  if (lot.sellerId !== claims?.id) notFound();
  if (lot.status !== "DRAFT") redirect(`/seller/lots/${id}`);
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title="Edit draft" description={`${lotCode(lot.id)} · only drafts can be edited`} />
      <EditDraftForm lot={lot} />
    </div>
  );
}
