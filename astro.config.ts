import sitemap from "@astrojs/sitemap";
import { satteri } from "@astrojs/markdown-satteri";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import { satteriSanitize } from "satteri-sanitize";

// Canonical URLs, the sitemap, and the RSS feed use this origin.
// Set SITE at build time once the production hostname is known.
const site = process.env.SITE ?? "https://example.com";

export default defineConfig({
  site,
  // Directory output is served both with and without a trailing slash.
  // Pagefind links to the directory form (`/posts/hello-world/`).
  trailingSlash: "ignore",
  compressHTML: true,
  integrations: [
    sitemap({
      serialize(item) {
        const url = new URL(item.url);
        if (url.pathname !== "/") url.pathname = url.pathname.replace(/\/$/, "");
        item.url = url.href;
        return item;
      },
    }),
  ],
  markdown: {
    processor: satteri({
      hastPlugins: [satteriSanitize()],
    }),
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
