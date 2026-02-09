"use client";

import { useMemo, useState } from "react";
import QtyPicker from "@/app/components/QtyPicker";
import { MenuKey, useOrder } from "@/app/lib/orderStore";
import { useRouter } from "next/navigation";

const cards: Array<{ key: MenuKey; title: string; desc: string }> = [
  { key: "mahtai", title: "Махтай", desc: "Сонгоод тоо оруулна" },
  { key: "piroshki", title: "Пирошки", desc: "Сонгоод тоо оруулна" },
  { key: "mantuun_buuz", title: "Мантуун бууз", desc: "Дарвал тоо гарч ирнэ" },
];

export default function MenuSelector({ nextPath }: { nextPath: string }) {
  const { state, setQty, totalQty } = useOrder();
  const router = useRouter();
  const [active, setActive] = useState<MenuKey | null>(null);

  const canNext = useMemo(() => totalQty > 0, [totalQty]);

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-10">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Сонголтоо хийнэ үү</h1>
          <p className="text-gray-600">
            Нийт сонгосон: <span className="font-semibold">{totalQty}</span>
          </p>
        </div>

        <button
          disabled={!canNext}
          onClick={() => router.push(nextPath)}
          className={`rounded-xl px-5 py-3 font-semibold ${
            canNext
              ? "bg-black text-white"
              : "bg-gray-200 text-gray-500 cursor-not-allowed"
          }`}
        >
          Дараагийн хуудас
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {cards.map((c) => {
          const qty = state.items[c.key].qty;
          const isActive = active === c.key;

          return (
            <div
              key={c.key}
              className="rounded-2xl border border-gray-200 p-6 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold">{c.title}</h2>
                  <p className="mt-1 text-sm text-gray-600">{c.desc}</p>
                </div>

                {/* Мантуун бууз дээр “дарвал” picker гарна */}
                {c.key === "mantuun_buuz" ? (
                  <button
                    type="button"
                    onClick={() => setActive(isActive ? null : c.key)}
                    className="rounded-xl border border-gray-300 px-3 py-2 text-sm"
                  >
                    {isActive ? "Хаах" : "Сонгох"}
                  </button>
                ) : null}
              </div>

              <div className="mt-6">
                {c.key === "mantuun_buuz" ? (
                  isActive ? (
                    <QtyPicker qty={qty} onChange={(n) => setQty(c.key, n)} />
                  ) : (
                    <div className="text-gray-500 text-sm">
                      “Сонгох” дээр дарвал тоо сонгоно.
                      <div className="mt-2 font-semibold">
                        Одоогийн тоо: {qty}
                      </div>
                    </div>
                  )
                ) : (
                  <QtyPicker qty={qty} onChange={(n) => setQty(c.key, n)} />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
