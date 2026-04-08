"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { PageShell } from "@/components/page-shell";
import { MENU_ITEMS } from "@/lib/constants";
import { isAdminSession, isNormalStudentSession } from "@/lib/guards";
import { clearActiveOrderId, clearCart, createOrder, getCart, getSession, setActiveOrderId, upsertOrder } from "@/lib/storage";
import type { BonumEnvironment, Cart, OrderRecord, PaymentStatus, Session } from "@/lib/types";

type CopyField = "iban" | "accountNumber" | "accountName";

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
  expiresAt: number; // Date.now() + expiresIn * 1000
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
        title: "Төлсөнд баярлалаа",
        subtitle: "Таны төлбөр амжилттай баталгаажлаа.",
        tone: "border-emerald-700/40 bg-emerald-950/30 text-emerald-100",
      };
    case "rejected":
      return {
        title: "Төлбөр амжилтгүй боллоо",
        subtitle: "Гүйлгээ төлөгдөөгүй эсвэл цуцлагдсан байна.",
        tone: "border-rose-700/40 bg-rose-950/30 text-rose-100",
      };
    default:
      return {
        title: "Төлбөрийг автоматаар шалгаж байна",
        subtitle: "Гүйлгээ ормогц энэ хэсэг шууд шинэчлэгдэнэ.",
        tone: "border-emerald-700/40 bg-emerald-950/20 text-emerald-100",
      };
  }
}

