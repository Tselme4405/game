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

const DELIVERY_WINDOW_DAYS = 7;
const DELIVERY_TIME_ZONE = "Asia/Ulaanbaatar";
const DELIVERY_SUMMARY_ITEMS = MENU_ITEMS;

const dayKeyFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: DELIVERY_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const dayLabelFormatter = new Intl.DateTimeFormat("mn-MN", {
  timeZone: DELIVERY_TIME_ZONE,
  month: "long",
  day: "numeric",
  weekday: "long",
});

type ItemTotals = Record<string, number>;

type StudentSummary = {
  name: string;
  totalCount: number;
  itemTotals: ItemTotals;
};

type ClassSummary = {
  classNumber: string;
  totalCount: number;
  itemTotals: ItemTotals;
  students: StudentSummary[];
};

type DaySummary = {
  key: string;
  dayNumber: number;
  label: string;
  isToday: boolean;
  totalOrders: number;
  totalItems: number;
  itemTotals: Array<{
    id: string;
    name: string;
    total: number;
  }>;
  classSummaries: ClassSummary[];
  orders: OrderRecord[];
};

function createEmptyItemTotals(): ItemTotals {
  return Object.fromEntries(MENU_ITEMS.map((item) => [item.id, 0])) as ItemTotals;
}

function getDeliveryDayKey(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);
  return dayKeyFormatter.format(date);
}

function buildItemTotals(orders: OrderRecord[]) {
  return MENU_ITEMS.map((item) => ({
    id: item.id,
    name: item.name,
    total: orders.reduce((sum, order) => {
      const match = order.items.find((orderItem) => orderItem.itemId === item.id);
      return sum + (match?.qty ?? 0);
    }, 0),
  }));
}

function buildClassSummaries(orders: OrderRecord[]): ClassSummary[] {
  const classMap = new Map<
    string,
    {
      classNumber: string;
      totalCount: number;
      itemTotals: ItemTotals;
      students: Map<string, StudentSummary>;
    }
  >();

  for (const order of orders) {
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
      classEntry.itemTotals[item.itemId] = (classEntry.itemTotals[item.itemId] ?? 0) + item.qty;
      studentEntry.itemTotals[item.itemId] = (studentEntry.itemTotals[item.itemId] ?? 0) + item.qty;
    }

    classEntry.students.set(order.userName, studentEntry);
    classMap.set(classNumber, classEntry);
  }

  return Array.from(classMap.values())
    .map((classEntry) => ({
      classNumber: classEntry.classNumber,
      totalCount: classEntry.totalCount,
      itemTotals: classEntry.itemTotals,
      students: Array.from(classEntry.students.values()).sort((left, right) =>
        left.name.localeCompare(right.name, "mn"),
      ),
    }))
    .sort((left, right) => left.classNumber.localeCompare(right.classNumber, "mn"));
}

function createDayWindow(days: number) {
  const anchor = new Date();
  anchor.setHours(12, 0, 0, 0);

  return Array.from({ length: days }, (_, index) => {
    const offset = days - index - 1;
    const date = new Date(anchor);
    date.setDate(anchor.getDate() - offset);

    return {
      key: getDeliveryDayKey(date),
      label: dayLabelFormatter.format(date),
      isToday: offset === 0,
    };
  });
}

