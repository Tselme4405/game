"use client";

import { useRouter } from "next/navigation";
import { PageShell } from "@/components/page-shell";
import { isNormalStudentSession } from "@/lib/guards";
import { getSession } from "@/lib/storage";

export default function WaitingPage() {
  const router = useRouter();

  if (typeof window === "undefined") {
    return null;
  }

  const session = getSession();
  if (!session || !isNormalStudentSession(session)) {
    router.replace("/");
    return null;
  }

  return (
    <PageShell>
      <div className="flex min-h-[80vh] items-center justify-center">
        <div className="w-full max-w-lg rounded-3xl border border-neutral-800 bg-neutral-900/70 p-8 text-center">
          <div className="mx-auto mb-6 h-12 w-12 animate-spin rounded-full border-4 border-neutral-700 border-t-neutral-100" />
          <h1 className="text-2xl font-bold">Гүйлгээг шалгаж байна</h1>
          <p className="mt-2 text-neutral-300">Та түр хүлээнэ үү</p>
          <p className="mt-3 text-sm text-neutral-500">
            Таны илгээсэн мэдээллийг админ шалгаж байна.
          </p>
        </div>
      </div>
    </PageShell>
  );
}
