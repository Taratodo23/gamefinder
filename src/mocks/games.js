// DATOS DE PRUEBA (no son juegos reales).
// Se usan solo con VITE_USE_MOCK_DATA=true para desarrollar sin API Key de RAWG.
// Para reemplazarlos alcanza con poner VITE_USE_MOCK_DATA=false.

const MOCKS = [
  { id: 900001, title: 'Juego de prueba: Aventura', genres: ['Aventura'], platforms: ['PC'], released: null },
  { id: 900002, title: 'Juego de prueba: Estrategia', genres: ['Estrategia'], platforms: ['PC', 'Mac'], released: null },
  { id: 900003, title: 'Juego de prueba: Carreras', genres: ['Carreras'], platforms: ['PlayStation'], released: null },
  { id: 900004, title: 'Juego de prueba: Plataformas', genres: ['Plataformas'], platforms: ['Nintendo'], released: null },
  { id: 900005, title: 'Juego de prueba: Rol', genres: ['RPG'], platforms: ['PC', 'Xbox'], released: null },
  { id: 900006, title: 'Juego de prueba: Puzzle', genres: ['Puzzle'], platforms: ['iOS', 'Android'], released: null },
].map((m) => ({ ...m, genreSlugs: [], cover: null, rating: null, metacritic: null }))

const esperar = (ms) => new Promise((r) => setTimeout(r, ms))

export async function mockBuscar(texto = '') {
  await esperar(400)
  const t = texto.trim().toLowerCase()
  const resultados = t ? MOCKS.filter((m) => m.title.toLowerCase().includes(t)) : MOCKS
  return { resultados, hayMas: false, total: resultados.length }
}

export async function mockDetalle(id) {
  await esperar(300)
  const m = MOCKS.find((x) => x.id === Number(id))
  if (!m) {
    const e = new Error('No encontramos ese juego.')
    e.code = 'not_found'
    throw e
  }
  return {
    ...m,
    description: 'Ficha de prueba: este juego no existe. Activá RAWG para ver datos reales.',
    developers: [],
    publishers: [],
    platformsFull: m.platforms,
    playtime: null,
    esrb: null,
    website: null,
    rawgUrl: null,
  }
}

export async function mockRecomendar() {
  await esperar(500)
  return { resultados: MOCKS, hayMas: false }
}

// Los juegos de prueba no tienen capturas
export async function mockCapturas() {
  await esperar(300)
  return []
}
