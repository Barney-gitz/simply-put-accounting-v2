import "server-only";

import { eq } from "drizzle-orm";
import { cookies } from "next/headers";

import { db } from "@/db/client";
import { staffSessions } from "@/db/schema/staff-sessions";
import { staffUsers } from "@/db/schema/staff-users";
import { verifyPassword } from "./password";
import { createSession, hashSessionToken, SESSION_COOKIE_NAME, deleteSession } from "./session";

export async function login(email: string, password: string) {
  const staffUser = await db.query.staffUsers.findFirst({
    where: eq(staffUsers.email, email.toLowerCase()),
  });

  if (!staffUser || !staffUser.isActive) return false;

  const validPassword = await verifyPassword(password, staffUser.passwordHash);
  if (!validPassword) return false;

  await createSession(staffUser.id);
  return true;
}

export async function logout() {
  await deleteSession();
}

export async function getCurrentStaffUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) return null;

  const session = await db.query.staffSessions.findFirst({
    where: eq(staffSessions.tokenHash, hashSessionToken(token)),
  });

  if (!session || session.expiresAt < new Date()) return null;

  const staffUser = await db.query.staffUsers.findFirst({
    where: eq(staffUsers.id, session.staffUserId),
  });

  if (!staffUser || !staffUser.isActive) return null;

  return staffUser;
}