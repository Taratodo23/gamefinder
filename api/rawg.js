// Función serverless (Vercel) que hace de intermediaria con RAWG.
// La API Key vive solo acá (variable RAWG_API_KEY), nunca en el navegador.
// Uso desde el frontend:
//   /api/rawg?recurso=games&search=zelda&page=1
//   /api/rawg?recurso=game&id=3498

const BASE = 'https://api.rawg.io/api'
const PARAMS_PERMITIDOS = [
  'search', 'search_precise', 'page', 'page_size', 'ordering',
  'genres', 'platforms', 'parent_platforms', 'dates', 'tags', 'metacritic', 'exclude_additions',
]

function responder(res, status, cuerpo, cache) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  if (cache) res.setHeader('Cache-Control', cache)
  res.end(JSON.stringify(cuerpo))
}

export default async function handler(req, res, claveLocal) {
  const key = claveLocal || process.env.RAWG_API_KEY

  if (req.method !== 'GET') return responder(res, 405, { error: 'method_not_allowed' })
  if (!key) return responder(res, 503, { error: 'missing_key' })

  const entrada = new URL(req.url, 'http://localhost').searchParams
  const recurso = entrada.get('recurso')
  let destino

  // Solo se permiten dos recursos: así la función no queda como proxy abierto.
  if (recurso === 'games') {
    destino = new URL(`${BASE}/games`)
    for (const p of PARAMS_PERMITIDOS) {
      const v = entrada.get(p)
      if (v) destino.searchParams.set(p, v.slice(0, 100))
    }
    const tam = Number(destino.searchParams.get('page_size') || 20)
    destino.searchParams.set('page_size', String(Math.min(Math.max(tam, 1), 40)))
  } else if (recurso === 'game') {
    const id = entrada.get('id') || ''
    if (!/^\d{1,10}$/.test(id)) return responder(res, 400, { error: 'bad_request' })
    destino = new URL(`${BASE}/games/${id}`)
  } else {
    return responder(res, 400, { error: 'bad_request' })
  }

  destino.searchParams.set('key', key)

  try {
    const r = await fetch(destino)
    if (r.status === 404) return responder(res, 404, { error: 'not_found' })
    if (r.status === 429) return responder(res, 429, { error: 'rate_limited' })
    if (r.status === 401 || r.status === 403) return responder(res, 502, { error: 'invalid_key' })
    if (!r.ok) return responder(res, 502, { error: 'upstream_error', status: r.status })
    const datos = await r.json()
    // Cache en el CDN de Vercel: reduce pedidos a RAWG (el plan gratuito tiene límite mensual).
    return responder(res, 200, datos, 's-maxage=3600, stale-while-revalidate=86400')
  } catch {
    return responder(res, 502, { error: 'upstream_unreachable' })
  }
}
