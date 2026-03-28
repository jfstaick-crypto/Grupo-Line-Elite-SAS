import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const results: Record<string, unknown> = {};

  results.env = {
    DB_URL: process.env.DB_URL ? "SET" : "NOT SET",
    DB_TOKEN: process.env.DB_TOKEN ? "SET" : "NOT SET",
    NODE_ENV: process.env.NODE_ENV,
  };

  try {
    const { getDb } = await import("@/db");
    const db = getDb();
    results.dbInit = "OK";

    const { users } = await import("@/db/schema");
    const allUsers = await db.select().from(users).limit(5);
    results.dbQuery = "OK";
    results.userCount = allUsers.length;
    results.users = allUsers.map((u) => ({
      id: u.id,
      username: u.username,
      role: u.role,
      active: u.active,
    }));
  } catch (error) {
    results.dbError =
      error instanceof Error ? error.message : String(error);
    results.dbStack =
      error instanceof Error ? error.stack : undefined;
  }

  return NextResponse.json(results);
}
