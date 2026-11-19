// Estados posibles de un juego en la biblioteca
export const ESTADOS = [
  { valor: 'pendiente', texto: 'Pendiente' },
  { valor: 'jugando', texto: 'Jugando' },
  { valor: 'completado', texto: 'Completado' },
  { valor: 'abandonado', texto: 'Abandonado' },
]

export const textoEstado = (valor) => ESTADOS.find((e) => e.valor === valor)?.texto ?? valor

export const MAX_NOTA = 500

// ===== Recomendador =====
// Los "valor" son los identificadores (slugs / ids) que usa la API de RAWG.

export const GENEROS = [
  { valor: 'action', texto: 'Acción' },
  { valor: 'adventure', texto: 'Aventura' },
  { valor: 'role-playing-games-rpg', texto: 'RPG' },
  { valor: 'shooter', texto: 'Shooter' },
  { valor: 'strategy', texto: 'Estrategia' },
  { valor: 'puzzle', texto: 'Puzzle' },
  { valor: 'platformer', texto: 'Plataformas' },
  { valor: 'racing', texto: 'Carreras' },
  { valor: 'sports', texto: 'Deportes' },
  { valor: 'simulation', texto: 'Simulación' },
  { valor: 'fighting', texto: 'Peleas' },
  { valor: 'indie', texto: 'Indie' },
  { valor: 'arcade', texto: 'Arcade' },
  { valor: 'casual', texto: 'Casual' },
  { valor: 'family', texto: 'Familiar' },
  { valor: 'massively-multiplayer', texto: 'MMO' },
]

// parent_platforms de RAWG
export const PLATAFORMAS = [
  { valor: 1, texto: 'PC' },
  { valor: 2, texto: 'PlayStation' },
  { valor: 3, texto: 'Xbox' },
  { valor: 7, texto: 'Nintendo' },
  { valor: 8, texto: 'Android' },
  { valor: 4, texto: 'iOS' },
  { valor: 5, texto: 'Mac' },
  { valor: 6, texto: 'Linux' },
]

export const EPOCAS = [
  { valor: 'cualquiera', texto: 'Me da igual', detalle: 'Cualquier año' },
  { valor: 'clasicos', texto: 'Clásicos', detalle: 'Hasta 2009' },
  { valor: 'decada', texto: '2010 – 2019', detalle: 'La década pasada' },
  { valor: 'recientes', texto: 'Recientes', detalle: 'Desde 2020' },
]

// tags de RAWG
export const MODOS = [
  { valor: 'cualquiera', texto: 'Me da igual', detalle: 'Cualquier modo' },
  { valor: 'singleplayer', texto: 'Solo', detalle: 'Un jugador' },
  { valor: 'multiplayer', texto: 'Online', detalle: 'Multijugador' },
  { valor: 'co-op', texto: 'En equipo', detalle: 'Cooperativo' },
]

export const MAX_GENEROS = 5

export const textoDe = (lista, valor) => lista.find((x) => x.valor === valor)?.texto ?? String(valor)
