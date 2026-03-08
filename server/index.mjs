import "dotenv/config";

import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import multer from "multer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { query } from "./db.mjs";
import { requireAdmin, requireAuth, signToken } from "./auth.mjs";
import { pickFirst, toJson, uuid } from "./utils.mjs";

const app = express();

const DEFAULT_SKILLS = [
  {
    name: "Python",
    proficiency: 90,
    icon: "🐍",
    description: "Data analysis, ML model development, automation",
    status: "proficient",
  },
  {
    name: "C Programming",
    proficiency: 85,
    icon: "💻",
    description: "System programming, data structures, algorithms",
    status: "proficient",
  },
  {
    name: "HTML & CSS",
    proficiency: 80,
    icon: "🎨",
    description: "Responsive web design, modern layouts",
    status: "proficient",
  },
  {
    name: "Data Structures",
    proficiency: 88,
    icon: "🗂️",
    description: "Arrays, linked lists, trees, graphs, algorithms",
    status: "proficient",
  },
  {
    name: "JavaScript",
    proficiency: 70,
    icon: "⚡",
    description: "Web development, API integration",
    status: "learning",
  },
  {
    name: "Foundations of Data Science",
    proficiency: 75,
    icon: "📊",
    description: "Statistical analysis, data exploration, modeling",
    status: "learning",
  },
  {
    name: "Data Visualization",
    proficiency: 72,
    icon: "📈",
    description: "Matplotlib, Seaborn, Plotly dashboards",
    status: "learning",
  },
];

async function ensureColumn(table, column, ddl) {
  const rows = await query(
    "SELECT COUNT(*) AS cnt FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = :table AND column_name = :column",
    { table, column },
  );
  const cnt = Number(rows?.[0]?.cnt ?? 0);
  if (cnt === 0) {
    await query(`ALTER TABLE ${table} ADD COLUMN ${column} ${ddl}`);
  }
}

// Ensure new optional columns exist (keeps older DBs working after updates).
try {
  await ensureColumn("projects", "highlights", "JSON NULL");
  await ensureColumn("projects", "description_align", "VARCHAR(16) NULL");
  await ensureColumn("certificates", "description_align", "VARCHAR(16) NULL");
  await ensureColumn("about_content", "description_align", "VARCHAR(16) NULL");
  await ensureColumn("education", "parent_id", "CHAR(36) NULL");
  await ensureColumn("certificates", "status", "VARCHAR(32) DEFAULT 'completed'");
  await ensureColumn("resume_content", "summary_text", "TEXT NULL");
  await ensureColumn("resume_content", "education_summary", "TEXT NULL");
  await ensureColumn("resume_content", "experience_summary", "TEXT NULL");
  await ensureColumn("resume_content", "achievements_summary", "TEXT NULL");
} catch {
  // Ignore: if DB is not ready yet, requests will surface the error.
}

async function seedDefaultSkillsIfEmpty() {
  const rows = await query("SELECT COUNT(*) AS cnt FROM skills");
  const cnt = Number(rows?.[0]?.cnt ?? 0);
  if (cnt > 0) return;

  for (let i = 0; i < DEFAULT_SKILLS.length; i += 1) {
    const s = DEFAULT_SKILLS[i];
    await query(
      "INSERT INTO skills (id, name, icon, description, proficiency, status, sort_order) VALUES (:id, :name, :icon, :description, :proficiency, :status, :sort_order)",
      {
        id: uuid(),
        name: s.name,
        icon: s.icon,
        description: s.description,
        proficiency: s.proficiency,
        status: s.status,
        sort_order: i,
      },
    );
  }
}

try {
  await seedDefaultSkillsIfEmpty();
} catch {
  // Ignore: if DB/table isn't ready yet, requests will surface the error.
}

function wrap(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

app.use(express.json({ limit: "1mb" }));
app.use(cors({
  origin: "*",
  exposedHeaders: ["Accept-Ranges", "Content-Range", "Content-Length"],
}));

// ---- File uploads (local disk) ----
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, "uploads");
fs.mkdirSync(uploadDir, { recursive: true });