export default function DeliveryPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedDayKey, setSelectedDayKey] = useState("");
  const [session] = useState(() => (typeof window === "undefined" ? null : getSession()));
  const isBrowser = typeof window !== "undefined";

  const approvedOrders = useMemo(
    () =>
      orders
        .filter((order) => order.status === "approved")
        .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt)),
    [orders],
  );

  const daySummaries = useMemo<DaySummary[]>(() => {
    const groupedOrders = new Map<string, OrderRecord[]>();

    for (const order of approvedOrders) {
      const dayKey = getDeliveryDayKey(order.createdAt);
      const dayOrders = groupedOrders.get(dayKey) ?? [];
      dayOrders.push(order);
      groupedOrders.set(dayKey, dayOrders);
    }

    return createDayWindow(DELIVERY_WINDOW_DAYS).map((day, index) => {
      const dayOrders = [...(groupedOrders.get(day.key) ?? [])].sort(
        (left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt),
      );

      return {
        key: day.key,
        dayNumber: index + 1,
        label: day.label,
        isToday: day.isToday,
        totalOrders: dayOrders.length,
        totalItems: dayOrders.reduce((sum, order) => sum + order.totalCount, 0),
        itemTotals: buildItemTotals(dayOrders),
        classSummaries: buildClassSummaries(dayOrders),
        orders: dayOrders,
      };
    });
  }, [approvedOrders]);

  const fallbackDayKey = useMemo(() => {
    for (let index = daySummaries.length - 1; index >= 0; index -= 1) {
      if (daySummaries[index].orders.length > 0) {
        return daySummaries[index].key;
      }
    }

    return daySummaries[daySummaries.length - 1]?.key ?? "";
  }, [daySummaries]);

  useEffect(() => {
    if (!daySummaries.length) return;

    const stillExists = daySummaries.some((day) => day.key === selectedDayKey);
    if (!selectedDayKey || !stillExists) {
      setSelectedDayKey(fallbackDayKey);
    }
  }, [daySummaries, fallbackDayKey, selectedDayKey]);

  const selectedDay =
    daySummaries.find((day) => day.key === selectedDayKey) ??
    daySummaries[daySummaries.length - 1] ??
    null;

  const fetchOrders = useCallback(async () => {
    try {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") {
        return;
      }

      const response = await fetch(
        `/api/orders?status=approved&limit=1000&days=${DELIVERY_WINDOW_DAYS}&cleanup=true`,
        {
          cache: "no-store",
        },
      );

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
      title="Хүргэлтийн 7 хоногийн мэдээлэл"
      subtitle="Сүүлийн 7 хоногийн баталгаажсан захиалгыг өдөр өдрөөр нь харуулна. 7 хоногоос хуучин өгөгдөл автоматаар цэвэрлэгдэнэ."
    >
      {error && (
        <div className="rounded-[1.5rem] border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-100">
          {error}
        </div>
      )}

      <section className="rounded-[2rem] border border-white/10 bg-black/35 p-5 shadow-[0_22px_60px_rgba(0,0,0,0.28)] backdrop-blur-2xl sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.3em] text-[#43f0c1]">
              Delivery Calendar
            </p>
            <h2 className="mt-3 text-2xl font-bold text-[#f4efe8]">
              7 хоногийн өдрүүд
            </h2>
            <p className="mt-2 text-sm text-[#f4efe8]/64">
              Өдөр дээр дарж тухайн өдрийн мэдээллийг харна.
            </p>
          </div>

          <div className="rounded-[1.25rem] border border-white/10 bg-white/5 px-4 py-3 text-right">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#f4efe8]/54">
              7 хоногийн захиалга
            </p>
            <p className="mt-2 text-2xl font-black text-[#f4efe8]">{approvedOrders.length}</p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-7">
          {daySummaries.map((day) => {
            const isActive = day.key === selectedDay?.key;

            return (
              <button
                key={day.key}
                type="button"
                onClick={() => setSelectedDayKey(day.key)}
                className={`rounded-[1.4rem] border px-4 py-4 text-left transition ${
                  isActive
                    ? "border-[#43f0c1]/35 bg-[#43f0c1]/12"
                    : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
                }`}
              >
                <p className="text-[11px] font-extrabold uppercase tracking-[0.24em] text-[#43f0c1]">
                  {day.dayNumber}-р өдөр
                </p>
                <p className="mt-2 text-sm font-semibold text-[#f4efe8]">{day.label}</p>
                <p className="mt-2 text-xs text-[#f4efe8]/62">{day.totalOrders} захиалга</p>
              </button>
            );
          })}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-[1.75rem] border border-white/10 bg-black/35 p-5 shadow-[0_22px_60px_rgba(0,0,0,0.28)] backdrop-blur-2xl">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.3em] text-[#43f0c1]">
            Total Items
          </p>
          <p className="mt-3 text-4xl font-black text-[#f4efe8]">
            {selectedDay?.totalItems ?? 0}
          </p>
          <p className="mt-2 text-sm text-[#f4efe8]/64">
            {selectedDay ? `${selectedDay.dayNumber}-р өдрийн нийт бүтээгдэхүүн` : "Тухайн өдрийн нийт бүтээгдэхүүн"}
          </p>
        </article>

        {DELIVERY_SUMMARY_ITEMS.map((item) => {
          const total =
            selectedDay?.itemTotals.find((entry) => entry.id === item.id)?.total ?? 0;

          return (
            <article
              key={item.id}
              className="rounded-[1.75rem] border border-white/10 bg-black/35 p-5 shadow-[0_22px_60px_rgba(0,0,0,0.28)] backdrop-blur-2xl"
            >
              <p className="text-[11px] font-extrabold uppercase tracking-[0.3em] text-[#43f0c1]">
                Item Total
              </p>
              <p className="mt-3 text-3xl font-black text-[#f4efe8]">{total}</p>
              <p className="mt-2 text-sm text-[#f4efe8]/64">{item.name}</p>
            </article>
          );
        })}
      </section>

      <section className="space-y-5">
        {loading && approvedOrders.length === 0 ? (
          <EmptyState title="Уншиж байна..." subtitle="7 хоногийн баталгаажсан захиалгуудыг шинэчилж байна." />
        ) : !selectedDay ? (
          <EmptyState title="Өдөр олдсонгүй" subtitle="7 хоногийн өдөр сонгоно уу." />
        ) : (
          <section className="rounded-[2rem] border border-white/10 bg-black/35 p-5 shadow-[0_22px_60px_rgba(0,0,0,0.28)] backdrop-blur-2xl sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-extrabold uppercase tracking-[0.3em] text-[#43f0c1]">
                  {selectedDay.dayNumber}-р өдөр
                </p>
                <h2 className="mt-3 text-2xl font-bold text-[#f4efe8]">
                  {selectedDay.label}
                </h2>
              </div>

              <div className="flex flex-wrap gap-3">
                {selectedDay.isToday && (
                  <div className="rounded-full border border-[#43f0c1]/20 bg-[#43f0c1]/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.24em] text-[#baffef]">
                    Өнөөдөр
                  </div>
                )}
                <div className="rounded-[1.25rem] border border-white/10 bg-white/5 px-4 py-3 text-right">
                  <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#f4efe8]/54">
                    Захиалга
                  </p>
                  <p className="mt-2 text-2xl font-black text-[#f4efe8]">{selectedDay.totalOrders}</p>
                </div>
              </div>
            </div>

            {selectedDay.orders.length === 0 ? (
              <div className="mt-5">
                <EmptyState title="Захиалга алга" subtitle="Энэ өдөр баталгаажсан захиалга бүртгэгдээгүй байна." />
              </div>
            ) : (
              <>
                <div className="mt-6 space-y-4">
                  <div>
                    <p className="text-[11px] font-extrabold uppercase tracking-[0.3em] text-[#43f0c1]">
                      By Class
                    </p>
                    <h3 className="mt-3 text-xl font-bold text-[#f4efe8]">
                      Тухайн өдрийн анги, сурагчийн задаргаа
                    </h3>
                  </div>

                  <div className="space-y-4">
                    {selectedDay.classSummaries.map((classSummary) => (
                      <section
                        key={`${selectedDay.key}-${classSummary.classNumber}`}
                        className="rounded-[1.75rem] border border-white/10 bg-black/30 p-4 sm:p-5"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-[11px] font-extrabold uppercase tracking-[0.3em] text-[#43f0c1]">
                              Class
                            </p>
                            <h4 className="mt-3 text-xl font-bold text-[#f4efe8]">
                              {classSummary.classNumber}
                            </h4>
                          </div>

                          <div className="rounded-[1.1rem] border border-white/10 bg-white/5 px-4 py-3 text-right">
                            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#f4efe8]/54">
                              Нийт
                            </p>
                            <p className="mt-2 text-2xl font-black text-[#baffef]">
                              {classSummary.totalCount}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                          {MENU_ITEMS.map((item) => (
                            <div
                              key={item.id}
                              className="rounded-[1rem] border border-white/10 bg-white/5 px-3 py-2.5"
                            >
                              <p className="text-xs text-[#f4efe8]/56">{item.name}</p>
                              <p className="mt-1 text-lg font-bold text-[#f4efe8]">
                                {classSummary.itemTotals[item.id] ?? 0}
                              </p>
                            </div>
                          ))}
                        </div>

                        <div className="mt-4 space-y-3">
                          {classSummary.students.map((student) => (
                            <article
                              key={`${selectedDay.key}-${classSummary.classNumber}-${student.name}`}
                              className="rounded-[1.25rem] border border-white/10 bg-white/5 p-4"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                  <p className="text-lg font-semibold text-[#f4efe8]">
                                    {student.name}
                                  </p>
                                  <p className="mt-1 text-sm text-[#f4efe8]/58">
                                    Нийт авсан: {student.totalCount} ш
                                  </p>
                                </div>

                                <div className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs font-semibold text-[#f4efe8]/72">
                                  {classSummary.classNumber}
                                </div>
                              </div>

                              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                                {MENU_ITEMS.map((item) => (
                                  <div
                                    key={item.id}
                                    className="rounded-[1rem] border border-white/10 bg-black/30 px-3 py-2.5"
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
                </div>

                <div className="mt-6 space-y-4">
                  <div>
                    <p className="text-[11px] font-extrabold uppercase tracking-[0.3em] text-[#43f0c1]">
                      Orders
                    </p>
                    <h3 className="mt-3 text-xl font-bold text-[#f4efe8]">
                      Тухайн өдрийн баталгаажсан захиалгууд
                    </h3>
                  </div>

                  <div className="grid gap-4">
                    {selectedDay.orders.map((order) => (
                      <OrderCard key={order.id} order={order} />
                    ))}
                  </div>
                </div>
              </>
            )}
          </section>
        )}
      </section>
    </PageShell>
  );
}
