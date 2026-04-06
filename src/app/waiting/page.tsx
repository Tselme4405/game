"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PageShell } from "@/components/page-shell";
import { StatusBadge } from "@/components/status-badge";
import { isNormalStudentSession } from "@/lib/guards";
import {
  clearActiveOrderId,
  getActiveOrderId,
  getOrderById,
  getSession,
  setActiveOrderId,
  upsertOrder,
} from "@/lib/storage";
import type { OrderRecord } from "@/lib/types";

function getStatusCopy(status: OrderRecord["status"]) {
  switch (status) {
    case "approved":
      return {
        title: "Төлбөр амжилттай баталгаажлаа",
        subtitle: "Таны захиалга төлөгдсөн гэж бүртгэгдлээ.",
        tone: "border-emerald-700/40 bg-emerald-950/30 text-emerald-100",
      };
    case "rejected":
      return {
        title: "Төлбөр төлөгдөөгүй байна",
        subtitle: "Гүйлгээ амжилтгүй болсон эсвэл хүчингүй болсон байна.",
        tone: "border-rose-700/40 bg-rose-950/30 text-rose-100",
      };
    default:
      return {
        title: "Гүйлгээг шалгаж байна",
        subtitle: "Төлбөрийн төлөв шинэчлэгдмэгц энд харагдана.",
        tone: "border-neutral-800 bg-neutral-900/70 text-neutral-100",
      };
  }
}

export default function WaitingPage() {
  const router = useRouter();
  const [order, setOrder] = useState<OrderRecord | null>(() => {
    const activeOrderId = getActiveOrderId();
    return activeOrderId ? getOrderById(activeOrderId) : null;
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const session = getSession();
    if (!session || !isNormalStudentSession(session)) {
      router.replace("/");
      return;
    }

    const activeOrderId = getActiveOrderId();
    if (!activeOrderId) {
      setLoading(false);
      setError("Идэвхтэй захиалга олдсонгүй. Төлбөрийн хэсэг рүү буцаад дахин оролдоно уу.");
      return;
    }

    let cancelled = false;
    let intervalId: number | null = null;

    const syncOrder = async () => {
      try {
        const response = await fetch(`/api/orders/${activeOrderId}`, {
          cache: "no-store",
        });

        if (response.status === 404) {
          if (!cancelled) {
            setError("Захиалгын мэдээлэл олдсонгүй.");
            setLoading(false);
          }
          if (intervalId) clearInterval(intervalId);
          return;
        }

        if (!response.ok) {
          throw new Error("Төлөв шалгаж чадсангүй");
        }

        const nextOrder = (await response.json()) as OrderRecord;

        if (cancelled) return;

        upsertOrder(nextOrder);
        setActiveOrderId(nextOrder.id);
        setOrder(nextOrder);
        setError("");
        setLoading(false);

        if (nextOrder.status === "approved" || nextOrder.status === "rejected") {
          if (intervalId) clearInterval(intervalId);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Алдаа гарлаа");
          setLoading(false);
        }
      }
    };

    void syncOrder();
    intervalId = window.setInterval(() => {
      void syncOrder();
    }, 3000);

    return () => {
      cancelled = true;
      if (intervalId) clearInterval(intervalId);
    };
  }, [router]);

  if (typeof window === "undefined") {
    return null;
  }

  const session = getSession();
  if (!session || !isNormalStudentSession(session)) {
    router.replace("/");
    return null;
  }

  const status = order?.status ?? "pending";
  const copy = getStatusCopy(status);
  const showSpinner = loading || (status === "pending" && !error);

  return (
    <PageShell title="Төлбөрийн төлөв" subtitle="Bonum болон захиалгын төлөвийг шалгаж байна">
      <div className="mx-auto flex min-h-[70vh] w-full max-w-2xl items-center justify-center">
        <div className={`w-full rounded-3xl border p-8 text-center ${copy.tone}`}>
          {showSpinner ? (
            <div className="mx-auto mb-6 h-12 w-12 animate-spin rounded-full border-4 border-neutral-700 border-t-neutral-100" />
          ) : (
            <div className="mb-6 text-5xl">{status === "approved" ? "OK" : status === "rejected" ? "X" : "..."}</div>
          )}

          <div className="flex justify-center">
            <StatusBadge status={status} />
          </div>

          <h1 className="mt-5 text-2xl font-bold">{copy.title}</h1>
          <p className="mt-2 text-sm text-neutral-300">{copy.subtitle}</p>

          {order && (
            <div className="mt-6 rounded-2xl border border-neutral-800 bg-neutral-950/50 p-4 text-left">
              <p className="text-sm text-neutral-300">Захиалгын дугаар: {order.id}</p>
              {order.bonumInvoiceId && (
                <p className="mt-2 text-sm text-neutral-300">Invoice: {order.bonumInvoiceId}</p>
              )}
              <p className="mt-2 text-sm text-neutral-300">Нийт тоо: {order.totalCount}</p>
            </div>
          )}

          {error && (
            <div className="mt-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-100">
              {error}
            </div>
          )}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            {status === "approved" ? (
              <button
                type="button"
                onClick={() => {
                  clearActiveOrderId();
                  router.push("/select");
                }}
                className="flex-1 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-500"
              >
                Шинэ захиалга хийх
              </button>
            ) : status === "rejected" ? (
              <button
                type="button"
                onClick={() => router.push("/account")}
                className="flex-1 rounded-xl bg-rose-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-rose-500"
              >
                Дахин төлөх
              </button>
            ) : null}

            <button
              type="button"
              onClick={() => router.push("/account")}
              className="flex-1 rounded-xl border border-neutral-700 px-4 py-3 text-sm font-semibold text-neutral-100 transition hover:bg-neutral-800"
            >
              Данс руу буцах
            </button>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
