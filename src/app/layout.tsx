import "./globals.css";
import { OrderProvider } from "@/app/lib/orderStore";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="mn">
      <body>
        <OrderProvider>{children}</OrderProvider>
      </body>
    </html>
  );
}
