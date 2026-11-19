import { useState } from 'react'
import { Portada } from './ui'

// Tarjeta de un resultado de RAWG en Descubrir
export default function GameCard({ juego, enBiblioteca, onAbrir, onAgregar, puedeGuardar }) {
  const [guardando, setGuardando] = useState(false)

  async function agregar() {
    setGuardando(true)
    await onAgregar(juego)
    setGuardando(false)
  }

  return (
    <article className="game-card">
      <button className="game-card-link" onClick={() => onAbrir(juego.id)} aria-label={`Ver detalle de ${juego.title}`}>
        <div className="game-card-portada">
          <Portada src={juego.cover} alt={juego.title} />
          {juego.metacritic && (
            <span className="metacritic" title="Puntaje Metacritic">{juego.metacritic}</span>
          )}
        </div>
        <div className="game-card-info">
          <h3>{juego.title}</h3>
          <div className="game-card-meta">
            {juego.genres.length > 0 && <span>{juego.genres.slice(0, 2).join(' · ')}</span>}
            {juego.rating && <span className="rating-rawg">★ {juego.rating.toFixed(1)}</span>}
          </div>
          {juego.platforms.length > 0 && (
            <ul className="plataformas" aria-label="Plataformas">
              {juego.platforms.slice(0, 4).map((p) => (
                <li key={p}>{p}</li>
              ))}
              {juego.platforms.length > 4 && <li>+{juego.platforms.length - 4}</li>}
            </ul>
          )}
        </div>
      </button>

      <button
        className={`game-card-agregar ${enBiblioteca ? 'en-biblioteca' : ''}`}
        onClick={agregar}
        disabled={enBiblioteca || guardando || !puedeGuardar}
        aria-label={enBiblioteca ? `${juego.title} ya está en tu biblioteca` : `Agregar ${juego.title} a la biblioteca`}
        title={enBiblioteca ? 'En tu biblioteca' : 'Agregar a la biblioteca'}
      >
        {guardando ? <span className="spinner spinner-mini" aria-hidden="true" /> : enBiblioteca ? '✓' : '+'}
      </button>
    </article>
  )
}
