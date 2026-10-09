import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { marked } from "marked";
import sanitizeHtml from "sanitize-html";
import { isAlias, isMap, isScalar, parseDocument, type Document, type Scalar } from "yaml";
import { descriptionFromMarkdown } from "./description.ts";
import { postFields, type PostFieldKey } from "./fields.ts";
import type { Category, Content, Post, Slug } from "./types.ts";

const postsDir = "src/content/posts";
const categoriesDir = "src/content/categories";
const configFile = "src/content.config.ts";

type Problem = { path: string; message: string };

export function loadContent(root: string): Content {
  if (!existsSync(join(root, configFile))) {
    throw new Error(`${configFile} が見つかりません。blog はリポジトリのルートで実行してください`);
  }
  const problems: Problem[] = [];
  const categories = new Map<Slug, Category>();
  for (const path of walkMarkdown(root, categoriesDir)) {
    const id = categoryId(path);
    if (!id) {
      problems.push({
        path,
        message: "カテゴリファイルは src/content/categories/<id>.md で、id は1つのパス要素である必要があります",
      });
      continue;
    }
    const parsed = parseCategory(path, id, readFileSync(join(root, path), "utf8"));
    problems.push(...parsed.problems);
    if (parsed.category) categories.set(parsed.category.slug, parsed.category);
  }

  const posts: Post[] = [];
  const seen = new Map<string, string>();
  for (const path of walkMarkdown(root, postsDir)) {
    const parsed = parsePost(path, readFileSync(join(root, path), "utf8"));
    problems.push(...parsed.problems);
    if (!parsed.post) continue;
    const slug = parsed.post.slug;
    const expected = `${postsDir}/${slug}.md`;
    if (path !== expected) {
      problems.push({
        path,
        message: `slug ${goQuote(slug)} のファイルは ${expected} である必要があります`,
      });
    }
    const previous = seen.get(slug);
    if (previous) {
      problems.push({ path, message: `slug ${goQuote(slug)} は ${previous} でも使われています` });
    } else {
      seen.set(slug, path);
    }
    if (parsed.post.categorySlug && !categories.has(parsed.post.categorySlug)) {
      problems.push({
        path,
        message: `カテゴリ ${goQuote(parsed.post.categorySlug)} のファイル ${categoriesDir}/${parsed.post.categorySlug}.md がありません`,
      });
    }
    posts.push(parsed.post);
  }
  if (problems.length > 0) {
    problems.sort((a, b) => a.path.localeCompare(b.path) || a.message.localeCompare(b.message));
    throw new Error(problems.map((problem) => `${problem.path}: ${problem.message}`).join("\n"));
  }
  const categoryList = [...categories.values()].sort((a, b) => a.slug.localeCompare(b.slug));
  posts.sort((a, b) => a.slug.localeCompare(b.slug));
  return { categories: categoryList, posts };
}

function categoryId(path: string): Slug | undefined {
  const prefix = `${categoriesDir}/`;
  if (!path.startsWith(prefix) || !path.endsWith(".md")) return undefined;
  const id = path.slice(prefix.length, -".md".length);
  try {
    return parseSlug(id);
  } catch {
    return undefined;
  }
}

function walkMarkdown(root: string, dir: string): string[] {
  const absolute = join(root, dir);
  if (!existsSync(absolute)) return [];
  if (!statSync(absolute).isDirectory()) {
    throw new Error(`${dir} はディレクトリである必要があります`);
  }
  const found: string[] = [];
  const visit = (current: string) => {
    for (const name of readdirSync(current)) {
      if (name.startsWith(".")) continue;
      const full = join(current, name);
      if (statSync(full).isDirectory()) {
        visit(full);
        continue;
      }
      if (!name.endsWith(".md")) continue;
      found.push(relative(root, full).split(sep).join("/"));
    }
  };
  visit(absolute);
  found.sort();
  return found;
}

