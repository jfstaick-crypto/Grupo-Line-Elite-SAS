import { getDb } from "./index";
import { users } from "./schema";

const db = getDb();
const existingUsers = await db.select().from(users).limit(1);

if (existingUsers.length === 0) {
  await db.insert(users).values([
    {
      username: "admin",
      password: "admin123",
      fullName: "Administrador del Sistema",
      role: "administrador",
      active: true,
    },
    {
      username: "admision",
      password: "admision123",
      fullName: "Usuario de Admisión",
      role: "admision",
      active: true,
    },
    {
      username: "medico",
      password: "medico123",
      fullName: "Dr. Médico General",
      role: "medico",
      active: true,
    },
  ]);
  console.log("Default users created");
} else {
  console.log("Users already exist, skipping seed");
}
