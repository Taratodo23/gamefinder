import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  listarBiblioteca,
  agregarJuego,
  actualizarJuego,
  eliminarJuego,
  mensajeFirebase,
  aFecha,
} from '../services/library'

// Estado de la biblioteca + operaciones. Cada operación espera la
// confirmación de Firestore antes de cambiar la pantalla: si falla,
// la interfaz no muestra el cambio y avisa el error.
export function useLibrary(uid, avisar) {
  const [items, setItems] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  const cargar = useCallback(async () => {
    if (!uid) return
    setCargando(true)
    setError('')
    try {
      setItems(await listarBiblioteca(uid))
    } catch (e) {
      setError(mensajeFirebase(e))
    } finally {
      setCargando(false)
    }
  }, [uid])

  useEffect(() => {
    cargar()
  }, [cargar])

  const porId = useMemo(() => new Map(items.map((i) => [String(i.gameId), i])), [items])

  const agregar = useCallback(
    async (juego) => {
      if (porId.has(String(juego.id))) {
        avisar('info', `“${juego.title}” ya está en tu biblioteca.`)
        return false
      }
      try {
        const datos = await agregarJuego(uid, juego)
        const ahora = new Date()
        setItems((xs) => [{ ...datos, id: String(juego.id), createdAt: ahora, updatedAt: ahora }, ...xs])
        avisar('ok', `“${juego.title}” se agregó a tu biblioteca.`)
        return true
      } catch (e) {
        avisar('error', mensajeFirebase(e))
        return false
      }
    },
    [uid, porId, avisar],
  )

  const actualizar = useCallback(
    async (gameId, cambios) => {
      try {
        await actualizarJuego(uid, gameId, cambios)
        const ahora = new Date()
        setItems((xs) =>
          [...xs.map((x) => (String(x.gameId) === String(gameId) ? { ...x, ...cambios, updatedAt: ahora } : x))]
            .sort((a, b) => (aFecha(b.updatedAt)?.getTime() ?? 0) - (aFecha(a.updatedAt)?.getTime() ?? 0)),
        )
        avisar('ok', 'Cambios guardados.')
        return { ok: true }
      } catch (e) {
        const mensaje = mensajeFirebase(e)
        avisar('error', mensaje)
        return { ok: false, mensaje }
      }
    },
    [uid, avisar],
  )

  const eliminar = useCallback(
    async (item) => {
      try {
        await eliminarJuego(uid, item.gameId)
        setItems((xs) => xs.filter((x) => String(x.gameId) !== String(item.gameId)))
        avisar('ok', `“${item.title}” se eliminó de tu biblioteca.`)
        return true
      } catch (e) {
        avisar('error', mensajeFirebase(e))
        return false
      }
    },
    [uid, avisar],
  )

  return { items, porId, cargando, error, recargar: cargar, agregar, actualizar, eliminar }
}
