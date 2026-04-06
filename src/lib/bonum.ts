/**
 * Bonum payment gateway helper
 * All credentials are read from environment variables — never exposed to the client.
 */

import type { BonumEnvironment } from "@/lib/types";

const BASE_URL = process.env.BONUM_BASE_URL!;
const APP_SECRET = process.env.BONUM_APP_SECRET!;
const TERMINAL_ID = process.env.BONUM_TERMINAL_ID!;
const RAW_ENV = process.env.BONUM_ENV?.trim().toLowerCase() ?? "test";

const HOST_ALLOWLIST: Record<BonumEnvironment, readonly string[]> = {
  test: ["testapi.bonum.mn"],
  // Bonum has not yet confirmed a single production QR host for this integration,
  // so allow the known public candidates and reject obvious test/prod mismatches.
  production: ["api.bonum.mn", "psp.bonum.mn"],
};

export interface BonumConfig {
  environment: BonumEnvironment;
  baseUrl: string;
  baseHost: string;
}

function assertBonumEnvironment(value: string): BonumEnvironment {
  if (value === "test" || value === "production") {
    return value;
  }

  throw new Error(`Invalid BONUM_ENV "${value}". Expected "test" or "production".`);
}

function logBonumDiagnostic(scope: string, detail: Record<string, unknown>) {
  console.info(`[bonum/${scope}] ${JSON.stringify(detail)}`);
}

export function getBonumConfig(): BonumConfig {
  const environment = assertBonumEnvironment(RAW_ENV);

  let baseHost: string;
  try {
    baseHost = new URL(BASE_URL).hostname.toLowerCase();
  } catch {
    throw new Error(`Invalid BONUM_BASE_URL "${BASE_URL}".`);
  }

  const allowedHosts = HOST_ALLOWLIST[environment];

  if (!allowedHosts.includes(baseHost)) {
    throw new Error(
      `BONUM_BASE_URL host "${baseHost}" does not match BONUM_ENV="${environment}". Allowed hosts: ${allowedHosts.join(", ")}.`
    );
  }

  return {
    environment,
    baseUrl: BASE_URL,
    baseHost,
  };
}

export function getBonumEnvironment(): BonumEnvironment {
  return getBonumConfig().environment;
}

// ── Types ────────────────────────────────────────────────────────────────────

export interface BonumTokenResponse {
  tokenType: string;
  accessToken: string;
  expiresIn: number;
  refreshToken: string;
  refreshExpiresIn: number;
  unit: string;
}

export interface BonumQrResponse {
  data: {
    invoiceId: string;
    qrCode: string;
    qrImage: string; // base64 PNG
    links?: unknown;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface BonumLink {
  name: string;
  logo?: string;
  link?: string;
  deeplink?: string;
}

export interface CreateQrResult {
  invoiceId: string;
  qrCode: string;
  qrImage: string;
  links: BonumLink[];
  expiresIn?: number;
  expiresAt?: string;
}

// ── Auth ─────────────────────────────────────────────────────────────────────

/** Fetches a short-lived access token from Bonum. */
export async function getBonumToken(): Promise<string> {
  const config = getBonumConfig();
  const res = await fetch(
    `${config.baseUrl}/bonum-gateway/ecommerce/auth/create`,
    {
      cache: "no-store",
      method: "GET",
      headers: {
        Authorization: `AppSecret ${APP_SECRET}`,
        "X-TERMINAL-ID": TERMINAL_ID,
      },
    }
  );

  logBonumDiagnostic("auth", {
    environment: config.environment,
    baseHost: config.baseHost,
    status: res.status,
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Bonum auth failed (${res.status}): ${body}`);
  }

  const json: BonumTokenResponse = await res.json();

  if (!json?.accessToken) {
    throw new Error(`Bonum auth: unexpected response shape: ${JSON.stringify(json)}`);
  }

  logBonumDiagnostic("auth-token", {
    environment: config.environment,
    baseHost: config.baseHost,
    status: res.status,
    tokenExpiresIn: json.expiresIn,
  });

  return json.accessToken;
}

// ── QR creation ──────────────────────────────────────────────────────────────

interface CreateQrParams {
  amount: number;
  transactionId: string;
  /** Seconds until the QR expires (default: 1800) */
  expiresIn?: number;
}

/** Creates a Bonum QR code for the given amount. Requires a valid access token. */
export async function createBonumQr(
  token: string,
  { amount, transactionId, expiresIn = 1800 }: CreateQrParams
): Promise<CreateQrResult> {
  const config = getBonumConfig();
  const res = await fetch(
    `${config.baseUrl}/mpay-service/merchant/transaction/qr/create`,
    {
      cache: "no-store",
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "X-TERMINAL-ID": TERMINAL_ID,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ amount, transactionId, expiresIn }),
    }
  );

  logBonumDiagnostic("qr-create", {
    environment: config.environment,
    baseHost: config.baseHost,
    status: res.status,
    transactionId,
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Bonum QR creation failed (${res.status}): ${body}`);
  }

  const json: BonumQrResponse = await res.json();

  if (!json?.data?.qrImage) {
    throw new Error(`Bonum QR: unexpected response shape: ${JSON.stringify(json)}`);
  }

  logBonumDiagnostic("qr-created", {
    environment: config.environment,
    baseHost: config.baseHost,
    status: res.status,
    transactionId,
    invoiceId: json.data.invoiceId,
    linksCount: Array.isArray(json.data.links) ? json.data.links.length : 0,
    expiresIn: typeof json.data.expiresIn === "number" ? json.data.expiresIn : null,
    expiresAt: typeof json.data.expiresAt === "string" ? json.data.expiresAt : null,
  });

  return {
    invoiceId: json.data.invoiceId,
    qrCode: json.data.qrCode,
    qrImage: json.data.qrImage,
    links: Array.isArray(json.data.links) ? (json.data.links as BonumLink[]) : [],
    expiresIn: typeof json.data.expiresIn === "number" ? json.data.expiresIn : undefined,
    expiresAt: typeof json.data.expiresAt === "string" ? json.data.expiresAt : undefined,
  };
}
