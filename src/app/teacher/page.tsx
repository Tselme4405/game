"use client";

import { useState } from "react";
import MenuSelector from "@/app/components/MenuSelector";

export default function TeacherPage() {
  const [name, setName] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const saveTeacher = async () => {
    setErr("");
    const cleanName = name.trim();
    if (!cleanName) {
      setErr("Багшийн нэрээ оруулна уу.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/person", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "TEACHER", name: cleanName }),
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(txt || "Teacher save failed");
      }

      setDone(true);
    } catch (e: any) {
      setErr(e?.message || "Алдаа гарлаа");
    } finally {
      setLoading(false);
    }
  };

  // 1-р хэсэг: нэр асуух
  if (!done) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="w-full max-w-md rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h1 className="text-2xl font-bold">Багш мэдээлэл</h1>
          <p className="mt-1 text-gray-600">Багшийн нэрээ оруулна уу.</p>

          <div className="mt-6 space-y-4">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Багшийн нэр"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none"
              disabled={loading}
            />

            {err ? <div className="text-sm text-red-600">{err}</div> : null}

            <button
              onClick={saveTeacher}
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

  // 2-р хэсэг: menu сонголт
  return <MenuSelector nextPath="/summary" />;
}
