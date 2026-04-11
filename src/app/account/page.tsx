"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { PageShell } from "@/components/page-shell";
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
  return links.filter((link) => getBonumLinkHref(link).length > 0);
}

function resolveQrExpiry(expiresAt: unknown, expiresIn: unknown) {
  if (typeof expiresAt === "string") {
    const parsed = Date.parse(expiresAt);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  if (typeof expiresIn === "number" && Number.isFinite(expiresIn) && expiresIn > 0) {
    return Date.now() + expiresIn * 1000;
  }

  return Date.now() + 1800 * 1000;
}

function formatMoney(value: number) {
  return `${new Intl.NumberFormat("en-US").format(value)}₮`;
}

function getPaymentStatusCopy(status: PaymentStatus) {
  switch (status) {
    case "approved":
      return {
        title: "Төлбөр амжилттай орлоо",
        subtitle: "Захиалга шууд баталгаажсан.",
        tone: "border-emerald-500/30 bg-emerald-500/10 text-emerald-50",
      };
    case "rejected":
      return {
        title: "Төлбөр амжилтгүй боллоо",
        subtitle: "QR-ээ шинэчлээд дахин оролдоно уу.",
        tone: "border-rose-500/30 bg-rose-500/10 text-rose-50",
      };
    default:
      return null;
  }
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

  const selectedItems = MENU_ITEMS.filter((item) => (cart.items[item.id] ?? 0) > 0).map(
    (item) => ({
      itemId: item.id,
      name: item.name,
      qty: cart.items[item.id] ?? 0,
      price: item.price,
    }),
  );
  const totalQuantity = selectedItems.reduce((sum, item) => sum + item.qty, 0);
  const totalPayment = selectedItems.reduce((sum, item) => sum + item.qty * item.price, 0);
  const actionableLinks = qrData ? getActionableBonumLinks(qrData.links) : [];
  const isTestMode = qrData?.environment === "test";
  const showPaymentAppLinks = actionableLinks.length > 0 && !isTestMode;
  const paymentStatusCopy = getPaymentStatusCopy(qrData?.status ?? "pending");

  useEffect(() => {
    if (!qrData) return;

    const tick = () => {
      const secs = Math.max(0, Math.round((qrData.expiresAt - Date.now()) / 1000));
      setCountdown(secs);
      if (secs === 0 && countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };

    tick();
    countdownRef.current = setInterval(tick, 1000);

    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, [qrData]);

  useEffect(() => {
    if (!qrOrderId || qrPaymentStatus !== "pending") return;

    let cancelled = false;
    let intervalId: number | null = null;

    const syncPaymentStatus = async () => {
      try {
        if (typeof document !== "undefined" && document.visibilityState === "hidden") {
          return;
        }

        const response = await fetch(`/api/orders/${qrOrderId}`, {
          cache: "no-store",
        });

        if (!response.ok) {
          return;
        }

        const latestOrder = (await response.json()) as OrderStatusResponse;

        if (cancelled) return;

        upsertOrder(latestOrder);
        setActiveOrderId(latestOrder.id);
        setQrError(latestOrder.verificationError ?? "");
        setQrData((current) => {
          if (!current || current.orderId !== latestOrder.id) {
            return current;
          }

          return {
            ...current,
            status: latestOrder.status,
          };
        });

        if ((latestOrder.status === "approved" || latestOrder.status === "rejected") && intervalId) {
          window.clearInterval(intervalId);
        }
      } catch {
        // Keep polling; intermittent network failures should not interrupt payment status updates.
      }
    };

    void syncPaymentStatus();
    intervalId = window.setInterval(() => {
      void syncPaymentStatus();
    }, 3000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void syncPaymentStatus();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      cancelled = true;
      if (intervalId) {
        window.clearInterval(intervalId);
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
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

      if (requestId !== qrRequestRef.current) {
        return;
      }

      const environment: BonumEnvironment =
        qrJson.environment === "production" ? "production" : "test";
      const links = Array.isArray(qrJson.links) ? (qrJson.links as BonumLink[]) : [];
      const actionableQrLinks = getActionableBonumLinks(links);

      if (environment === "test" && actionableQrLinks.length === 0) {
        throw new Error(
          "Test QR generated, but no supported app links returned. Энэ нь Bonum test terminal тохиргоо дутуу байгааг илтгэж магадгүй.",
        );
      }

      const localOrder = createOrder({
        userName: session.name,
        classNumber: session.classNumber,
        role: session.role,
        items: selectedItems,
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

      const savedOrder = (await orderRes.json()) as OrderRecord;

      setQrData({
        environment,
        orderId: savedOrder.id,
        status: savedOrder.status,
        qrImage: qrJson.qrImage,
        invoiceId: qrJson.invoiceId,
        transactionId: qrJson.transactionId,
        links,
        expiresAt: resolveQrExpiry(qrJson.expiresAt, qrJson.expiresIn),
      });
      setActiveOrderId(savedOrder.id);
      clearCart();
    } catch (error) {
      if (requestId === qrRequestRef.current) {
        setQrError(error instanceof Error ? error.message : "Алдаа гарлаа");
      }
    } finally {
      if (requestId === qrRequestRef.current) {
        setQrLoading(false);
      }
    }
  }, [cart.totalCount, qrLoading, selectedItems, session, totalPayment]);

  useEffect(() => {
    if (selectedItems.length === 0 || qrData || qrLoading || autoQrStartedRef.current) {
      return;
    }

    autoQrStartedRef.current = true;
    void handleBonumQr();
  }, [handleBonumQr, qrData, qrLoading, selectedItems.length]);

  const primaryButton =
    "rounded-[1.2rem] bg-[#43f0c1] px-4 py-3 text-sm font-extrabold text-[#04110d] shadow-[0_18px_36px_rgba(67,240,193,0.26)] transition hover:-translate-y-0.5 hover:bg-[#61f4ce]";
  const secondaryButton =
    "rounded-[1.2rem] border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-[#f4efe8] transition hover:border-white/20 hover:bg-white/10";
  const panelCard = "rounded-[1.5rem] border border-white/10 bg-black/30 p-4 sm:p-5";
  const outerTone =
    qrData?.status === "approved"
      ? "border-emerald-500/35 bg-emerald-950/18"
      : qrData?.status === "rejected"
        ? "border-rose-500/25 bg-rose-950/12"
        : "border-white/10 bg-black/35";

  if (typeof window === "undefined") {
    return null;
  }

  if (!hasValidSession) {
    router.replace("/");
    return null;
  }

  if (cart.totalCount <= 0) {
    router.replace("/select");
    return null;
  }

  return (
    <PageShell title="Төлбөрийн хэсэг" subtitle="QR эсвэл банкны апп-аар төлнө.">
      <section
        className={`rounded-[2rem] border p-5 shadow-[0_22px_60px_rgba(0,0,0,0.28)] backdrop-blur-2xl sm:p-6 ${outerTone}`}
      >
        <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="space-y-4">
            <section className={panelCard}>
              <p className="text-[11px] font-extrabold uppercase tracking-[0.3em] text-[#43f0c1]">
                Profile
              </p>
              <h2 className="mt-3 text-2xl font-bold text-[#f4efe8]">{session.name}</h2>
              <p className="mt-1 text-sm text-[#f4efe8]/68">Анги: {session.classNumber}</p>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <div className="rounded-[1.4rem] border border-white/10 bg-white/5 p-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#f4efe8]/52">
                    Нийт ширхэг
                  </p>
                  <p className="mt-2 text-3xl font-black text-[#f4efe8]">{totalQuantity}</p>
                </div>

                <div className="rounded-[1.4rem] border border-[#43f0c1]/20 bg-[#43f0c1]/8 p-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#baffef]">
                    Нийт дүн
                  </p>
                  <p className="mt-2 text-3xl font-black text-[#baffef]">{formatMoney(totalPayment)}</p>
                </div>
              </div>
            </section>

            <section className={panelCard}>
              <p className="text-[11px] font-extrabold uppercase tracking-[0.3em] text-[#43f0c1]">
                Захиалга
              </p>
              <div className="mt-4 space-y-3">
                {selectedItems.map((item) => (
                  <div
                    key={item.itemId}
                    className="rounded-[1.25rem] border border-white/10 bg-white/5 px-4 py-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-[#f4efe8]">{item.name}</p>
                      <p className="text-sm font-bold text-[#baffef]">
                        {formatMoney(item.qty * item.price)}
                      </p>
                    </div>
                    <p className="mt-2 text-xs text-[#f4efe8]/62">
                      {item.qty} ш x {formatMoney(item.price)}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </aside>

          <section className={panelCard}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-extrabold uppercase tracking-[0.3em] text-[#43f0c1]">
                  QR төлбөр
                </p>
                <h2 className="mt-3 text-2xl font-bold text-[#f4efe8]">
                  QR эсвэл банкны апп-аар төлөх
                </h2>
                <p className="mt-2 text-sm leading-6 text-[#f4efe8]/72">
                  QR гармагц утсаараа уншуулж эсвэл банкны аппын товчоор төлнө.
                </p>
              </div>

              {qrData?.status === "pending" && (
                <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-mono text-[#f4efe8]">
                  {countdown > 0
                    ? `${Math.floor(countdown / 60)}:${String(countdown % 60).padStart(2, "0")}`
                    : "Хугацаа дууссан"}
                </div>
              )}
            </div>

            {paymentStatusCopy && (
              <div className={`mt-5 rounded-[1.5rem] border p-4 ${paymentStatusCopy.tone}`}>
                <p className="text-lg font-bold">{paymentStatusCopy.title}</p>
                <p className="mt-2 text-sm leading-6 opacity-90">{paymentStatusCopy.subtitle}</p>
              </div>
            )}

            {qrError && (
              <div className="mt-4 rounded-[1.5rem] border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-100">
                {qrError}
              </div>
            )}

            {!qrData && (
              <div className="mt-5 rounded-[1.75rem] border border-white/10 bg-black/25 p-5 text-center">
                <p className="text-sm font-semibold text-[#f4efe8]">
                  {qrLoading ? "QR үүсгэж байна..." : "QR бэлдээгүй байна."}
                </p>
                {!qrLoading && (
                  <button
                    type="button"
                    onClick={handleBonumQr}
                    className={`mt-4 ${primaryButton}`}
                  >
                    QR үүсгэх
                  </button>
                )}
              </div>
            )}

            {qrData && (
              <>
                {isTestMode && (
                  <div className="mt-5 rounded-[1.5rem] border border-amber-500/30 bg-amber-500/10 p-4 text-sm leading-6 text-amber-100">
                    Энэ QR нь test горимынх тул live банкны апп дээр ажиллахгүй байж магадгүй.
                  </div>
                )}

                {showPaymentAppLinks && qrData.status === "pending" && (
                  <div className="mt-5">
                    <p className="mb-3 text-[11px] font-extrabold uppercase tracking-[0.3em] text-[#43f0c1]">
                      Банкны апп
                    </p>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {actionableLinks.map((item) => (
                        <a
                          key={item.name}
                          href={getBonumLinkHref(item)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex min-h-[92px] flex-col items-center justify-center gap-2 rounded-[1.5rem] border border-white/10 bg-black/30 px-3 py-4 text-center transition hover:border-white/20 hover:bg-black/40"
                        >
                          {item.logo && (
                            <img
                              src={item.logo}
                              alt={item.name}
                              width={36}
                              height={36}
                              className="rounded-lg"
                            />
                          )}
                          <span className="text-xs font-semibold leading-5 text-[#f4efe8]">
                            {item.name}
                          </span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-5 grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
                  <div className="flex flex-col items-center gap-3 rounded-[1.75rem] border border-white/10 bg-black/30 p-4 sm:p-5">
                    <img
                      key={qrData.invoiceId}
                      src={`data:image/png;base64,${qrData.qrImage}`}
                      alt="Bonum QR code"
                      width={220}
                      height={220}
                      className="h-auto w-full max-w-[220px] rounded-[1.25rem]"
                    />
                  </div>

                  <div className="rounded-[1.75rem] border border-white/10 bg-black/30 p-4 sm:p-5">
                    <p className="text-sm leading-7 text-[#f4efe8]/72">
                      {qrData.status === "approved"
                        ? "Төлбөр орсон тул захиалга шууд баталгаажсан."
                        : qrData.status === "rejected"
                          ? "Төлбөр амжилтгүй болсон байна. QR-ээ шинэчлээд дахин оролдоно уу."
                          : "Төлбөр хийсний дараа захиалга шууд баталгаажна."}
                    </p>

                    <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                      {qrData.status !== "approved" && (
                        <button
                          type="button"
                          onClick={handleBonumQr}
                          disabled={qrLoading}
                          className={`sm:flex-1 ${secondaryButton} disabled:cursor-not-allowed disabled:opacity-50`}
                        >
                          {qrLoading ? "QR шинэчилж байна..." : "QR шинэчлэх"}
                        </button>
                      )}

                      {qrData.status === "approved" && (
                        <button
                          type="button"
                          onClick={() => {
                            clearActiveOrderId();
                            router.push("/select");
                          }}
                          className={`sm:flex-1 ${primaryButton}`}
                        >
                          Шинэ захиалга хийх
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </section>
        </div>
      </section>
    </PageShell>
  );
}
