"use client";

import { useRouter } from "next/navigation";
import { useOrder } from "../lib/orderStore";
import { Card, Eyebrow, Icon } from "@/components/ui-kit";

export default function SummaryPage() {
  const { state, totalQty, reset } = useOrder();
  const router = useRouter();
  const items = Object.values(state.items).filter((x) => x.qty > 0);

  function done() {
    reset();
    router.push("/");
  }

  return (
    <main style={{ minHeight: "100vh", background: "var(--bg)", padding: "40px 16px" }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <Eyebrow>Захиалга</Eyebrow>
        <h1
          style={{
            margin: "8px 0 24px",
            fontSize: 32,
            fontWeight: 800,
            letterSpacing: "-0.03em",
          }}
        >
          Дүгнэлт
        </h1>

        <Card padding={0} radius={24}>
          <div style={{ padding: 20, borderBottom: "1px solid var(--border)" }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "baseline" }}>
              <div style={{ fontSize: 13, color: "var(--muted)" }}>
                Үүрэг: <span style={{ color: "var(--text)", fontWeight: 700 }}>{state.role ?? "—"}</span>
              </div>
              {state.student && (
                <>
                  <div style={{ fontSize: 13, color: "var(--muted)" }}>
                    Нэр: <span style={{ color: "var(--text)", fontWeight: 700 }}>{state.student.name}</span>
                  </div>
                  <div style={{ fontSize: 13, color: "var(--muted)" }}>
                    Код:{" "}
                    <span style={{ color: "var(--text)", fontWeight: 700 }}>{state.student.classCode}</span>
                  </div>
                </>
              )}
              <div style={{ marginLeft: "auto", fontSize: 14, fontWeight: 800 }}>
                Нийт: {totalQty} ш
              </div>
            </div>
          </div>

          <div style={{ padding: 20 }}>
            {items.length === 0 ? (
              <div style={{ color: "var(--muted)", fontSize: 14, textAlign: "center", padding: 20 }}>
                Юу ч сонгоогүй байна.
              </div>
            ) : (
              <div style={{ display: "grid", gap: 8 }}>
                {items.map((it) => (
                  <div
                    key={it.key}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      background: "var(--surface-2)",
                      borderRadius: 14,
                      padding: "12px 14px",
                    }}
                  >
                    <span style={{ fontSize: 14, fontWeight: 700 }}>{it.name}</span>
                    <span style={{ fontSize: 14, color: "var(--muted)" }}>{it.qty} ш</span>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={done}
              disabled={totalQty === 0}
              style={{
                marginTop: 20,
                width: "100%",
                background: "var(--text)",
                color: "var(--bg)",
                border: "none",
                borderRadius: 999,
                padding: "14px",
                fontSize: 15,
                fontWeight: 800,
                cursor: totalQty === 0 ? "not-allowed" : "pointer",
                opacity: totalQty === 0 ? 0.4 : 1,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              Болсон <Icon name="check" size={16} />
            </button>
          </div>
        </Card>
      </div>
    </main>
  );
}
