type ApiError = {
  error: string;
};

const TOKEN_KEY = "portfolio_token";

const API_BASE = import.meta.env.VITE_API_BASE as string | undefined;

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
