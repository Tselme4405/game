"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { OrderCard } from "@/components/order-card";
import { PageShell } from "@/components/page-shell";
import { isDeliverySession } from "@/lib/guards";
import { getOrders, getSession } from "@/lib/storage";
import type { OrderRecord } from "@/lib/types";

export default function DeliveryPage() {
  const router = useRouter();
  const [orders] = useState<OrderRecord[]>(getOrders());

  const approvedOrders = useMemo(
    () => orders.filter((order) => order.status === "approved"),
    [orders],
  );

  if (typeof window === "undefined") {
    return null;
  }

  const session = getSession();
  if (!isDeliverySession(session)) {
    return (
      <PageShell>
        <div className="mx-auto mt-24 max-w-md rounded-2xl border border-rose-800 bg-rose-950/40 p-6 text-center">
          <h1 className="text-xl font-bold text-rose-100">Нэвтрэх эрхгүй байна</h1>
          <button
            type="button"
            onClick={() => router.replace("/")}
            className="mt-4 rounded-xl border border-rose-700 px-4 py-2 text-sm font-semibold text-rose-100 transition hover:bg-rose-900/40"
          >
            Буцах
          </button>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell title="Хүргэлтийн мэдээлэл" subtitle="Зөвшөөрөгдсөн захиалгууд">
      {approvedOrders.length === 0 ? (
        <EmptyState title="Хоосон байна" subtitle="Зөвшөөрөгдсөн захиалга алга." />
      ) : (
        <div className="grid gap-4">
          {approvedOrders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </PageShell>
  );
}
