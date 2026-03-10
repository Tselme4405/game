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

export default function AccountPage() {
  const router = useRouter();
  const [session] = useState<Session | null>(getSession());
  const [cart] = useState<Cart>(getCart());
  const [submitting, setSubmitting] = useState(false);

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

  return (
    <PageShell title="Данс" subtitle="Төлбөр баталгаажуулах хэсэг">
      <section className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-5 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1 text-sm text-neutral-300">
            <p>Үүрэг: сурагч</p>
            <p>Нэр: {session.name}</p>
            <p>Анги: {session.classNumber}</p>
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
