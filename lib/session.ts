import "server-only";

import crypto from "crypto";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";

import { db } from "@/db/client";
import { staffSessions } from "@/db/schema/staff-sessions";

export const SESSION_COOKIE_NAME = "simply_put_session";

export function hashSessionToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function createSession(staffUserId: string) {
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashSessionToken(token);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await db.insert(staffSessions).values({
    staffUserId,
    tokenHash,
    expiresAt,
  });

  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    path: "/",
  });
}

export async function deleteSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    await db
      .delete(staffSessions)
      .where(eq(staffSessions.tokenHash, hashSessionToken(token)));
  }

  cookieStore.delete(SESSION_COOKIE_NAME);
}