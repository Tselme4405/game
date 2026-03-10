"use client";

import type { ReactNode } from "react";
import { OrderProvider } from "@/app/lib/orderStore";

export default function Providers({ children }: { children: ReactNode }) {
  return <OrderProvider>{children}</OrderProvider>;
}
