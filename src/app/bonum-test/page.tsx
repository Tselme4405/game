import BonumPayButton from "@/components/bonum-pay-button";

export default function BonumTestPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-2xl font-bold">Bonum QR Test</h1>
      <p className="text-sm text-gray-500">
        Доорх товчийг дарж QR код үүсгэнэ үү.
      </p>
      <BonumPayButton amount={1000} />
    </main>
  );
}
