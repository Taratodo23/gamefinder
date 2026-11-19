import { useCallback, useEffect, useState } from 'react'
import {
  onAuthStateChanged,
  signInAnonymously,
  GoogleAuthProvider,
  linkWithPopup,
  signInWithCredential,
  signOut,
} from 'firebase/auth'
import { auth, configCompleta } from '../firebase'
import { mensajeFirebase } from '../services/library'

// Datos que muestra la interfaz. No se guardan en Firestore.
function perfilDe(u) {
  if (!u) return null
  const google = u.providerData.find((p) => p.providerId === 'google.com')
  return {
    anonimo: u.isAnonymous,
    nombre: google?.displayName || u.displayName || null,
    foto: google?.photoURL || u.photoURL || null,
    email: google?.email || u.email || null,
  }
}

// Cada visitante entra como usuario anónimo. Opcionalmente puede vincular
// su cuenta de Google para ver la misma biblioteca en todos sus dispositivos.
export function useAuth() {
  const [usuario, setUsuario] = useState(null)
  const [perfil, setPerfil] = useState(null)
  const [estado, setEstado] = useState(configCompleta ? 'cargando' : 'sin-config')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!configCompleta) return
    const desuscribir = onAuthStateChanged(auth, (u) => {
      if (u) {
        setUsuario(u)
        setPerfil(perfilDe(u))
        setEstado('listo')
      } else {
        signInAnonymously(auth).catch((e) => {
          setError(mensajeFirebase(e))
          setEstado('error')
        })
      }
    })
    return desuscribir
  }, [])

  // Devuelve { ok, mensaje } para que la interfaz avise el resultado
  const iniciarConGoogle = useCallback(async () => {
    const proveedor = new GoogleAuthProvider()
    try {
      // Vincular: el usuario anónimo pasa a ser de Google y conserva su uid,
      // así la biblioteca y los gustos que ya tenía no se pierden.
      const r = await linkWithPopup(auth.currentUser, proveedor)
      setPerfil(perfilDe(r.user))
      return { ok: true, mensaje: 'Listo: tu biblioteca quedó guardada en tu cuenta de Google.' }
    } catch (e) {
      if (e.code === 'auth/popup-closed-by-user' || e.code === 'auth/cancelled-popup-request') {
        return { ok: false, cancelado: true }
      }
      if (e.code === 'auth/credential-already-in-use') {
        // Esa cuenta de Google ya se usó antes: se entra a esa cuenta.
        const credencial = GoogleAuthProvider.credentialFromError(e)
        await signInWithCredential(auth, credencial)
        return {
          ok: true,
          mensaje: 'Entraste a tu cuenta. Lo que habías guardado en este navegador sin cuenta no se pasó.',
        }
      }
      if (e.code === 'auth/popup-blocked') {
        return { ok: false, mensaje: 'El navegador bloqueó la ventana de Google. Permití las ventanas emergentes y probá de nuevo.' }
      }
      if (e.code === 'auth/unauthorized-domain') {
        return { ok: false, mensaje: 'Este dominio no está autorizado en Firebase Authentication.' }
      }
      return { ok: false, mensaje: mensajeFirebase(e) }
    }
  }, [])

  // Al cerrar sesión se vuelve a un usuario anónimo nuevo (onAuthStateChanged lo crea)
  const cerrarSesion = useCallback(async () => {
    try {
      await signOut(auth)
      return { ok: true, mensaje: 'Cerraste sesión. Tu biblioteca sigue guardada en tu cuenta.' }
    } catch (e) {
      return { ok: false, mensaje: mensajeFirebase(e) }
    }
  }, [])

  return { usuario, perfil, estado, error, iniciarConGoogle, cerrarSesion }
}
