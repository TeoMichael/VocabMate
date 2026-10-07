import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv } from 'vite'
import { validateHostedApiUrl } from './src/lib/deployment.ts'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  if (process.env.VERCEL === '1') {
    const env = loadEnv(mode, process.cwd(), 'VITE_')
    validateHostedApiUrl(env.VITE_API_URL)
  }
  return { plugins: [react(), tailwindcss()] }
})
