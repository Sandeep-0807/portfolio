import { randomUUID } from "crypto";

export function uuid() {
  return randomUUID();
}

export function pickFirst(rows) {
  return Array.isArray(rows) && rows.length ? rows[0] : null;
}

export function toJson(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
  return value;
}
