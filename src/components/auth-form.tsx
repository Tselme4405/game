"use client";

import { useState } from "react";
import { normalizeSessionName, sanitizeClassNumberInput, validateClassNumber, validateSessionName } from "@/lib/session-validation";

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
  const nameError = name ? validateSessionName(name) : "";
  const classNumberError = classNumber ? validateClassNumber(classNumber) : "";

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const cleanName = normalizeSessionName(name);
    const cleanClassNumber = classNumber.trim();
    const nextNameError = validateSessionName(cleanName);
    const nextClassNumberError = validateClassNumber(cleanClassNumber);

    if (nextNameError) {
      setError(nextNameError);
      return;
    }

    if (nextClassNumberError) {
      setError(nextClassNumberError);
      return;
    }

    setSubmitting(true);
    onSubmit({
      name: cleanName,
      classNumber: cleanClassNumber,
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
          autoComplete="name"
        />
        {nameError && <p className="text-sm text-rose-300">{nameError}</p>}
      </div>

      <div className="space-y-2">
        <label htmlFor="classNumber" className="text-sm text-[#f4efe8]/72">
          Ангийн дугаар
        </label>
        <input
          id="classNumber"
          value={classNumber}
          onChange={(event) =>
            setClassNumber(sanitizeClassNumberInput(event.target.value))
          }
          className="w-full rounded-[1.05rem] border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-[#f4efe8] outline-none transition placeholder:text-[#f4efe8]/35 focus:border-[#43f0c1]/45 focus:ring-2 focus:ring-[#43f0c1]/20"
          placeholder="Жишээ: 302"
          disabled={submitting}
          inputMode="numeric"
          maxLength={3}
          autoComplete="off"
        />
        {classNumberError && (
          <p className="text-sm text-rose-300">{classNumberError}</p>
        )}
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-[1.15rem] bg-[#43f0c1] px-4 py-3 text-sm font-extrabold text-[#04110d] shadow-[0_18px_36px_rgba(67,240,193,0.26)] transition hover:-translate-y-0.5 hover:bg-[#61f4ce] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {submitting ? "Хадгалж байна..." : "Нэвтрэх"}
      </button>
    </form>
  );
}
