"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { PageShell } from "@/components/page-shell";
import { SummaryRow } from "@/components/summary-row";
import { MENU_ITEMS } from "@/lib/constants";
import { isAdminSession, isNormalStudentSession } from "@/lib/guards";
import { clearCart, createOrder, getCart, getSession } from "@/lib/storage";
import type { Cart, Session } from "@/lib/types";

type CopyField = "iban" | "accountNumber" | "accountName";

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
            <p className="mt-1 text-2xl font-bold">{cart.totalCount}</p>
          </div>
        </div>

        <div className="mt-5 space-y-2">
          {selectedItems.length > 0 ? (
            selectedItems.map((item) => (
              <SummaryRow key={item.itemId} label={item.name} value={`${item.qty} ш`} />
            ))
          ) : (
            <EmptyState title="Хоосон байна" subtitle="Сонгосон зүйл алга." />
          )}
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
