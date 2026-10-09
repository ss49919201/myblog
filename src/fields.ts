export const postFields = [
  { key: "title", required: true },
  { key: "slug", required: true },
  { key: "date", required: true },
  { key: "category", required: false },
  { key: "draft", required: false },
] as const;

export type PostFieldKey = (typeof postFields)[number]["key"];

export function postFieldsFromSchema(source: string): { key: string; required: boolean }[] {
  const start = source.indexOf("const posts");
  if (start < 0) {
    throw new Error("const posts not found");
  }
  const fromPosts = source.slice(start);
  const objectStart = fromPosts.indexOf("z.object({");
  if (objectStart < 0) {
    throw new Error("posts z.object not found");
  }
  const body = fromPosts.slice(objectStart + "z.object({".length);
  const objectEnd = body.indexOf("})");
  if (objectEnd < 0) {
    throw new Error("posts z.object end not found");
  }
  const fields: { key: string; required: boolean }[] = [];
  for (const rawLine of body.slice(0, objectEnd).split("\n")) {
    const line = rawLine.trim();
    if (line === "" || line.startsWith("//")) continue;
    const colon = line.indexOf(":");
    if (colon < 0) {
      throw new Error(`unparsed schema line ${JSON.stringify(line)}`);
    }
    const key = line.slice(0, colon).trim();
    const expr = line.slice(colon + 1).trim().replace(/,$/, "");
    fields.push({
      key,
      required: !expr.includes(".optional()") && !expr.includes(".default("),
    });
  }
  return fields;
}
