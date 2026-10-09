import { Hono } from "hono";
import { categories, categoryBySlug, visiblePost, visiblePosts, visiblePostsInCategory } from "./read.ts";
import { categoryPage, feedXml, homePage, notFoundPage, postPage, robotsTxt, sitemapXml } from "./render.ts";
import type { Site, SqlRead } from "./types.ts";

export type AssetReader = (pathname: string) => Promise<Response | undefined>;

export function createApp(deps: { sql: SqlRead; site: Site; now: () => Date; asset: AssetReader }): Hono {
  const app = new Hono();

  app.use("*", async (c, next) => {
    const url = new URL(c.req.url);
    if (url.pathname.length > 1 && url.pathname.endsWith("/")) {
      url.pathname = url.pathname.replace(/\/+$/, "") || "/";
      return c.redirect(`${url.pathname}${url.search}`, 301);
    }
    await next();
  });

  app.get("/styles.css", (c) => sendAsset(deps.asset, c.req.path, () => notFound(deps, c.req.path)));
  app.get("/favicon.svg", (c) => sendAsset(deps.asset, c.req.path, () => notFound(deps, c.req.path)));

  app.get("/", async (c) => {
    const posts = await visiblePosts(deps.sql, deps.now());
    return c.html(homePage(deps.site, posts));
  });

  app.get("/posts/:slug", async (c) => {
    const post = await visiblePost(deps.sql, c.req.param("slug"), deps.now());
    if (!post) return notFound(deps, c.req.path);
    return c.html(postPage(deps.site, post));
  });

  app.get("/categories/:slug", async (c) => {
    const slug = c.req.param("slug");
    const category = await categoryBySlug(deps.sql, slug);
    if (!category) return notFound(deps, c.req.path);
    const posts = await visiblePostsInCategory(deps.sql, slug, deps.now());
    return c.html(categoryPage(deps.site, category, posts));
  });

  app.get("/feed.xml", async () => {
    const posts = await visiblePosts(deps.sql, deps.now());
    return xml(feedXml(deps.site, posts), "application/rss+xml; charset=utf-8");
  });

  app.get("/sitemap.xml", async () => {
    const [listed, posts] = await Promise.all([categories(deps.sql), visiblePosts(deps.sql, deps.now())]);
    return xml(sitemapXml(deps.site, listed, posts), "application/xml; charset=utf-8");
  });

  app.get("/robots.txt", () => {
    return new Response(robotsTxt(deps.site), {
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  });

  app.notFound((c) => notFound(deps, c.req.path));
  return app;
}

function notFound(deps: { site: Site }, path: string): Response {
  return new Response(notFoundPage(deps.site, path), {
    status: 404,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

async function sendAsset(asset: AssetReader, pathname: string, missing: () => Response): Promise<Response> {
  const response = await asset(pathname);
  if (!response) return missing();
  return response;
}

function xml(body: string, contentType: string): Response {
  return new Response(body, { headers: { "content-type": contentType } });
}
