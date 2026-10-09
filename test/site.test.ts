import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { createApp } from "../src/app.ts";
import { postFields, postFieldsFromSchema } from "../src/fields.ts";
import { loadContent } from "../src/load.ts";
import { openDatabase, sqliteRead, syncDatabase } from "../src/node-db.ts";
import { readPublicFile } from "../src/public-file.ts";
import { ddlOnly, schemaChanges, schemaPlan } from "../src/schema.ts";
import { siteConfig } from "../src/site.ts";

const repoRoot = join(import.meta.dirname, "..");
const now = new Date("2026-10-09T00:00:00.000Z");

test("post fields match src/content.config.ts", () => {
  const source = readFileSync(join(repoRoot, "src/content.config.ts"), "utf8");
  assert.deepEqual(
    postFieldsFromSchema(source),
    postFields.map((field) => ({ key: field.key, required: field.required })),
  );
});

test("sqlite3def has nothing to change after apply, and again when the files already match", () => {
  const root = tempRepo({});
  const db = syncDatabase(root, join(root, "blog.sqlite"));
  db.close();
  assert.equal(schemaChanges(join(root, "blog.sqlite"), join(root, "db/schema.sql")), "");
  const desired = readFileSync(join(repoRoot, "db/schema.sql"), "utf8");
  assert.equal(ddlOnly(schemaPlan(desired, join(repoRoot, "db/schema.sql"))).trim(), "");
  const fresh = ddlOnly(schemaPlan("", join(repoRoot, "db/schema.sql")));
  assert.match(fresh, /CREATE TABLE posts/);
  assert.doesNotMatch(fresh, /\bBEGIN\b|\bCOMMIT\b/);
  rmSync(root, { recursive: true, force: true });
});