export default function AccountPage() {
  const router = useRouter();
  const [session] = useState<Session | null>(getSession());
  const [cart] = useState<Cart>(getCart());
  const [submitting, setSubmitting] = useState(false);
  const [copiedField, setCopiedField] = useState<CopyField | null>(null);
  const [submitError, setSubmitError] = useState("");
  const [qrData, setQrData] = useState<BonumQrData | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrError, setQrError] = useState("");
  const [countdown, setCountdown] = useState(0);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const qrRequestRef = useRef(0);
  const qrOrderId = qrData?.orderId ?? null;
  const qrPaymentStatus = qrData?.status ?? null;

  useEffect(() => {
    if (!qrData) return;
    const tick = () => {
      const secs = Math.max(0, Math.round((qrData.expiresAt - Date.now()) / 1000));
      setCountdown(secs);
      if (secs === 0 && countdownRef.current) clearInterval(countdownRef.current);
    };
    tick();
    countdownRef.current = setInterval(tick, 1000);
    return () => { if (countdownRef.current) clearInterval(countdownRef.current); };
  }, [qrData]);

  useEffect(() => {
    if (!qrOrderId || qrPaymentStatus !== "pending") return;

    let cancelled = false;
    let intervalId: number | null = null;

    const syncPaymentStatus = async () => {
      try {
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

    return () => {
      cancelled = true;
      if (intervalId) {
        window.clearInterval(intervalId);
      }
    };
  }, [qrOrderId, qrPaymentStatus]);

  if (typeof window === "undefined") {
    return null;
  }

  if (!session) {
    router.replace("/");
    return null;
  }

  if (isAdminSession(session)) {
    router.replace("/admin");
    return null;
  }

  if (!isNormalStudentSession(session)) {
    router.replace("/");
    return null;
  }

  if (cart.totalCount <= 0) {
    router.replace("/select");
    return null;
  }

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

  async function handlePaid() {
    if (!session || selectedItems.length === 0 || submitting) return;

    setSubmitError("");
    setSubmitting(true);

    const localOrder = createOrder({
      userName: session.name,
      classNumber: session.classNumber,
      role: session.role,
      items: selectedItems,
      totalCount: cart.totalCount,
      status: "pending",
    });

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(localOrder),
      });

      if (!response.ok) {
        const message = await response.text().catch(() => "");
        throw new Error(message || "Захиалга хадгалж чадсангүй");
      }

      setActiveOrderId(localOrder.id);
      clearCart();
      router.push("/waiting");
    } catch (error) {
      setSubmitting(false);
      setSubmitError(error instanceof Error ? error.message : "Алдаа гарлаа");
    }
  }

  async function handleBonumQr() {
    if (!session || selectedItems.length === 0 || qrLoading) return;
    const requestId = qrRequestRef.current + 1;
    qrRequestRef.current = requestId;

    // Always discard any previous QR so a fresh invoice is shown
    setQrData(null);
    setQrError("");
    setQrLoading(true);

    try {
      // Get QR first so we have invoiceId before saving the order
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
          "Test QR generated, but no supported app links returned. Энэ нь Bonum test terminal тохиргоо дутуу байгааг илтгэж магадгүй."
        );
      }

      // Save order with Bonum IDs so the webhook can match it later
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
        const msg = await orderRes.text().catch(() => "");
        throw new Error(msg || "Захиалга хадгалж чадсангүй");
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
    } catch (err) {
      if (requestId === qrRequestRef.current) {
        setQrError(err instanceof Error ? err.message : "Алдаа гарлаа");
      }
    } finally {
      if (requestId === qrRequestRef.current) {
        setQrLoading(false);
      }
    }
  }

  async function handleCopy(field: CopyField, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(field);
      window.setTimeout(() => {
        setCopiedField((current) => (current === field ? null : current));
      }, 1400);
    } catch {
      setCopiedField(null);
    }
  }

  const glassCard =
    "rounded-[2rem] border border-white/10 bg-black/35 p-5 shadow-[0_22px_60px_rgba(0,0,0,0.28)] backdrop-blur-2xl sm:p-6";
  const panelCard = "rounded-[1.5rem] border border-white/10 bg-white/5 p-4";
  const subtleRow =
    "flex items-center justify-between gap-3 rounded-[1.25rem] border border-white/10 bg-black/30 px-4 py-3";
  const copyButton =
    "rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-[#f4efe8]/78 transition hover:border-white/20 hover:bg-white/10";
  const secondaryButton =
    "rounded-[1.2rem] border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-[#f4efe8] transition hover:border-white/20 hover:bg-white/10";
  const primaryButton =
    "rounded-[1.2rem] bg-[#43f0c1] px-4 py-3 text-sm font-extrabold text-[#04110d] shadow-[0_18px_36px_rgba(67,240,193,0.26)] transition hover:-translate-y-0.5 hover:bg-[#61f4ce]";

  return (
    <PageShell title="Төлбөрийн хэсэг" subtitle="QR, банкны апп, эсвэл шилжүүлгээр төлөөд төлөв нь автоматаар шинэчлэгдэнэ.">
      <div className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
        <aside className="space-y-4">
          <section className={glassCard}>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.3em] text-[#43f0c1]">
              Student
            </p>
            <h2 className="mt-3 text-2xl font-bold text-[#f4efe8]">{session.name}</h2>
            <p className="mt-1 text-sm text-[#f4efe8]/68">Анги: {session.classNumber}</p>

            <div className="mt-5 grid gap-3">
              <div className={panelCard}>
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#f4efe8]/52">
                  Нийт ширхэг
                </p>
                <p className="mt-2 text-3xl font-black text-[#f4efe8]">{totalQuantity}</p>
              </div>

              <div className="rounded-[1.5rem] border border-[#43f0c1]/20 bg-[#43f0c1]/8 p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#baffef]">
                  Нийт төлөх дүн
                </p>
                <p className="mt-2 text-3xl font-black text-[#baffef]">{formatMoney(totalPayment)}</p>
              </div>
            </div>
          </section>

          <section className={glassCard}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-extrabold uppercase tracking-[0.3em] text-[#43f0c1]">
                  Basket
                </p>
                <h3 className="mt-3 text-xl font-bold text-[#f4efe8]">Сонгосон зүйлс</h3>
              </div>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-[#f4efe8]/72">
                {selectedItems.length} төрөл
              </span>
            </div>

            <div className="mt-5 space-y-3">
              {selectedItems.length > 0 ? (
                selectedItems.map((item) => {
                  const lineTotal = item.qty * item.price;

                  return (
                    <div key={item.itemId} className={panelCard}>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-[#f4efe8]">{item.name}</p>
                        <p className="text-sm font-bold text-[#baffef]">{formatMoney(lineTotal)}</p>
                      </div>
                      <div className="mt-2 grid gap-1 text-xs text-[#f4efe8]/62">
                        <p>Тоо ширхэг: {item.qty} ш</p>
                        <p>Нэгж үнэ: {formatMoney(item.price)}</p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <EmptyState title="Хоосон байна" subtitle="Сонгосон зүйл алга." />
              )}
            </div>
          </section>
        </aside>

        <section className="space-y-4">
          <section className={glassCard}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-extrabold uppercase tracking-[0.3em] text-[#43f0c1]">
                  Payment
                </p>
                <h2 className="mt-3 text-2xl font-bold text-[#f4efe8]">QR эсвэл банкны аппаар төлөх</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-[#f4efe8]/72">
                  QR үүсмэгц утсаараа уншуулж эсвэл банкны аппын товчоор нээгээд төлнө. Төлөв
                  амжилттай ормогц энэ хуудас өөрөө шинэчлэгдэнэ.
                </p>
              </div>

              <div className="rounded-full border border-[#43f0c1]/20 bg-[#43f0c1]/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.24em] text-[#baffef]">
                realtime status
              </div>
            </div>

            {!qrData && (
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={handleBonumQr}
                  disabled={qrLoading || selectedItems.length === 0}
                  className={`flex-1 ${primaryButton} disabled:cursor-not-allowed disabled:opacity-50`}
                >
                  {qrLoading ? "QR үүсгэж байна..." : "QR болон аппын төлбөр эхлүүлэх"}
                </button>

                <button
                  type="button"
                  onClick={handlePaid}
                  disabled={submitting || selectedItems.length === 0}
                  className={`flex-1 ${secondaryButton} disabled:cursor-not-allowed disabled:opacity-50`}
                >
                  {submitting ? "Илгээж байна..." : "Шилжүүлгээр төлсөн"}
                </button>
              </div>
            )}

            {qrError && (
              <div className="mt-4 rounded-[1.5rem] border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-100">
                {qrError}
              </div>
            )}

            {submitError && (
              <div className="mt-4 rounded-[1.5rem] border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-100">
                {submitError}
              </div>
            )}
          </section>

          <section className={glassCard}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-extrabold uppercase tracking-[0.3em] text-[#43f0c1]">
                  Bank Details
                </p>
                <h3 className="mt-3 text-xl font-bold text-[#f4efe8]">Шилжүүлгийн мэдээлэл</h3>
              </div>

              <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-[#f4efe8]/72">
                Khan Bank
              </div>
            </div>

            <div className="mt-5 grid gap-3">
              <div className={subtleRow}>
                <span className="text-sm font-semibold text-[#f4efe8]/72">Банк</span>
                <span className="text-sm font-semibold text-[#f4efe8]">Khan Bank</span>
              </div>

              <div className={subtleRow}>
                <span className="text-sm font-semibold text-[#f4efe8]/72">IBAN</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-medium text-[#f4efe8]">9200500</span>
                  <button type="button" onClick={() => handleCopy("iban", "9200500")} className={copyButton}>
                    {copiedField === "iban" ? "Хуулсан" : "Хуулах"}
                  </button>
                </div>
              </div>

              <div className={subtleRow}>
                <span className="text-sm font-semibold text-[#f4efe8]/72">Дансны дугаар</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-medium text-[#f4efe8]">5217172741</span>
                  <button
                    type="button"
                    onClick={() => handleCopy("accountNumber", "5217172741")}
                    className={copyButton}
                  >
                    {copiedField === "accountNumber" ? "Хуулсан" : "Хуулах"}
                  </button>
                </div>
              </div>

              <div className={subtleRow}>
                <span className="text-sm font-semibold text-[#f4efe8]/72">Данс эзэмшигч</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-[#f4efe8]">Tselmeg</span>
                  <button
                    type="button"
                    onClick={() => handleCopy("accountName", "Tselmeg")}
                    className={copyButton}
                  >
                    {copiedField === "accountName" ? "Хуулсан" : "Хуулах"}
                  </button>
                </div>
              </div>
            </div>
          </section>

          {qrData ? (
            <section className={`${glassCard} ${paymentStatusCopy.tone}`}>
              <div className="flex w-full flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-extrabold uppercase tracking-[0.3em] text-[#43f0c1]">
                    Live Status
                  </p>
                  <h3 className="mt-3 text-2xl font-bold text-[#f4efe8]">
                    {isTestMode ? "Test горимын төлбөр" : paymentStatusCopy.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-[#f4efe8]/72">{paymentStatusCopy.subtitle}</p>
                </div>

                {qrData.status === "pending" && (
                  <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-mono text-[#f4efe8]">
                    {countdown > 0
                      ? `${Math.floor(countdown / 60)}:${String(countdown % 60).padStart(2, "0")}`
                      : "Хугацаа дууссан"}
                  </div>
                )}
              </div>

              {isTestMode && (
                <div className="mt-5 rounded-[1.5rem] border border-amber-500/30 bg-amber-500/10 p-4 text-left">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-bold uppercase tracking-[0.2em] text-amber-200">Test Mode</p>
                    <span className="rounded-full border border-amber-400/30 px-2 py-1 text-[10px] font-semibold text-amber-100">
                      SANDBOX
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-amber-100">
                    Энэ QR нь sandbox invoice тул банкны live app, QR scanner, эсвэл deeplink-р
                    төлөхөд хүчингүй гэж гарна. Жинхэнэ төлбөр ажиллуулахын тулд Bonum-ийн production
                    credential хэрэгтэй.
                  </p>
                </div>
              )}

              {qrData.status === "approved" ? (
                <div className="mt-5 rounded-[1.75rem] border border-emerald-500/30 bg-emerald-500/10 p-6 text-center">
                  <p className="text-5xl font-black text-emerald-300">OK</p>
                  <p className="mt-3 text-lg font-bold text-emerald-100">Төлсөнд баярлалаа</p>
                  <p className="mt-2 text-sm text-emerald-50/90">
                    Захиалга тань амжилттай бүртгэгдлээ. Энэ хэсэг real-time шинэчлэгдсэн болно.
                  </p>
                </div>
              ) : null}

              {showPaymentAppLinks && qrData.status === "pending" && (
                <div className="mt-5">
                  <p className="mb-3 text-[11px] font-extrabold uppercase tracking-[0.3em] text-[#43f0c1]">
                    Bank Apps
                  </p>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {actionableLinks.map((item) => (
                      <a
                        key={item.name}
                        href={getBonumLinkHref(item)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-col items-center gap-2 rounded-[1.5rem] border border-white/10 bg-black/30 px-3 py-4 text-center transition hover:border-white/20 hover:bg-black/40"
                      >
                        {item.logo && (
                          <img src={item.logo} alt={item.name} width={36} height={36} className="rounded-lg" />
                        )}
                        <span className="text-xs font-semibold leading-5 text-[#f4efe8]">{item.name}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {qrData.status !== "approved" && (
                <div className="mt-5 grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
                  <div className="flex flex-col items-center gap-3 rounded-[1.75rem] border border-white/10 bg-black/30 p-5">
                    <img
                      key={qrData.invoiceId}
                      src={`data:image/png;base64,${qrData.qrImage}`}
                      alt="Bonum QR code"
                      width={220}
                      height={220}
                      className="rounded-[1.25rem]"
                    />
                    <p className="text-xs text-[#f4efe8]/52">Invoice: {qrData.invoiceId}</p>
                  </div>

                  <div className="rounded-[1.75rem] border border-white/10 bg-black/30 p-5">
                    <p className="text-sm leading-7 text-[#f4efe8]/72">
                      {isTestMode
                        ? "Лавлах зорилгоор харуулж байна. Test mode дээр scanner-ээр бүү уншуул."
                        : qrData.status === "pending"
                          ? "Desktop дээр энэ хуудсыг нээлттэй орхиод утсаараа QR уншуулж эсвэл дээрх банкны аппын товчоор төлнө. Амжилттай төлөгдвөл энэ card шууд ногоон төлөвт шилжинэ."
                          : "Энэ invoice төлөгдөөгүй байна. Шинээр QR үүсгээд дахин оролдоно уу."}
                    </p>

                    <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                      <button
                        type="button"
                        onClick={handleBonumQr}
                        disabled={qrLoading}
                        className={`sm:flex-1 ${secondaryButton} disabled:opacity-50`}
                      >
                        {qrLoading ? "..." : qrData.status === "rejected" ? "QR дахин үүсгэх" : "QR шинэчлэх"}
                      </button>

                      <button
                        type="button"
                        onClick={() => router.push("/waiting")}
                        className={`sm:flex-1 ${primaryButton}`}
                      >
                        Төлөвийн дэлгэрэнгүй
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {qrData.status === "approved" && (
                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => router.push("/waiting")}
                    className={`sm:flex-1 ${secondaryButton}`}
                  >
                    Төлөвийн хуудас харах
                  </button>
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
                </div>
              )}
            </section>
          ) : null}
        </section>
      </div>
    </PageShell>
  );
}
