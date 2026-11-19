// Estados posibles de un juego en la biblioteca
export const ESTADOS = [
  { valor: 'pendiente', texto: 'Pendiente' },
  { valor: 'jugando', texto: 'Jugando' },
  { valor: 'completado', texto: 'Completado' },
  { valor: 'abandonado', texto: 'Abandonado' },
]

export const textoEstado = (valor) => ESTADOS.find((e) => e.valor === valor)?.texto ?? valor

export const MAX_NOTA = 500
