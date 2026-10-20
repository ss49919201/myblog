import { cloudflare } from '@cloudflare/vite-plugin'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const persistStatePath = process.env.MYBLOG_PERSIST_STATE

export default defineConfig({
  plugins: [
    react(),
    cloudflare(
      persistStatePath
        ? { persistState: { path: persistStatePath } }
        : undefined,
    ),
  ],
})
