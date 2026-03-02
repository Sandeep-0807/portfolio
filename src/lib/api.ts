import { isSupabaseEnabled, supabase } from "@/integrations/supabase/client";

type ApiError = {
  error: string;
};

const TOKEN_KEY = "portfolio_token";

const OFFLINE_ADMIN = (() => {
  const raw = (import.meta.env.VITE_OFFLINE_ADMIN as string | undefined) ?? "";
  const v = raw.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes" || v === "on";
})();

const LOCAL_ADMIN_PASSWORD = (import.meta.env.VITE_LOCAL_ADMIN_PASSWORD as string | undefined) ?? undefined;

const LOCAL_DB_KEY = "portfolio_local_db_v1";

const SUPABASE_STORAGE_BUCKET = ((import.meta.env.VITE_SUPABASE_STORAGE_BUCKET as string | undefined) ?? "uploads").trim();

const API_BASE = import.meta.env.VITE_API_BASE as string | undefined;

function isProbablyDeployedHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  if (host === "localhost" || host === "127.0.0.1") return false;
  if (host.endsWith(".local")) return false;
  if (host === "::1") return false;
  return true;
}

function backendConfigHint(): string {
  const parts: string[] = [];
  parts.push("Backend not configured");
  parts.push("Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel (recommended)");
  parts.push("or set VITE_API_BASE to your running API server URL");
  return parts.join(". ") + ".";
}

function assertBackendConfiguredForApi(path: string) {
  if (!path.startsWith("/api/")) return;
  if (OFFLINE_ADMIN) return;
  if (isSupabaseEnabled) return;

  const baseFromEnv = API_BASE?.trim();
  if (baseFromEnv) return;

  // In a deployed/static host (e.g. Vercel), `/api/*` will typically 404 (HTML).
  // Fail early with a clear message instead of a confusing JSON/HTML parse error.
  if (typeof window !== "undefined" && isProbablyDeployedHost(window.location.hostname)) {
    throw new Error(backendConfigHint());
  }
}

type LocalDb = {
  version: 1;
  about_content: unknown[];
  profile_content: unknown[];
  resume_content: unknown[];
  contact_info: unknown[];
  skills: unknown[];
  education: unknown[];
  experience: unknown[];
  projects: unknown[];
  certificates: unknown[];
};

function getDefaultLocalDb(): LocalDb {
  return {
    version: 1,
    about_content: [],
    profile_content: [],
    resume_content: [],
    contact_info: [],
    skills: [],
    education: [],
    experience: [],
    projects: [],
    certificates: [],
  };
}

function loadLocalDb(): LocalDb {
  try {
    const raw = localStorage.getItem(LOCAL_DB_KEY);
    if (!raw) return getDefaultLocalDb();
    const parsed = JSON.parse(raw) as Partial<LocalDb> | null;
    if (!parsed || parsed.version !== 1) return getDefaultLocalDb();
    return {
      ...getDefaultLocalDb(),
      ...parsed,
    } as LocalDb;
  } catch {
    return getDefaultLocalDb();
  }
}

function saveLocalDb(db: LocalDb) {
  localStorage.setItem(LOCAL_DB_KEY, JSON.stringify(db));
}

