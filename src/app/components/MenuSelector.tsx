"use client";

import QtyPicker from "@/app/components/QtyPicker";
import { useOrder } from "@/app/lib/orderStore";
import { useRouter } from "next/navigation";

export default function MenuSelector({ nextPath }: { nextPath: string }) {
  const { state, setQty, totalQty } = useOrder();
  const router = useRouter();

  const canNext = totalQty > 0;

  const cards = [
    { key: "mahtai" as const, title: "Махтай пирошки" },
    { key: "piroshki" as const, title: "Төмстэй пирошки" },
    { key: "mantuun_buuz" as const, title: "Мантуун бууз" },
  ];

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
              ? "bg-white text-black"
              : "bg-gray-200 text-gray-500 cursor-not-allowed"
          }`}
        >
          Дараагийн хуудас
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {cards.map((c) => (
          <div
            key={c.key}
            className="rounded-2xl border border-gray-200 p-6 shadow-sm"
          >
            <h2 className="text-xl font-bold">{c.title}</h2>
            <p className="mt-1 text-sm text-gray-600">Сонгоод тоо оруулна</p>

            <div className="mt-6">
              <QtyPicker
                qty={state.items[c.key].qty}
                onChange={(n) => setQty(c.key, n)}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
