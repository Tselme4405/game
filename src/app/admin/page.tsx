"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { OrderCard } from "@/components/order-card";
import { PageShell } from "@/components/page-shell";
import { isAdminSession } from "@/lib/guards";
import { getSession } from "@/lib/storage";
import { cn } from "@/lib/utils";
import type { OrderRecord, PaymentStatus } from "@/lib/types";

type AdminTab = Extract<PaymentStatus, "pending" | "approved" | "rejected">;

const tabs: Array<{ key: AdminTab; label: string }> = [
  { key: "pending", label: "Хүлээгдэж буй" },
  { key: "approved", label: "Зөвшөөрөгдсөн" },
  { key: "rejected", label: "Үгүйсгэсэн" },
];

export default function AdminPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<AdminTab>("pending");
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const counts = useMemo(
    () => ({
      pending: orders.filter((order) => order.status === "pending").length,
      approved: orders.filter((order) => order.status === "approved").length,
      rejected: orders.filter((order) => order.status === "rejected").length,
    }),
    [orders],
  );

  const visibleOrders = useMemo(
    () => orders.filter((order) => order.status === activeTab),
    [orders, activeTab],
  );

  const fetchOrders = useCallback(async () => {
    try {
      const response = await fetch("/api/orders", { cache: "no-store" });
      if (!response.ok) return;

      const incoming = (await response.json()) as OrderRecord[];
      const dedupedMap = new Map<string, OrderRecord>();
      for (const order of incoming) {
        if (!order?.id) continue;
        dedupedMap.set(order.id, order);
      }
      setOrders(Array.from(dedupedMap.values()));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchOrders();
    const intervalId = window.setInterval(() => {
      void fetchOrders();
    }, 3000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [fetchOrders]);

  async function handleStatusUpdate(orderId: string, status: "approved" | "rejected") {
    const response = await fetch("/api/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: orderId, status }),
    });

    if (response.ok) {
      const updated = (await response.json()) as OrderRecord;
      setOrders((previous) =>
        previous.map((order) => (order.id === orderId ? updated : order)),
      );
    }
  }

  if (typeof window === "undefined") {
    return null;
  }

  const session = getSession();
  if (!isAdminSession(session)) {
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
    <PageShell title="Админ удирдлага" subtitle="Захиалгуудын төлөв удирдах хэсэг">
      <div className="sticky top-3 z-10 rounded-2xl border border-neutral-800 bg-neutral-900/90 p-2 backdrop-blur">
        <div className="grid gap-2 sm:grid-cols-3">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "rounded-xl border px-3 py-2 text-sm font-semibold transition",
                activeTab === tab.key
                  ? "border-neutral-500 bg-neutral-800 text-neutral-100"
                  : "border-neutral-800 bg-neutral-900 text-neutral-400 hover:border-neutral-700",
              )}
            >
              {tab.label} ({counts[tab.key]})
            </button>
          ))}
        </div>
      </div>

      {loading && orders.length === 0 ? (
        <EmptyState title="Уншиж байна..." subtitle="Шинэ захиалгуудыг шалгаж байна." />
      ) : visibleOrders.length === 0 ? (
        <EmptyState title="Хоосон байна" subtitle="Энэ төлөвт захиалга алга." />
      ) : (
        <div className="grid gap-4">
          {visibleOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              showActions={activeTab === "pending"}
              onApprove={(id) => handleStatusUpdate(id, "approved")}
              onReject={(id) => handleStatusUpdate(id, "rejected")}
            />
          ))}
        </div>
      )}
    </PageShell>
  );
}
