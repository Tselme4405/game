/**
 * Bonum payment gateway helper
 * All credentials are read from environment variables — never exposed to the client.
 */

const BASE_URL = process.env.BONUM_BASE_URL!;
const APP_SECRET = process.env.BONUM_APP_SECRET!;
const TERMINAL_ID = process.env.BONUM_TERMINAL_ID!;

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
}

// ── Auth ─────────────────────────────────────────────────────────────────────

/** Fetches a short-lived access token from Bonum. */
export async function getBonumToken(): Promise<string> {
  const res = await fetch(
    `${BASE_URL}/bonum-gateway/ecommerce/auth/create`,
    {
      method: "GET",
      headers: {
        Authorization: `AppSecret ${APP_SECRET}`,
        "X-TERMINAL-ID": TERMINAL_ID,
      },
    }
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Bonum auth failed (${res.status}): ${body}`);
  }

  const json: BonumTokenResponse = await res.json();

  if (!json?.accessToken) {
    throw new Error(`Bonum auth: unexpected response shape: ${JSON.stringify(json)}`);
  }

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
  const res = await fetch(
    `${BASE_URL}/mpay-service/merchant/transaction/qr/create`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "X-TERMINAL-ID": TERMINAL_ID,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ amount, transactionId, expiresIn }),
    }
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Bonum QR creation failed (${res.status}): ${body}`);
  }

  const json: BonumQrResponse = await res.json();

  if (!json?.data?.qrImage) {
    throw new Error(`Bonum QR: unexpected response shape: ${JSON.stringify(json)}`);
  }

  return {
    invoiceId: json.data.invoiceId,
    qrCode: json.data.qrCode,
    qrImage: json.data.qrImage,
    links: Array.isArray(json.data.links) ? (json.data.links as BonumLink[]) : [],
  };
}
