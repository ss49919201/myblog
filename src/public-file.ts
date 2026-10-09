import { readFile } from "node:fs/promises";
import { join } from "node:path";

export async function readPublicFile(root: string, pathname: string): Promise<Response | undefined> {
  const name = pathname === "/favicon.svg" ? "favicon.svg" : pathname === "/styles.css" ? "styles.css" : undefined;
  if (!name) return undefined;
  const bytes = await readFile(join(root, "public", name));
  const type = name.endsWith(".css") ? "text/css; charset=utf-8" : "image/svg+xml";
  return new Response(bytes, { headers: { "content-type": type } });
}
