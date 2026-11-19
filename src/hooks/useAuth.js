import { useEffect, useState } from 'react'
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth'
import { auth, configCompleta } from '../firebase'
import { mensajeFirebase } from '../services/library'

// Identifica a cada visitante con un usuario anónimo de Firebase.
export function useAuth() {
  const [usuario, setUsuario] = useState(null)
  const [estado, setEstado] = useState(configCompleta ? 'cargando' : 'sin-config')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!configCompleta) return
    const desuscribir = onAuthStateChanged(auth, (u) => {
      if (u) {
        setUsuario(u)
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

  return { usuario, estado, error }
}
