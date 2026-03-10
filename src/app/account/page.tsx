"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { PageShell } from "@/components/page-shell";
import { MENU_ITEMS } from "@/lib/constants";
import { isAdminSession, isNormalStudentSession } from "@/lib/guards";
import { clearCart, createOrder, getCart, getSession } from "@/lib/storage";
import type { Cart, Session } from "@/lib/types";

type CopyField = "iban" | "accountNumber" | "accountName";
const UNIT_PRICE = 3500;

function formatMoney(value: number) {
  return `${new Intl.NumberFormat("en-US").format(value)}₮`;
}

export default function AccountPage() {
  const router = useRouter();
  const [session] = useState<Session | null>(getSession());
  const [cart] = useState<Cart>(getCart());
  const [submitting, setSubmitting] = useState(false);
  const [copiedField, setCopiedField] = useState<CopyField | null>(null);

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
    }),
  );
  const totalQuantity = selectedItems.reduce((sum, item) => sum + item.qty, 0);
  const totalPayment = totalQuantity * UNIT_PRICE;

  async function handlePaid() {
    if (!session || selectedItems.length === 0 || submitting) return;

    setSubmitting(true);

    createOrder({
      userName: session.name,
      classNumber: session.classNumber,
      role: session.role,
      items: selectedItems,
      totalCount: cart.totalCount,
      status: "pending",
    });

    clearCart();
    router.push("/waiting");
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

  return (
    <PageShell title="Данс" subtitle="Төлбөр баталгаажуулах хэсэг">
      <section className="rounded-2xl border border-emerald-700/40 bg-neutral-900/80 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-emerald-100">Төлбөрийн мэдээлэл</h2>
            <p className="mt-1 text-sm text-neutral-300">
              Төлбөрөө дээрх данс руу шилжүүлээд доорх товчийг дарна уу.
            </p>
          </div>
          <div className="rounded-xl border border-emerald-700/30 bg-emerald-950/30 px-3 py-1.5 text-xs font-semibold text-emerald-200">
            Шилжүүлгийн мэдээлэл
          </div>
        </div>

        <div className="mt-5 rounded-xl border border-neutral-700 bg-neutral-950/70 p-4 sm:p-5">
          <div className="grid gap-3">
            <div className="flex items-center justify-between gap-3 rounded-lg border border-neutral-800 bg-neutral-900/70 px-3 py-2.5">
              <span className="text-sm font-semibold text-neutral-200">Банк</span>
              <span className="text-sm font-medium text-white">Khan Bank</span>
            </div>

            <div className="flex items-center justify-between gap-3 rounded-lg border border-neutral-800 bg-neutral-900/70 px-3 py-2.5">
              <span className="text-sm font-semibold text-neutral-200">IBAN</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-medium text-white">9200500</span>
                <button
                  type="button"
                  onClick={() => handleCopy("iban", "9200500")}
                  className="rounded-md border border-neutral-700 px-2.5 py-1 text-xs font-semibold text-neutral-200 transition hover:border-neutral-500 hover:bg-neutral-800"
                >
                  {copiedField === "iban" ? "Хуулсан" : "Хуулах"}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 rounded-lg border border-neutral-800 bg-neutral-900/70 px-3 py-2.5">
              <span className="text-sm font-semibold text-neutral-200">Дансны дугаар</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-medium text-white">5217172741</span>
                <button
                  type="button"
                  onClick={() => handleCopy("accountNumber", "5217172741")}
                  className="rounded-md border border-neutral-700 px-2.5 py-1 text-xs font-semibold text-neutral-200 transition hover:border-neutral-500 hover:bg-neutral-800"
                >
                  {copiedField === "accountNumber" ? "Хуулсан" : "Хуулах"}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 rounded-lg border border-neutral-800 bg-neutral-900/70 px-3 py-2.5">
              <span className="text-sm font-semibold text-neutral-200">Данс эзэмшигч</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-white">Tselmeg</span>
                <button
                  type="button"
                  onClick={() => handleCopy("accountName", "Tselmeg")}
                  className="rounded-md border border-neutral-700 px-2.5 py-1 text-xs font-semibold text-neutral-200 transition hover:border-neutral-500 hover:bg-neutral-800"
                >
                  {copiedField === "accountName" ? "Хуулсан" : "Хуулах"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-5 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1 text-sm text-neutral-300">
            <p>
              <span className="font-semibold text-neutral-100">Үүрэг:</span> сурагч
            </p>
            <p>
              <span className="font-semibold text-neutral-100">Нэр:</span> {session.name}
            </p>
            <p>
              <span className="font-semibold text-neutral-100">Анги:</span> {session.classNumber}
            </p>
          </div>
          <div className="rounded-xl border border-neutral-800 bg-neutral-950/70 p-4 text-right">
            <p className="text-xs uppercase tracking-wide text-neutral-500">Нийт авсан</p>
            <p className="mt-1 text-2xl font-bold">{totalQuantity}</p>
          </div>
        </div>

        <div className="mt-5">
          {selectedItems.length > 0 ? (
            <div className="space-y-2">
              {selectedItems.map((item) => {
                const lineTotal = item.qty * UNIT_PRICE;

                return (
                  <div
                    key={item.itemId}
                    className="rounded-xl border border-neutral-800 bg-neutral-950/60 px-4 py-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-neutral-100">{item.name}</p>
                      <p className="text-sm font-bold text-emerald-300">{formatMoney(lineTotal)}</p>
                    </div>
                    <div className="mt-2 grid gap-2 text-xs text-neutral-300 sm:grid-cols-3">
                      <p>Тоо ширхэг: {item.qty} ш</p>
                      <p>Нэгж үнэ: {formatMoney(UNIT_PRICE)}</p>
                      <p className="sm:text-right">Мөрийн дүн: {formatMoney(lineTotal)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState title="Хоосон байна" subtitle="Сонгосон зүйл алга." />
          )}
        </div>

        <div className="mt-5 rounded-xl border border-emerald-800/40 bg-emerald-950/20 p-4">
          <h3 className="text-sm font-bold text-emerald-200">Төлбөрийн тооцоо</h3>
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between text-sm text-neutral-200">
              <span>Нийт авсан</span>
              <span className="font-semibold">{totalQuantity} ш</span>
            </div>
            <div className="flex items-center justify-between text-sm text-neutral-200">
              <span>Нэгж үнэ</span>
              <span className="font-semibold">{formatMoney(UNIT_PRICE)}</span>
            </div>
            <div className="flex items-center justify-between border-t border-emerald-900/60 pt-2 text-base">
              <span className="font-semibold text-neutral-100">Нийт төлөх дүн</span>
              <span className="font-bold text-emerald-300">{formatMoney(totalPayment)}</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handlePaid}
          disabled={submitting || selectedItems.length === 0}
          className="mt-6 w-full rounded-xl bg-neutral-100 px-4 py-3 text-sm font-bold text-neutral-900 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          Төлсөн
        </button>
      </section>
    </PageShell>
  );
}
