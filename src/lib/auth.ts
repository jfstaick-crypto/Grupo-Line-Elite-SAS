import { cookies } from "next/headers";
import { sealData, unsealData } from "iron-session";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

const SESSION_PASSWORD =
  "complex_password_at_least_32_characters_long_for_security";
const COOKIE_NAME = "si";

export interface SessionData {
  userId: number;
  username: string;
  fullName: string;
  role: string;
}

export async function createSession(user: {
  id: number;
  username: string;
  fullName: string;
  role: string;
}) {
  const session: SessionData = {
    userId: user.id,
    username: user.username,
    fullName: user.fullName,
    role: user.role,
  };
  const encrypted = await sealData(session, { password: SESSION_PASSWORD });
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, encrypted, {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24,
  });
  return session;
}

export async function getSession(): Promise<SessionData | null> {
  try {
    const cookieStore = await cookies();
    const cookie = cookieStore.get(COOKIE_NAME);
    if (!cookie?.value) return null;
    const session = await unsealData<SessionData>(cookie.value, {
      password: SESSION_PASSWORD,
    });
    return session;
  } catch {
    return null;
  }
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function verifyCredentials(username: string, password: string) {
  const user = await db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  if (user.length === 0) return null;

  const found = user[0];
  if (found.password !== password || !found.active) return null;

  return found;
}

export const ROLE_PERMISSIONS: Record<string, string[]> = {
  administrador: [
    "usuarios",
    "admision",
    "traslados",
    "historia-clinica",
    "exportar",
  ],
  admision: ["admision", "exportar"],
  medico: ["historia-clinica", "admision", "traslados"],
};

export function hasPermission(role: string, module: string): boolean {
  return ROLE_PERMISSIONS[role]?.includes(module) ?? false;
}