function makeId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `id_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
  }
}

function parseJsonBody(options: RequestInit): unknown {
  if (!options.body) return null;
  if (typeof options.body !== "string") {
    throw new Error("Offline mode only supports JSON request bodies");
  }
  try {
    return JSON.parse(options.body) as unknown;
  } catch {
    throw new Error("Invalid JSON body");
  }
}

function normalizeMethod(options: RequestInit) {
  return (options.method || "GET").toUpperCase();
}

type LocalDbTableKey = Exclude<keyof LocalDb, "version">;

function getTableKeyFromAdminPath(path: string): LocalDbTableKey | null {
  const m = path.match(/^\/api\/admin\/([a-z_]+)(?:\/([^/?#]+))?$/i);
  if (!m) return null;
  const table = m[1].toLowerCase();
  const allow: ReadonlyArray<LocalDbTableKey> = [
    "about_content",
    "profile_content",
    "resume_content",
    "contact_info",
    "skills",
    "education",
    "experience",
    "projects",
    "certificates",
  ];
  return (allow as readonly string[]).includes(table) ? (table as LocalDbTableKey) : null;
}

function getIdFromAdminPath(path: string): string | null {
  const m = path.match(/^\/api\/admin\/[a-z_]+\/([^/?#]+)$/i);
  return m ? decodeURIComponent(m[1]) : null;
}

function localAuthMe(): { user: { id: string; email: string; role: "admin" }; isAdmin: true } {
  return {
    user: { id: "local", email: "offline@local", role: "admin" },
    isAdmin: true,
  };
}

function localApiFetch<T>(path: string, options: RequestInit = {}): T {
  const method = normalizeMethod(options);

  // Auth
  if (path === "/api/auth/login" && method === "POST") {
    const body = parseJsonBody(options) as { email?: string; password?: string } | null;
    const password = (body?.password ?? "").toString();
    if (LOCAL_ADMIN_PASSWORD && password !== LOCAL_ADMIN_PASSWORD) {
      throw new Error("Invalid credentials");
    }
    return {
      token: "local-token",
      user: {
        id: "local",
        email: (body?.email ?? "offline@local").toString() || "offline@local",
        role: "admin",
      },
    } as T;
  }

  if (path === "/api/auth/me" && method === "GET") {
    const token = getAuthToken();
    if (!token) throw new Error("Unauthorized");
    return localAuthMe() as T;
  }

  // Admin CRUD
  const tableKey = getTableKeyFromAdminPath(path);
  if (tableKey) {
    const db = loadLocalDb();
    const id = getIdFromAdminPath(path);
    const table = [...(db[tableKey] || [])] as Array<Record<string, unknown>>;

    if (method === "GET" && !id) {
      return table as unknown as T;
    }

    if (method === "POST" && !id) {
      const body = parseJsonBody(options) as Record<string, unknown> | null;
      const row = { ...(body || {}) } as Record<string, unknown>;
      if (!row.id) row.id = makeId();
      table.push(row);
      db[tableKey] = table;
      saveLocalDb(db);
      return row as unknown as T;
    }

    if ((method === "PUT" || method === "PATCH") && id) {
      const body = parseJsonBody(options) as Record<string, unknown> | null;
      const idx = table.findIndex((r) => String(r.id) === String(id));
      if (idx < 0) throw new Error("Not found");
      table[idx] = { ...table[idx], ...(body || {}), id };
      db[tableKey] = table;
      saveLocalDb(db);
      return table[idx] as unknown as T;
    }

    if (method === "DELETE" && id) {
      const next = table.filter((r) => String(r.id) !== String(id));
      db[tableKey] = next;
      saveLocalDb(db);
      return { ok: true } as unknown as T;
    }

    throw new Error("Unsupported offline admin operation");
  }

  // Public endpoints backed by local store
  if (method === "GET") {
    const db = loadLocalDb();
    if (path === "/api/public/about") return ((db.about_content[0] ?? null) as unknown) as T;
    if (path === "/api/public/profile") return ((db.profile_content[0] ?? null) as unknown) as T;
    if (path === "/api/public/resume") return ((db.resume_content[0] ?? null) as unknown) as T;
    if (path === "/api/public/contact") return ((db.contact_info[0] ?? null) as unknown) as T;
    if (path === "/api/public/skills") return (db.skills as unknown) as T;
    if (path === "/api/public/education") return (db.education as unknown) as T;
    if (path === "/api/public/experience") return (db.experience as unknown) as T;
    if (path === "/api/public/projects") return (db.projects as unknown) as T;
    if (path === "/api/public/certificates") return (db.certificates as unknown) as T;
  }

  throw new Error("Offline mode: unknown endpoint");
}

async function supabaseIsAdmin(): Promise<boolean> {
  if (!isSupabaseEnabled || !supabase) return false;
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData.user) return false;

  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userData.user.id)
    .eq("role", "admin")
    .maybeSingle();

  if (error) return false;
  return Boolean(data);
}

async function supabaseAuthLogin(options: RequestInit): Promise<{ token: string; user: { id: string; email: string; role: "admin" | "user" } }> {
  if (!supabase) throw new Error("Supabase is not configured");
  const body = parseJsonBody(options) as { email?: string; password?: string } | null;
  const email = (body?.email ?? "").toString();
  const password = (body?.password ?? "").toString();
  if (!email || !password) throw new Error("Email and password are required");

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message || "Login failed");
  if (!data.session || !data.user) throw new Error("Login failed");

  // Keep the existing app behavior: presence of TOKEN_KEY controls whether /api/auth/me is attempted.
  setAuthToken("supabase");

  const admin = await supabaseIsAdmin();
  return {
    token: "supabase",
    user: {
      id: data.user.id,
      email: data.user.email || email,
      role: admin ? "admin" : "user",
    },
  };
}

async function supabaseAuthMe(): Promise<{ user: { id: string; email: string; role: "admin" | "user" }; isAdmin: boolean }> {
  if (!supabase) throw new Error("Supabase is not configured");
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error("Unauthorized");
  const admin = await supabaseIsAdmin();
  return {
    user: {
      id: data.user.id,
      email: data.user.email || "",
      role: admin ? "admin" : "user",
    },
    isAdmin: admin,
  };
}

function parseSupabaseAdminPath(path: string): { table: string; id: string | null } | null {
  const m = path.match(/^\/api\/admin\/([a-z_]+)(?:\/([^/?#]+))?$/i);
  if (!m) return null;
  return { table: m[1].toLowerCase(), id: m[2] ? decodeURIComponent(m[2]) : null };
}

async function supabaseApiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (!supabase) throw new Error("Supabase is not configured");

  const requireRecord = (value: unknown): Record<string, unknown> => {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      throw new Error("Invalid request body");
    }
    return value as Record<string, unknown>;
  };

  const method = normalizeMethod(options);

  // Auth routes
  if (path === "/api/auth/login" && method === "POST") {
    return (await supabaseAuthLogin(options)) as unknown as T;
  }
  if (path === "/api/auth/me" && method === "GET") {
    return (await supabaseAuthMe()) as unknown as T;
  }

  // Admin CRUD routes
  const adminRoute = parseSupabaseAdminPath(path);
  if (adminRoute) {
    const { table, id } = adminRoute;

    const adminOrder: Record<string, { column: string; ascending: boolean }> = {
      skills: { column: "sort_order", ascending: true },
      education: { column: "sort_order", ascending: true },
      experience: { column: "sort_order", ascending: true },
      projects: { column: "sort_order", ascending: true },
      certificates: { column: "sort_order", ascending: true },
      about_content: { column: "updated_at", ascending: false },
      resume_content: { column: "updated_at", ascending: false },
      contact_info: { column: "updated_at", ascending: false },
      profile_content: { column: "updated_at", ascending: false },
    };

    if (method === "GET" && !id) {
      let q = supabase.from(table).select("*");
      const order = adminOrder[table];
      if (order) {
        q = q.order(order.column, { ascending: order.ascending });
      }
      const { data, error } = await q;
      if (error) throw new Error(error.message);
      return (data || []) as unknown as T;
    }

    if (method === "POST" && !id) {
      const body = requireRecord(parseJsonBody(options));
      const { data, error } = await supabase.from(table).insert(body).select("*").maybeSingle();
      if (error) throw new Error(error.message);
      return data as unknown as T;
    }

    if ((method === "PUT" || method === "PATCH") && id) {
      const body = requireRecord(parseJsonBody(options));
      const { data, error } = await supabase.from(table).update(body).eq("id", id).select("*").maybeSingle();
      if (error) throw new Error(error.message);
      return data as unknown as T;
    }

    if (method === "DELETE" && id) {
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) throw new Error(error.message);
      return ({ ok: true } as unknown) as T;
    }

    throw new Error("Unsupported admin operation");
  }

  // Public routes
  if (method === "GET") {
    if (path === "/api/public/about") {
      const { data, error } = await supabase
        .from("about_content")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return (data ?? null) as unknown as T;
    }

    if (path === "/api/public/profile") {
      const { data, error } = await supabase
        .from("profile_content")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return (data ?? null) as unknown as T;
    }

    if (path === "/api/public/resume") {
      const { data, error } = await supabase
        .from("resume_content")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return (data ?? null) as unknown as T;
    }

    if (path === "/api/public/contact") {
      const { data, error } = await supabase
        .from("contact_info")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return (data ?? null) as unknown as T;
    }

    const listMap: Record<string, { table: string; order?: string }> = {
      "/api/public/skills": { table: "skills", order: "sort_order" },
      "/api/public/education": { table: "education", order: "sort_order" },
      "/api/public/experience": { table: "experience", order: "sort_order" },
      "/api/public/projects": { table: "projects", order: "sort_order" },
      "/api/public/certificates": { table: "certificates", order: "sort_order" },
    };

    const mapped = listMap[path];
    if (mapped) {
      let q = supabase.from(mapped.table).select("*");
      if (mapped.order) q = q.order(mapped.order, { ascending: true });
      const { data, error } = await q;
      if (error) throw new Error(error.message);
      return (data || []) as unknown as T;
    }
  }

  throw new Error("Supabase mode: unknown endpoint");
}

async function fileToDataUrl(file: File): Promise<string> {
  const maxBytes = 3.5 * 1024 * 1024; // localStorage-friendly-ish cap
  if (file.size > maxBytes) {
    throw new Error(
      "File too large for offline mode. Use a URL (/assets/...) or run the API server for uploads.",
    );
  }

  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.onload = () => resolve(String(reader.result || ""));
    reader.readAsDataURL(file);
  });
}

function getDefaultLocalApiBase() {
  if (typeof window === "undefined") return undefined;
  const host = window.location.hostname;
  const port = window.location.port;

  const isLocalhost = host === "localhost" || host === "127.0.0.1";
  const isPrivateIp = (() => {
    const m = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
    if (!m) return false;
    const [a, b, c, d] = m.slice(1).map((x) => Number(x));
    const ok = [a, b, c, d].every((n) => Number.isFinite(n) && n >= 0 && n <= 255);
    if (!ok) return false;
    if (a === 10) return true;
    if (a === 192 && b === 168) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    return false;
  })();

  // If you're on typical Vite dev/preview ports, assume local API next to it.
  const isDevLikePort = port === "5173" || port === "4173" || port === "3000" || port === "8080";

  if (!(isLocalhost || isPrivateIp || isDevLikePort)) return undefined;
  return `http://${host}:5050`;
}

