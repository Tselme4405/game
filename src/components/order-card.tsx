import { StatusBadge } from "@/components/status-badge";
import { formatDate } from "@/lib/utils";
import type { OrderRecord } from "@/lib/types";

type OrderCardProps = {
  order: OrderRecord;
  showActions?: boolean;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
};

export function OrderCard({
  order,
  showActions = false,
  onApprove,
  onReject,
}: OrderCardProps) {
  return (
    <article className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-base font-semibold">{order.userName}</p>
          <p className="mt-1 text-sm text-neutral-400">
            Анги: {order.classNumber ?? "-"}
          </p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div className="mt-4 rounded-xl border border-neutral-800 bg-neutral-950/70 p-3">
        <p className="text-xs uppercase tracking-wide text-neutral-500">Авсан зүйлс</p>
        <ul className="mt-2 space-y-1 text-sm text-neutral-300">
          {order.items.map((item) => (
            <li key={item.itemId} className="flex items-center justify-between">
              <span>{item.name}</span>
              <span>{item.qty} ш</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
        <p className="text-neutral-300">Нийт тоо: {order.totalCount}</p>
        <p className="text-neutral-400">Огноо: {formatDate(order.createdAt)}</p>
      </div>

      {showActions && (
        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => onApprove?.(order.id)}
            className="rounded-xl border border-emerald-700 bg-emerald-950/60 px-4 py-2 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-900/70"
          >
            Зөвшөөрөх
          </button>
          <button
            type="button"
            onClick={() => onReject?.(order.id)}
            className="rounded-xl border border-rose-700 bg-rose-950/60 px-4 py-2 text-sm font-semibold text-rose-100 transition hover:bg-rose-900/70"
          >
            Үгүйсгэх
          </button>
        </div>
      )}
    </article>
  );
}
