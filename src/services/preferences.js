// Gustos del usuario para el recomendador, guardados en Firestore.
// Ruta: users/{uid}/preferences/recomendador
import { doc, getDoc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'

const referencia = (uid) => doc(db, 'users', uid, 'preferences', 'recomendador')

// CONSULTAR: devuelve los gustos guardados o null si todavía no hay
export async function leerPreferencias(uid) {
  const snap = await getDoc(referencia(uid))
  return snap.exists() ? snap.data() : null
}

// CREAR o MODIFICAR: guarda los gustos (pisa los anteriores)
export async function guardarPreferencias(uid, prefs) {
  await setDoc(referencia(uid), {
    genres: prefs.genres,
    platforms: prefs.platforms,
    era: prefs.era,
    mode: prefs.mode,
    quality: prefs.quality,
    updatedAt: serverTimestamp(),
  })
}

// ELIMINAR: borra los gustos para empezar de cero
export async function borrarPreferencias(uid) {
  await deleteDoc(referencia(uid))
}
