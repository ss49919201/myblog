import { DatabaseSync } from "node:sqlite";
import { join } from "node:path";
import { contentSql } from "./content-sql.ts";
import { loadContent } from "./load.ts";
import { applySchema } from "./schema.ts";
import type { SqlRead } from "./types.ts";

export function openDatabase(path: string): DatabaseSync {
  return new DatabaseSync(path, { enableForeignKeyConstraints: true });
}

export function sqliteRead(db: DatabaseSync): SqlRead {
  return {
    async all(query, params) {
      return db.prepare(query).all(...params);
    },
  };
}

export function syncDatabase(root: string, dbPath: string): DatabaseSync {
  const content = loadContent(root);
  applySchema(dbPath, join(root, "db", "schema.sql"));
  const db = openDatabase(dbPath);
  db.exec(contentSql(content));
  return db;
}

export function syncDefault(root: string): DatabaseSync {
  return syncDatabase(root, join(root, "db", "blog.sqlite"));
}
