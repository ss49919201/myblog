import { cloudflare } from '@cloudflare/vite-plugin'
import { defineConfig } from 'vite'

const persistStatePath = process.env.BLOG_PERSIST_STATE

export default defineConfig({
  plugins: [
    cloudflare(
      persistStatePath
        ? { persistState: { path: persistStatePath } }
        : undefined,
    ),
  ],
})
