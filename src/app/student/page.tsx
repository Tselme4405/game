"use client";

import { useState } from "react";
import { useOrder } from "@/app/lib/orderStore";
import MenuSelector from "@/app/components/MenuSelector";

export default function StudentPage() {
  const { state, setStudent } = useOrder();
  const [name, setName] = useState(state.student?.name ?? "");
  const [code, setCode] = useState(state.student?.classCode ?? "");
  const [done, setDone] = useState(!!state.student);

  const save = () => {
    const cleanCode = code.replace(/\D/g, "").slice(0, 3);
    if (!name.trim() || cleanCode.length !== 3) return;
    setStudent({ name: name.trim(), classCode: cleanCode });
    setDone(true);
  };

  if (!done) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="w-full max-w-md rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h1 className="text-2xl font-bold">Сурагч мэдээлэл</h1>
          <p className="mt-1 text-gray-600">
            Нэр + 3 оронтой ангийн дугаар оруулна.
          </p>

          <div className="mt-6 space-y-4">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Нэр"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none"
            />
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Ангийн дугаар (3 оронтой)"
              inputMode="numeric"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none"
            />

            <button
              onClick={save}
              className="w-full rounded-xl bg-black py-3 font-semibold text-white"
            >
              Үргэлжлүүлэх
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <MenuSelector nextPath="/summary" />;
}
