"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Card,
  Eyebrow,
  FoodImage,
  Icon,
  StatusDot,
  formatMoney,
} from "@/components/ui-kit";
import { MENU_ITEMS } from "@/lib/constants";
import { isNormalStudentSession } from "@/lib/guards";
import {
  clearActiveOrderId,
  clearCart,
  createOrder,
  getCart,
  getSession,
  setActiveOrderId,
  upsertOrder,
} from "@/lib/storage";
import type {
  BonumEnvironment,
  Cart,
  OrderRecord,
  PaymentStatus,
  Session,
} from "@/lib/types";

interface BonumLink {
  name: string;
  logo?: string;
  link?: string;
  deeplink?: string;
}

interface BonumQrData {
  environment: BonumEnvironment;
  orderId: string;
  status: PaymentStatus;
  qrImage: string;
  invoiceId: string;
  transactionId: string;
  links: BonumLink[];
  expiresAt: number;
}

type OrderStatusResponse = OrderRecord & {
  verificationError?: string | null;
};

function getBonumLinkHref(link: BonumLink) {
  return link.deeplink ?? link.link ?? "";
}
function getActionableBonumLinks(links: BonumLink[]) {
  return links.filter((l) => getBonumLinkHref(l).length > 0);
}
function resolveQrExpiry(expiresAt: unknown, expiresIn: unknown) {
  if (typeof expiresAt === "string") {
    const parsed = Date.parse(expiresAt);
    if (Number.isFinite(parsed)) return parsed;
  }
  if (typeof expiresIn === "number" && Number.isFinite(expiresIn) && expiresIn > 0) {
    return Date.now() + expiresIn * 1000;
  }
  return Date.now() + 1800 * 1000;
}

