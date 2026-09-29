import Link from "next/link";
import { LuGavel } from "react-icons/lu";
import { cn } from "@/lib/utils";

export function Logo({ href = "/", className }: { href?: string; className?: string }) {
  return (
    <Link href={href} className={cn("flex items-center gap-2 font-semibold tracking-tight", className)}>
      <span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
        <LuGavel className="size-4" aria-hidden />
      </span>
      <span>
        Surplus<span className="text-primary">Bid</span>
      </span>
    </Link>
  );
}
