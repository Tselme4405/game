"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { FoodCard } from "@/components/food-card";
import { PageShell } from "@/components/page-shell";
import { MENU_ITEMS } from "@/lib/constants";
import { isAdminSession, isNormalStudentSession } from "@/lib/guards";
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

  if (isAdminSession(session)) {
    router.replace("/admin");
    return null;
  }

  if (!isNormalStudentSession(session)) {
    router.replace("/");
    return null;
  }

  const totalCount = Object.values(cart.items).reduce((sum, qty) => sum + qty, 0);

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
      subtitle={`Нийт сонгосон: ${totalCount}`}
      rightSlot={
        <button
          type="button"
          onClick={goNext}
          className="rounded-xl bg-neutral-100 px-4 py-2 text-sm font-semibold text-neutral-900 transition hover:bg-white"
        >
          Дараагийн хуудас
        </button>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {MENU_ITEMS.map((item) => (
          <FoodCard
            key={item.id}
            title={item.name}
            subtitle={`${item.subtitle} • ${formatMoney(item.price)}`}
            qty={cart.items[item.id] ?? 0}
            onQtyChange={(qty) => updateQty(item.id, qty)}
          />
        ))}
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}
    </PageShell>
  );
}