function parseCategory(path: string, slug: Slug, source: string): { category?: Category; problems: Problem[] } {
  const split = splitFrontmatter(source);
  if ("error" in split) return { problems: [{ path, message: split.error }] };
  const mapping = mappingFields(path, split.yaml);
  if (mapping.problems.length > 0) return { problems: mapping.problems };
  const problems: Problem[] = [];
  let name: string | undefined;
  for (const field of mapping.fields) {
    if (field.key !== "name") {
      problems.push({ path, message: `不明なキー ${goQuote(field.key)} です。カテゴリのキーは name です` });
      continue;
    }
    if (typeof field.value !== "string") {
      problems.push({ path, message: "name: 文字列が必要です" });
      continue;
    }
    name = field.value;
  }
  if (name === undefined && !problems.some((problem) => problem.message.startsWith("name:"))) {
    problems.push({ path, message: '必須のキー "name" がありません' });
  }
  if (problems.length > 0 || name === undefined) return { problems };
  return { category: { slug, name }, problems: [] };
}

function parsePost(path: string, source: string): { post?: Post; problems: Problem[] } {
  const split = splitFrontmatter(source);
  if ("error" in split) return { problems: [{ path, message: split.error }] };
  const mapping = mappingFields(path, split.yaml);
  if (mapping.problems.length > 0) return { problems: mapping.problems };
  const problems: Problem[] = [];
  const seen = new Set<string>();
  let title: string | undefined;
  let slug: Slug | undefined;
  let publishedAt: string | undefined;
  let categorySlug: Slug | null = null;
  let draft = false;
  for (const field of mapping.fields) {
    if (!isPostField(field.key)) {
      problems.push({
        path,
        message: `不明なキー ${goQuote(field.key)} です。記事のキーは ${postFields.map((item) => item.key).join("、")} です`,
      });
      continue;
    }
    if (seen.has(field.key)) {
      problems.push({ path, message: `キー ${goQuote(field.key)} が2回以上あります` });
      continue;
    }
    seen.add(field.key);
    if (field.key === "title") {
      if (typeof field.value !== "string") {
        problems.push({ path, message: "title: 文字列が必要です" });
        continue;
      }
      title = field.value;
    } else if (field.key === "slug") {
      if (typeof field.value !== "string") {
        problems.push({ path, message: "slug: 文字列が必要です" });
        continue;
      }
      try {
        slug = parseSlug(field.value);
      } catch (error) {
        problems.push({ path, message: `slug: ${error instanceof Error ? error.message : "不正です"}` });
      }
    } else if (field.key === "date") {
      if (typeof field.value !== "string") {
        problems.push({ path, message: "date: 日付が必要です" });
        continue;
      }
      try {
        publishedAt = parseDate(field.value).toISOString();
      } catch (error) {
        problems.push({ path, message: `date: ${error instanceof Error ? error.message : "不正です"}` });
      }
    } else if (field.key === "category") {
      if (typeof field.value !== "string") {
        problems.push({ path, message: "category: 文字列が必要です" });
        continue;
      }
      try {
        categorySlug = parseSlug(field.value);
      } catch (error) {
        problems.push({ path, message: `category: ${error instanceof Error ? error.message : "不正です"}` });
      }
    } else if (field.key === "draft") {
      if (typeof field.value !== "boolean") {
        problems.push({ path, message: "draft: 真偽値が必要です" });
        continue;
      }
      draft = field.value;
    } else {
      const unreachable: never = field.key;
      throw new Error(unreachable);
    }
  }
  for (const field of postFields) {
    if (field.required && !seen.has(field.key)) {
      problems.push({ path, message: `必須のキー ${goQuote(field.key)} がありません` });
    }
  }
  if (problems.length > 0 || title === undefined || slug === undefined || publishedAt === undefined) {
    return { problems };
  }
  const description = descriptionFromMarkdown(split.body) || title;
  return {
    post: {
      slug,
      title,
      publishedAt,
      categorySlug,
      draft,
      description,
      html: renderMarkdown(split.body),
    },
    problems: [],
  };
}

function isPostField(key: string): key is PostFieldKey {
  return postFields.some((field) => field.key === key);
}

type Field = { key: string; value: unknown };

