import { bindings, defineConfig } from "cf/config";

export default defineConfig({
  worker: {
    name: "blog-web",
    compatibilityDate: "2026-10-08",
    entrypoint: "src/index.ts",
    env: {
      DB: bindings.d1({
        name: "blog-web",
        id: process.env.DATABASE_ID,
      }),
    },
  },
});
