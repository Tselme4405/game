"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, Eyebrow, FoodImage, Icon, StatusDot, formatMoney } from "@/components/ui-kit";
import { MENU_ITEMS } from "@/lib/constants";
import { isDeliverySession } from "@/lib/guards";
import { clearSession, getSession } from "@/lib/storage";
import type { OrderRecord } from "@/lib/types";

// Demo / mock data — энэ нь зөвхөн харуулах зорилгоор хэвлэгдэнэ
function makeMockOrders(): OrderRecord[] {
  const now = new Date();
  const mk = (dayOffset: number, idx: number, data: Omit<OrderRecord, "id" | "createdAt" | "role" | "status">): OrderRecord => {
    const d = new Date(now);
    d.setDate(now.getDate() - dayOffset);
    d.setHours(11, 30, idx, 0);
    return {
      ...data,
      id: `mock-${dayOffset}-${idx}`,
      createdAt: d.toISOString(),
      role: "student",
      status: "approved",
    };
  };
  return [
    mk(0, 1, { userName: "Болд-Эрдэнэ", classNumber: "301", items: [{ itemId: "mahtai_piroshki", name: "Махтай пирошки", qty: 2 }, { itemId: "mantuun_buuz", name: "Мантуун бууз", qty: 1 }], totalCount: 3 }),
    mk(0, 2, { userName: "Сарангэрэл", classNumber: "301", items: [{ itemId: "tomstoi_piroshki", name: "Төмстэй пирошки", qty: 1 }], totalCount: 1 }),
    mk(0, 3, { userName: "Тэмүүлэн", classNumber: "302", items: [{ itemId: "mahtai_piroshki", name: "Махтай пирошки", qty: 3 }], totalCount: 3 }),
    mk(0, 4, { userName: "Амарбаясгалан", classNumber: "303", items: [{ itemId: "mantuun_buuz", name: "Мантуун бууз", qty: 2 }, { itemId: "tomstoi_piroshki", name: "Төмстэй пирошки", qty: 1 }], totalCount: 3 }),
    mk(0, 5, { userName: "Номин-Эрдэнэ", classNumber: "401", items: [{ itemId: "mahtai_piroshki", name: "Махтай пирошки", qty: 1 }, { itemId: "tomstoi_piroshki", name: "Төмстэй пирошки", qty: 1 }], totalCount: 2 }),
    mk(0, 6, { userName: "Баярмаа", classNumber: "402", items: [{ itemId: "mantuun_buuz", name: "Мантуун бууз", qty: 4 }], totalCount: 4 }),
    mk(1, 1, { userName: "Энхжаргал", classNumber: "301", items: [{ itemId: "mahtai_piroshki", name: "Махтай пирошки", qty: 2 }], totalCount: 2 }),
    mk(1, 2, { userName: "Ганболд", classNumber: "302", items: [{ itemId: "tomstoi_piroshki", name: "Төмстэй пирошки", qty: 2 }], totalCount: 2 }),
    mk(2, 1, { userName: "Цолмон", classNumber: "403", items: [{ itemId: "mahtai_piroshki", name: "Махтай пирошки", qty: 1 }, { itemId: "mantuun_buuz", name: "Мантуун бууз", qty: 1 }], totalCount: 2 }),
    mk(2, 2, { userName: "Мөнхцэцэг", classNumber: "305", items: [{ itemId: "mantuun_buuz", name: "Мантуун бууз", qty: 3 }], totalCount: 3 }),
    mk(3, 1, { userName: "Анхбаяр", classNumber: "304", items: [{ itemId: "mahtai_piroshki", name: "Махтай пирошки", qty: 2 }, { itemId: "tomstoi_piroshki", name: "Төмстэй пирошки", qty: 1 }], totalCount: 3 }),
    mk(4, 1, { userName: "Дөлгөөн", classNumber: "302", items: [{ itemId: "mahtai_piroshki", name: "Махтай пирошки", qty: 1 }], totalCount: 1 }),
    mk(4, 2, { userName: "Уянга", classNumber: "401", items: [{ itemId: "mantuun_buuz", name: "Мантуун бууз", qty: 2 }, { itemId: "tomstoi_piroshki", name: "Төмстэй пирошки", qty: 2 }], totalCount: 4 }),
    mk(5, 1, { userName: "Жаргалсайхан", classNumber: "403", items: [{ itemId: "mahtai_piroshki", name: "Махтай пирошки", qty: 3 }], totalCount: 3 }),
    mk(6, 1, { userName: "Алтанзул", classNumber: "305", items: [{ itemId: "tomstoi_piroshki", name: "Төмстэй пирошки", qty: 1 }, { itemId: "mantuun_buuz", name: "Мантуун бууз", qty: 1 }], totalCount: 2 }),
  ];
}
const MOCK_ORDERS = makeMockOrders();