export default function AccountPage() {
  const router = useRouter();
  const [session] = useState<Session | null>(getSession());
  const [cart] = useState<Cart>(getCart());
  const [qrData, setQrData] = useState<BonumQrData | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrError, setQrError] = useState("");
  const [countdown, setCountdown] = useState(0);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const qrRequestRef = useRef(0);
  const autoQrStartedRef = useRef(false);
  const qrOrderId = qrData?.orderId ?? null;
  const qrPaymentStatus = qrData?.status ?? null;
  const hasValidSession = !!session && isNormalStudentSession(session);

  const selectedItems = MENU_ITEMS.filter((item) => (cart.items[item.id] ?? 0) > 0).map((item) => ({
    itemId: item.id,
    name: item.name,
    qty: cart.items[item.id] ?? 0,
    price: item.price,
    image: item.image,
    tone: item.tone,
  }));
  const totalQuantity = selectedItems.reduce((s, i) => s + i.qty, 0);
  const totalPayment = selectedItems.reduce((s, i) => s + i.qty * i.price, 0);
  const actionableLinks = qrData ? getActionableBonumLinks(qrData.links) : [];
  const isTestMode = qrData?.environment === "test";

  useEffect(() => {
    if (!qrData) return;
    const tick = () => {
      const secs = Math.max(0, Math.round((qrData.expiresAt - Date.now()) / 1000));
      setCountdown(secs);
      if (secs === 0 && countdownRef.current) clearInterval(countdownRef.current);
    };
    tick();
    countdownRef.current = setInterval(tick, 1000);
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [qrData]);

  useEffect(() => {
    if (!qrOrderId || qrPaymentStatus !== "pending") return;
    let cancelled = false;
    let intervalId: number | null = null;

    const sync = async () => {
      try {
        if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
        const response = await fetch(`/api/orders/${qrOrderId}`, { cache: "no-store" });
        if (!response.ok) return;
        const latest = (await response.json()) as OrderStatusResponse;
        if (cancelled) return;
        upsertOrder(latest);
        setActiveOrderId(latest.id);
        setQrError(latest.verificationError ?? "");
        setQrData((cur) => (!cur || cur.orderId !== latest.id ? cur : { ...cur, status: latest.status }));
        if ((latest.status === "approved" || latest.status === "rejected") && intervalId) {
          window.clearInterval(intervalId);
        }
      } catch {
        /* ignore */
      }
    };

    void sync();
    intervalId = window.setInterval(() => void sync(), 3000);
    const onVis = () => {
      if (document.visibilityState === "visible") void sync();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelled = true;
      if (intervalId) window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [qrOrderId, qrPaymentStatus]);

  const handleBonumQr = useCallback(async () => {
    if (!session || selectedItems.length === 0 || qrLoading) return;
    const requestId = qrRequestRef.current + 1;
    qrRequestRef.current = requestId;
    setQrError("");
    setQrLoading(true);
    try {
      const qrRes = await fetch("/api/bonum/create-qr", {
        method: "POST",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: totalPayment }),
      });
      const qrJson = await qrRes.json();
      if (!qrRes.ok || !qrJson.success) {
        throw new Error(qrJson.error ?? "QR үүсгэхэд алдаа гарлаа");
      }
      if (requestId !== qrRequestRef.current) return;

      const environment: BonumEnvironment = qrJson.environment === "production" ? "production" : "test";
      const links: BonumLink[] = Array.isArray(qrJson.links) ? qrJson.links : [];

      const localOrder = createOrder({
        userName: session.name,
        classNumber: session.classNumber,
        role: session.role,
        items: selectedItems.map((i) => ({ itemId: i.itemId, name: i.name, qty: i.qty })),
        totalCount: cart.totalCount,
        status: "pending",
      });

      const orderRes = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...localOrder,
          bonumInvoiceId: qrJson.invoiceId,
          bonumTransactionId: qrJson.transactionId,
        }),
      });
      if (!orderRes.ok) {
        const message = await orderRes.text().catch(() => "");
        throw new Error(message || "Захиалга хадгалж чадсангүй");
      }
      const saved = (await orderRes.json()) as OrderRecord;

      setQrData({
        environment,
        orderId: saved.id,
        status: saved.status,
        qrImage: qrJson.qrImage,
        invoiceId: qrJson.invoiceId,
        transactionId: qrJson.transactionId,
        links,
        expiresAt: resolveQrExpiry(qrJson.expiresAt, qrJson.expiresIn),
      });
      setActiveOrderId(saved.id);
      clearCart();
    } catch (error) {
      if (requestId === qrRequestRef.current) {
        setQrError(error instanceof Error ? error.message : "Алдаа гарлаа");
      }
    } finally {
      if (requestId === qrRequestRef.current) setQrLoading(false);
    }
  }, [cart.totalCount, qrLoading, selectedItems, session, totalPayment]);

  useEffect(() => {
    if (selectedItems.length === 0 || qrData || qrLoading || autoQrStartedRef.current) return;
    autoQrStartedRef.current = true;
    void handleBonumQr();
  }, [handleBonumQr, qrData, qrLoading, selectedItems.length]);

  if (typeof window === "undefined") return null;
  if (!hasValidSession) {
    router.replace("/");
    return null;
  }
  if (cart.totalCount <= 0 && !qrData) {
    router.replace("/select");
    return null;
  }

  const mm = String(Math.floor(countdown / 60)).padStart(2, "0");
  const ss = String(countdown % 60).padStart(2, "0");

  return (
    <main style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <header style={{ padding: "20px clamp(16px, 4vw, 40px)", maxWidth: 1200, margin: "0 auto" }}>
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
              cursor: "pointer",
              color: "var(--text)",
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
              {session!.name.charAt(0).toUpperCase()}
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 13, fontWeight: 800 }}>{session!.name}</div>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>Анги {session!.classNumber}</div>
            </div>
          </div>
        </div>
        <div style={{ marginTop: 20 }}>
          <Eyebrow>QR төлбөр · Bonum</Eyebrow>
          <h1
            style={{
              margin: "8px 0 0",
              fontSize: "clamp(28px, 4vw, 44px)",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              lineHeight: 1.05,
            }}
          >
            Төлбөрөө хийнэ үү
          </h1>
        </div>
      </header>

      <section
        style={{
          padding: "8px clamp(16px, 4vw, 40px) 80px",
          maxWidth: 1200,
          margin: "0 auto",
        }}
      >
        <div className="pay-grid">
          <Card padding={0} radius={28}>
            <div
              style={{
                padding: "24px 28px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderBottom: "1px solid var(--border)",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <div>
                <Eyebrow>QR төлбөр</Eyebrow>
                <h2 style={{ margin: "8px 0 0", fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em" }}>
                  Банкны аппаар уншуулна уу
                </h2>
              </div>
              <StatusDot
                tone={
                  qrData?.status === "approved"
                    ? "approved"
                    : qrData?.status === "rejected"
                      ? "rejected"
                      : "pending"
                }
                label={
                  qrData?.status === "approved"
                    ? "Баталгаажсан"
                    : qrData?.status === "rejected"
                      ? "Цуцлагдсан"
                      : countdown > 0
                        ? `${mm}:${ss}`
                        : "Хүлээгдэж байна"
                }
              />
            </div>

            <div className="qr-body">
              <div
                style={{
                  background: "var(--surface-2)",
                  padding: 16,
                  borderRadius: 24,
                  border: "1px solid var(--border)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                {qrData ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={`data:image/png;base64,${qrData.qrImage}`}
                    alt="Bonum QR"
                    width={220}
                    height={220}
                    style={{ borderRadius: 12, width: "100%", maxWidth: 220, height: "auto" }}
                  />
                ) : (
                  <div
                    style={{
                      width: 220,
                      height: 220,
                      background: "var(--surface)",
                      borderRadius: 12,
                      display: "grid",
                      placeItems: "center",
                      color: "var(--muted)",
                      fontWeight: 700,
                      fontSize: 13,
                    }}
                  >
                    {qrLoading ? "QR үүсгэж байна..." : "QR бэлдэж байна..."}
                  </div>
                )}
                {qrData && (
                  <div
                    style={{
                      background: "var(--surface)",
                      padding: "8px 12px",
                      borderRadius: 10,
                      fontFamily: "ui-monospace, monospace",
                      fontSize: 11,
                      color: "var(--muted)",
                      letterSpacing: "0.08em",
                    }}
                  >
                    INV-{qrData.invoiceId.slice(-6).toUpperCase()}
                  </div>
                )}
              </div>

              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--muted)", marginBottom: 8 }}>Төлөх дүн</div>
                <div style={{ fontSize: 48, fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1 }}>
                  {formatMoney(totalPayment)}
                </div>
                <div style={{ fontSize: 14, color: "var(--muted)", marginTop: 6 }}>
                  {totalQuantity} ширхэг · {session!.name}
                </div>

                {isTestMode && (
                  <div
                    style={{
                      marginTop: 16,
                      padding: 12,
                      background: "#FFF3D1",
                      border: "1px solid #F1D88A",
                      borderRadius: 12,
                      fontSize: 12,
                      color: "#5C3F00",
                      fontWeight: 600,
                    }}
                  >
                    Test горим — live банкны апп дээр ажиллахгүй байж магадгүй.
                  </div>
                )}

                {actionableLinks.length > 0 && qrData?.status === "pending" && (
                  <div style={{ marginTop: 24 }}>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 800,
                        letterSpacing: "0.2em",
                        color: "var(--muted)",
                        marginBottom: 10,
                      }}
                    >
                      БАНКНЫ АПП
                    </div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
                        gap: 8,
                      }}
                    >
                      {actionableLinks.map((item) => (
                        <a
                          key={item.name}
                          href={getBonumLinkHref(item)}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            padding: "10px 12px",
                            background: "var(--surface-2)",
                            border: "1px solid var(--border)",
                            borderRadius: 14,
                            fontSize: 13,
                            fontWeight: 700,
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            color: "var(--text)",
                          }}
                        >
                          {item.logo ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img src={item.logo} alt={item.name} width={28} height={28} style={{ borderRadius: 8 }} />
                          ) : (
                            <div
                              style={{
                                width: 28,
                                height: 28,
                                borderRadius: 8,
                                background: "var(--bg)",
                                display: "grid",
                                placeItems: "center",
                                fontWeight: 800,
                                fontSize: 11,
                              }}
                            >
                              {item.name.charAt(0)}
                            </div>
                          )}
                          {item.name}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {qrData?.status === "approved" && (
                  <div
                    style={{
                      marginTop: 20,
                      padding: 16,
                      background: "#E8F6ED",
                      border: "1px solid #B4E4C4",
                      borderRadius: 16,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#0E5132" }}>
                      <Icon name="check" size={18} />
                      <span style={{ fontWeight: 800, fontSize: 15 }}>Төлбөр амжилттай орлоо</span>
                    </div>
                    <button
                      onClick={() => router.push("/waiting")}
                      style={{
                        marginTop: 12,
                        width: "100%",
                        background: "var(--accent)",
                        color: "var(--on-accent)",
                        border: "none",
                        borderRadius: 999,
                        padding: "12px",
                        fontSize: 14,
                        fontWeight: 800,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                      }}
                    >
                      Захиалгаа харах <Icon name="arrow-right" size={14} />
                    </button>
                  </div>
                )}

                {qrError && (
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
                    {qrError}
                  </div>
                )}

                {(qrData?.status === "pending" || qrData?.status === "rejected") && (
                  <div style={{ marginTop: 16, display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <button
                      onClick={handleBonumQr}
                      disabled={qrLoading}
                      style={{
                        background: "var(--surface-2)",
                        color: "var(--text)",
                        border: "1px solid var(--border)",
                        borderRadius: 999,
                        padding: "12px 18px",
                        fontSize: 14,
                        fontWeight: 800,
                        cursor: qrLoading ? "not-allowed" : "pointer",
                        opacity: qrLoading ? 0.6 : 1,
                      }}
                    >
                      {qrLoading ? "QR шинэчилж байна..." : "QR шинэчлэх"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </Card>

          <Card padding={0} radius={24}>
            <div style={{ padding: 20, borderBottom: "1px solid var(--border)" }}>
              <Eyebrow>Захиалгын хураангуй</Eyebrow>
            </div>
            <div style={{ padding: 20, display: "grid", gap: 12 }}>
              {selectedItems.length === 0 && qrData ? (
                <div style={{ fontSize: 14, color: "var(--muted)" }}>
                  Захиалга үүсгэгдсэн. Төлбөр хүлээгдэж байна.
                </div>
              ) : (
                selectedItems.map((item) => (
                  <div key={item.itemId} style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, overflow: "hidden", flexShrink: 0 }}>
                      <FoodImage src={item.image} tone={item.tone} aspect="square" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700 }}>{item.name}</div>
                      <div style={{ fontSize: 12, color: "var(--muted)" }}>{item.qty} ш</div>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 800 }}>{formatMoney(item.qty * item.price)}</div>
                  </div>
                ))
              )}
            </div>
            <div
              style={{
                padding: 20,
                borderTop: "1px solid var(--border)",
                background: "var(--surface-2)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
              }}
            >
              <span style={{ fontSize: 14, fontWeight: 800 }}>Нийт</span>
              <span style={{ fontSize: 18, fontWeight: 800 }}>{formatMoney(totalPayment)}</span>
            </div>
          </Card>
        </div>

        {qrData?.status === "approved" && (
          <div style={{ marginTop: 20, textAlign: "center" }}>
            <button
              onClick={() => {
                clearActiveOrderId();
                router.push("/select");
              }}
              style={{
                background: "transparent",
                color: "var(--muted)",
                border: "1px solid var(--border)",
                borderRadius: 999,
                padding: "10px 20px",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Шинэ захиалга хийх
            </button>
          </div>
        )}
      </section>

      <style>{`
        .pay-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 360px;
          gap: 24px;
          align-items: start;
        }
        .qr-body {
          padding: 28px;
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 28px;
          align-items: center;
        }
        @media (max-width: 900px) {
          .pay-grid { grid-template-columns: 1fr; }
          .qr-body { grid-template-columns: 1fr; padding: 20px; }
        }
      `}</style>
    </main>
  );
}
