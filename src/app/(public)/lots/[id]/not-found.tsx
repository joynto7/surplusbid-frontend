import Link from "next/link";
import { LuPackageX } from "react-icons/lu";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";

export default function LotNotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-20">
      <EmptyState
        icon={LuPackageX}
        title="Lot not found"
        description="It may have been withdrawn by the seller, or the link is incorrect."
        action={
          <Button asChild>
            <Link href="/lots">Browse live auctions</Link>
          </Button>
        }
      />
    </div>
  );
}
