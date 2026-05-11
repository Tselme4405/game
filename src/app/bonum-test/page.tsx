import BonumPayButton from "@/components/bonum-pay-button";
import { Card, Eyebrow } from "@/components/ui-kit";

export default function BonumTestPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "var(--bg)",
        display: "grid",
        placeItems: "center",
        padding: 24,
      }}
    >
      <Card style={{ width: "100%", maxWidth: 460, textAlign: "center" }}>
        <Eyebrow>Bonum QR Test</Eyebrow>
        <h1 style={{ margin: "8px 0 6px", fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em" }}>
          QR төлбөр шалгах
        </h1>
        <p style={{ margin: "0 0 20px", fontSize: 13, color: "var(--muted)" }}>
          Доорх товчийг дарж QR код үүсгэнэ үү.
        </p>
        <BonumPayButton amount={1000} />
      </Card>
    </main>
  );
}
