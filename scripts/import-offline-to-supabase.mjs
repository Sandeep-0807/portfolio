import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";

function requireEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

function parseJsonFile(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  try {
    return JSON.parse(raw);
  } catch (e) {
    throw new Error(`Invalid JSON in ${filePath}`);
  }
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

async function assertIsAdmin(supabase) {
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData?.user) throw new Error("Not signed in");

  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userData.user.id)
    .eq("role", "admin")
    .maybeSingle();

  if (error) throw new Error(`Failed to check admin role: ${error.message}`);
  if (!data) throw new Error(`Signed in as ${userData.user.email || userData.user.id}, but user is not admin`);
}

async function upsertAll(supabase, table, rows) {
  const cleanRows = rows
    .filter(Boolean)
    .map((r) => (typeof r === "object" && r !== null ? r : null))
    .filter(Boolean);

  if (cleanRows.length === 0) return;

  const { error } = await supabase.from(table).upsert(cleanRows, { onConflict: "id" });
  if (error) throw new Error(`Upsert ${table} failed: ${error.message}`);
}

async function main() {
  const exportPath = process.argv[2];
  if (!exportPath) {
    console.error("Usage: node scripts/import-offline-to-supabase.mjs <offline-export.json>");
    console.error("\nRequired env vars:");
    console.error("  VITE_SUPABASE_URL");
    console.error("  VITE_SUPABASE_ANON_KEY");
    console.error("  SUPABASE_ADMIN_EMAIL");
    console.error("  SUPABASE_ADMIN_PASSWORD");
    process.exit(2);
  }

  const supabaseUrl = requireEnv("VITE_SUPABASE_URL");
  const supabaseAnonKey = requireEnv("VITE_SUPABASE_ANON_KEY");
  const email = requireEnv("SUPABASE_ADMIN_EMAIL");
  const password = requireEnv("SUPABASE_ADMIN_PASSWORD");

  const offlineDb = parseJsonFile(exportPath);

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { error: loginErr } = await supabase.auth.signInWithPassword({ email, password });
  if (loginErr) throw new Error(`Login failed: ${loginErr.message}`);

  await assertIsAdmin(supabase);

  // Singletons (we keep all rows, but UI generally reads the latest)
  await upsertAll(supabase, "about_content", asArray(offlineDb.about_content));
  await upsertAll(supabase, "profile_content", asArray(offlineDb.profile_content));
  await upsertAll(supabase, "resume_content", asArray(offlineDb.resume_content));
  await upsertAll(supabase, "contact_info", asArray(offlineDb.contact_info));

  // Lists
  await upsertAll(supabase, "skills", asArray(offlineDb.skills));
  await upsertAll(supabase, "education", asArray(offlineDb.education));
  await upsertAll(supabase, "experience", asArray(offlineDb.experience));
  await upsertAll(supabase, "projects", asArray(offlineDb.projects));
  await upsertAll(supabase, "certificates", asArray(offlineDb.certificates));

  console.log("Import complete.");
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
