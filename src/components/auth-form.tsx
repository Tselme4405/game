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
      className="space-y-4 rounded-[1.5rem] border border-white/10 bg-black/28 p-5 backdrop-blur-xl"
    >
      <div className="space-y-2">
        <label htmlFor="name" className="text-sm text-[#f4efe8]/72">
          Нэр
        </label>
        <input
          id="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="w-full rounded-[1.05rem] border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-[#f4efe8] outline-none transition placeholder:text-[#f4efe8]/35 focus:border-[#43f0c1]/45 focus:ring-2 focus:ring-[#43f0c1]/20"
          placeholder="Нэрээ оруулна уу"
          disabled={submitting}
        />
      </div>

      {isStudent && (
        <div className="space-y-2">
          <label htmlFor="classNumber" className="text-sm text-[#f4efe8]/72">
            Ангийн дугаар
          </label>
          <input
            id="classNumber"
            value={classNumber}
            onChange={(event) => setClassNumber(event.target.value)}
            className="w-full rounded-[1.05rem] border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-[#f4efe8] outline-none transition placeholder:text-[#f4efe8]/35 focus:border-[#43f0c1]/45 focus:ring-2 focus:ring-[#43f0c1]/20"
            placeholder="Жишээ: 302"
            disabled={submitting}
          />
        </div>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-[1.15rem] bg-[#43f0c1] px-4 py-3 text-sm font-extrabold text-[#04110d] shadow-[0_18px_36px_rgba(67,240,193,0.26)] transition hover:-translate-y-0.5 hover:bg-[#61f4ce] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {submitting ? "Хадгалж байна..." : buttonLabel}
      </button>
    </form>
  );
}
