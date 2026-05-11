"use client";

import { useRouter } from "next/navigation";
import {
  Card,
  Eyebrow,
  FoodImage,
  Icon,
  QtyStepper,
  formatMoney,
} from "@/components/ui-kit";
import { MENU_ITEMS } from "@/lib/constants";
import { useOrder, type MenuKey } from "@/app/lib/orderStore";

const KEY_TO_ITEM: Record<MenuKey, string> = {
  mahtai: "mahtai_piroshki",
  piroshki: "tomstoi_piroshki",
  mantuun_buuz: "mantuun_buuz",
};

export default function MenuSelector({ nextPath }: { nextPath: string }) {
  const { state, setQty, totalQty } = useOrder();
  const router = useRouter();
  const canNext = totalQty > 0;

  return (
    <main style={{ minHeight: "100vh", background: "var(--bg)", padding: "40px 16px 100px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 16, flexWrap: "wrap", marginBottom: 24 }}>
          <div>
            <Eyebrow>Цэс</Eyebrow>
            <h1
              style={{
                margin: "8px 0 6px",
                fontSize: "clamp(28px, 4vw, 40px)",
                fontWeight: 800,
                letterSpacing: "-0.03em",
              }}
            >
              Сонголтоо хийнэ үү
            </h1>
            <p style={{ margin: 0, fontSize: 14, color: "var(--muted)" }}>
              Нийт сонгосон: <strong style={{ color: "var(--text)" }}>{totalQty} ш</strong>
            </p>
          </div>
          <button
            disabled={!canNext}
            onClick={() => router.push(nextPath)}
            style={{
              background: "var(--text)",
              color: "var(--bg)",
              border: "none",
              borderRadius: 999,
              padding: "12px 22px",
              fontSize: 14,
              fontWeight: 800,
              cursor: canNext ? "pointer" : "not-allowed",
              opacity: canNext ? 1 : 0.4,
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            Үргэлжлүүлэх <Icon name="arrow-right" size={16} />
          </button>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 16,
          }}
        >
          {(Object.keys(state.items) as MenuKey[]).map((key) => {
            const item = state.items[key];
            const meta = MENU_ITEMS.find((m) => m.id === KEY_TO_ITEM[key]);
            return (
              <Card key={key} padding={0} radius={24} accent={item.qty > 0}>
                <div style={{ position: "relative" }}>
                  <FoodImage src={meta?.image} alt={item.name} tone={meta?.tone} aspect="wide" />
                  {item.qty > 0 && (
                    <span
                      style={{
                        position: "absolute",
                        top: 12,
                        right: 12,
                        background: "var(--accent)",
                        color: "var(--on-accent)",
                        width: 36,
                        height: 36,
                        borderRadius: 999,
                        display: "grid",
                        placeItems: "center",
                        fontWeight: 800,
                        fontSize: 15,
                      }}
                    >
                      {item.qty}
                    </span>
                  )}
                </div>
                <div style={{ padding: 18 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, letterSpacing: "-0.01em" }}>
                      {item.name}
                    </h3>
                    {meta && (
                      <span style={{ fontSize: 17, fontWeight: 800 }}>{formatMoney(meta.price)}</span>
                    )}
                  </div>
                  {meta?.subtitle && (
                    <p style={{ margin: "6px 0 0", fontSize: 12, color: "var(--muted)", fontWeight: 600 }}>
                      {meta.subtitle}
                    </p>
                  )}
                  <div
                    style={{
                      marginTop: 16,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600 }}>
                      {meta?.kcal ?? 300} ккал
                    </span>
                    <QtyStepper value={item.qty} onChange={(n) => setQty(key, n)} />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </main>
  );
}
