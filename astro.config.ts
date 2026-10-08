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
  trailingSlash: "never",
  compressHTML: true,
  integrations: [sitemap()],
  markdown: {
    processor: satteri({
      hastPlugins: [satteriSanitize()],
    }),
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
