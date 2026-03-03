import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function normalizeExternalUrl(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // URLs with spaces are almost always copy/paste mistakes.
  if (/\s/.test(trimmed)) return null;

  let candidate = trimmed;
  if (/^https?:\/\//i.test(candidate)) {
    // ok
  } else if (candidate.startsWith("//")) {
    candidate = `https:${candidate}`;
  } else if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(candidate)) {
    // Disallow non-http(s) schemes for external social links.
    return null;
  } else {
    candidate = `https://${candidate}`;
  }

  try {
    const url = new URL(candidate);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}
