import { useCallback, useEffect, useState } from 'react'
import { useAuth } from './hooks/useAuth'
import { useLibrary } from './hooks/useLibrary'
import Sidebar, { BotonTema } from './components/Sidebar'
import Account from './components/Account'
import Toast from './components/Toast'
import EditModal from './components/EditModal'
import { Mensaje, Spinner } from './components/ui'
import Discover from './views/Discover'
import GameDetail from './views/GameDetail'
import Library from './views/Library'
import Recommender from './views/Recommender'

// Tema claro/oscuro: se recuerda en el navegador (es una preferencia visual,
// no un dato de la app, por eso no va a Firestore).
function temaInicial() {
  try {
    const guardado = localStorage.getItem('gf-tema')
    if (guardado === 'light' || guardado === 'dark') return guardado
  } catch {
    /* sin acceso a localStorage */
  }
  return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

function Atribucion() {
  return (
    <footer className="atribucion">
      Datos e imágenes de videojuegos provistos por{' '}
      <a href="https://rawg.io" target="_blank" rel="noopener noreferrer">RAWG</a>.
    </footer>
  )
}

export default function App() {
  const { usuario, perfil, estado: estadoAuth, error: errorAuth, iniciarConGoogle, cerrarSesion } = useAuth()
  const [toast, setToast] = useState(null)
  const avisar = useCallback((tipo, texto) => setToast({ tipo, texto, id: Date.now() }), [])
  const cerrarToast = useCallback(() => setToast(null), [])

  const biblioteca = useLibrary(usuario?.uid, avisar)

  const [tema, setTema] = useState(temaInicial)
  useEffect(() => {
    document.documentElement.dataset.theme = tema
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', tema === 'light' ? '#f4f5f7' : '#0d0e11')
    try {
      localStorage.setItem('gf-tema', tema)
    } catch {
      /* sin acceso a localStorage */
    }
  }, [tema])
  const cambiarTema = () => setTema((t) => (t === 'light' ? 'dark' : 'light'))

  async function iniciarSesion() {
    const r = await iniciarConGoogle()
    if (r.mensaje) avisar(r.ok ? 'ok' : 'error', r.mensaje)
  }

  async function salir() {
    const r = await cerrarSesion()
    if (r.mensaje) avisar(r.ok ? 'ok' : 'error', r.mensaje)
    setEditando(null)
  }

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
      <Sidebar
        vista={vista.nombre}
        onNavegar={navegar}
        cantidad={biblioteca.items.length}
        tema={tema}
        onCambiarTema={cambiarTema}
      />

      <main className="contenido">
        {/* Barra superior: cuenta (y tema en el celular) */}
        <div className="barra-superior">
          {/* Logo solo en el celular (en escritorio está en la barra lateral) */}
          <button className="marca marca-movil" onClick={() => navegar('descubrir')} aria-label="GameFinder, ir al inicio">
            <span className="marca-logo" aria-hidden="true" />
            <span>GameFinder</span>
          </button>
          <BotonTema tema={tema} onCambiar={cambiarTema} className="tema-movil" />
          <Account perfil={perfil} onIniciar={iniciarSesion} onCerrar={salir} />
        </div>

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

        {/* El recomendador también queda montado para no perder los resultados */}
        <div hidden={vista.nombre !== 'recomendador'}>
          <Recommender
            key={usuario.uid}
            uid={usuario.uid}
            porId={biblioteca.porId}
            onAbrir={abrirDetalle}
            onAgregar={biblioteca.agregar}
            puedeGuardar={puedeGuardar}
            avisar={avisar}
          />
        </div>

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
