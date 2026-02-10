"use client";

import { useState } from "react";
import { useOrder } from "@/app/lib/orderStore";
import MenuSelector from "@/app/components/MenuSelector";

export default function StudentPage() {
  const { state, setStudent } = useOrder();

  const [name, setName] = useState(state.student?.name ?? "");
  const [code, setCode] = useState(state.student?.classCode ?? "");
  const [done, setDone] = useState(!!state.student);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const save = async () => {
    setErr("");

    const cleanName = name.trim();
    const cleanCode = code.replace(/\D/g, "").slice(0, 3);

    if (!cleanName) {
      setErr("Нэрээ оруулна уу.");
      return;
    }
    if (cleanCode.length !== 3) {
      setErr("Ангийн дугаар 3 оронтой байх ёстой.");
      return;
    }

    setLoading(true);
    try {
      // 1) local store (front-end)
      setStudent({ name: cleanName, classCode: cleanCode });

      // 2) DB save
      const res = await fetch("/api/person", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: "STUDENT",
          name: cleanName,
          classCode: cleanCode,
        }),
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(txt || "Student save failed");
      }

      setDone(true);
    } catch (e: any) {
      setErr(e?.message || "Алдаа гарлаа");
    } finally {
      setLoading(false);
    }
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
              disabled={loading}
            />

            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Ангийн дугаар (3 оронтой)"
              inputMode="numeric"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none"
              disabled={loading}
            />

            {err ? <div className="text-sm text-red-600">{err}</div> : null}

            <button
              onClick={save}
              disabled={loading}
              className={`w-full rounded-xl py-3 font-semibold text-white ${
                loading ? "bg-gray-400" : "bg-black"
              }`}
            >
              {loading ? "Хадгалж байна..." : "Үргэлжлүүлэх"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <MenuSelector nextPath="/summary" />;
}
