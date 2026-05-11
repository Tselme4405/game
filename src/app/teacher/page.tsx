"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Card, Eyebrow, Icon } from "@/components/ui-kit";
import MenuSelector from "@/app/components/MenuSelector";

export default function TeacherPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function save() {
    setErr("");
    const cleanName = name.trim();
    if (!cleanName) return setErr("Багшийн нэрээ оруулна уу.");
    setLoading(true);
    try {
      const res = await fetch("/api/person", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "TEACHER", name: cleanName }),
      });
      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(t || "Teacher save failed");
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
        <Eyebrow>Багш</Eyebrow>
        <h1 style={{ margin: "8px 0 4px", fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em" }}>
          Багшийн нэрээ оруулна уу
        </h1>
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
              placeholder="Багшийн нэр"
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