function buildUrl(path: string) {
  if (/^https?:\/\//i.test(path)) return path;

  const baseFromEnv = API_BASE?.trim();
  const base = (baseFromEnv || getDefaultLocalApiBase())?.replace(/\/$/, "");
  if (!base) return path;

  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${base}${suffix}`;
}

export function resolveUrl(path: string) {
  return buildUrl(path);
}

function safeJsonParse(text: string): unknown | null {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

async function readResponse(res: Response): Promise<{ data: unknown; isJson: boolean; text: string }> {
  const contentType = res.headers.get("content-type") || "";
  const text = await res.text();
  if (!text) return { data: null, isJson: contentType.includes("application/json"), text: "" };

  const parsed = safeJsonParse(text);
  if (parsed !== null) return { data: parsed, isJson: true, text };

  return { data: text, isJson: false, text };
}

function looksLikeHtml(text: string) {
  const t = text.trimStart().toLowerCase();
  return t.startsWith("<!doctype") || t.startsWith("<html");
}

export function getAuthToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string | null) {
  if (!token) {
    localStorage.removeItem(TOKEN_KEY);
  } else {
    localStorage.setItem(TOKEN_KEY, token);
  }
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  assertBackendConfiguredForApi(path);

  if (OFFLINE_ADMIN && path.startsWith("/api/")) {
    return Promise.resolve(localApiFetch<T>(path, options));
  }

  if (isSupabaseEnabled && path.startsWith("/api/")) {
    return supabaseApiFetch<T>(path, options);
  }

  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");

  const token = getAuthToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(buildUrl(path), { ...options, headers });
  const { data, isJson, text } = await readResponse(res);

  if (!res.ok) {
    const jsonMessage = isJson ? (data as ApiError | null)?.error : null;
    const fallback = res.statusText || `HTTP ${res.status}`;
    const hint = !isJson && looksLikeHtml(text) ? " (looks like HTML; check API server/proxy or set VITE_API_BASE)" : "";
    throw new Error(`${jsonMessage || fallback}${hint}`);
  }

  if (!isJson) {
    const hint = looksLikeHtml(text) ? " (looks like HTML; check API server/proxy or set VITE_API_BASE)" : "";
    throw new Error(`Unexpected non-JSON response${hint}`);
  }

  return data as T;
}

export async function apiUpload<T>(path: string, formData: FormData, options: Omit<RequestInit, "body"> = {}): Promise<T> {
  assertBackendConfiguredForApi(path);

  if (OFFLINE_ADMIN && path === "/api/admin/upload") {
    const file = formData.get("file");
    if (!(file instanceof File)) throw new Error("No file provided");
    const url = await fileToDataUrl(file);
    return { url } as unknown as T;
  }

  if (isSupabaseEnabled && path === "/api/admin/upload") {
    if (!supabase) throw new Error("Supabase is not configured");
    const file = formData.get("file");
    if (!(file instanceof File)) throw new Error("No file provided");

    const ext = (() => {
      const m = file.name.match(/\.([a-z0-9]+)$/i);
      return m ? m[1].toLowerCase() : "bin";
    })();

    const objectPath = `uploads/${makeId()}.${ext}`;

    const { error } = await supabase.storage.from(SUPABASE_STORAGE_BUCKET).upload(objectPath, file, {
      contentType: file.type || undefined,
      upsert: false,
    });
    if (error) throw new Error(error.message);

    const { data } = supabase.storage.from(SUPABASE_STORAGE_BUCKET).getPublicUrl(objectPath);
    const url = data.publicUrl;
    if (!url) throw new Error("Upload succeeded but no public URL was returned");

    return { url } as unknown as T;
  }

  const headers = new Headers(options.headers);

  const token = getAuthToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(buildUrl(path), { ...options, method: options.method || "POST", body: formData, headers });
  const { data, isJson, text } = await readResponse(res);

  if (!res.ok) {
    const jsonMessage = isJson ? (data as ApiError | null)?.error : null;
    const fallback = res.statusText || `HTTP ${res.status}`;
    const hint = !isJson && looksLikeHtml(text) ? " (looks like HTML; check API server/proxy or set VITE_API_BASE)" : "";
    throw new Error(`${jsonMessage || fallback}${hint}`);
  }

  if (!isJson) {
    const hint = looksLikeHtml(text) ? " (looks like HTML; check API server/proxy or set VITE_API_BASE)" : "";
    throw new Error(`Unexpected non-JSON response${hint}`);
  }

  return data as T;
}
