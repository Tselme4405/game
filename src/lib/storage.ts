import { MENU_ITEMS, STORAGE_KEYS } from "@/lib/constants";
import { buildId } from "@/lib/utils";
import type { Cart, OrderRecord, PaymentStatus, Session } from "@/lib/types";

const EMPTY_CART: Cart = {
  items: Object.fromEntries(MENU_ITEMS.map((item) => [item.id, 0])),
  totalCount: 0,
  updatedAt: new Date().toISOString(),
};

function isBrowser() {
  return typeof window !== "undefined";
}

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(raw) as T;
    return parsed;
  } catch {
    return fallback;
  }
}

export function getSession(): Session | null {
  if (!isBrowser()) return null;
  const data = safeParse<Session | null>(
    window.localStorage.getItem(STORAGE_KEYS.session),
    null,
  );

  if (!data || !data.role || !data.name) {
    return null;
  }

  return data;
}

export function setSession(session: Session) {
  if (!isBrowser()) return;
  window.localStorage.setItem(STORAGE_KEYS.session, JSON.stringify(session));
}

export function clearSession() {
  if (!isBrowser()) return;
  window.localStorage.removeItem(STORAGE_KEYS.session);
}

export function getCart(): Cart {
  if (!isBrowser()) return EMPTY_CART;
  const data = safeParse<Cart>(
    window.localStorage.getItem(STORAGE_KEYS.cart),
    EMPTY_CART,
  );

  const normalizedItems: Record<string, number> = { ...EMPTY_CART.items };
  for (const item of MENU_ITEMS) {
    const value = Number(data?.items?.[item.id] ?? 0);
    normalizedItems[item.id] = Number.isFinite(value) && value > 0 ? value : 0;
  }

  const totalCount = Object.values(normalizedItems).reduce((sum, qty) => sum + qty, 0);

  return {
    items: normalizedItems,
    totalCount,
    updatedAt: data?.updatedAt ?? new Date().toISOString(),
  };
}

export function setCart(cart: Cart) {
  if (!isBrowser()) return;
  const normalized: Cart = {
    items: { ...EMPTY_CART.items, ...cart.items },
    totalCount: Object.values({ ...EMPTY_CART.items, ...cart.items }).reduce(
      (sum, qty) => sum + (Number.isFinite(qty) && qty > 0 ? qty : 0),
      0,
    ),
    updatedAt: new Date().toISOString(),
  };

  window.localStorage.setItem(STORAGE_KEYS.cart, JSON.stringify(normalized));
}

export function clearCart() {
  if (!isBrowser()) return;
  window.localStorage.setItem(
    STORAGE_KEYS.cart,
    JSON.stringify({ ...EMPTY_CART, updatedAt: new Date().toISOString() }),
  );
}

export function getOrders(): OrderRecord[] {
  if (!isBrowser()) return [];
  const data = safeParse<OrderRecord[]>(
    window.localStorage.getItem(STORAGE_KEYS.orders),
    [],
  );

  if (!Array.isArray(data)) {
    return [];
  }

  return data.filter((order) => order?.id && order?.status && order?.userName);
}

export function getOrderById(orderId: string) {
  return getOrders().find((order) => order.id === orderId) ?? null;
}

export function setOrders(orders: OrderRecord[]) {
  if (!isBrowser()) return;
  window.localStorage.setItem(STORAGE_KEYS.orders, JSON.stringify(orders));
}

export function upsertOrder(order: OrderRecord) {
  const orders = getOrders();
  const nextOrders = orders.filter((item) => item.id !== order.id);
  nextOrders.unshift(order);
  setOrders(nextOrders);
  return order;
}

export function getActiveOrderId() {
  if (!isBrowser()) return null;
  return window.localStorage.getItem(STORAGE_KEYS.activeOrderId);
}

export function setActiveOrderId(orderId: string) {
  if (!isBrowser()) return;
  window.localStorage.setItem(STORAGE_KEYS.activeOrderId, orderId);
}

export function clearActiveOrderId() {
  if (!isBrowser()) return;
  window.localStorage.removeItem(STORAGE_KEYS.activeOrderId);
}

export function createOrder(payload: Omit<OrderRecord, "id" | "createdAt">) {
  const baseOrder: OrderRecord = {
    ...payload,
    id: buildId(),
    createdAt: new Date().toISOString(),
  };

  const orders = getOrders();
  orders.unshift(baseOrder);
  setOrders(orders);
  return baseOrder;
}

export function updateOrderStatus(orderId: string, status: PaymentStatus) {
  const orders = getOrders();
  const nextOrders = orders.map((order) =>
    order.id === orderId ? { ...order, status } : order,
  );
  setOrders(nextOrders);
  return nextOrders;
}