app.use("/uploads", express.static(uploadDir));

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname || "");
      cb(null, `${uuid()}${ext}`);
    },
  }),
  limits: { fileSize: 15 * 1024 * 1024 },
});

app.post(
  "/api/admin/upload",
  requireAuth,
  requireAdmin,
  upload.single("file"),
  (req, res) => {
    if (!req.file) return res.status(400).json({ error: "Missing file" });
    res.json({ url: `/uploads/${req.file.filename}` });
  },
);

app.get("/api/health", wrap(async (_req, res) => {
  try {
    await query("SELECT 1");
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e instanceof Error ? e.message : "DB error" });
  }
}));

// ---- Auth ----
app.post("/api/auth/login", wrap(async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: "Email and password are required" });

  const users = await query("SELECT * FROM users WHERE email = :email LIMIT 1", { email });
  const user = pickFirst(users);
  if (!user) return res.status(401).json({ error: "Invalid email or password" });

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: "Invalid email or password" });

  const roles = await query(
    "SELECT role FROM user_roles WHERE user_id = :user_id",
    { user_id: user.id },
  );
  const role = roles.some((r) => r.role === "admin") ? "admin" : "user";

  const token = signToken({ sub: user.id, email: user.email, role });
  res.json({ token, user: { id: user.id, email: user.email, role } });
}));

app.get("/api/auth/me", requireAuth, wrap(async (req, res) => {
  res.json({ user: { id: req.user.sub, email: req.user.email, role: req.user.role }, isAdmin: req.user.role === "admin" });
}));

// ---- Public read endpoints ----
app.get("/api/public/about", wrap(async (_req, res) => {
  const rows = await query("SELECT * FROM about_content ORDER BY updated_at DESC LIMIT 1");
  const row = pickFirst(rows);
  if (!row) return res.json(null);
  row.highlights = toJson(row.highlights);
  res.json(row);
}));

app.get("/api/public/skills", wrap(async (_req, res) => {
  const rows = await query("SELECT * FROM skills ORDER BY sort_order ASC, created_at ASC");
  res.json(rows);
}));

app.get("/api/public/certificates", wrap(async (_req, res) => {
  const rows = await query("SELECT * FROM certificates ORDER BY sort_order ASC, created_at ASC");
  res.json(rows);
}));

app.get("/api/public/projects", wrap(async (_req, res) => {
  const rows = await query("SELECT * FROM projects ORDER BY sort_order ASC, created_at ASC");
  for (const r of rows) {
    r.highlights = toJson(r.highlights);
    r.technologies = toJson(r.technologies);
  }
  res.json(rows);
}));

app.get("/api/public/resume", wrap(async (_req, res) => {
  const rows = await query("SELECT * FROM resume_content ORDER BY updated_at DESC LIMIT 1");
  const row = pickFirst(rows);
  if (!row) return res.json(null);
  row.education = toJson(row.education);
  row.experience = toJson(row.experience);
  res.json(row);
}));

app.get("/api/public/contact", wrap(async (_req, res) => {
  const rows = await query("SELECT * FROM contact_info ORDER BY updated_at DESC LIMIT 1");
  const row = pickFirst(rows);
  if (!row) return res.json(null);
  row.social_links = toJson(row.social_links);
  res.json(row);
}));

app.get("/api/public/profile", wrap(async (_req, res) => {
  const rows = await query("SELECT * FROM profile_content ORDER BY updated_at DESC LIMIT 1");
  const row = pickFirst(rows);
  res.json(row);
}));

app.get("/api/public/education", wrap(async (_req, res) => {
  const rows = await query("SELECT * FROM education ORDER BY sort_order ASC, created_at ASC");
  res.json(rows);
}));

app.get("/api/public/experience", wrap(async (_req, res) => {
  const rows = await query("SELECT * FROM experience ORDER BY sort_order ASC, created_at ASC");
  res.json(rows);
}));

