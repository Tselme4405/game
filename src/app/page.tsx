"use client";

import { useRouter } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { Eyebrow, FoodImage } from "@/components/ui-kit";
import { isDeliveryCredentials } from "@/lib/guards";
import { setSession } from "@/lib/storage";

export default function HomePage() {
  const router = useRouter();

  async function saveUserToDb(input: { name: string; classNumber: string; role: "student" | "teacher" }) {
    const response = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: input.name,
        class_number: input.classNumber ?? null,
        role: input.role,
      }),
    });
    if (!response.ok) {
      const message = await response.text().catch(() => "");
      throw new Error(message || "Мэдээлэл хадгалж чадсангүй");
    }
  }

  async function handleAuthSubmit(session: { name: string; classNumber: string }) {
    if (isDeliveryCredentials(session.name, session.classNumber)) {
      setSession({ role: "teacher", name: session.name, classNumber: session.classNumber });
      router.push("/delivery");
      return;
    }
    await saveUserToDb({ name: session.name, classNumber: session.classNumber, role: "student" });
    setSession({ ...session, role: "student" });
    router.push("/select");
  }

  const monthLabel = new Date().toLocaleDateString("mn-MN", { year: "numeric", month: "long" });

  return (
    <main style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "20px clamp(16px, 4vw, 40px)",
          maxWidth: 1400,
          margin: "0 auto",
        }}
      >
        <div style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 12,
              background: "var(--accent)",
              color: "var(--on-accent)",
              display: "grid",
              placeItems: "center",
              fontWeight: 900,
              fontSize: 18,
            }}
          >
            P
          </div>
          <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.02em" }}>
            Pinecone Delivery
          </span>
        </div>
      </header>

      <section
        style={{
          padding: "clamp(24px, 5vw, 48px) clamp(16px, 4vw, 40px) 80px",
          maxWidth: 1400,
          margin: "0 auto",
        }}
      >
        <div className="home-grid">
          <div>
            <Eyebrow>{monthLabel}</Eyebrow>
            <h1
              style={{
                margin: "16px 0 0",
                fontSize: "clamp(40px, 7vw, 92px)",
                lineHeight: 0.95,
                letterSpacing: "-0.04em",
                fontWeight: 800,
              }}
            >
              Ангидаа{" "}
              <em style={{ fontStyle: "italic", color: "var(--accent)" }}>халуун</em> пирошки захиалаарай.
            </h1>
            <p
              style={{
                margin: "24px 0 0",
                maxWidth: 520,
                fontSize: 18,
                lineHeight: 1.55,
                color: "var(--muted)",
                fontWeight: 500,
              }}
            >
              Ангиа сонгоод, нэрээ бичээд, цэсээсээ сонго. Бид цайны цагаар таны ангид хүргээд өгнө.{" "}
              <span style={{ color: "var(--text)", fontWeight: 700 }}>
                13:00 цагаас хойш өгсөн захиалга маргаашийн хүргэлтээр ирнэ.
              </span>
            </p>

            <div style={{ marginTop: 32, display: "flex", gap: 24, flexWrap: "wrap" }}>
              {[
                { big: "~15 мин", small: "Хүргэх хугацаа" },
                { big: "13:15", small: "Цагт ирнэ" },
                { big: "Үнэгүй", small: "Ангид хүргэлт" },
              ].map((s, i) => (
                <div
                  key={i}
                  style={{
                    borderLeft: i === 0 ? "none" : "1px solid var(--border)",
                    paddingLeft: i === 0 ? 0 : 24,
                  }}
                >
                  <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em" }}>{s.big}</div>
                  <div style={{ fontSize: 13, color: "var(--muted)", fontWeight: 600, marginTop: 2 }}>
                    {s.small}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 40 }}>
              <AuthForm onSubmit={handleAuthSubmit} />
            </div>
          </div>

          <div className="home-hero" style={{ position: "relative", minHeight: 360 }}>
            <div
              style={{
                borderRadius: 32,
                overflow: "hidden",
                boxShadow: "0 24px 60px rgba(40,28,12,0.14)",
                border: "1px solid var(--border)",
              }}
            >
              <FoodImage src="/img/mahtai_piroshki.jpg" alt="Махтай пирошки" tone="warm" aspect="tall" />
            </div>
          </div>
        </div>
      </section>

      <style>{`
        .home-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.1fr) minmax(0, 0.9fr);
          gap: clamp(24px, 4vw, 48px);
          align-items: center;
        }
        @media (max-width: 860px) {
          .home-grid { grid-template-columns: 1fr; }
          .home-hero { display: none; }
        }
      `}</style>
    </main>
  );
}