test("published posts are listed, drafts and future posts are not, and search and OGP images are gone", async () => {
  const root = tempRepo({
    "src/content/categories/news.md": category("お知らせ"),
    "src/content/categories/tech.md": category("技術"),
    "src/content/posts/hello.md": post({
      title: `It's <ok>`,
      slug: "hello",
      date: "2026-10-03",
      category: "news",
      body: "こんにちは。\n\n<script>SENTINEL</script>\n",
    }),
    "src/content/posts/later.md": post({
      title: "まだ公開しない",
      slug: "later",
      date: "2026-10-10T09:00:00+09:00",
      category: "news",
      body: "未来",
    }),
    "src/content/posts/draft.md": post({
      title: "下書き",
      slug: "draft",
      date: "2026-10-01",
      category: "tech",
      draft: true,
      body: "隠し",
    }),
    "src/content/posts/newer.md": post({
      title: "新しい記事",
      slug: "newer",
      date: "2026-10-02T15:00:00Z",
      category: "tech",
      body: "新しい本文",
    }),
    "src/content/posts/日記.md": post({
      title: "日記",
      slug: "日記",
      date: "2026-10-03T09:00:00.5",
      body: "メモ",
    }),
  });
  const db = syncDatabase(root, join(root, "blog.sqlite"));
  const app = createApp({
    sql: sqliteRead(db),
    site: siteConfig("https://example.com"),
    now: () => now,
    asset: (pathname) => readPublicFile(repoRoot, pathname),
  });

  const home = await text(app, "/");
  assert.equal(home.status, 200);
  assert.ok(home.body.indexOf(">日記<") < home.body.indexOf("It's &lt;ok&gt;"));
  assert.ok(home.body.indexOf("It's &lt;ok&gt;") < home.body.indexOf("新しい記事"));
  assert.match(home.body, /datetime="2026-10-02T15:00:00.000Z"/);
  assert.match(home.body, /2026\/10\/03/);
  assert.match(home.body, /href="\/posts\/hello"/);
  assert.match(home.body, /href="\/categories\/news"/);
  assert.match(home.body, /お知らせ/);
  assert.doesNotMatch(home.body, /まだ公開しない|下書き/);
  assert.doesNotMatch(home.body, /og:image|pagefind|action="\/search"|name="q"/);
  assert.match(home.body, /<meta property="og:title" content="myblog" \/>/);
  assert.match(home.body, /twitter:card" content="summary"/);

  const article = await text(app, "/posts/hello");
  assert.equal(article.status, 200);
  assert.match(article.body, /<h1>It's &lt;ok&gt;<\/h1>/);
  assert.match(article.body, /<p>こんにちは。<\/p>/);
  assert.doesNotMatch(article.body, /SENTINEL|<script/);
  assert.match(article.body, /<meta name="description" content="こんにちは。" \/>/);
  assert.match(article.body, /<meta property="og:type" content="article" \/>/);
  assert.doesNotMatch(article.body, /og:image/);

  const diary = await text(app, "/posts/%E6%97%A5%E8%A8%98");
  assert.equal(diary.status, 200);
  assert.match(diary.body, /datetime="2026-10-03T09:00:00.500Z"/);

  assert.equal((await text(app, "/posts/later")).status, 404);
  assert.equal((await text(app, "/posts/draft")).status, 404);
  assert.match((await text(app, "/posts/missing")).body, /ページが見つかりません/);

  const news = await text(app, "/categories/news");
  assert.match(news.body, /<h1>お知らせ<\/h1>/);
  assert.match(news.body, /It's &lt;ok&gt;/);
  assert.doesNotMatch(news.body, /新しい記事/);

  const tech = await text(app, "/categories/tech");
  assert.match(tech.body, /新しい記事/);
  assert.doesNotMatch(tech.body, /下書き/);

  const empty = tempRepo({ "src/content/categories/news.md": category("お知らせ") });
  const emptyDb = syncDatabase(empty, join(empty, "blog.sqlite"));
  const emptyApp = createApp({
    sql: sqliteRead(emptyDb),
    site: siteConfig(undefined),
    now: () => now,
    asset: async () => undefined,
  });
  assert.match((await text(emptyApp, "/categories/news")).body, /まだ記事がありません。/);
  emptyDb.close();
  rmSync(empty, { recursive: true, force: true });

  const feed = await text(app, "/feed.xml");
  assert.match(feed.headers.get("content-type") ?? "", /application\/rss\+xml/);
  assert.match(feed.body, /<title>It's &lt;ok&gt;<\/title>/);
  assert.match(feed.body, /<link>https:\/\/example.com\/posts\/hello<\/link>/);
  assert.doesNotMatch(feed.body, /下書き|まだ公開しない/);

  const sitemap = await text(app, "/sitemap.xml");
  assert.match(sitemap.body, /<loc>https:\/\/example.com\/posts\/hello<\/loc><lastmod>2026-10-03<\/lastmod>/);
  assert.match(sitemap.body, /<loc>https:\/\/example.com\/categories\/tech<\/loc>/);
  assert.doesNotMatch(sitemap.body, /\/search|\/og\/|draft|later/);

  assert.equal(
    (await text(app, "/robots.txt")).body,
    "User-agent: *\nAllow: /\n\nSitemap: https://example.com/sitemap.xml\n",
  );

  const redirected = await text(app, "/posts/hello/");
  assert.equal(redirected.status, 301);
  assert.equal(redirected.headers.get("location"), "/posts/hello");
  assert.equal((await text(app, "/search")).status, 404);
  assert.equal((await text(app, "/og/site.png")).status, 404);
  assert.equal((await text(app, "/og/posts/hello.png")).status, 404);

  const css = await text(app, "/styles.css");
  assert.equal(css.status, 200);
  assert.match(css.body, /#c4b5fd/);
  const icon = await text(app, "/favicon.svg");
  assert.match(icon.body, /^<svg/);

  const titles = await sqliteRead(db).all("SELECT title FROM posts WHERE slug = ?", ["hello"]);
  assert.equal(titleOf(titles[0]), "It's <ok>");
  db.close();

  writeFileSync(join(root, "src/content/posts/hello.md"), post({
    title: "書き直した",
    slug: "hello",
    date: "2026-10-03",
    category: "news",
    body: "二度目",
  }));
  rmSync(join(root, "src/content/posts/newer.md"));
  const again = syncDatabase(root, join(root, "blog.sqlite"));
  const rows = await sqliteRead(again).all("SELECT slug, title FROM posts ORDER BY slug", []);
  assert.deepEqual(
    rows.map((row) => `${stringField(row, "slug")}:${stringField(row, "title")}`),
    ["draft:下書き", "hello:書き直した", "later:まだ公開しない", "日記:日記"],
  );
  again.close();
  rmSync(root, { recursive: true, force: true });
});

test("the repository sample is on the home page after its publish time", async () => {
  const dir = mkdtempSync(join(tmpdir(), "myblog-sample-"));
  const db = syncDatabase(repoRoot, join(dir, "blog.sqlite"));
  const app = createApp({
    sql: sqliteRead(db),
    site: siteConfig("https://example.com"),
    now: () => now,
    asset: async () => undefined,
  });
  const home = await text(app, "/");
  assert.match(home.body, /ブログを開設した/);
  assert.match(home.body, /href="\/categories\/tech"/);
  const tech = await text(app, "/categories/tech");
  assert.match(tech.body, /技術/);
  const news = await text(app, "/categories/news");
  assert.match(news.body, /まだ記事がありません。/);
  db.close();
  rmSync(dir, { recursive: true, force: true });
});

test("bad frontmatter fails before the database is replaced", async () => {
  const root = tempRepo({
    "src/content/posts/keep.md": post({ title: "残す", slug: "keep", date: "2026-10-01", body: "本文" }),
  });
  const dbPath = join(root, "blog.sqlite");
  syncDatabase(root, dbPath).close();
  writeFileSync(join(root, "src/content/posts/keep.md"), "---\ntitle: true\nslug: keep\ndate: 2026\ndraft: yes\n---\n");
  assert.throws(() => syncDatabase(root, dbPath), /src\/content\/posts\/keep\.md: title: 文字列が必要です/);
  const kept = openDatabase(dbPath);
  const rows = await sqliteRead(kept).all("SELECT title FROM posts", []);
  assert.deepEqual(rows.map((row) => stringField(row, "title")), ["残す"]);
  kept.close();
  rmSync(root, { recursive: true, force: true });
});

test("a long description is cut at 140 characters", async () => {
  const body = `${"あ".repeat(150)}\n`;
  const root = tempRepo({
    "src/content/posts/long.md": post({ title: "長い", slug: "long", date: "2026-10-01", body }),
  });
  const db = syncDatabase(root, join(root, "blog.sqlite"));
  const app = createApp({
    sql: sqliteRead(db),
    site: siteConfig("https://example.com"),
    now: () => now,
    asset: async () => undefined,
  });
  const page = await text(app, "/posts/long");
  assert.match(page.body, new RegExp(`name="description" content="${"あ".repeat(140)}…"`));
  db.close();
  rmSync(root, { recursive: true, force: true });
});

test("load rejects a missing repository marker and an unknown key", () => {
  const bare = mkdtempSync(join(tmpdir(), "myblog-bare-"));
  assert.throws(
    () => loadContent(bare),
    /src\/content\.config\.ts が見つかりません。blog はリポジトリのルートで実行してください/,
  );
  rmSync(bare, { recursive: true, force: true });

  const root = tempRepo({
    "src/content/posts/extra.md": "---\ntitle: a\nslug: extra\ndate: 2026-10-01\nextra: 1\n---\n",
  });
  assert.throws(() => loadContent(root), /不明なキー "extra"/);
  rmSync(root, { recursive: true, force: true });
});

function tempRepo(files: Record<string, string>): string {
  const root = mkdtempSync(join(tmpdir(), "myblog-"));
  mkdirSync(join(root, "db"), { recursive: true });
  mkdirSync(join(root, "src"), { recursive: true });
  writeFileSync(join(root, "db/schema.sql"), readFileSync(join(repoRoot, "db/schema.sql")));
  writeFileSync(join(root, "src/content.config.ts"), "export {}\n");
  for (const [path, body] of Object.entries(files)) {
    const full = join(root, path);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, body);
  }
  return root;
}

function category(name: string): string {
  return `---\nname: ${JSON.stringify(name)}\n---\n`;
}

function post(opts: { title: string; slug: string; date: string; category?: string; draft?: boolean; body: string }): string {
  const lines = ["---", `title: ${JSON.stringify(opts.title)}`, `slug: ${opts.slug}`, `date: ${opts.date}`];
  if (opts.category) lines.push(`category: ${JSON.stringify(opts.category)}`);
  if (opts.draft) lines.push("draft: true");
  lines.push("---", opts.body);
  return `${lines.join("\n")}\n`;
}

function text(
  app: { request: (input: string) => Response | Promise<Response> },
  path: string,
): Promise<{ status: number; body: string; headers: Headers }> {
  return Promise.resolve(app.request(`http://example.com${path}`)).then(async (response) => ({
    status: response.status,
    body: await response.text(),
    headers: response.headers,
  }));
}

function titleOf(row: unknown): string {
  return stringField(row, "title");
}

function stringField(row: unknown, key: string): string {
  if (!isRecord(row)) assert.fail("row is not an object");
  const value = row[key];
  if (typeof value !== "string") assert.fail(`${key} is not a string`);
  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
