"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { OrderCard } from "@/components/order-card";
import { PageShell } from "@/components/page-shell";
import { MENU_ITEMS } from "@/lib/constants";
import { isDeliverySession } from "@/lib/guards";
import { getSession } from "@/lib/storage";
import type { OrderRecord } from "@/lib/types";

type ItemTotals = Record<string, number>;

function createEmptyItemTotals(): ItemTotals {
  return Object.fromEntries(MENU_ITEMS.map((item) => [item.id, 0])) as ItemTotals;
}

export default function DeliveryPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [session] = useState(() => (typeof window === "undefined" ? null : getSession()));
  const isBrowser = typeof window !== "undefined";

  const approvedOrders = useMemo(
    () => orders.filter((order) => order.status === "approved"),
    [orders],
  );

  const totalApprovedItems = useMemo(
    () => approvedOrders.reduce((sum, order) => sum + order.totalCount, 0),
    [approvedOrders],
  );

  const itemTotals = useMemo(
    () =>
      MENU_ITEMS.map((item) => ({
        ...item,
        total: approvedOrders.reduce((sum, order) => {
          const match = order.items.find((orderItem) => orderItem.itemId === item.id);
          return sum + (match?.qty ?? 0);
        }, 0),
      })),
    [approvedOrders],
  );

  const classSummaries = useMemo(() => {
    const classMap = new Map<
      string,
      {
        classNumber: string;
        totalCount: number;
        itemTotals: Record<string, number>;
        students: Map<
          string,
          {
            name: string;
            totalCount: number;
            itemTotals: Record<string, number>;
          }
        >;
      }
    >();

    for (const order of approvedOrders) {
      const classNumber = order.classNumber?.trim() || "Анги тодорхойгүй";
      const classEntry =
        classMap.get(classNumber) ??
        {
          classNumber,
          totalCount: 0,
          itemTotals: createEmptyItemTotals(),
          students: new Map(),
        };

      classEntry.totalCount += order.totalCount;

      const studentEntry =
        classEntry.students.get(order.userName) ??
        {
          name: order.userName,
          totalCount: 0,
          itemTotals: createEmptyItemTotals(),
        };

      studentEntry.totalCount += order.totalCount;

      for (const item of order.items) {
        classEntry.itemTotals[item.itemId] =
          (classEntry.itemTotals[item.itemId] ?? 0) + item.qty;
        studentEntry.itemTotals[item.itemId] =
          (studentEntry.itemTotals[item.itemId] ?? 0) + item.qty;
      }

      classEntry.students.set(order.userName, studentEntry);
      classMap.set(classNumber, classEntry);
    }

    return Array.from(classMap.values())
      .map((classEntry) => ({
        ...classEntry,
        students: Array.from(classEntry.students.values()).sort((left, right) =>
          left.name.localeCompare(right.name, "mn"),
        ),
      }))
      .sort((left, right) => left.classNumber.localeCompare(right.classNumber, "mn"));
  }, [approvedOrders]);

  const fetchOrders = useCallback(async () => {
    try {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") {
        return;
      }

      const response = await fetch("/api/orders?status=approved&limit=500", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Захиалгуудыг уншиж чадсангүй.");
      }

      const incoming = (await response.json()) as OrderRecord[];
      const deduped = new Map<string, OrderRecord>();

      for (const order of incoming) {
        if (!order?.id) continue;
        deduped.set(order.id, order);
      }

      setOrders(Array.from(deduped.values()));
      setError("");
    } catch (nextError) {
      setError(
        nextError instanceof Error ? nextError.message : "Захиалгуудыг уншихад алдаа гарлаа.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isBrowser || !isDeliverySession(session)) {
      setLoading(false);
      return;
    }

    void fetchOrders();

    const intervalId = window.setInterval(() => {
      void fetchOrders();
    }, 5000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void fetchOrders();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [fetchOrders, isBrowser, session]);

  if (!isBrowser) {
    return null;
  }

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
    <PageShell
      title="Хүргэлтийн мэдээлэл"
      subtitle="Баталгаажсан захиалгуудын нийлбэр, ангиар болон сурагчаар задаргаа."
    >
      {error && (
        <div className="rounded-[1.5rem] border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-100">
          {error}
        </div>
      )}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-[1.75rem] border border-white/10 bg-black/35 p-5 shadow-[0_22px_60px_rgba(0,0,0,0.28)] backdrop-blur-2xl">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.3em] text-[#43f0c1]">
            Confirmed Orders
          </p>
          <p className="mt-3 text-4xl font-black text-[#f4efe8]">{approvedOrders.length}</p>
          <p className="mt-2 text-sm text-[#f4efe8]/64">Баталгаажсан захиалгын тоо</p>
        </article>

        <article className="rounded-[1.75rem] border border-white/10 bg-black/35 p-5 shadow-[0_22px_60px_rgba(0,0,0,0.28)] backdrop-blur-2xl">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.3em] text-[#43f0c1]">
            Total Items
          </p>
          <p className="mt-3 text-4xl font-black text-[#f4efe8]">{totalApprovedItems}</p>
          <p className="mt-2 text-sm text-[#f4efe8]/64">Нийт хүргэх бүтээгдэхүүн</p>
        </article>

        {itemTotals.slice(0, 2).map((item) => (
          <article
            key={item.id}
            className="rounded-[1.75rem] border border-white/10 bg-black/35 p-5 shadow-[0_22px_60px_rgba(0,0,0,0.28)] backdrop-blur-2xl"
          >
            <p className="text-[11px] font-extrabold uppercase tracking-[0.3em] text-[#43f0c1]">
              Item Total
            </p>
            <p className="mt-3 text-3xl font-black text-[#f4efe8]">{item.total}</p>
            <p className="mt-2 text-sm text-[#f4efe8]/64">{item.name}</p>
          </article>
        ))}
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-black/35 p-5 shadow-[0_22px_60px_rgba(0,0,0,0.28)] backdrop-blur-2xl sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.3em] text-[#43f0c1]">
              Item Summary
            </p>
            <h2 className="mt-3 text-2xl font-bold text-[#f4efe8]">Юм тус бүрийн нийт тоо</h2>
          </div>
          <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-[#f4efe8]/72">
            Approved only
          </div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {itemTotals.map((item) => (
            <div
              key={item.id}
              className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4"
            >
              <p className="text-sm font-semibold text-[#f4efe8]">{item.name}</p>
              <p className="mt-3 text-3xl font-black text-[#baffef]">{item.total}</p>
              <p className="mt-2 text-xs text-[#f4efe8]/54">ширхэг баталгаажсан</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.3em] text-[#43f0c1]">
            By Class
          </p>
          <h2 className="mt-3 text-2xl font-bold text-[#f4efe8]">
            Аль ангиас хэн юу авсныг харах
          </h2>
        </div>

        {loading && approvedOrders.length === 0 ? (
          <EmptyState title="Уншиж байна..." subtitle="Баталгаажсан захиалгуудыг шинэчилж байна." />
        ) : classSummaries.length === 0 ? (
          <EmptyState title="Хоосон байна" subtitle="Баталгаажсан захиалга алга." />
        ) : (
          <div className="space-y-4">
            {classSummaries.map((classSummary) => (
              <section
                key={classSummary.classNumber}
                className="rounded-[2rem] border border-white/10 bg-black/35 p-5 shadow-[0_22px_60px_rgba(0,0,0,0.28)] backdrop-blur-2xl sm:p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-extrabold uppercase tracking-[0.3em] text-[#43f0c1]">
                      Class
                    </p>
                    <h3 className="mt-3 text-2xl font-bold text-[#f4efe8]">
                      {classSummary.classNumber}
                    </h3>
                  </div>

                  <div className="rounded-[1.25rem] border border-white/10 bg-white/5 px-4 py-3 text-right">
                    <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#f4efe8]/54">
                      Нийт
                    </p>
                    <p className="mt-2 text-2xl font-black text-[#baffef]">
                      {classSummary.totalCount}
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {MENU_ITEMS.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-[1.25rem] border border-white/10 bg-white/5 px-4 py-3"
                    >
                      <p className="text-sm font-semibold text-[#f4efe8]">{item.name}</p>
                      <p className="mt-2 text-2xl font-black text-[#f4efe8]">
                        {classSummary.itemTotals[item.id] ?? 0}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-5 space-y-3">
                  {classSummary.students.map((student) => (
                    <article
                      key={`${classSummary.classNumber}-${student.name}`}
                      className="rounded-[1.5rem] border border-white/10 bg-black/30 p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-lg font-semibold text-[#f4efe8]">{student.name}</p>
                          <p className="mt-1 text-sm text-[#f4efe8]/58">
                            Нийт авсан: {student.totalCount} ш
                          </p>
                        </div>

                        <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-[#f4efe8]/72">
                          {classSummary.classNumber}
                        </div>
                      </div>

                      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        {MENU_ITEMS.map((item) => (
                          <div
                            key={item.id}
                            className="rounded-[1rem] border border-white/10 bg-white/5 px-3 py-2.5"
                          >
                            <p className="text-xs text-[#f4efe8]/56">{item.name}</p>
                            <p className="mt-1 text-lg font-bold text-[#baffef]">
                              {student.itemTotals[item.id] ?? 0}
                            </p>
                          </div>
                        ))}
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.3em] text-[#43f0c1]">
            Confirmed Orders
          </p>
          <h2 className="mt-3 text-2xl font-bold text-[#f4efe8]">
            Баталгаажсан захиалгуудын жагсаалт
          </h2>
        </div>

        {approvedOrders.length === 0 ? (
          <EmptyState title="Хоосон байна" subtitle="Зөвшөөрөгдсөн захиалга алга." />
        ) : (
          <div className="grid gap-4">
            {approvedOrders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </section>
    </PageShell>
  );
}
