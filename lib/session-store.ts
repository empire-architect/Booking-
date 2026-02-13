import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import type { BookResponse } from "@/types/liteapi";
import type { BookingContext } from "@/lib/session";

type BookingSessionRecord = {
  context: BookingContext;
  createdAt: number;
  expiresAt: number;
  bookingResult?: BookResponse;
};

type SessionDb = Record<string, BookingSessionRecord>;

function getStorePath() {
  return process.env.BOOKING_SESSION_STORE_PATH || path.join(process.cwd(), ".data", "booking-sessions.json");
}

async function ensureStoreFile() {
  const filePath = getStorePath();
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });

  try {
    await fs.access(filePath);
  } catch {
    await fs.writeFile(filePath, "{}", "utf8");
  }

  return filePath;
}

async function readDb(): Promise<SessionDb> {
  const filePath = await ensureStoreFile();
  const raw = await fs.readFile(filePath, "utf8");

  try {
    const parsed = JSON.parse(raw) as SessionDb;
    return parsed ?? {};
  } catch {
    return {};
  }
}

async function writeDb(db: SessionDb) {
  const filePath = await ensureStoreFile();
  const tmpPath = `${filePath}.tmp`;
  await fs.writeFile(tmpPath, JSON.stringify(db, null, 2), "utf8");
  await fs.rename(tmpPath, filePath);
}

function pruneExpired(db: SessionDb) {
  const now = Date.now();
  for (const [key, value] of Object.entries(db)) {
    if (value.expiresAt <= now) {
      delete db[key];
    }
  }
}

export async function createBookingSession(context: BookingContext, ttlSeconds = 60 * 30) {
  const db = await readDb();
  pruneExpired(db);

  const sid = crypto.randomBytes(24).toString("base64url");
  const now = Date.now();

  db[sid] = {
    context,
    createdAt: now,
    expiresAt: now + ttlSeconds * 1000,
  };

  await writeDb(db);
  return sid;
}

export async function getBookingSession(sid: string) {
  const db = await readDb();
  pruneExpired(db);
  const record = db[sid] ?? null;
  await writeDb(db);
  return record;
}

export async function updateBookingSession(
  sid: string,
  patch: Partial<BookingSessionRecord>
): Promise<BookingSessionRecord | null> {
  const db = await readDb();
  pruneExpired(db);

  if (!db[sid]) {
    await writeDb(db);
    return null;
  }

  db[sid] = {
    ...db[sid],
    ...patch,
  };

  await writeDb(db);
  return db[sid];
}

export async function deleteBookingSession(sid: string) {
  const db = await readDb();
  pruneExpired(db);
  delete db[sid];
  await writeDb(db);
}
