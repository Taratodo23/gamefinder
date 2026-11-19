import { useEffect, useRef, useState } from 'react'
import { buscarJuegos, USANDO_MOCK } from '../services/rawg'
import GameCard from '../components/GameCard'
import { Mensaje } from '../components/ui'

const ESPERA_BUSQUEDA = 450 // ms sin teclear antes de buscar

export default function Discover({ porId, onAbrir, onAgregar, puedeGuardar }) {
  const [texto, setTexto] = useState('')
  const [consulta, setConsulta] = useState('')
  const [resultados, setResultados] = useState([])
  const [pagina, setPagina] = useState(1)
  const [hayMas, setHayMas] = useState(false)
  const [total, setTotal] = useState(0)
  const [estado, setEstado] = useState('cargando') // cargando | listo | error
  const [cargandoMas, setCargandoMas] = useState(false)
  const [error, setError] = useState('')
  const [reintento, setReintento] = useState(0)
  const controlador = useRef(null)

  // Espera a que el usuario deje de escribir
  useEffect(() => {
    const t = setTimeout(() => setConsulta(texto.trim()), ESPERA_BUSQUEDA)
    return () => clearTimeout(t)
  }, [texto])

  // Primera página de cada búsqueda
  useEffect(() => {
    controlador.current?.abort()
    const c = new AbortController()
    controlador.current = c
    setEstado('cargando')
    setError('')
    buscarJuegos({ texto: consulta, pagina: 1, signal: c.signal })
      .then((r) => {
        setResultados(r.resultados)
        setHayMas(r.hayMas)
        setTotal(r.total)
        setPagina(1)
        setEstado('listo')
      })
      .catch((e) => {
        if (e.name === 'AbortError') return
        setError(e.message)
        setEstado('error')
      })
    return () => c.abort()
  }, [consulta, reintento])

  async function cargarMas() {
    setCargandoMas(true)
    try {
      const r = await buscarJuegos({ texto: consulta, pagina: pagina + 1 })
      setResultados((xs) => {
        const vistos = new Set(xs.map((x) => x.id))
        return [...xs, ...r.resultados.filter((x) => !vistos.has(x.id))]
      })
      setHayMas(r.hayMas)
      setPagina((p) => p + 1)
    } catch (e) {
      setError(e.message)
    } finally {
      setCargandoMas(false)
    }
  }

  function enviar(e) {
    e.preventDefault()
    setConsulta(texto.trim())
  }

  const titulo = consulta ? `Resultados para “${consulta}”` : 'Populares en RAWG'

  return (
    <section className="vista" aria-labelledby="titulo-descubrir">
      <header className="vista-cabecera">
        <div>
          <p className="sobretitulo">Descubrir</p>
          <h1 id="titulo-descubrir">¿A qué vas a jugar ahora?</h1>
        </div>
        <form className="buscador" role="search" onSubmit={enviar}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="11" cy="11" r="6.5" />
            <path d="M16 16l4.5 4.5" />
          </svg>
          <input
            type="search"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Buscá un juego por nombre"
            aria-label="Buscar juegos"
            maxLength={80}
          />
          {texto && (
            <button type="button" className="limpiar" onClick={() => setTexto('')} aria-label="Borrar búsqueda">
              ×
            </button>
          )}
        </form>
      </header>

      {USANDO_MOCK && (
        <div className="aviso-mock" role="note">
          <strong>Datos de prueba.</strong> Estás viendo juegos ficticios (VITE_USE_MOCK_DATA=true). No son datos de RAWG.
        </div>
      )}

      <div className="seccion-titulo">
        <h2>{titulo}</h2>
        {estado === 'listo' && total > 0 && (
          <span className="ayuda">{total.toLocaleString('es-AR')} juegos</span>
        )}
      </div>

      {estado === 'cargando' && (
        <div className="grilla" aria-busy="true" aria-label="Cargando juegos">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="esqueleto" />
          ))}
        </div>
      )}

      {estado === 'error' && (
        <Mensaje
          tipo="error"
          titulo="No pudimos cargar los juegos"
          texto={error}
          accion={
            <button className="btn btn-secundario" onClick={() => setReintento((n) => n + 1)}>
              Reintentar
            </button>
          }
        />
      )}

      {estado === 'listo' && resultados.length === 0 && (
        <Mensaje
          titulo="Sin resultados"
          texto={`No encontramos juegos para “${consulta}”. Probá con otro nombre o revisá cómo está escrito.`}
        />
      )}

      {estado === 'listo' && resultados.length > 0 && (
        <>
          <div className="grilla">
            {resultados.map((j) => (
              <GameCard
                key={j.id}
                juego={j}
                enBiblioteca={porId.has(String(j.id))}
                onAbrir={onAbrir}
                onAgregar={onAgregar}
                puedeGuardar={puedeGuardar}
              />
            ))}
          </div>
          {error && <p className="error-form centro">{error}</p>}
          {hayMas && (
            <div className="centro">
              <button className="btn btn-secundario" onClick={cargarMas} disabled={cargandoMas}>
                {cargandoMas ? 'Cargando…' : 'Cargar más'}
              </button>
            </div>
          )}
        </>
      )}
    </section>
  )
}
