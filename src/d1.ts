import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { contentStatements } from "./content-sql.ts";
import { loadContent } from "./load.ts";
import { ddlOnly, schemaPlan } from "./schema.ts";

export function pushContent(root: string, target: "local" | "remote"): void {
  const content = loadContent(root);
  const name = d1DatabaseName(root);
  const current = exportSchema(root, name, target);
  const plan = ddlOnly(schemaPlan(current, join(root, "db", "schema.sql")));
  if (plan.trim()) executeSql(root, name, target, plan);
  executeSql(root, name, target, contentStatements(content).join("\n"));
}

function d1DatabaseName(root: string): string {
  const raw: unknown = JSON.parse(readFileSync(join(root, "wrangler.jsonc"), "utf8"));
  if (!isRecord(raw) || !Array.isArray(raw.d1_databases) || raw.d1_databases.length !== 1) {
    throw new Error("wrangler.jsonc の d1_databases は1件である必要があります");
  }
  const database = raw.d1_databases[0];
  if (!isRecord(database) || typeof database.database_name !== "string" || database.database_name === "") {
    throw new Error("wrangler.jsonc に database_name がありません");
  }
  return database.database_name;
}

function exportSchema(root: string, name: string, target: "local" | "remote"): string {
  const result = wrangler(root, [
    "d1",
    "execute",
    name,
    targetFlag(target),
    "--json",
    "--command",
    "SELECT name, sql FROM sqlite_master WHERE sql IS NOT NULL",
  ]);
  const rows = parseRows(result.stdout);
  return rows
    .filter((row) => {
      const table = row.name;
      return typeof table === "string" && !table.startsWith("sqlite_") && !table.startsWith("_cf_");
    })
    .map((row) => {
      if (typeof row.sql !== "string") throw new Error("sqlite_master.sql が文字列ではありません");
      return row.sql.endsWith(";") ? row.sql : `${row.sql};`;
    })
    .join("\n");
}

function executeSql(root: string, name: string, target: "local" | "remote", sql: string): void {
  const dir = mkdtempSync(join(tmpdir(), "myblog-d1-"));
  try {
    const file = join(dir, "push.sql");
    writeFileSync(file, sql);
    wrangler(root, ["d1", "execute", name, targetFlag(target), "--yes", "--file", file]);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function wrangler(root: string, args: readonly string[]): { stdout: string } {
  const bin = join(root, "node_modules", ".bin", "wrangler");
  const result = spawnSync(bin, args, { cwd: root, encoding: "utf8" });
  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || `wrangler exited ${result.status ?? 1}`);
  }
  return { stdout: result.stdout ?? "" };
}

function parseRows(stdout: string): Record<string, unknown>[] {
  const start = stdout.indexOf("[");
  if (start < 0) throw new Error("wrangler の JSON が見つかりません");
  const parsed: unknown = JSON.parse(stdout.slice(start));
  if (!Array.isArray(parsed)) throw new Error("wrangler の JSON が配列ではありません");
  const rows: Record<string, unknown>[] = [];
  for (const item of parsed) {
    if (!isRecord(item) || !Array.isArray(item.results)) continue;
    for (const row of item.results) {
      if (!isRecord(row)) throw new Error("wrangler の行がオブジェクトではありません");
      rows.push(row);
    }
  }
  return rows;
}

function targetFlag(target: "local" | "remote"): "--local" | "--remote" {
  return target === "local" ? "--local" : "--remote";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
