import { STATUS_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { PaymentStatus } from "@/lib/types";

type StatusBadgeProps = {
  status: PaymentStatus;
};

const styleMap: Record<PaymentStatus, string> = {
  draft: "border-neutral-700 bg-neutral-800 text-neutral-300",
  pending: "border-amber-800 bg-amber-950/60 text-amber-200",
  approved: "border-emerald-800 bg-emerald-950/60 text-emerald-200",
  rejected: "border-rose-800 bg-rose-950/60 text-rose-200",
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold",
        styleMap[status],
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
