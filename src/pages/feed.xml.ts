import rss from "@astrojs/rss";
import type { APIRoute } from "astro";
import { descriptionFromMarkdown } from "../lib/description";
import { publishedPosts } from "../lib/posts";
import { siteDescription, siteName } from "../lib/site";

export const GET: APIRoute = async (context) => {
  if (!context.site) {
    throw new Error("site is not set. Configure `site` in astro.config.ts or the SITE environment variable.");
  }

  const posts = await publishedPosts();
  return rss({
    title: siteName,
    description: siteDescription,
    site: context.site,
    trailingSlash: false,
    customData: "<language>ja</language>",
    items: posts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.date,
      description: descriptionFromMarkdown(post.body ?? "") || post.data.title,
      link: `/posts/${post.data.slug}`,
    })),
  });
};
