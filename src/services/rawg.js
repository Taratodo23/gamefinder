// Servicio de RAWG. El navegador nunca llama a RAWG directo:
// pide a /api/rawg (función de Vercel), que agrega la API Key del servidor.
import { mockBuscar, mockDetalle, mockRecomendar, mockCapturas } from '../mocks/games'

export const USANDO_MOCK = import.meta.env.VITE_USE_MOCK_DATA === 'true'

export class RawgError extends Error {
  constructor(code, message) {
    super(message)
    this.code = code
  }
}

const MENSAJES = {
  missing_key: 'Falta configurar RAWG_API_KEY en el servidor. Mientras tanto podés activar los datos de prueba.',
  invalid_key: 'RAWG rechazó la API Key. Revisá que esté bien copiada.',
  rate_limited: 'Se alcanzó el límite de pedidos a RAWG. Esperá un momento y probá de nuevo.',
  not_found: 'No encontramos ese juego en RAWG.',
  network: 'Sin conexión. Revisá tu internet y probá de nuevo.',
  default: 'No pudimos obtener datos de RAWG. Probá de nuevo.',
}

async function pedir(params, signal) {
  let r
  try {
    r = await fetch(`/api/rawg?${new URLSearchParams(params)}`, { signal })
  } catch (e) {
    if (e.name === 'AbortError') throw e
    throw new RawgError('network', MENSAJES.network)
  }
  let datos = null
  try {
    datos = await r.json()
  } catch {
    datos = null
  }
  if (!r.ok || !datos) {
    const code = datos?.error in MENSAJES ? datos.error : 'default'
    throw new RawgError(code, MENSAJES[code])
  }
  return datos
}

// Deja solo los campos que usa la interfaz. Lo que RAWG no trae queda en null
// o en una lista vacía: la interfaz no muestra lo que falta (no se inventa).
export function normalizarJuego(g) {
  return {
    id: g.id,
    title: g.name,
    cover: g.background_image || null,
    released: g.released || null,
    rating: g.rating > 0 ? g.rating : null,
    metacritic: g.metacritic ?? null,
    genres: (g.genres || []).map((x) => x.name),
    genreSlugs: (g.genres || []).map((x) => x.slug),
    platforms: (g.parent_platforms || []).map((p) => p.platform.name),
  }
}

const DIA = 86400000
const iso = (fecha) => fecha.toISOString().slice(0, 10)

// Órdenes disponibles en Descubrir. RAWG no tiene datos de ventas,
// así que "Populares" usa la cantidad de personas que agregaron el juego.
export const ORDENES = [
  { valor: 'populares', texto: 'Populares', titulo: 'Populares en RAWG' },
  { valor: 'puntuados', texto: 'Mejor puntuados', titulo: 'Mejor puntuados por la crítica' },
  { valor: 'novedades', texto: 'Novedades', titulo: 'Novedades de los últimos 4 meses' },
  { valor: 'proximos', texto: 'Próximos', titulo: 'Próximos lanzamientos' },
]

function parametrosDeOrden(orden) {
  const hoy = new Date()
  if (orden === 'puntuados') return { ordering: '-metacritic', metacritic: '50,100' }
  if (orden === 'novedades') return { ordering: '-added', dates: `${iso(new Date(hoy - 120 * DIA))},${iso(hoy)}` }
  if (orden === 'proximos') return { ordering: '-added', dates: `${iso(new Date(+hoy + DIA))},${iso(new Date(+hoy + 540 * DIA))}` }
  return { ordering: '-added' }
}

// Búsqueda con filtros. Aunque haya texto, se ordena por popularidad:
// sin orden, RAWG prioriza coincidencias literales poco conocidas
// (buscar "gta" traía "GTA-bankrob" antes que GTA V).
export async function buscarJuegos({ texto = '', pagina = 1, orden = 'populares', genero = '', plataforma = '', signal } = {}) {
  if (USANDO_MOCK) return mockBuscar(texto, pagina)

  const params = { recurso: 'games', page: String(pagina), page_size: '20', ...parametrosDeOrden(orden) }
  if (texto.trim()) {
    params.search = texto.trim()
    params.search_precise = 'true'
  }
  if (genero) params.genres = genero
  if (plataforma) params.parent_platforms = String(plataforma)

  const datos = await pedir(params, signal)
  return {
    resultados: (datos.results || []).map(normalizarJuego),
    hayMas: Boolean(datos.next),
    total: datos.count ?? 0,
  }
}

// Detalle de un juego
export async function obtenerJuego(id, signal) {
  if (USANDO_MOCK) return mockDetalle(id)

  const g = await pedir({ recurso: 'game', id: String(id) }, signal)
  return {
    ...normalizarJuego(g),
    description: g.description_raw?.trim() || null,
    developers: (g.developers || []).map((d) => d.name),
    publishers: (g.publishers || []).map((p) => p.name),
    platformsFull: (g.platforms || []).map((p) => p.platform.name),
    playtime: g.playtime > 0 ? g.playtime : null,
    esrb: g.esrb_rating?.name || null,
    website: g.website || null,
    rawgUrl: g.slug ? `https://rawg.io/games/${g.slug}` : null,
  }
}

// Galería: capturas de pantalla del juego (las que no tienen imagen se descartan)
export async function obtenerCapturas(id, signal) {
  if (USANDO_MOCK) return mockCapturas(id)
  const datos = await pedir({ recurso: 'capturas', id: String(id) }, signal)
  return (datos.results || [])
    .filter((c) => c.image && !c.is_deleted)
    .map((c) => ({ id: c.id, imagen: c.image, ancho: c.width || null, alto: c.height || null }))
}

// Rango de fechas de cada época (formato que pide RAWG: desde,hasta)
function fechasDeEpoca(epoca) {
  const hoy = new Date().toISOString().slice(0, 10)
  if (epoca === 'clasicos') return '1970-01-01,2009-12-31'
  if (epoca === 'decada') return '2010-01-01,2019-12-31'
  if (epoca === 'recientes') return `2020-01-01,${hoy}`
  return null
}

// Recomendador: arma la consulta a RAWG a partir de los gustos del usuario
export async function recomendarJuegos(prefs, { pagina = 1, signal } = {}) {
  if (USANDO_MOCK) return mockRecomendar(prefs)

  const params = {
    recurso: 'games',
    page: String(pagina),
    page_size: '40',
    ordering: '-added',
    exclude_additions: 'true',
    genres: prefs.genres.join(','),
  }
  if (prefs.platforms.length) params.parent_platforms = prefs.platforms.join(',')
  const fechas = fechasDeEpoca(prefs.era)
  if (fechas) params.dates = fechas
  if (prefs.mode !== 'cualquiera') params.tags = prefs.mode
  if (prefs.quality) params.metacritic = '75,100'

  const datos = await pedir(params, signal)
  return {
    resultados: (datos.results || []).map(normalizarJuego),
    hayMas: Boolean(datos.next),
  }
}
