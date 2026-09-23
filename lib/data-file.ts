import fs from "fs";
import path from "path";

export const DATA_DIR = path.join(process.cwd(), "data");

export function ensureDataDir(sub = "") {
  const dir = sub ? path.join(DATA_DIR, sub) : DATA_DIR;
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function readJson<T>(relPath: string, fallback: T): T {
  const full = path.join(DATA_DIR, relPath);
  if (!fs.existsSync(full)) return fallback;
  try {
    return JSON.parse(fs.readFileSync(full, "utf-8")) as T;
  } catch {
    return fallback;
  }
}

export function writeJson(relPath: string, value: unknown) {
  const full = path.join(DATA_DIR, relPath);
  ensureDataDir(path.dirname(relPath) === "." ? "" : path.dirname(relPath));
  fs.writeFileSync(full, JSON.stringify(value, null, 2), "utf-8");
}

export function listFiles(sub: string): string[] {
  const dir = path.join(DATA_DIR, sub);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => f.endsWith(".json"));
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}
