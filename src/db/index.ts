import { createDatabase } from "@kilocode/app-builder-db";
import * as schema from "./schema";

let _db: ReturnType<typeof createDatabase> | null = null;

export function getDb() {
  if (!_db) {
    _db = createDatabase(schema);
  }
  return _db;
}
