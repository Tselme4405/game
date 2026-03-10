import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Сургууль доторх зууш захиалга",
  description: "Сурагчийн зууш захиалга, админ баталгаажуулалт, хүргэлтийн хяналт",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="mn">
      <body className="antialiased">{children}</body>
    </html>
  );
}
