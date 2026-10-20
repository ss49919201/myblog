import { bindings, defineConfig } from "cf/config";

export default defineConfig({
  worker: {
    name: "myblog-admin",
    compatibilityDate: "2026-10-08",
    entrypoint: "src/index.ts",
    env: {
      PUBLIC_WEB_URL: bindings.text("https://blog.example.com"),
      DB: bindings.d1({
        name: "myblog-web",
        id: process.env.DATABASE_ID,
      }),
    },
  },
});
