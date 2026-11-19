import { useEffect, useState } from 'react'
import { obtenerJuego } from '../services/rawg'
import { BadgeEstado, Estrellas, Mensaje, Portada, Spinner } from '../components/ui'

const formatoFecha = new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })

function fechaLanzamiento(iso) {
  if (!iso) return null
  const [a, m, d] = iso.split('-').map(Number)
  return formatoFecha.format(new Date(a, m - 1, d))
}

export default function GameDetail({ gameId, guardado, onVolver, onAgregar, onEditar, puedeGuardar }) {
  const [juego, setJuego] = useState(null)
  const [estado, setEstado] = useState('cargando')
  const [error, setError] = useState('')
  const [reintento, setReintento] = useState(0)
  const [agregando, setAgregando] = useState(false)
  const [descripcionCompleta, setDescripcionCompleta] = useState(false)

  useEffect(() => {
    const c = new AbortController()
    setEstado('cargando')
    setDescripcionCompleta(false)
    obtenerJuego(gameId, c.signal)
      .then((j) => {
        setJuego(j)
        setEstado('listo')
      })
      .catch((e) => {
        if (e.name === 'AbortError') return
        setError(e.message)
        setEstado('error')
      })
    return () => c.abort()
  }, [gameId, reintento])

  async function agregar() {
    setAgregando(true)
    await onAgregar(juego)
    setAgregando(false)
  }

  if (estado === 'cargando') {
    return (
      <section className="vista">
        <button className="volver" onClick={onVolver}>← Volver</button>
        <Spinner texto="Cargando ficha del juego…" />
      </section>
    )
  }

  if (estado === 'error') {
    return (
      <section className="vista">
        <button className="volver" onClick={onVolver}>← Volver</button>
        <Mensaje
          tipo="error"
          titulo="No pudimos abrir este juego"
          texto={error}
          accion={
            <button className="btn btn-secundario" onClick={() => setReintento((n) => n + 1)}>
              Reintentar
            </button>
          }
        />
      </section>
    )
  }

  const datos = [
    ['Lanzamiento', fechaLanzamiento(juego.released)],
    ['Géneros', juego.genres.join(', ')],
    ['Plataformas', juego.platformsFull.join(', ')],
    ['Desarrollo', juego.developers.join(', ')],
    ['Distribución', juego.publishers.join(', ')],
    ['Tiempo de juego promedio', juego.playtime ? `${juego.playtime} h` : null],
    ['Clasificación ESRB', juego.esrb],
  ].filter(([, v]) => v)

  const descripcionLarga = (juego.description?.length ?? 0) > 600
  const descripcion =
    descripcionLarga && !descripcionCompleta ? `${juego.description.slice(0, 600).trimEnd()}…` : juego.description

  return (
    <section className="vista detalle" aria-labelledby="titulo-detalle">
      <button className="volver" onClick={onVolver}>← Volver</button>

      <div className="detalle-hero">
        <Portada src={juego.cover} alt={juego.title} className="detalle-portada" />
        <div className="detalle-hero-texto">
          <h1 id="titulo-detalle">{juego.title}</h1>
          <div className="detalle-puntajes">
            {juego.rating && (
              <span className="chip">
                <strong>★ {juego.rating.toFixed(1)}</strong> en RAWG
              </span>
            )}
            {juego.metacritic && (
              <span className="chip">
                <strong>{juego.metacritic}</strong> Metacritic
              </span>
            )}
          </div>

          <div className="detalle-biblioteca">
            {guardado ? (
              <>
                <div className="detalle-guardado">
                  <span className="ayuda">En tu biblioteca</span>
                  <BadgeEstado estado={guardado.status} />
                  {guardado.rating > 0 && <Estrellas valor={guardado.rating} tamano="chica" />}
                </div>
                <button className="btn btn-secundario" onClick={() => onEditar(guardado)}>
                  Editar estado y nota
                </button>
              </>
            ) : (
              <button className="btn btn-primario" onClick={agregar} disabled={agregando || !puedeGuardar}>
                {agregando ? 'Agregando…' : '+ Agregar a mi biblioteca'}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="detalle-cuerpo">
        <div className="detalle-descripcion">
          <h2>Sobre el juego</h2>
          {descripcion ? (
            <>
              <p>{descripcion}</p>
              {descripcionLarga && (
                <button className="link" onClick={() => setDescripcionCompleta((v) => !v)}>
                  {descripcionCompleta ? 'Ver menos' : 'Leer más'}
                </button>
              )}
            </>
          ) : (
            <p className="ayuda">RAWG no tiene descripción para este juego.</p>
          )}
        </div>

        {datos.length > 0 && (
          <dl className="detalle-datos">
            {datos.map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
            {(juego.website || juego.rawgUrl) && (
              <div>
                <dt>Enlaces</dt>
                <dd className="enlaces">
                  {juego.website && (
                    <a href={juego.website} target="_blank" rel="noopener noreferrer">Sitio oficial ↗</a>
                  )}
                  {juego.rawgUrl && (
                    <a href={juego.rawgUrl} target="_blank" rel="noopener noreferrer">Ver en RAWG ↗</a>
                  )}
                </dd>
              </div>
            )}
          </dl>
        )}
      </div>
    </section>
  )
}
