import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LuChevronLeft } from "react-icons/lu";
import { LotPerformance } from "@/components/dashboard/seller/lot-performance";
import { ApiError } from "@/lib/api/errors";
import { serverApi } from "@/lib/api/server";
import { getClaims } from "@/lib/auth/session";
import { isUuid } from "@/lib/format";

export const metadata: Metadata = { title: "Lot performance" };

export default async function LotPerformancePage({ params }: PageProps<"/seller/lots/[id]">) {
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const [lot, claims] = await Promise.all([
    serverApi.lot(id).catch((e) => {
      if (e instanceof ApiError && e.status === 404) notFound();
      throw e;
    }),
    getClaims(),
  ]);
  // Sellers only see performance for their own lots.
  if (lot.sellerId !== claims?.id) notFound();
  return (
    <div className="space-y-4">
      <Link
        href="/seller/lots"
        className="flex w-fit items-center gap-1 text-muted-foreground text-sm hover:text-foreground"
      >
        <LuChevronLeft className="size-4" /> My listings
      </Link>
      <LotPerformance initialLot={lot} />
    </div>
  );
}
