import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

if (!SUPABASE_URL) {
  console.error("Missing SUPABASE_URL (or VITE_SUPABASE_URL)");
  process.exit(1);
}
if (!SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_SERVICE_ROLE_KEY (keep this secret; never expose in Vite env)");
  process.exit(1);
}
if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error("Missing ADMIN_EMAIL and/or ADMIN_PASSWORD");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function findUserByEmail(email) {
  // listUsers is paginated; most projects have small user counts.
  let page = 1;
  const perPage = 200;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw error;

    const user = data.users.find((u) => (u.email || "").toLowerCase() === email.toLowerCase());
    if (user) return user;

    if (data.users.length < perPage) return null;
    page += 1;
  }
}

async function main() {
  const existing = await findUserByEmail(ADMIN_EMAIL);

  const userId = existing?.id;

  if (!userId) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true,
    });
    if (error) throw error;

    console.log(`Created auth user: ${data.user.id}`);

    const { error: roleError } = await supabase
      .from("user_roles")
      .insert({ user_id: data.user.id, role: "admin" });

    if (roleError) throw roleError;

    console.log("Granted admin role");
    return;
  }

  console.log(`Auth user already exists: ${userId}`);

  const { error: roleError } = await supabase
    .from("user_roles")
    .insert({ user_id: userId, role: "admin" });

  if (roleError) {
    // Ignore duplicates
    const msg = String(roleError.message || "");
    if (!/duplicate|already exists|unique/i.test(msg)) throw roleError;
  }

  console.log("Admin role ensured");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
