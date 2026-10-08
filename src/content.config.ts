import { defineCollection, reference } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const categories = defineCollection({
  loader: glob({ base: "./src/content/categories", pattern: "**/*.md" }),
  schema: z.object({
    name: z.string(),
  }),
});

const posts = defineCollection({
  loader: glob({ base: "./src/content/posts", pattern: "**/*.md" }),
  schema: z.object({
    title: z.string(),
    slug: z.string().min(1),
    date: z.coerce.date(),
    category: reference("categories").optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { categories, posts };
