"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { FoodCard } from "@/components/food-card";
import { PageShell } from "@/components/page-shell";
import { MENU_ITEMS } from "@/lib/constants";
import { isNormalStudentSession } from "@/lib/guards";
import { getCart, getSession, setCart } from "@/lib/storage";
import type { Cart } from "@/lib/types";

function formatMoney(value: number) {
  return `${new Intl.NumberFormat("en-US").format(value)}₮`;
}

export default function SelectPage() {
  const router = useRouter();
  const [cart, setCartState] = useState<Cart>(getCart());
  const [error, setError] = useState("");

  if (typeof window === "undefined") {
    return null;
  }

  const session = getSession();
  if (!session) {
    router.replace("/");
    return null;
  }

  if (!isNormalStudentSession(session)) {
    router.replace("/");
    return null;
  }

  const totalCount = Object.values(cart.items).reduce((sum, qty) => sum + qty, 0);
  const selectedKinds = MENU_ITEMS.filter((item) => (cart.items[item.id] ?? 0) > 0).length;
  const totalPayment = MENU_ITEMS.reduce(
    (sum, item) => sum + (cart.items[item.id] ?? 0) * item.price,
    0,
  );

  function updateQty(itemId: string, qty: number) {
    const nextCart: Cart = {
      items: {
        ...cart.items,
        [itemId]: Math.max(0, qty),
      },
      totalCount: 0,
      updatedAt: new Date().toISOString(),
    };

    setCartState(nextCart);
    setCart(nextCart);
    setError("");
  }

  function goNext() {
    if (totalCount <= 0) {
      setError("Хамгийн багадаа 1 бүтээгдэхүүн сонгоно уу");
      return;
    }

    setCart(cart);
    router.push("/account");
  }

  return (
    <PageShell
      title="Сонголтоо хийнэ үү"
      subtitle="Өөрт хэрэгтэй төрлөө сонгоод дараагийн алхмаар төлбөрийн хэсэг рүү орно."
      rightSlot={
        <button
          type="button"
          onClick={goNext}
          className="hidden rounded-full bg-[#43f0c1] px-5 py-2.5 text-sm font-extrabold text-[#04110d] shadow-[0_14px_30px_rgba(67,240,193,0.26)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_36px_rgba(67,240,193,0.34)] sm:inline-flex"
        >
          Төлбөр рүү үргэлжлүүлэх
        </button>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {MENU_ITEMS.map((item) => (
            <FoodCard
              key={item.id}
              title={item.name}
              subtitle={`${item.subtitle} • ${formatMoney(item.price)}`}
              qty={cart.items[item.id] ?? 0}
              onQtyChange={(qty) => updateQty(item.id, qty)}
            />
          ))}
        </section>

        <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
          <section className="rounded-[2rem] border border-white/10 bg-black/35 p-5 shadow-[0_22px_60px_rgba(0,0,0,0.28)] backdrop-blur-2xl">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.3em] text-[#43f0c1]">
              Student Profile
            </p>
            <h2 className="mt-3 text-2xl font-bold text-[#f4efe8]">{session.name}</h2>
            <p className="mt-1 text-sm text-[#f4efe8]/68">Анги: {session.classNumber}</p>

            <div className="mt-5 grid gap-3 grid-cols-1 sm:grid-cols-3 xl:grid-cols-1">
              <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#f4efe8]/52">
                  Сонгосон төрөл
                </p>
                <p className="mt-2 text-3xl font-black text-[#f4efe8]">{selectedKinds}</p>
              </div>

              <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#f4efe8]/52">
                  Нийт ширхэг
                </p>
                <p className="mt-2 text-3xl font-black text-[#f4efe8]">{totalCount}</p>
              </div>

              <div className="rounded-[1.5rem] border border-[#43f0c1]/20 bg-[#43f0c1]/8 p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#baffef]">
                  Нийт дүн
                </p>
                <p className="mt-2 text-3xl font-black text-[#baffef]">{formatMoney(totalPayment)}</p>
              </div>
            </div>
          </section>

          <section className="rounded-[2rem] border border-white/10 bg-black/35 p-5 shadow-[0_22px_60px_rgba(0,0,0,0.28)] backdrop-blur-2xl">
            <p className="text-sm leading-7 text-[#f4efe8]/70">
              Сонголтоо хийсний дараа QR, банкны апп, эсвэл шилжүүлгээр төлөх хэсэг рүү шууд орно.
            </p>

            <button
              type="button"
              onClick={goNext}
              className="mt-5 w-full rounded-[1.25rem] bg-[#43f0c1] px-4 py-3.5 text-sm font-extrabold text-[#04110d] shadow-[0_18px_36px_rgba(67,240,193,0.26)] transition hover:-translate-y-0.5 hover:bg-[#61f4ce]"
            >
              Төлбөрийн хэсэг нээх
            </button>

            <p className="mt-3 text-xs leading-6 text-[#f4efe8]/52">
              Захиалга баталгаажсаны дараа төлбөрийн төлөв автоматаар шинэчлэгдэнэ.
            </p>
          </section>

          {error && (
            <div className="rounded-[1.5rem] border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-100">
              {error}
            </div>
          )}
        </aside>
      </div>

      <div className="sticky bottom-3 z-20 -mx-1 mt-6 rounded-[1.5rem] border border-white/10 bg-black/70 p-3 shadow-[0_22px_60px_rgba(0,0,0,0.32)] backdrop-blur-2xl sm:hidden">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.24em] text-[#43f0c1]">
              Нийт
            </p>
            <p className="mt-1 text-sm text-[#f4efe8]/68">
              {totalCount} ш • {formatMoney(totalPayment)}
            </p>
          </div>

          <button
            type="button"
            onClick={goNext}
            className="shrink-0 rounded-[1rem] bg-[#43f0c1] px-4 py-3 text-sm font-extrabold text-[#04110d] shadow-[0_18px_36px_rgba(67,240,193,0.26)] transition hover:bg-[#61f4ce]"
          >
            Төлөх
          </button>
        </div>
      </div>
    </PageShell>
  );
}
