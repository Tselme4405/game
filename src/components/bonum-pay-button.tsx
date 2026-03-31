"use client";

import { useState } from "react";

interface BonumLink {
  name: string;
  logo?: string;
  link?: string;
  deeplink?: string;
}

interface QrData {
  transactionId: string;
  invoiceId: string;
  qrCode: string;
  qrImage: string;
  links: BonumLink[];
}

interface Props {
  /** Amount in MNT (e.g. 1000) */
  amount?: number;
}

export default function BonumPayButton({ amount = 1000 }: Props) {
  const [loading, setLoading] = useState(false);
  const [qrData, setQrData] = useState<QrData | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handlePay() {
    setLoading(true);
    setError(null);
    setQrData(null);

    try {
      const res = await fetch("/api/bonum/create-qr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error ?? "QR үүсгэхэд алдаа гарлаа");
      }

      setQrData({
        ...data,
        links: Array.isArray(data.links) ? data.links : [],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Алдаа гарлаа");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {!qrData && (
        <button
          onClick={handlePay}
          disabled={loading}
          className="px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold disabled:opacity-50 hover:bg-blue-700 transition-colors"
        >
          {loading ? "QR үүсгэж байна..." : `Төлөх — ${amount.toLocaleString()}₮`}
        </button>
      )}

      {error && (
        <p className="text-red-500 text-sm">{error}</p>
      )}

      {qrData && (
        <div className="flex flex-col items-center gap-3 p-4 border rounded-2xl shadow-sm">
          <p className="text-sm text-gray-500">QR кодоор төлөх</p>

          <img
            src={`data:image/png;base64,${qrData.qrImage}`}
            alt="Bonum QR code"
            width={220}
            height={220}
            className="rounded-lg"
          />

          <p className="text-xs text-gray-400">Invoice: {qrData.invoiceId}</p>

          {qrData.links.length > 0 && (
            <div className="w-full">
              <p className="mb-2 text-xs text-gray-400 text-center">Аппаараа нээх</p>
              <div className="grid grid-cols-3 gap-2">
                {qrData.links.map((item) => (
                  <a
                    key={item.name}
                    href={item.deeplink ?? item.link ?? "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center gap-1.5 rounded-xl border border-gray-200 px-2 py-3 text-center hover:bg-gray-50 transition"
                  >
                    {item.logo && (
                      <img src={item.logo} alt={item.name} width={32} height={32} className="rounded-md" />
                    )}
                    <span className="text-xs text-gray-700 leading-tight">{item.name}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={() => { setQrData(null); setError(null); }}
            className="text-xs text-blue-500 underline"
          >
            Цуцлах
          </button>
        </div>
      )}
    </div>
  );
}
