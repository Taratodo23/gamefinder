// Piezas chicas reutilizables de la interfaz
import { textoEstado } from '../constants'

export function Spinner({ texto }) {
  return (
    <div className="estado" role="status">
      <span className="spinner" aria-hidden="true" />
      {texto && <p>{texto}</p>}
    </div>
  )
}

export function Mensaje({ titulo, texto, tipo = 'neutro', accion }) {
  return (
    <div className={`estado estado-${tipo}`}>
      {titulo && <h3>{titulo}</h3>}
      {texto && <p>{texto}</p>}
      {accion}
    </div>
  )
}

export function BadgeEstado({ estado }) {
  return <span className={`badge badge-${estado}`}>{textoEstado(estado)}</span>
}

export function Portada({ src, alt, className = '' }) {
  if (!src) {
    return (
      <div className={`portada portada-vacia ${className}`} role="img" aria-label={`${alt} (sin portada)`}>
        <span>Sin portada</span>
      </div>
    )
  }
  return <img className={`portada ${className}`} src={src} alt={alt} loading="lazy" />
}

export function Estrellas({ valor, onCambiar, tamano = 'normal' }) {
  const editable = Boolean(onCambiar)
  return (
    <div
      className={`estrellas estrellas-${tamano}`}
      role={editable ? 'radiogroup' : 'img'}
      aria-label={editable ? 'Puntuación personal' : `${valor} de 5`}
    >
      {[1, 2, 3, 4, 5].map((n) =>
        editable ? (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={valor === n}
            aria-label={`${n} de 5`}
            className={n <= valor ? 'llena' : ''}
            onClick={() => onCambiar(valor === n ? 0 : n)}
          >
            ★
          </button>
        ) : (
          <span key={n} className={n <= valor ? 'llena' : ''} aria-hidden="true">
            ★
          </span>
        ),
      )}
    </div>
  )
}
