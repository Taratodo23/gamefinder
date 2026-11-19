import { useEffect, useRef, useState } from 'react'
import { buscarJuegos, USANDO_MOCK, ORDENES } from '../services/rawg'
import { GENEROS, PLATAFORMAS, textoDe } from '../constants'
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
  const [orden, setOrden] = useState('populares')
  const [genero, setGenero] = useState('')
  const [plataforma, setPlataforma] = useState('')
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
    buscarJuegos({ texto: consulta, pagina: 1, orden, genero, plataforma, signal: c.signal })
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
  }, [consulta, orden, genero, plataforma, reintento])

  async function cargarMas() {
    setCargandoMas(true)
    try {
      const r = await buscarJuegos({ texto: consulta, pagina: pagina + 1, orden, genero, plataforma })
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

  const ordenActual = ORDENES.find((o) => o.valor === orden)
  const titulo = consulta ? `Resultados para “${consulta}”` : ordenActual.titulo
  const hayFiltros = genero || plataforma || orden !== 'populares'

  function limpiarFiltros() {
    setOrden('populares')
    setGenero('')
    setPlataforma('')
  }

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

      <div className="barra-filtros">
        <div className="filtros" role="tablist" aria-label="Ordenar juegos">
          {ORDENES.map((o) => (
            <button
              key={o.valor}
              role="tab"
              aria-selected={orden === o.valor}
              className={`filtro ${orden === o.valor ? 'activo' : ''}`}
              onClick={() => setOrden(o.valor)}
            >
              {o.texto}
            </button>
          ))}
        </div>
        <div className="selects">
          <label className="select">
            <span className="sr-only">Género</span>
            <select value={genero} onChange={(e) => setGenero(e.target.value)}>
              <option value="">Género: todos</option>
              {GENEROS.map((g) => (
                <option key={g.valor} value={g.valor}>{g.texto}</option>
              ))}
            </select>
          </label>
          <label className="select">
            <span className="sr-only">Plataforma</span>
            <select value={plataforma} onChange={(e) => setPlataforma(e.target.value)}>
              <option value="">Plataforma: todas</option>
              {PLATAFORMAS.map((p) => (
                <option key={p.valor} value={p.valor}>{p.texto}</option>
              ))}
            </select>
          </label>
          {hayFiltros && (
            <button className="btn btn-fantasma btn-chico" onClick={limpiarFiltros}>Limpiar</button>
          )}
        </div>
      </div>

      <div className="seccion-titulo">
        <h2>
          {titulo}
          {(genero || plataforma) && (
            <span className="filtros-activos">
              {[genero && textoDe(GENEROS, genero), plataforma && textoDe(PLATAFORMAS, Number(plataforma))].filter(Boolean).join(' · ')}
            </span>
          )}
        </h2>
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
          texto={
            consulta
              ? `No encontramos juegos para “${consulta}”${hayFiltros ? ' con estos filtros' : ''}. Probá con otro nombre${hayFiltros ? ' o limpiá los filtros' : ''}.`
              : 'No hay juegos con esta combinación de filtros. Probá con otra.'
          }
          accion={hayFiltros ? <button className="btn btn-secundario" onClick={limpiarFiltros}>Limpiar filtros</button> : null}
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
