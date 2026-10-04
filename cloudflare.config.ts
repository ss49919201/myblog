import { bindings, defineConfig, defineWorker } from "cf/config";
import pkg from "./package.json" with { type: "json" };

export default defineConfig({
  worker: defineWorker({
    name: "myblog",
    entrypoint: "vinext/server/fetch-handler",
    compatibilityDate: "2026-10-03",
    compatibilityFlags: ["nodejs_compat"],
    assets: { notFoundHandling: "none" },
    env: {
      ASSETS: bindings.assets(),
      IMAGES: bindings.images(),
      DB: bindings.d1({ name: "myblog", id: pkg.config.d1DatabaseId }),
    },
  }),
});
