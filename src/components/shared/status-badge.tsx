import { cn } from "@/lib/utils";
import type {
  BidStatus,
  DisputeStatus,
  LotStatus,
  MessageStatus,
  PaymentStatus,
  Role,
  VerificationStatus,
} from "@/types/api";

type Tone = "neutral" | "info" | "success" | "warning" | "danger" | "live";

const TONES: Record<Tone, string> = {
  neutral: "bg-muted text-muted-foreground border-border",
  info: "bg-primary/10 text-primary border-primary/20",
  success: "bg-success/10 text-success border-success/25",
  warning: "bg-warning/10 text-warning border-warning/25",
  danger: "bg-destructive/10 text-destructive border-destructive/25",
  live: "bg-success/10 text-success border-success/25",
};

type AnyStatus =
  | LotStatus
  | PaymentStatus
  | BidStatus
  | VerificationStatus
  | DisputeStatus
  | MessageStatus
  | Role
  | "WATCHING"
  | "WON"
  | "LOST";

const MAP: Record<AnyStatus, { tone: Tone; label: string }> = {
  DRAFT: { tone: "neutral", label: "Draft" },
  LIVE: { tone: "live", label: "Live" },
  ENDED: { tone: "neutral", label: "Ended" },
  SOLD: { tone: "success", label: "Sold" },
  UNSOLD: { tone: "warning", label: "Unsold" },
  CANCELLED: { tone: "danger", label: "Cancelled" },
  PENDING: { tone: "warning", label: "Pending" },
  SUCCEEDED: { tone: "success", label: "Paid" },
  FAILED: { tone: "danger", label: "Failed" },
  REFUNDED: { tone: "neutral", label: "Refunded" },
  ACTIVE: { tone: "info", label: "Active" },
  OUTBID: { tone: "danger", label: "Outbid" },
  WINNING: { tone: "success", label: "Winning" },
  UNVERIFIED: { tone: "neutral", label: "Unverified" },
  VERIFIED: { tone: "success", label: "Verified" },
  REJECTED: { tone: "danger", label: "Rejected" },
  OPEN: { tone: "warning", label: "Open" },
  UNDER_REVIEW: { tone: "info", label: "Under review" },
  RESOLVED: { tone: "success", label: "Resolved" },
  NEW: { tone: "info", label: "New" },
  READ: { tone: "neutral", label: "Read" },
  ARCHIVED: { tone: "neutral", label: "Archived" },
  BUYER: { tone: "info", label: "Buyer" },
  SELLER: { tone: "warning", label: "Seller" },
  ADMIN: { tone: "danger", label: "Admin" },
  WATCHING: { tone: "neutral", label: "Watching" },
  WON: { tone: "success", label: "Won" },
  LOST: { tone: "neutral", label: "Lost" },
};

/** One badge for every status enum in the domain, so colours stay consistent app-wide. */
export function StatusBadge({ status, className }: { status: AnyStatus; className?: string }) {
  const { tone, label } = MAP[status] ?? { tone: "neutral", label: status };
  return (
    <span
      className={cn(
        "inline-flex h-5 items-center gap-1.5 rounded-full border px-2 font-medium text-xs whitespace-nowrap",
        TONES[tone],
        className,
      )}
    >
      {tone === "live" && (
        <span className="relative flex size-1.5">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-current opacity-60" />
          <span className="relative inline-flex size-1.5 rounded-full bg-current" />
        </span>
      )}
      {label}
    </span>
  );
}
