import type { SqlRead, SqlValue } from "./types.ts";

type D1Statement = {
  bind(...values: SqlValue[]): D1Statement;
  all(): Promise<{ results?: unknown[] }>;
};

export type D1Like = {
  prepare(query: string): D1Statement;
};

export function d1Read(db: D1Like): SqlRead {
  return {
    async all(query, params) {
      const statement = params.length === 0 ? db.prepare(query) : db.prepare(query).bind(...params);
      const result = await statement.all();
      return result.results ?? [];
    },
  };
}
