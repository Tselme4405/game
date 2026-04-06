"use client";

import { useState } from "react";
import type { BonumEnvironment } from "@/lib/types";

interface BonumLink {
  name: string;
  logo?: string;
  link?: string;
  deeplink?: string;
}

interface QrData {
  environment: BonumEnvironment;
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

function getBonumLinkHref(link: BonumLink) {
  return link.deeplink ?? link.link ?? "";
}

function getActionableBonumLinks(links: BonumLink[]) {
  return links.filter((link) => getBonumLinkHref(link).length > 0);
}

export default function BonumPayButton({ amount = 1000 }: Props) {
  const [loading, setLoading] = useState(false);
  const [qrData, setQrData] = useState<QrData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const actionableLinks = qrData ? getActionableBonumLinks(qrData.links) : [];
  const isTestMode = qrData?.environment === "test";

  async function handlePay() {
    setLoading(true);
    setError(null);
    setQrData(null);

    try {
      const res = await fetch("/api/bonum/create-qr", {
        method: "POST",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error ?? "QR үүсгэхэд алдаа гарлаа");
      }

      const environment: BonumEnvironment =
        data.environment === "production" ? "production" : "test";
      const links = Array.isArray(data.links) ? (data.links as BonumLink[]) : [];
      const actionableQrLinks = getActionableBonumLinks(links);

      if (environment === "test" && actionableQrLinks.length === 0) {
        throw new Error(
          "Test QR generated, but no supported app links returned. Энэ нь Bonum test terminal тохиргоо дутуу байгааг илтгэж магадгүй."
        );
      }

      setQrData({
        ...data,
        environment,
        links,
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
          <p className="text-sm text-gray-500">
            {isTestMode ? "Test горимын төлбөр" : "QR кодоор төлөх"}
          </p>

          {isTestMode && (
            <div className="w-full rounded-2xl border border-amber-300 bg-amber-50 p-4 text-left">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700">Test Mode</p>
              <p className="mt-2 text-sm text-amber-900">
                Энэ QR нь test орчных тул банкны аппын камераар уншуулахгүй. Доорх аппын товчоор
                нээгээд шалгана уу.
              </p>
            </div>
          )}

          {actionableLinks.length > 0 && (
            <div className="w-full">
              <p className="mb-2 text-xs text-gray-400 text-center">
                {isTestMode ? "Төлбөрийн апп руу шууд нээх" : "Аппаараа нээх"}
              </p>
              <div className={`grid gap-2 ${isTestMode ? "grid-cols-2" : "grid-cols-3"}`}>
                {actionableLinks.map((item) => (
                  <a
                    key={item.name}
                    href={getBonumLinkHref(item)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex flex-col items-center gap-1.5 rounded-xl px-2 py-3 text-center transition ${
                      isTestMode
                        ? "border border-amber-300 bg-amber-50 hover:bg-amber-100"
                        : "border border-gray-200 hover:bg-gray-50"
                    }`}
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

          <div className="flex w-full flex-col items-center gap-3 rounded-2xl border border-gray-200 bg-white/80 p-4">
            <p className="text-xs text-gray-400">
              {isTestMode
                ? "Лавлах зорилгоор харуулж байна. Test mode дээр scanner-ээр бүү уншуул."
                : "QR код"}
            </p>

            <img
              key={qrData.invoiceId}
              src={`data:image/png;base64,${qrData.qrImage}`}
              alt="Bonum QR code"
              width={220}
              height={220}
              className="rounded-lg"
            />

            <p className="text-xs text-gray-400">Invoice: {qrData.invoiceId}</p>
          </div>

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