function mappingFields(path: string, yamlSource: string): { fields: Field[]; problems: Problem[] } {
  const doc = parseDocument(yamlSource, { uniqueKeys: true, schema: "core" });
  if (doc.errors.length > 0) {
    const detail = doc.errors[0]?.message.split("\n")[0] ?? "YAML";
    return { fields: [], problems: [{ path, message: `frontmatter の YAML が正しくありません: ${detail}` }] };
  }
  if (doc.contents === null) return { fields: [], problems: [] };
  if (!isMap(doc.contents)) {
    return { fields: [], problems: [{ path, message: "frontmatter はキーと値の対応である必要があります" }] };
  }
  const fields: Field[] = [];
  const problems: Problem[] = [];
  for (const item of doc.contents.items) {
    const keyNode = asScalar(doc, item.key);
    if (!keyNode || typeof keyNode.value !== "string") {
      problems.push({ path, message: "キーは文字列である必要があります" });
      continue;
    }
    const valueNode = asScalar(doc, item.value);
    if (!valueNode) {
      problems.push({ path, message: `${keyNode.value}: 値が不正です` });
      continue;
    }
    fields.push({ key: keyNode.value, value: valueNode.value });
  }
  return { fields, problems };
}

function asScalar(doc: Document, node: unknown): Scalar | undefined {
  if (isAlias(node)) {
    const resolved = node.resolve(doc);
    if (!isScalar(resolved)) return undefined;
    return resolved;
  }
  if (!isScalar(node)) return undefined;
  return node;
}

function splitFrontmatter(source: string): { yaml: string; body: string } | { error: string } {
  const matched = /^(---\r?\n)([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/.exec(source) ?? /^(---\r?\n)---\r?\n([\s\S]*)$/.exec(source);
  if (!matched) {
    return { error: "YAML の frontmatter がありません。ファイルは --- の行で始め、もう一つの --- で閉じてください" };
  }
  if (matched.length === 4) return { yaml: matched[2] ?? "", body: matched[3] ?? "" };
  return { yaml: "", body: matched[2] ?? "" };
}

function parseSlug(value: string): Slug {
  if (value === "" || value === "." || value === ".." || value.includes("/") || value.includes("\\") || value.includes("\0")) {
    throw new Error(`${goQuote(value)} はスラッグではありません。空文字、.、..、/、\\、NUL は使えません`);
  }
  return value as Slug;
}

function parseDate(source: string): Date {
  const zoned = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?)(Z|[+-]\d{2}:\d{2})$/.exec(source);
  if (zoned) {
    const date = new Date(source);
    if (!Number.isNaN(date.getTime())) return date;
  }
  const naive = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})(\.\d+)?$/.exec(source);
  if (naive) {
    const date = new Date(`${naive[1]}${naive[2] ?? ""}Z`);
    if (!Number.isNaN(date.getTime())) return date;
  }
  const day = /^(\d{4})-(\d{2})-(\d{2})$/.exec(source);
  if (day) {
    const date = new Date(`${source}T00:00:00.000Z`);
    if (!Number.isNaN(date.getTime()) && date.toISOString().startsWith(source)) return date;
  }
  throw new Error(
    `日付 ${goQuote(source)} は解釈できません。2006-01-02、ゾーン無しの 2006-01-02T15:04:05（UTC）、または Z か数値オフセット付きの RFC3339 にしてください`,
  );
}

function renderMarkdown(markdown: string): string {
  const raw = marked.parse(markdown, { async: false });
  return sanitizeHtml(raw, {
    allowedTags: [
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "p",
      "br",
      "hr",
      "ul",
      "ol",
      "li",
      "blockquote",
      "pre",
      "code",
      "em",
      "strong",
      "a",
      "img",
      "table",
      "thead",
      "tbody",
      "tr",
      "th",
      "td",
      "del",
    ],
    allowedAttributes: {
      a: ["href"],
      img: ["src", "alt"],
      code: ["class"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    allowedSchemesByTag: { img: ["http", "https"] },
  });
}

function goQuote(value: string): string {
  let out = '"';
  for (const char of value) {
    if (char === "\\") out += "\\\\";
    else if (char === '"') out += '\\"';
    else if (char === "\0") out += "\\x00";
    else if (char === "\n") out += "\\n";
    else out += char;
  }
  return `${out}"`;
}
