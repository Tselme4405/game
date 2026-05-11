"use client";

import { useState } from "react";
import { Icon } from "@/components/ui-kit";
import { CLASS_OPTIONS } from "@/lib/constants";
import { normalizeSessionName, validateClassNumber, validateSessionName } from "@/lib/session-validation";

type SubmitPayload = {
  name: string;
  classNumber: string;
};

type AuthFormProps = {
  onSubmit: (session: SubmitPayload) => Promise<void>;
};

export function AuthForm({ onSubmit }: AuthFormProps) {
  const [name, setName] = useState("");
  const [classNumber, setClassNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const cleanName = normalizeSessionName(name);
    const cleanClassNumber = classNumber.trim();
    const nextNameError = validateSessionName(cleanName);
    const nextClassNumberError = validateClassNumber(cleanClassNumber);

    if (nextNameError) return setError(nextNameError);
    if (nextClassNumberError) return setError(nextClassNumberError);

    setSubmitting(true);
    onSubmit({ name: cleanName, classNumber: cleanClassNumber })
      .catch((submitError: unknown) => {
        setError(submitError instanceof Error ? submitError.message : "Алдаа гарлаа");
      })
      .finally(() => setSubmitting(false));
  }

  const inputBox: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 10,
    background: "var(--surface)",
    border: "2px solid var(--text)",
    borderRadius: 18,
    padding: "0 18px",
    minHeight: 60,
  };

  return (
    <form id="auth-form" onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
      <div className="auth-grid">
        <label style={inputBox}>
          <Icon name="user" size={18} />
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Нэрээ бичнэ үү"
            disabled={submitting}
            autoComplete="name"
            style={{
              border: "none",
              outline: "none",
              background: "transparent",
              flex: 1,
              fontSize: 16,
              fontWeight: 600,
              color: "var(--text)",
              minWidth: 0,
            }}
          />
        </label>
        <label style={inputBox}>
          <select
            value={classNumber}
            onChange={(e) => setClassNumber(e.target.value)}
            disabled={submitting}
            style={{
              appearance: "none",
              border: "none",
              outline: "none",
              background: "transparent",
              flex: 1,
              fontSize: 16,
              fontWeight: 700,
              color: classNumber ? "var(--text)" : "var(--muted)",
              paddingRight: 24,
              minWidth: 0,
            }}
          >
            <option value="">Анги сонгох</option>
            {CLASS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <Icon name="chevron-down" size={18} />
        </label>
        <button
          type="submit"
          disabled={submitting}
          style={{
            background: "var(--text)",
            color: "var(--bg)",
            border: "2px solid var(--text)",
            borderRadius: 18,
            padding: "0 28px",
            minHeight: 60,
            fontSize: 16,
            fontWeight: 800,
            cursor: submitting ? "not-allowed" : "pointer",
            opacity: submitting ? 0.65 : 1,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            whiteSpace: "nowrap",
          }}
        >
          {submitting ? "Түр хүлээнэ үү..." : "Эхлэх"} <Icon name="arrow-right" size={18} />
        </button>
      </div>

      {error && (
        <p style={{ margin: 0, color: "#B4351F", fontSize: 14, fontWeight: 700 }}>{error}</p>
      )}

      <style>{`
        .auth-grid {
          display: grid;
          grid-template-columns: 1.2fr 1fr auto;
          gap: 10px;
        }
        @media (max-width: 720px) {
          .auth-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </form>
  );
}
