"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { OrderCard } from "@/components/order-card";
import { PageShell } from "@/components/page-shell";
import { isAdminSession } from "@/lib/guards";
import { getOrders, getSession, updateOrderStatus } from "@/lib/storage";
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
  const [orders, setOrders] = useState<OrderRecord[]>(getOrders());

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

  function handleStatusUpdate(orderId: string, status: "approved" | "rejected") {
    const nextOrders = updateOrderStatus(orderId, status);
    setOrders(nextOrders);
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

      {visibleOrders.length === 0 ? (
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
