import crypto from "node:crypto";

const DEFAULT_COOKIE_NAME = "booking_ctx";

function getSecret() {
  return process.env.SESSION_SECRET || "dev-session-secret-change-me";
}

function sign(payload: string) {
  return crypto.createHmac("sha256", getSecret()).update(payload).digest("base64url");
}

export function encodeSigned<T>(data: T) {
  const payload = Buffer.from(JSON.stringify(data)).toString("base64url");
  const signature = sign(payload);
  return `${payload}.${signature}`;
}

export function decodeSigned<T>(value: string | undefined | null): T | null {
  if (!value) return null;

  const [payload, signature] = value.split(".");
  if (!payload || !signature) return null;

  const expected = sign(payload);
  if (signature !== expected) return null;

  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as T;
  } catch {
    return null;
  }
}

export function getBookingCookieName() {
  return process.env.BOOKING_CONTEXT_COOKIE || DEFAULT_COOKIE_NAME;
}

export type BookingContext = {
  prebookId: string;
  transactionId: string;
  secretKey: string;
  offerId: string;
  holder?: {
    firstName: string;
    lastName: string;
    email: string;
  };
  guests?: Array<{
    occupancyNumber: number;
    firstName: string;
    lastName: string;
    email: string;
  }>;
  checkin?: string;
  checkout?: string;
  hotelId?: string;
  hotelName?: string;
  currency?: string;
  amount?: number;
};
