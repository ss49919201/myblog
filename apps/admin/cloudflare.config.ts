import { bindings, defineConfig } from "cf/config";

export default defineConfig({
  worker: {
    name: "blog-admin",
    compatibilityDate: "2026-10-08",
    entrypoint: "src/index.ts",
    env: {
      PUBLIC_WEB_URL: bindings.text("https://blog.example.com"),
      DB: bindings.d1({
        name: "blog-web",
        id: "efa4b017-66f6-40ae-9015-203f4265f300",
      }),
    },
  },
});
