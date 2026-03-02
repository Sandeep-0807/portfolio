import "dotenv/config";

import bcrypt from "bcryptjs";
import { query } from "./db.mjs";
import { uuid } from "./utils.mjs";

const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;

if (!email || !password) {
  console.error("Missing ADMIN_EMAIL and/or ADMIN_PASSWORD");
  process.exit(1);
}

async function main() {
  const existing = await query("SELECT id FROM users WHERE email = :email LIMIT 1", { email });
  const user = Array.isArray(existing) && existing.length ? existing[0] : null;

  const userId = user?.id ?? uuid();

  const password_hash = await bcrypt.hash(password, 10);

  if (!user) {
    await query(
      "INSERT INTO users (id, email, password_hash) VALUES (:id, :email, :password_hash)",
      { id: userId, email, password_hash },
    );
    console.log(`Created user: ${userId}`);
  } else {
    await query(
      "UPDATE users SET password_hash = :password_hash WHERE id = :id",
      { id: userId, password_hash },
    );
    console.log(`Updated user password: ${userId}`);
  }

  try {
    await query(
      "INSERT INTO user_roles (id, user_id, role) VALUES (:id, :user_id, 'admin')",
      { id: uuid(), user_id: userId },
    );
    console.log("Granted admin role");
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (!/duplicate|unique/i.test(msg)) throw e;
    console.log("Admin role already granted");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
