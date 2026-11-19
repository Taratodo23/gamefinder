import { useCallback, useState } from 'react'
import { useAuth } from './hooks/useAuth'
import { useLibrary } from './hooks/useLibrary'
import Sidebar from './components/Sidebar'
import Toast from './components/Toast'
import EditModal from './components/EditModal'
import { Mensaje, Spinner } from './components/ui'
import Discover from './views/Discover'
import GameDetail from './views/GameDetail'
import Library from './views/Library'

function Atribucion() {
  return (
    <footer className="atribucion">
      Datos e imágenes de videojuegos provistos por{' '}
      <a href="https://rawg.io" target="_blank" rel="noopener noreferrer">RAWG</a>.
    </footer>
  )
}

export default function App() {
  const { usuario, estado: estadoAuth, error: errorAuth } = useAuth()
  const [toast, setToast] = useState(null)
  const avisar = useCallback((tipo, texto) => setToast({ tipo, texto, id: Date.now() }), [])
  const cerrarToast = useCallback(() => setToast(null), [])

  const biblioteca = useLibrary(usuario?.uid, avisar)

  // Navegación: { nombre: 'descubrir' | 'biblioteca' | 'detalle', gameId, desde }
  const [vista, setVista] = useState({ nombre: 'descubrir' })
  const [editando, setEditando] = useState(null)
  const cerrarEdicion = useCallback(() => setEditando(null), [])

  function navegar(nombre) {
    setVista({ nombre })
    window.scrollTo({ top: 0 })
  }

  function abrirDetalle(gameId) {
    setVista((v) => ({ nombre: 'detalle', gameId, desde: v.nombre === 'detalle' ? v.desde : v.nombre }))
    window.scrollTo({ top: 0 })
  }

  if (estadoAuth === 'sin-config') {
    return (
      <main className="pantalla-completa">
        <Mensaje
          tipo="error"
          titulo="Falta configurar Firebase"
          texto="No se encontraron las variables VITE_FIREBASE_*. Copiá .env.example como .env, completá los valores y reiniciá npm run dev. En Vercel, cargalas en Settings → Environment Variables y hacé Redeploy."
        />
      </main>
    )
  }

  if (estadoAuth === 'error') {
    return (
      <main className="pantalla-completa">
        <Mensaje tipo="error" titulo="No pudimos conectar con Firebase" texto={errorAuth} />
      </main>
    )
  }

  if (estadoAuth === 'cargando') {
    return (
      <main className="pantalla-completa">
        <Spinner texto="Conectando…" />
      </main>
    )
  }

  const puedeGuardar = !biblioteca.cargando && !biblioteca.error

  return (
    <div className="app">
      <Sidebar vista={vista.nombre} onNavegar={navegar} cantidad={biblioteca.items.length} />

      <main className="contenido">
        {/* Descubrir queda montado para no perder la búsqueda al volver del detalle */}
        <div hidden={vista.nombre !== 'descubrir'}>
          <Discover
            porId={biblioteca.porId}
            onAbrir={abrirDetalle}
            onAgregar={biblioteca.agregar}
            puedeGuardar={puedeGuardar}
          />
        </div>

        {vista.nombre === 'detalle' && (
          <GameDetail
            key={vista.gameId}
            gameId={vista.gameId}
            guardado={biblioteca.porId.get(String(vista.gameId))}
            onVolver={() => navegar(vista.desde || 'descubrir')}
            onAgregar={biblioteca.agregar}
            onEditar={setEditando}
            puedeGuardar={puedeGuardar}
          />
        )}

        {vista.nombre === 'biblioteca' && (
          <Library
            items={biblioteca.items}
            cargando={biblioteca.cargando}
            error={biblioteca.error}
            onRecargar={biblioteca.recargar}
            onAbrir={abrirDetalle}
            onEditar={setEditando}
            onEliminar={biblioteca.eliminar}
            onIrADescubrir={() => navegar('descubrir')}
          />
        )}

        <Atribucion />
      </main>

      {editando && (
        <EditModal
          key={editando.id}
          item={editando}
          onGuardar={biblioteca.actualizar}
          onCerrar={cerrarEdicion}
        />
      )}

      <Toast toast={toast} onCerrar={cerrarToast} />
    </div>
  )
}
