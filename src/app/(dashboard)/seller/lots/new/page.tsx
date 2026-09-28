import type { Metadata } from "next";
import { LotWizard } from "@/components/dashboard/seller/lot-wizard";
import { PageHeader } from "@/components/shared/page-header";
import { serverApi } from "@/lib/api/server";
import { isUuid } from "@/lib/format";

export const metadata: Metadata = { title: "Create a lot" };

/** `?from=<lotId>` relists a previous lot with its details prefilled. */
export default async function NewLotPage({ searchParams }: PageProps<"/seller/lots/new">) {
  const { from } = await searchParams;
  const relistFrom = typeof from === "string" && isUuid(from) ? await serverApi.lot(from).catch(() => null) : null;
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title={relistFrom ? "Relist a lot" : "Create a lot"}
        description="Four quick steps. Your progress is saved if you leave this page."
      />
      <LotWizard relistFrom={relistFrom} />
    </div>
  );
}
