import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import rawgHandler from './api/rawg.js'

// En desarrollo, `npm run dev` no ejecuta las funciones de Vercel.
// Este plugin atiende /api/rawg con el mismo código que usa Vercel,
// leyendo RAWG_API_KEY del .env (sin prefijo VITE_, no llega al navegador).
function rawgDevProxy(env) {
  return {
    name: 'rawg-dev-proxy',
    configureServer(server) {
      server.middlewares.use('/api/rawg', (req, res) => {
        rawgHandler(req, res, env.RAWG_API_KEY)
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), rawgDevProxy(env)],
  }
})