// ---- Admin CRUD ----
function adminCrud(table, {
  jsonFields = [],
  orderBy = "updated_at DESC",
} = {}) {
  app.get(`/api/admin/${table}`, requireAuth, requireAdmin, wrap(async (_req, res) => {
    const rows = await query(`SELECT * FROM ${table} ORDER BY ${orderBy}`);
    for (const row of rows) {
      for (const f of jsonFields) row[f] = toJson(row[f]);
    }
    res.json(rows);
  }));

  app.post(`/api/admin/${table}`, requireAuth, requireAdmin, wrap(async (req, res) => {
    const id = uuid();
    const payload = { ...req.body, id };

    for (const f of jsonFields) {
      if (payload[f] !== undefined) payload[f] = JSON.stringify(payload[f]);
    }

    const keys = Object.keys(payload);
    const cols = keys.map((k) => `\`${k}\``).join(",");
    const vals = keys.map((k) => `:${k}`).join(",");

    await query(`INSERT INTO ${table} (${cols}) VALUES (${vals})`, payload);
    res.json({ id });
  }));

  app.put(`/api/admin/${table}/:id`, requireAuth, requireAdmin, wrap(async (req, res) => {
    const id = req.params.id;
    const payload = { ...req.body };

    for (const f of jsonFields) {
      if (payload[f] !== undefined) payload[f] = JSON.stringify(payload[f]);
    }

    const keys = Object.keys(payload);
    if (!keys.length) return res.status(400).json({ error: "No fields to update" });

    const set = keys.map((k) => `\`${k}\` = :${k}`).join(", ");
    await query(`UPDATE ${table} SET ${set} WHERE id = :id`, { ...payload, id });
    res.json({ ok: true });
  }));

  app.delete(`/api/admin/${table}/:id`, requireAuth, requireAdmin, wrap(async (req, res) => {
    await query(`DELETE FROM ${table} WHERE id = :id`, { id: req.params.id });
    res.json({ ok: true });
  }));
}

// Tables used by admin UI
adminCrud("skills", { orderBy: "sort_order ASC, created_at ASC" });
adminCrud("certificates", { orderBy: "sort_order ASC, created_at ASC" });
adminCrud("projects", { jsonFields: ["highlights", "technologies"], orderBy: "sort_order ASC, created_at ASC" });
adminCrud("experience", { orderBy: "sort_order ASC, created_at ASC" });

// Education supports a parent/child tree (e.g., degree -> year-wise internships).
// Define cascade delete BEFORE registering the generic CRUD routes.
app.delete("/api/admin/education/:id", requireAuth, requireAdmin, wrap(async (req, res) => {
  const id = req.params.id;
  await query("DELETE FROM education WHERE parent_id = :id", { id });
  await query("DELETE FROM education WHERE id = :id", { id });
  res.json({ ok: true });
}));
adminCrud("education", { orderBy: "sort_order ASC, created_at ASC" });

// Single-row content tables (use latest row; update by id)
adminCrud("about_content", { jsonFields: ["highlights"], orderBy: "updated_at DESC" });
adminCrud("resume_content", { jsonFields: ["education", "experience"], orderBy: "updated_at DESC" });
adminCrud("contact_info", { jsonFields: ["social_links"], orderBy: "updated_at DESC" });
adminCrud("profile_content", { orderBy: "updated_at DESC" });

const PORT = Number(process.env.PORT || process.env.API_PORT || 5050);

app.use((err, _req, res, _next) => {
  console.error(err);

  // express.json() parse errors (often caused by unescaped backslashes in JSON)
  // should be a 400, not a 500.
  if (err && typeof err === "object") {
    const anyErr = /** @type {any} */ (err);
    const statusCode = anyErr.statusCode ?? anyErr.status;
    const isJsonParseError =
      anyErr.type === "entity.parse.failed" ||
      (err instanceof SyntaxError && statusCode === 400) ||
      statusCode === 400;

    if (isJsonParseError) {
      return res.status(400).json({
        error: "Invalid JSON in request body. If you pasted a Windows path, use double backslashes (\\\\) or forward slashes (/).",
      });
    }
  }

  const message = err instanceof Error ? err.message : "Internal Server Error";
  res.status(500).json({ error: message });
});

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
