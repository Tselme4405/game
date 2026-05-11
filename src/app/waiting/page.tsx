"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, Eyebrow, FoodImage, Icon } from "@/components/ui-kit";
import { MENU_ITEMS } from "@/lib/constants";
import { isNormalStudentSession } from "@/lib/guards";
import {
  clearActiveOrderId,
  getActiveOrderId,
  getOrderById,
  getSession,
  setActiveOrderId,
  upsertOrder,
} from "@/lib/storage";
import type { OrderRecord } from "@/lib/types";

type OrderStatusResponse = OrderRecord & { verificationError?: string | null };

const STEPS = [
  { k: "Баталгаажсан", s: "Төлбөр орж, захиалга гал тогоонд орлоо.", icon: "check" as const },
  { k: "Бэлтгэгдэж байна", s: "Пирошки шарагдаж байна. Халуухан хүрнэ.", icon: "flame" as const },
  { k: "Хүргэлтэнд гарсан", s: "Ангидаа хүргэгдэж байна.", icon: "truck" as const },
  { k: "Хүргэгдсэн", s: "Сайхан хооллоорой!", icon: "sparkle" as const },
];

export default function WaitingPage() {
  const router = useRouter();
  const [order, setOrder] = useState<OrderRecord | null>(() => {
    const id = getActiveOrderId();
    return id ? getOrderById(id) : null;
  });
  const [error, setError] = useState("");
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Time-based step:
  // 0 = Баталгаажсан, 1 = Бэлтгэгдэж байна, 2 = Хүргэлтэнд гарсан (>=13:00), 3 = Хүргэгдсэн (>=13:15)
  const minutesNow = now.getHours() * 60 + now.getMinutes();
  const step = minutesNow >= 13 * 60 + 15 ? 3 : minutesNow >= 13 * 60 ? 2 : 1;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const session = getSession();
    if (!session || !isNormalStudentSession(session)) {
      router.replace("/");
      return;
    }
    const id = getActiveOrderId();
    if (!id) {
      setError("Идэвхтэй захиалга олдсонгүй.");
      return;
    }
    let cancelled = false;
    let intervalId: number | null = null;
    const sync = async () => {
      try {
        if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
        const res = await fetch(`/api/orders/${id}`, { cache: "no-store" });
        if (res.status === 404) {
          if (!cancelled) setError("Захиалгын мэдээлэл олдсонгүй.");
          if (intervalId) clearInterval(intervalId);
          return;
        }
        if (!res.ok) throw new Error("Төлөв шалгаж чадсангүй");
        const next = (await res.json()) as OrderStatusResponse;
        if (cancelled) return;
        upsertOrder(next);
        setActiveOrderId(next.id);
        setOrder(next);
        setError(next.verificationError ?? "");
        if (next.status === "approved" || next.status === "rejected") {
          if (intervalId) clearInterval(intervalId);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Алдаа гарлаа");
      }
    };
    void sync();
    intervalId = window.setInterval(() => void sync(), 3000);
    return () => {
      cancelled = true;
      if (intervalId) clearInterval(intervalId);
    };
  }, [router]);

  if (typeof window === "undefined") return null;

  const items = order ? order.items.map((it) => {
    const meta = MENU_ITEMS.find((m) => m.id === it.itemId);
    return { ...it, image: meta?.image, tone: meta?.tone };
  }) : [];

  const idx = step;
  const cur = STEPS[idx];
  const orderNumber = order ? `#${order.id.slice(-5).toUpperCase()}` : `#PD-${String(Date.now()).slice(-5)}`;

  return (
    <main style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <header style={{ padding: "20px clamp(16px, 4vw, 40px)", maxWidth: 1000, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          <button
            onClick={() => router.push("/select")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 14px 10px 10px",
              borderRadius: 999,
              background: "var(--surface)",
              border: "1px solid var(--border)",
              fontSize: 14,
              fontWeight: 700,
              color: "var(--text)",
              cursor: "pointer",
            }}
          >
            <Icon name="chevron-left" size={16} /> Буцах
          </button>
          <Eyebrow>{orderNumber}</Eyebrow>
        </div>
        <div style={{ marginTop: 20 }}>
          <Eyebrow>Захиалга</Eyebrow>
          <h1
            style={{
              margin: "8px 0 0",
              fontSize: "clamp(28px, 4vw, 44px)",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              lineHeight: 1.05,
            }}
          >
            Захиалга бэлтгэгдэж байна
          </h1>
        </div>
      </header>

      <section style={{ padding: "8px clamp(16px, 4vw, 40px) 80px", maxWidth: 1000, margin: "0 auto" }}>
        <Card padding={0} radius={28} style={{ overflow: "hidden" }}>
          <div
            style={{
              padding: 32,
              background: "linear-gradient(180deg, var(--accent-soft), transparent)",
              display: "grid",
              gridTemplateColumns: "auto 1fr auto",
              alignItems: "center",
              gap: 24,
            }}
            className="wait-hero"
          >
            <div
              style={{
                width: 96,
                height: 96,
                borderRadius: 999,
                background: "var(--accent)",
                color: "var(--on-accent)",
                display: "grid",
                placeItems: "center",
                boxShadow: "0 12px 32px rgba(40,28,12,0.18)",
                position: "relative",
              }}
            >
              <Icon name={cur.icon} size={40} />
              {step < 3 && (
                <span
                  style={{
                    position: "absolute",
                    inset: -6,
                    borderRadius: 999,
                    border: "2px solid var(--accent)",
                    opacity: 0.4,
                    animation: "pulse-ring 2s ease-out infinite",
                  }}
                />
              )}
            </div>
            <div>
              <Eyebrow>
                {idx + 1}/{STEPS.length}
              </Eyebrow>
              <h2
                style={{
                  margin: "8px 0 0",
                  fontSize: "clamp(26px, 4vw, 36px)",
                  fontWeight: 800,
                  letterSpacing: "-0.02em",
                }}
              >
                {cur.k}
              </h2>
              <p style={{ margin: "6px 0 0", fontSize: 15, color: "var(--muted)" }}>{cur.s}</p>
            </div>
            <div style={{ textAlign: "right" }}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 800,
                  letterSpacing: "0.2em",
                  color: "var(--muted)",
                }}
              >
                ИРЭХ
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em", marginTop: 4 }}>13:15</div>
              {order?.classNumber && (
                <div style={{ fontSize: 13, color: "var(--muted)" }}>Анги {order.classNumber}</div>
              )}
            </div>
          </div>

          <div style={{ padding: "24px 32px 32px" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: `repeat(${STEPS.length}, 1fr)`,
                gap: 4,
              }}
            >
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  style={{
                    height: 6,
                    borderRadius: 999,
                    background: i <= idx ? "var(--accent)" : "var(--surface-2)",
                    transition: "background 400ms",
                  }}
                />
              ))}
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: `repeat(${STEPS.length}, 1fr)`,
                gap: 4,
                marginTop: 12,
              }}
            >
              {STEPS.map((s, i) => (
                <div
                  key={i}
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: i <= idx ? "var(--text)" : "var(--muted)",
                  }}
                >
                  {s.k}
                </div>
              ))}
            </div>
          </div>
        </Card>

        {error && (
          <div
            style={{
              marginTop: 16,
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

        {items.length > 0 && (
          <div style={{ marginTop: 20 }}>
            <Card>
              <Eyebrow>Захиалга</Eyebrow>
              <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
                {items.map((item) => (
                  <div key={item.itemId} style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, overflow: "hidden", flexShrink: 0 }}>
                      <FoodImage src={item.image} tone={item.tone} aspect="square" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700 }}>{item.name}</div>
                      <div style={{ fontSize: 12, color: "var(--muted)" }}>{item.qty} ш</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        <div style={{ marginTop: 20, textAlign: "center" }}>
          <button
            onClick={() => {
              clearActiveOrderId();
              router.push("/select");
            }}
            style={{
              background: "var(--text)",
              color: "var(--bg)",
              border: "none",
              borderRadius: 999,
              padding: "14px 28px",
              fontSize: 15,
              fontWeight: 800,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Icon name="plus" size={16} /> Шинэ захиалга
          </button>
        </div>
      </section>

      <style>{`
        @media (max-width: 720px) {
          .wait-hero {
            grid-template-columns: auto 1fr !important;
            padding: 24px !important;
          }
          .wait-hero > div:last-child {
            grid-column: 1 / -1;
            text-align: left !important;
          }
        }
      `}</style>
    </main>
  );
}
