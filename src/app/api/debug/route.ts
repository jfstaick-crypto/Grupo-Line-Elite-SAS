import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const results: Record<string, unknown> = {};

  results.env = {
    DB_URL: process.env.DB_URL ? `SET (${process.env.DB_URL.substring(0, 30)}...)` : "NOT SET",
    DB_TOKEN: process.env.DB_TOKEN ? `SET (${process.env.DB_TOKEN.substring(0, 10)}...)` : "NOT SET",
    NODE_ENV: process.env.NODE_ENV,
  };

  try {
    const { createDatabase } = await import("@kilocode/app-builder-db");
    const schema = await import("@/db/schema");

    const url = process.env.DB_URL;
    const token = process.env.DB_TOKEN;

    if (!url || !token) {
      results.error = "DB_URL or DB_TOKEN not set";
      return NextResponse.json(results);
    }

    const db = createDatabase(schema);
    results.dbInit = "OK";

    const allUsers = await db.select().from(schema.users).limit(5);
    results.dbQuery = "OK";
    results.userCount = allUsers.length;
    results.users = allUsers.map((u) => ({
      id: u.id,
      username: u.username,
      role: u.role,
      active: u.active,
    }));
  } catch (error) {
    results.error = error instanceof Error ? error.message : String(error);
    results.stack = error instanceof Error ? error.stack?.substring(0, 500) : undefined;
  }

  return NextResponse.json(results);
}
