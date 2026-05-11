"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useEffect } from "react";
import { Card, Eyebrow, FoodImage, Icon, QtyStepper, formatMoney } from "@/components/ui-kit";
import { MENU_ITEMS } from "@/lib/constants";
import { isNormalStudentSession } from "@/lib/guards";
import { getCart, getSession, setCart } from "@/lib/storage";
import type { Cart } from "@/lib/types";

export default function SelectPage() {
  const router = useRouter();
  const [cart, setCartState] = useState<Cart>(getCart());
  const [error, setError] = useState("");
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  if (typeof window === "undefined") return null;

  const session = getSession();
  if (!session) {
    router.replace("/");
    return null;
  }
  if (!isNormalStudentSession(session)) {
    router.replace("/");
    return null;
  }

  const totalCount = Object.values(cart.items).reduce((s, q) => s + q, 0);
  const totalPayment = MENU_ITEMS.reduce(
    (s, item) => s + (cart.items[item.id] ?? 0) * item.price,
    0,
  );
  const currentClock = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  const isAfterCutoff = now.getHours() * 60 + now.getMinutes() >= 13 * 60 + 15;

  function updateQty(itemId: string, qty: number) {
    const next: Cart = {
      items: { ...cart.items, [itemId]: Math.max(0, qty) },
      totalCount: 0,
      updatedAt: new Date().toISOString(),
    };
    setCartState(next);
    setCart(next);
    setError("");
  }

  function goNext() {
    if (totalCount <= 0) {
      setError("Хамгийн багадаа 1 хоол сонгоно уу");
      return;
    }
    setCart(cart);
    router.push("/account");
  }

  return (
    <main style={{ minHeight: "100vh", background: "var(--bg)", paddingBottom: totalCount > 0 ? 120 : 40 }}>
      {/* Header */}
      <header
        style={{
          padding: "20px clamp(16px, 4vw, 40px)",
          maxWidth: 1200,
          margin: "0 auto",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          <button
            onClick={() => router.push("/")}
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
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 999,
                background: "var(--accent)",
                color: "var(--on-accent)",
                display: "grid",
                placeItems: "center",
                fontWeight: 800,
                fontSize: 14,
              }}
            >
              {session.name.charAt(0).toUpperCase()}
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 13, fontWeight: 800 }}>{session.name}</div>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>Анги {session.classNumber}</div>
            </div>
          </div>
        </div>
        <div style={{ marginTop: 24 }}>
          <Eyebrow>Цэс</Eyebrow>
          <h1
            style={{
              margin: "8px 0 0",
              fontSize: "clamp(28px, 5vw, 48px)",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              lineHeight: 1,
            }}
          >
            Өнөөдөр юу идэх вэ?
          </h1>
        </div>

        {/* Delivery banner */}
        <div style={{ marginTop: 18 }}>
          <div
            style={{
              background: isAfterCutoff ? "#FFF3D1" : "var(--text)",
              color: isAfterCutoff ? "#5C3F00" : "var(--bg)",
              borderRadius: 18,
              padding: "14px 16px",
              display: "flex",
              alignItems: "center",
              gap: 12,
              maxWidth: 600,
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: isAfterCutoff ? "#F5B700" : "var(--accent)",
                color: isAfterCutoff ? "#3A2700" : "var(--on-accent)",
                display: "grid",
                placeItems: "center",
                flexShrink: 0,
              }}
            >
              <Icon name="clock" size={18} />
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.18em", opacity: 0.7 }}>
                ОДООГИЙН ЦАГ
              </div>
              <div style={{ fontSize: 14, fontWeight: 800, marginTop: 2 }}>
                {currentClock} · Анги {session.classNumber}
              </div>
              {isAfterCutoff && (
                <div style={{ fontSize: 12, fontWeight: 600, marginTop: 4, opacity: 0.85 }}>
                  13:15 цагаас хойш — таны захиалга маргааш хүргэгдэх болно
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main
        style={{
          padding: "8px clamp(16px, 4vw, 40px) 40px",
          maxWidth: 1200,
          margin: "0 auto",
        }}
      >
        <div className="select-grid">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 16,
            }}
          >
            {MENU_ITEMS.map((item) => {
              const qty = cart.items[item.id] ?? 0;
              return (
                <article
                  key={item.id}
                  style={{
                    background: "var(--surface)",
                    border: `1px solid ${qty > 0 ? "var(--accent)" : "var(--border)"}`,
                    borderRadius: 24,
                    overflow: "hidden",
                    boxShadow:
                      qty > 0
                        ? "0 0 0 3px color-mix(in oklab, var(--accent) 20%, transparent)"
                        : "0 2px 0 rgba(0,0,0,0.02)",
                    transition: "border-color 200ms, box-shadow 200ms",
                  }}
                >
                  <div style={{ position: "relative" }}>
                    <FoodImage src={item.image} alt={item.name} tone={item.tone} aspect="wide" />
                    {qty > 0 && (
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
                          boxShadow: "0 6px 14px rgba(40,28,12,0.18)",
                        }}
                      >
                        {qty}
                      </span>
                    )}
                  </div>
                  <div style={{ padding: 18 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                      <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, letterSpacing: "-0.01em" }}>
                        {item.name}
                      </h3>
                      <span style={{ fontSize: 17, fontWeight: 800 }}>{formatMoney(item.price)}</span>
                    </div>
                    <p style={{ margin: "6px 0 0", fontSize: 12, color: "var(--muted)", fontWeight: 600 }}>
                      {item.subtitle}
                    </p>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginTop: 16,
                      }}
                    >
                      <span style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600 }}>
                        {item.kcal} ккал · халуун
                      </span>
                      <QtyStepper value={qty} onChange={(v) => updateQty(item.id, v)} />
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          <aside className="select-aside">
            <Card padding={0} radius={24}>
              <div style={{ padding: 20, borderBottom: "1px solid var(--border)" }}>
                <Eyebrow>Таны захиалга</Eyebrow>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 12 }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 999,
                      background: "var(--surface-2)",
                      display: "grid",
                      placeItems: "center",
                      fontWeight: 800,
                    }}
                  >
                    {session.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 800 }}>{session.name}</div>
                    <div style={{ fontSize: 13, color: "var(--muted)" }}>Анги: {session.classNumber}</div>
                  </div>
                </div>
              </div>

              <div style={{ padding: 20, minHeight: 120 }}>
                {totalCount === 0 ? (
                  <div style={{ textAlign: "center", padding: "24px 8px" }}>
                    <div
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: 999,
                        background: "var(--surface-2)",
                        display: "grid",
                        placeItems: "center",
                        margin: "0 auto 12px",
                        color: "var(--muted)",
                      }}
                    >
                      <Icon name="bag" />
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>Сагс хоосон байна</div>
                    <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>
                      Цэснээс хоолоо сонгоно уу
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "grid", gap: 10 }}>
                    {MENU_ITEMS.filter((m) => (cart.items[m.id] ?? 0) > 0).map((item) => (
                      <div
                        key={item.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          padding: "10px 12px",
                          background: "var(--surface-2)",
                          borderRadius: 14,
                        }}
                      >
                        <div style={{ width: 40, height: 40, borderRadius: 10, overflow: "hidden", flexShrink: 0 }}>
                          <FoodImage src={item.image} tone={item.tone} aspect="square" />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: 13,
                              fontWeight: 700,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {item.name}
                          </div>
                          <div style={{ fontSize: 12, color: "var(--muted)" }}>
                            {cart.items[item.id]} ш × {formatMoney(item.price)}
                          </div>
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>
                          {formatMoney((cart.items[item.id] ?? 0) * item.price)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ padding: 20, borderTop: "1px solid var(--border)", background: "var(--surface-2)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <span style={{ fontSize: 15, fontWeight: 800 }}>Нийт</span>
                  <span style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em" }}>
                    {formatMoney(totalPayment)}
                  </span>
                </div>
                {error && (
                  <p style={{ margin: "12px 0 0", color: "#B4351F", fontSize: 13, fontWeight: 700 }}>{error}</p>
                )}
                <button
                  type="button"
                  onClick={goNext}
                  disabled={totalCount === 0}
                  style={{
                    marginTop: 16,
                    width: "100%",
                    background: "var(--text)",
                    color: "var(--bg)",
                    border: "none",
                    borderRadius: 999,
                    padding: "14px",
                    fontSize: 15,
                    fontWeight: 800,
                    cursor: totalCount === 0 ? "not-allowed" : "pointer",
                    opacity: totalCount === 0 ? 0.5 : 1,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  {totalCount === 0 ? "Хоол сонгоно уу" : `Төлөх · ${totalCount} ш`}
                  <Icon name="arrow-right" size={16} />
                </button>
              </div>
            </Card>
          </aside>
        </div>
      </main>

      {/* Mobile sticky cart bar */}
      {totalCount > 0 && (
        <div className="mobile-cart">
          <div>
            <div style={{ fontSize: 12, opacity: 0.7, fontWeight: 700 }}>
              {totalCount} ш · {formatMoney(totalPayment)}
            </div>
            <div style={{ fontSize: 15, fontWeight: 800 }}>Төлбөр рүү орох</div>
          </div>
          <button
            onClick={goNext}
            style={{
              background: "var(--accent)",
              color: "var(--on-accent)",
              border: "none",
              borderRadius: 999,
              padding: "12px 22px",
              fontSize: 14,
              fontWeight: 800,
              cursor: "pointer",
              display: "inline-flex",
              gap: 6,
              alignItems: "center",
            }}
          >
            Үргэлжлүүлэх <Icon name="arrow-right" size={16} />
          </button>
        </div>
      )}

      <style>{`
        .select-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 340px;
          gap: 32px;
          align-items: start;
        }
        .select-aside {
          position: sticky;
          top: 20px;
          align-self: start;
        }
        .mobile-cart {
          display: none;
        }
        @media (max-width: 900px) {
          .select-grid { grid-template-columns: 1fr; }
          .select-aside { position: static; }
          .mobile-cart {
            position: fixed;
            bottom: 16px;
            left: 16px;
            right: 16px;
            background: var(--text);
            color: var(--bg);
            border-radius: 999px;
            padding: 10px 10px 10px 20px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            box-shadow: 0 18px 36px rgba(40,28,12,0.28);
            z-index: 40;
          }
        }
      `}</style>
    </main>
  );
}
