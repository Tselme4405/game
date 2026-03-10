"use client";

import { useMemo, useState } from "react";
import type { EntryRole } from "@/lib/types";

type SubmitPayload = {
  role: EntryRole;
  name: string;
  classNumber?: string;
};

type AuthFormProps = {
  role: EntryRole;
  onSubmit: (session: SubmitPayload) => Promise<void>;
};

export function AuthForm({ role, onSubmit }: AuthFormProps) {
  const [name, setName] = useState("");
  const [classNumber, setClassNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const isStudent = role === "student";

  const buttonLabel = useMemo(
    () => (isStudent ? "Үргэлжлүүлэх" : "Нэвтрэх"),
    [isStudent],
  );

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const cleanName = name.trim();
    const cleanClassNumber = classNumber.trim();

    if (!cleanName) {
      setError("Нэрээ оруулна уу");
      return;
    }

    if (isStudent && !cleanClassNumber) {
      setError("Ангийн дугаараа оруулна уу");
      return;
    }

    setSubmitting(true);
    onSubmit({
      role,
      name: cleanName,
      classNumber: isStudent ? cleanClassNumber : undefined,
    })
      .catch((submitError: unknown) => {
        setError(
          submitError instanceof Error ? submitError.message : "Алдаа гарлаа",
        );
      })
      .finally(() => {
        setSubmitting(false);
      });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-2xl border border-neutral-800 bg-neutral-900/70 p-5"
    >
      <div className="space-y-2">
        <label htmlFor="name" className="text-sm text-neutral-300">
          Нэр
        </label>
        <input
          id="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none transition focus:border-neutral-500 focus:ring-2 focus:ring-neutral-500/50"
          placeholder="Нэрээ оруулна уу"
          disabled={submitting}
        />
      </div>

      {isStudent && (
        <div className="space-y-2">
          <label htmlFor="classNumber" className="text-sm text-neutral-300">
            Ангийн дугаар
          </label>
          <input
            id="classNumber"
            value={classNumber}
            onChange={(event) => setClassNumber(event.target.value)}
            className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none transition focus:border-neutral-500 focus:ring-2 focus:ring-neutral-500/50"
            placeholder="Жишээ: 302"
            disabled={submitting}
          />
        </div>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-xl bg-neutral-100 px-4 py-2.5 text-sm font-semibold text-neutral-900 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-70"
      >
        {submitting ? "Хадгалж байна..." : buttonLabel}
      </button>
    </form>
  );
}
