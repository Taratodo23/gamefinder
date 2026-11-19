// Todas las operaciones con Cloud Firestore.
// Estructura: users/{uid}/library/{gameId}  (gameId = id del juego en RAWG)
import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase'

const coleccion = (uid) => collection(db, 'users', uid, 'library')
const referencia = (uid, gameId) => doc(db, 'users', uid, 'library', String(gameId))

// CONSULTAR: toda la biblioteca, lo último editado primero
export async function listarBiblioteca(uid) {
  const snap = await getDocs(query(coleccion(uid), orderBy('updatedAt', 'desc')))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

// CREAR: el id del documento es el id del juego, así no se duplica
export async function agregarJuego(uid, juego) {
  const datos = {
    gameId: juego.id,
    title: juego.title,
    cover: juego.cover ?? null,
    status: 'pendiente',
    rating: 0,
    note: '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }
  await setDoc(referencia(uid, juego.id), datos)
  return datos
}

// MODIFICAR: estado, puntuación personal y nota
export async function actualizarJuego(uid, gameId, { status, rating, note }) {
  await updateDoc(referencia(uid, gameId), {
    status,
    rating,
    note,
    updatedAt: serverTimestamp(),
  })
}

// ELIMINAR
export async function eliminarJuego(uid, gameId) {
  await deleteDoc(referencia(uid, gameId))
}

// Traduce errores de Firebase a mensajes para la interfaz
export function mensajeFirebase(e) {
  const code = e?.code || ''
  if (code === 'permission-denied') return 'Firebase rechazó la operación por permisos. Revisá las reglas de Firestore.'
  if (code === 'unavailable' || code === 'auth/network-request-failed') return 'No hay conexión con Firebase. Revisá tu internet y probá de nuevo.'
  if (code === 'failed-precondition') return 'Firestore no está listo (¿creaste la base de datos?).'
  if (code === 'not-found') return 'Ese juego ya no está en tu biblioteca.'
  if (code === 'auth/operation-not-allowed' || code === 'auth/admin-restricted-operation') {
    return 'El acceso anónimo no está habilitado en Firebase Authentication.'
  }
  if (code === 'auth/invalid-api-key' || code === 'auth/api-key-not-valid.-please-pass-a-valid-api-key.') {
    return 'La API Key de Firebase no es válida. Revisá las variables VITE_FIREBASE_*.'
  }
  return 'Algo salió mal y no se guardó. Probá de nuevo.'
}

// Convierte un Timestamp de Firestore (o Date) a Date
export function aFecha(valor) {
  if (!valor) return null
  if (typeof valor.toDate === 'function') return valor.toDate()
  return valor instanceof Date ? valor : null
}