const DELIVERY_WINDOW_DAYS = 7;
const DELIVERY_TIME_ZONE = "Asia/Ulaanbaatar";

const dayKeyFmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: DELIVERY_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
const dayShortFmt = new Intl.DateTimeFormat("mn-MN", {
  timeZone: DELIVERY_TIME_ZONE,
  weekday: "short",
});

function getDayKey(d: Date | string) {
  return dayKeyFmt.format(d instanceof Date ? d : new Date(d));
}

type Day = {
  key: string;
  label: string;
  day: number;
  isToday: boolean;
  orders: OrderRecord[];
};

export default function DeliveryPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [selectedKey, setSelectedKey] = useState("");
  const [error, setError] = useState("");
  const [session] = useState(() => (typeof window === "undefined" ? null : getSession()));
  const isBrowser = typeof window !== "undefined";

  const approved = useMemo(
    () =>
      [...orders, ...MOCK_ORDERS]
        .filter((o) => o.status === "approved")
        .sort((l, r) => Date.parse(r.createdAt) - Date.parse(l.createdAt)),
    [orders],
  );

  const days: Day[] = useMemo(() => {
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    const map = new Map<string, OrderRecord[]>();
    for (const o of approved) {
      const k = getDayKey(o.createdAt);
      const arr = map.get(k) ?? [];
      arr.push(o);
      map.set(k, arr);
    }
    return Array.from({ length: DELIVERY_WINDOW_DAYS }, (_, i) => {
      const offset = DELIVERY_WINDOW_DAYS - 1 - i;
      const d = new Date(today);
      d.setDate(today.getDate() - offset);
      const k = getDayKey(d);
      return {
        key: k,
        label: dayShortFmt.format(d),
        day: d.getDate(),
        isToday: offset === 0,
        orders: map.get(k) ?? [],
      };
    });
  }, [approved]);

  useEffect(() => {
    if (!days.length) return;
    if (!days.some((d) => d.key === selectedKey)) {
      const todayDay = days.find((d) => d.isToday);
      setSelectedKey(todayDay?.key ?? days[days.length - 1].key);
    }
  }, [days, selectedKey]);

  const fetchOrders = useCallback(async () => {
    try {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
      const res = await fetch(
        `/api/orders?status=approved&limit=1000&days=${DELIVERY_WINDOW_DAYS}&cleanup=true`,
        { cache: "no-store" },
      );
      if (!res.ok) throw new Error("Захиалгуудыг уншиж чадсангүй.");
      const incoming = (await res.json()) as OrderRecord[];
      const dedup = new Map<string, OrderRecord>();
      for (const o of incoming) if (o?.id) dedup.set(o.id, o);
      setOrders(Array.from(dedup.values()));
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Алдаа гарлаа");
    }
  }, []);

  useEffect(() => {
    if (!isBrowser || !isDeliverySession(session)) return;
    void fetchOrders();
    const id = window.setInterval(() => void fetchOrders(), 5000);
    return () => window.clearInterval(id);
  }, [fetchOrders, isBrowser, session]);

  if (!isBrowser) return null;
  if (!isDeliverySession(session)) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "var(--bg)",
          display: "grid",
          placeItems: "center",
          padding: 24,
        }}
      >
        <Card>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>Нэвтрэх эрхгүй байна</h1>
          <button
            onClick={() => router.replace("/")}
            style={{
              marginTop: 16,
              background: "var(--text)",
              color: "var(--bg)",
              border: "none",
              borderRadius: 999,
              padding: "10px 20px",
              fontSize: 14,
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            Буцах
          </button>
        </Card>
      </main>
    );
  }

  const day = days.find((d) => d.key === selectedKey) ?? days[days.length - 1];
  const dayOrders = day?.orders ?? [];

  const DELIVERY_UNIT_PRICE = 2500;
  const itemTotals = MENU_ITEMS.map((m) => ({
    ...m,
    total: dayOrders.reduce(
      (s, o) => s + (o.items.find((x) => x.itemId === m.id)?.qty ?? 0),
      0,
    ),
  }));
  const totalItems = itemTotals.reduce((s, x) => s + x.total, 0);
  const totalRevenue = totalItems * DELIVERY_UNIT_PRICE;

  const byClass: Record<
    string,
    { total: number; students: OrderRecord[]; itemTotals: Record<string, number> }
  > = {};
  for (const o of dayOrders) {
    const c = o.classNumber ?? "—";
    if (!byClass[c]) byClass[c] = { total: 0, students: [], itemTotals: {} };
    byClass[c].students.push(o);
    byClass[c].total += o.totalCount;
    for (const it of o.items) {
      byClass[c].itemTotals[it.itemId] = (byClass[c].itemTotals[it.itemId] ?? 0) + it.qty;
    }
  }

  function logout() {
    clearSession();
    router.replace("/");
  }

  return (
    <main style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <header
        style={{
          padding: "16px clamp(16px, 4vw, 40px)",
          borderBottom: "1px solid var(--border)",
          background: "var(--surface)",
          position: "sticky",
          top: 0,
          zIndex: 20,
        }}
      >
        <div
          style={{
            maxWidth: 1400,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 10,
                background: "var(--text)",
                color: "var(--bg)",
                display: "grid",
                placeItems: "center",
                fontWeight: 900,
                fontSize: 16,
              }}
            >
              P
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800 }}>Хүргэлтийн самбар</div>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>{session!.name} · админ</div>
            </div>
          </div>
          <button
            onClick={logout}
            style={{
              background: "transparent",
              border: "1px solid var(--border)",
              borderRadius: 999,
              padding: "8px 16px",
              fontSize: 13,
              fontWeight: 700,
              color: "var(--muted)",
              cursor: "pointer",
            }}
          >
            Гарах
          </button>
        </div>
      </header>

      <section style={{ padding: "28px clamp(16px, 4vw, 40px) 80px", maxWidth: 1400, margin: "0 auto" }}>
        <div style={{ marginBottom: 24 }}>
          <Eyebrow>Хүргэлтийн календарь</Eyebrow>
          <h1
            style={{
              margin: "8px 0 0",
              fontSize: "clamp(28px, 4vw, 40px)",
              fontWeight: 800,
              letterSpacing: "-0.03em",
            }}
          >
            7 хоногийн захиалгын тойм
          </h1>
        </div>

        {error && (
          <div
            style={{
              marginBottom: 16,
              padding: 12,
              background: "#FBDBD3",
              border: "1px solid #F1B7AA",
              borderRadius: 12,
              fontSize: 13,
              color: "#8A2E1E",
              fontWeight: 600,
            }}
          >
            {error}
          </div>
        )}

        <div className="day-picker">
          {days.map((d) => {
            const active = selectedKey === d.key;
            return (
              <button
                key={d.key}
                onClick={() => setSelectedKey(d.key)}
                style={{
                  padding: "14px 10px",
                  background: active ? "var(--text)" : "var(--surface)",
                  color: active ? "var(--bg)" : "var(--text)",
                  border: `1px solid ${active ? "var(--text)" : "var(--border)"}`,
                  borderRadius: 18,
                  cursor: "pointer",
                  textAlign: "left",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    opacity: 0.7,
                  }}
                >
                  {d.label} {d.isToday && "· өнөөдөр"}
                </div>
                <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em", marginTop: 6 }}>
                  {d.day}
                </div>
                <div style={{ fontSize: 12, marginTop: 4, opacity: 0.75 }}>{d.orders.length} захиалга</div>
                {d.orders.length > 0 && !active && (
                  <span
                    style={{
                      position: "absolute",
                      top: 12,
                      right: 12,
                      width: 8,
                      height: 8,
                      borderRadius: 999,
                      background: "var(--accent)",
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 12,
            marginBottom: 24,
          }}
        >
          {[
            { eye: "Нийт ширхэг", big: totalItems, small: "захиалагдсан" },
            { eye: "Төлөх дүн", big: formatMoney(totalRevenue), small: "өнөөдөр" },
            { eye: "Сурагчид", big: dayOrders.length, small: "захиалсан" },
            { eye: "Ангиуд", big: Object.keys(byClass).length, small: "хүргэнэ" },
          ].map((k, i) => (
            <Card key={i}>
              <Eyebrow>{k.eye}</Eyebrow>
              <div
                style={{
                  fontSize: 32,
                  fontWeight: 800,
                  letterSpacing: "-0.03em",
                  marginTop: 10,
                  lineHeight: 1,
                }}
              >
                {k.big}
              </div>
              <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 6 }}>{k.small}</div>
            </Card>
          ))}
        </div>

        <div className="del-grid">
          <Card>
            <Eyebrow>Бүтээгдэхүүн</Eyebrow>
            <div style={{ marginTop: 16, display: "grid", gap: 14 }}>
              {itemTotals.map((it) => {
                const pct = totalItems ? Math.round((it.total / totalItems) * 100) : 0;
                return (
                  <div key={it.id} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, overflow: "hidden", flexShrink: 0 }}>
                      <FoodImage src={it.image} tone={it.tone} aspect="square" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ fontSize: 14, fontWeight: 700 }}>{it.name}</span>
                        <span style={{ fontSize: 14, fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>
                          {it.total} ш
                        </span>
                      </div>
                      <div
                        style={{
                          marginTop: 6,
                          height: 6,
                          background: "var(--surface-2)",
                          borderRadius: 999,
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            width: `${pct}%`,
                            background: "var(--accent)",
                            transition: "width 600ms",
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
              <Eyebrow>Ангиар</Eyebrow>
              <span style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600 }}>
                Хүргэх дарааллаар
              </span>
            </div>
            <div style={{ marginTop: 16, display: "grid", gap: 10 }}>
              {Object.keys(byClass)
                .sort()
                .map((cls) => (
                  <details
                    key={cls}
                    style={{
                      background: "var(--surface-2)",
                      borderRadius: 16,
                      border: "1px solid var(--border)",
                      overflow: "hidden",
                    }}
                  >
                    <summary
                      style={{
                        padding: "14px 16px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        cursor: "pointer",
                        listStyle: "none",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 12,
                            background: "var(--accent)",
                            color: "var(--on-accent)",
                            display: "grid",
                            placeItems: "center",
                            fontWeight: 800,
                            fontSize: 13,
                          }}
                        >
                          {cls}
                        </div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 800 }}>Анги {cls}</div>
                          <div style={{ fontSize: 12, color: "var(--muted)" }}>
                            {byClass[cls].students.length} сурагч · {byClass[cls].total} ш
                          </div>
                        </div>
                      </div>
                      <Icon name="chevron-down" size={18} />
                    </summary>
                    <div style={{ padding: "0 16px 14px", display: "grid", gap: 8 }}>
                      {byClass[cls].students.map((o) => (
                        <div
                          key={o.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "10px 12px",
                            background: "var(--surface)",
                            borderRadius: 12,
                            border: "1px solid var(--border)",
                          }}
                        >
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700 }}>{o.userName}</div>
                            <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
                              {o.items
                                .map((it) => {
                                  const m = MENU_ITEMS.find((x) => x.id === it.itemId);
                                  return `${it.qty}× ${m?.name.split(" ")[0]}`;
                                })
                                .join(" · ")}
                            </div>
                          </div>
                          <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontSize: 14, fontWeight: 800 }}>{o.totalCount} ш</span>
                            <StatusDot tone="approved" label="Төлсөн" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </details>
                ))}
              {Object.keys(byClass).length === 0 && (
                <div style={{ padding: 40, textAlign: "center", color: "var(--muted)" }}>
                  Энэ өдөрт захиалга байхгүй байна
                </div>
              )}
            </div>
          </Card>
        </div>
      </section>

      <style>{`
        .day-picker {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 8px;
          margin-bottom: 24px;
        }
        .del-grid {
          display: grid;
          grid-template-columns: 1fr 1.5fr;
          gap: 16px;
        }
        @media (max-width: 900px) {
          .del-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 600px) {
          .day-picker { grid-template-columns: repeat(auto-fit, minmax(90px, 1fr)); }
        }
      `}</style>
    </main>
  );
}
