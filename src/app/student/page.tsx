"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Card, Eyebrow, Icon } from "@/components/ui-kit";
import { useOrder } from "@/app/lib/orderStore";
import MenuSelector from "@/app/components/MenuSelector";

export default function StudentPage() {
  const router = useRouter();
  const { state, setStudent } = useOrder();
  const [name, setName] = useState(state.student?.name ?? "");
  const [code, setCode] = useState(state.student?.classCode ?? "");
  const [done, setDone] = useState(!!state.student);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function save() {
    setErr("");
    const cleanName = name.trim();
    const cleanCode = code.replace(/\D/g, "").slice(0, 3);
    if (!cleanName) return setErr("Нэрээ оруулна уу.");
    if (cleanCode.length !== 3) return setErr("Ангийн дугаар 3 оронтой байх ёстой.");
    setLoading(true);
    try {
      setStudent({ name: cleanName, classCode: cleanCode });
      const res = await fetch("/api/person", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "STUDENT", name: cleanName, classCode: cleanCode }),
      });
      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(t || "Student save failed");
      }
      setDone(true);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Алдаа гарлаа");
    } finally {
      setLoading(false);
    }
  }

  if (done) return <MenuSelector nextPath="/summary" />;

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "var(--bg)",
        display: "grid",
        placeItems: "center",
        padding: 24,
      }}
    >
      <Card style={{ width: "100%", maxWidth: 460 }}>
        <Eyebrow>Сурагч</Eyebrow>
        <h1
          style={{
            margin: "8px 0 4px",
            fontSize: 26,
            fontWeight: 800,
            letterSpacing: "-0.02em",
          }}
        >
          Мэдээлэлээ оруулна уу
        </h1>
        <p style={{ margin: 0, color: "var(--muted)", fontSize: 14 }}>
          Нэр + 3 оронтой ангийн дугаар.
        </p>

        <div style={{ marginTop: 20, display: "grid", gap: 10 }}>
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              background: "var(--surface)",
              border: "2px solid var(--text)",
              borderRadius: 16,
              padding: "0 16px",
              height: 56,
            }}
          >
            <Icon name="user" size={16} />
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Нэр"
              disabled={loading}
              style={{
                border: "none",
                outline: "none",
                background: "transparent",
                flex: 1,
                fontSize: 15,
                fontWeight: 600,
                color: "var(--text)",
              }}
            />
          </label>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Ангийн дугаар (3 оронтой)"
            inputMode="numeric"
            disabled={loading}
            style={{
              background: "var(--surface)",
              border: "2px solid var(--text)",
              borderRadius: 16,
              padding: "0 16px",
              height: 56,
              fontSize: 15,
              fontWeight: 600,
              color: "var(--text)",
              outline: "none",
            }}
          />

          {err && <p style={{ margin: 0, color: "#B4351F", fontSize: 13, fontWeight: 700 }}>{err}</p>}

          <button
            onClick={save}
            disabled={loading}
            style={{
              background: "var(--text)",
              color: "var(--bg)",
              border: "none",
              borderRadius: 16,
              height: 56,
              fontSize: 15,
              fontWeight: 800,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.6 : 1,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              marginTop: 6,
            }}
          >
            {loading ? "Хадгалж байна..." : "Үргэлжлүүлэх"} <Icon name="arrow-right" size={16} />
          </button>

          <button
            onClick={() => router.push("/")}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--muted)",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              marginTop: 4,
            }}
          >
            Нүүр буцах
          </button>
        </div>
      </Card>
    </main>
  );
}
