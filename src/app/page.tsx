"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthForm } from "@/components/auth-form";
import { PageShell } from "@/components/page-shell";
import { RoleSelector } from "@/components/role-selector";
import { ADMIN_STUDENT, DELIVERY_TEACHER } from "@/lib/constants";
import { setSession } from "@/lib/storage";
import type { Role } from "@/lib/types";

export default function HomePage() {
  const router = useRouter();
  const [role, setRole] = useState<Role | null>(null);
  const [teacherDenied, setTeacherDenied] = useState(false);

  async function saveUserToDb(input: {
    name: string;
    classNumber?: string;
    role: "student" | "teacher" | "admin";
  }) {
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

  async function handleAuthSubmit(session: {
    role: Role;
    name: string;
    classNumber?: string;
  }) {
    setTeacherDenied(false);

    if (session.role === "teacher") {
      setSession(session);
      if (session.name === DELIVERY_TEACHER.name) {
        router.push("/delivery");
      } else {
        setTeacherDenied(true);
      }
      return;
    }

    const isAdminDemo =
      session.name === ADMIN_STUDENT.name &&
      session.classNumber === ADMIN_STUDENT.classNumber;

    await saveUserToDb({
      name: session.name,
      classNumber: session.classNumber,
      role: isAdminDemo ? "admin" : "student",
    });

    setSession({
      ...session,
      role: isAdminDemo ? "admin" : "student",
    });

    if (isAdminDemo) {
      router.push("/admin");
      return;
    }

    router.push("/select");
  }

  return (
    <PageShell>
      <div className="mx-auto flex min-h-[80vh] w-full max-w-xl items-center">
        <div className="w-full rounded-3xl border border-neutral-800 bg-neutral-900/70 p-6 shadow-2xl shadow-black/40 sm:p-7">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold">
              Сургууль доторх хоол захиалга
            </h1>
            <p className="mt-2 text-sm text-neutral-400">
              Эрхээ сонгоод үргэлжлүүлнэ үү
            </p>
          </div>

          <RoleSelector
            selectedRole={role}
            onSelect={(nextRole) => setRole(nextRole)}
          />

          {role && (
            <div className="mt-5">
              <AuthForm role={role} onSubmit={handleAuthSubmit} />
            </div>
          )}

          {teacherDenied && (
            <div className="mt-4 rounded-xl border border-rose-800 bg-rose-950/40 p-3">
              <p className="text-sm font-medium text-rose-200">
                Нэвтрэх эрхгүй байна
              </p>
              <p className="mt-1 text-xs text-rose-300/80">
                Энэ нэрээр хүргэлтийн хуудас руу нэвтрэх боломжгүй.
              </p>
            </div>
          )}

          <div className="mt-6 text-center text-xs text-neutral-500">
            <Link href="/" className="transition hover:text-neutral-300">
              Буцах
            </Link>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
