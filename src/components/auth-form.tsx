"use client";

import { useState } from "react";
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
    <form id="auth-form" onSubmit={handleSubmit} className="w-full space-y-4">
      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,0.92fr)_auto]">
        <label
          htmlFor="name"
          className={`flex min-h-16 items-center gap-3 rounded-2xl border-2 bg-white px-5 text-black shadow-[0_10px_24px_rgba(0,0,0,0.12)] transition focus-within:-translate-y-0.5 focus-within:shadow-[0_16px_30px_rgba(0,0,0,0.16)] ${
            nameError ? "border-rose-500" : "border-black"
          }`}
        >
          <span className="sr-only">Нэр</span>
          <span
            aria-hidden="true"
            className="flex size-5 shrink-0 items-center justify-center text-black"
          >
            <svg
              viewBox="0 0 24 24"
              className="size-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                d="M20 21a8 8 0 0 0-16 0"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="12" cy="8" r="4" />
            </svg>
          </span>
          <span className="min-w-0 flex-1">
            <input
              id="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full border-0 bg-transparent p-0 text-base font-semibold text-black outline-none placeholder:text-black/50"
              placeholder="Нэр"
              disabled={submitting}
              autoComplete="name"
            />
          </span>
        </label>

        <label
          htmlFor="classNumber"
          className={`flex min-h-16 items-center rounded-2xl border-2 bg-white px-5 text-black shadow-[0_10px_24px_rgba(0,0,0,0.12)] transition focus-within:-translate-y-0.5 focus-within:shadow-[0_16px_30px_rgba(0,0,0,0.16)] ${
            classNumberError ? "border-rose-500" : "border-black"
          }`}
        >
          <span className="sr-only">Ангийн дугаар</span>
          <span className="relative min-w-0 flex-1">
            <select
              id="classNumber"
              value={classNumber}
              onChange={(event) => setClassNumber(event.target.value)}
              className={`w-full appearance-none border-0 bg-transparent p-0 pr-7 text-base font-semibold outline-none ${
                classNumber ? "text-black" : "text-black/50"
              }`}
              disabled={submitting}
              autoComplete="off"
            >
              <option value="">Анги сонгох</option>
              {CLASS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <span
              aria-hidden="true"
              className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-black/60"
            >
              <svg viewBox="0 0 20 20" className="size-4" fill="none">
                <path
                  d="m5 7.5 5 5 5-5"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </span>
        </label>

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex min-h-16 w-full items-center justify-center rounded-2xl border-2 border-black bg-black px-7 text-base font-extrabold text-white shadow-[0_10px_24px_rgba(0,0,0,0.16)] transition hover:-translate-y-0.5 hover:bg-[#1a1a1a] disabled:cursor-not-allowed disabled:opacity-70 md:min-w-[11rem]"
        >
          {submitting ? "Түр хүлээнэ үү..." : "Нэвтрэх"}
        </button>
      </div>

      <div className="space-y-1 pl-1">
        {classNumberError && (
          <p className="text-sm font-semibold text-rose-800">{classNumberError}</p>
        )}
        {nameError && (
          <p className="text-sm font-semibold text-rose-800">{nameError}</p>
        )}
        {error && <p className="text-sm font-semibold text-red-800">{error}</p>}
      </div>
    </form>
  );
}
