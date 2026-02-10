"use client";

import React, { createContext, useContext, useMemo, useState } from "react";

export type Role = "teacher" | "student" | null;

export type MenuKey = "mahtai" | "piroshki" | "mantuun_buuz";

export type OrderItem = {
  key: MenuKey;
  name: string;
  qty: number;
  price?: number; // хүсвэл нэм
};

type StudentInfo = { name: string; classCode: string };

type OrderState = {
  role: Role;
  student: StudentInfo | null;
  items: Record<MenuKey, OrderItem>;
};

type Ctx = {
  state: OrderState;
  setRole: (r: Role) => void;
  setStudent: (s: StudentInfo | null) => void;
  setQty: (key: MenuKey, qty: number) => void;
  reset: () => void;
  totalQty: number;
};

const defaultItems: Record<MenuKey, OrderItem> = {
  mahtai: { key: "mahtai", name: "Махтай Пирошки", qty: 0 },
  piroshki: { key: "piroshki", name: "Төмстэй Пирошки", qty: 0 },
  mantuun_buuz: { key: "mantuun_buuz", name: "Мантуун бууз", qty: 0 },
};

const OrderContext = createContext<Ctx | null>(null);

export function OrderProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<OrderState>({
    role: null,
    student: null,
    items: defaultItems,
  });

  const setRole = (role: Role) => setState((s) => ({ ...s, role }));
  const setStudent = (student: StudentInfo | null) =>
    setState((s) => ({ ...s, student }));

  const setQty = (key: MenuKey, qty: number) =>
    setState((s) => ({
      ...s,
      items: { ...s.items, [key]: { ...s.items[key], qty: Math.max(0, qty) } },
    }));

  const reset = () =>
    setState({
      role: null,
      student: null,
      items: defaultItems,
    });

  const totalQty = useMemo(() => {
    return Object.values(state.items).reduce(
      (sum, it) => sum + (it.qty || 0),
      0,
    );
  }, [state.items]);

  const value: Ctx = { state, setRole, setStudent, setQty, reset, totalQty };

  return (
    <OrderContext.Provider value={value}>{children}</OrderContext.Provider>
  );
}

export function useOrder() {
  const ctx = useContext(OrderContext);
  if (!ctx) throw new Error("useOrder must be used within OrderProvider");
  return ctx;
}
