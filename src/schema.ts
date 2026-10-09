import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runSqlite3def } from "./sqlite3def.ts";

export function applySchema(dbPath: string, schemaPath: string): void {
  const result = runSqlite3def(["--apply", "--enable-drop", "--file", schemaPath, dbPath]);
  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || `sqlite3def exited ${result.status}`);
  }
}

export function schemaChanges(dbPath: string, schemaPath: string): string {
  const result = runSqlite3def(["--check", "--file", schemaPath, dbPath]);
  if (result.status === 0) return "";
  if (result.status === 2) return result.stdout;
  throw new Error(result.stderr || result.stdout || `sqlite3def exited ${result.status}`);
}

export function schemaPlan(currentSql: string, desiredPath: string): string {
  const dir = mkdtempSync(join(tmpdir(), "myblog-schema-"));
  try {
    const currentPath = join(dir, "current.sql");
    writeFileSync(currentPath, currentSql);
    const result = runSqlite3def(["--file", desiredPath, currentPath]);
    if (result.status !== 0 && result.status !== 2) {
      throw new Error(result.stderr || result.stdout || `sqlite3def exited ${result.status}`);
    }
    return result.stdout;
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

export function ddlOnly(plan: string): string {
  return plan
    .split("\n")
    .filter((line) => {
      const trimmed = line.trim();
      if (trimmed === "" || trimmed.startsWith("--")) return false;
      if (trimmed === "BEGIN;" || trimmed === "COMMIT;") return false;
      return true;
    })
    .join("\n");
}
