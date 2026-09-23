import fs from "fs";
import path from "path";
import { ensureDataDir } from "../data-file";

export function sessionPath(): string {
  ensureDataDir();
  return path.join(process.cwd(), "data", "linkedin-session.json");
}

export function hasSession(): boolean {
  return fs.existsSync(sessionPath());
}

export function sessionSavedAt(): string | null {
  const p = sessionPath();
  if (!fs.existsSync(p)) return null;
  return fs.statSync(p).mtime.toISOString();
}

export function clearSession() {
  const p = sessionPath();
  if (fs.existsSync(p)) fs.unlinkSync(p);
}
