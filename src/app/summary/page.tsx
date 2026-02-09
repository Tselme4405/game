"use client";

import { useRouter } from "next/navigation";
import { useOrder } from "../lib/orderStore";

export default function SummaryPage() {
  const { state, totalQty, reset } = useOrder();
  const router = useRouter();

  const items = Object.values(state.items).filter((x) => x.qty > 0);

  const done = () => {
    // энд backend байхгүй тул зөвхөн reset + home буцаая
    reset();
    router.push("/");
  };

  return (
    <div className="min-h-screen px-6 py-10">
      <div className="mx-auto w-full max-w-3xl">
        <h1 className="text-3xl font-extrabold">Данс</h1>

        <div className="mt-4 rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-gray-700">
              Role: <span className="font-semibold">{state.role}</span>
              {state.student ? (
                <>
                  {" "}
                  | Нэр:{" "}
                  <span className="font-semibold">{state.student.name}</span> |
                  Код:{" "}
                  <span className="font-semibold">
                    {state.student.classCode}
                  </span>
                </>
              ) : null}
            </div>

            <div className="text-lg">
              Нийт авсан: <span className="font-bold">{totalQty}</span>
            </div>
          </div>

          <div className="mt-6 border-t pt-4">
            {items.length === 0 ? (
              <div className="text-gray-500">Юу ч сонгоогүй байна.</div>
            ) : (
              <ul className="space-y-3">
                {items.map((it) => (
                  <li
                    key={it.key}
                    className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3"
                  >
                    <span className="font-semibold">{it.name}</span>
                    <span className="text-gray-700">{it.qty} ш</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <button
            onClick={done}
            disabled={totalQty === 0}
            className={`mt-6 w-full rounded-xl py-3 font-semibold ${
              totalQty > 0
                ? "bg-black text-white"
                : "bg-gray-200 text-gray-500 cursor-not-allowed"
            }`}
          >
            Болсон
          </button>
        </div>
      </div>
    </div>
  );
}
