import { useEffect, useRef, useState } from 'react'
import { ESTADOS, MAX_NOTA } from '../constants'
import { Estrellas, Portada } from './ui'

// Ventana para editar estado, puntuación personal y nota
export default function EditModal({ item, onGuardar, onCerrar }) {
  const [status, setStatus] = useState(item.status)
  const [rating, setRating] = useState(item.rating ?? 0)
  const [note, setNote] = useState(item.note ?? '')
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)
  const primerFoco = useRef(null)

  useEffect(() => {
    primerFoco.current?.focus()
  }, [])

  useEffect(() => {
    const alTeclear = (e) => {
      if (e.key === 'Escape' && !guardando) onCerrar()
    }
    document.addEventListener('keydown', alTeclear)
    document.body.classList.add('sin-scroll')
    return () => {
      document.removeEventListener('keydown', alTeclear)
      document.body.classList.remove('sin-scroll')
    }
  }, [onCerrar, guardando])

  const sinCambios = status === item.status && rating === (item.rating ?? 0) && note.trim() === (item.note ?? '')

  async function enviar(e) {
    e.preventDefault()
    if (!ESTADOS.some((x) => x.valor === status)) return setError('Elegí un estado.')
    if (note.length > MAX_NOTA) return setError(`La nota puede tener hasta ${MAX_NOTA} caracteres.`)
    if (!Number.isInteger(rating) || rating < 0 || rating > 5) return setError('La puntuación va de 0 a 5.')
    setError('')
    setGuardando(true)
    const r = await onGuardar(item.gameId, { status, rating, note: note.trim() })
    setGuardando(false)
    if (r.ok) onCerrar()
    else setError(r.mensaje)
  }

  return (
    <div className="modal-fondo" onMouseDown={(e) => e.target === e.currentTarget && !guardando && onCerrar()}>
      <form className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-titulo" onSubmit={enviar} noValidate>
        <header className="modal-cabecera">
          <Portada src={item.cover} alt={item.title} className="modal-portada" />
          <div>
            <p className="sobretitulo">Editar juego</p>
            <h2 id="modal-titulo">{item.title}</h2>
          </div>
          <button type="button" className="cerrar" onClick={onCerrar} aria-label="Cerrar" disabled={guardando}>
            ×
          </button>
        </header>

        <fieldset className="campo">
          <legend>Estado</legend>
          <div className="segmentado">
            {ESTADOS.map((e, i) => (
              <button
                key={e.valor}
                ref={i === 0 ? primerFoco : undefined}
                type="button"
                className={`seg seg-${e.valor} ${status === e.valor ? 'activo' : ''}`}
                aria-pressed={status === e.valor}
                onClick={() => setStatus(e.valor)}
              >
                {e.texto}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="campo">
          <legend>Tu puntuación</legend>
          <div className="fila-estrellas">
            <Estrellas valor={rating} onCambiar={setRating} tamano="grande" />
            <span className="ayuda">{rating > 0 ? `${rating} de 5` : 'Sin puntuar'}</span>
          </div>
        </fieldset>

        <label className="campo">
          <span className="legend">Nota</span>
          <textarea
            rows={4}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Qué te gustó, en qué parte quedaste, con quién jugarlo…"
            aria-invalid={note.length > MAX_NOTA}
          />
          <span className={`contador-texto ${note.length > MAX_NOTA ? 'excedido' : ''}`}>
            {note.length}/{MAX_NOTA}
          </span>
        </label>

        {error && (
          <p className="error-form" role="alert">
            {error}
          </p>
        )}

        <footer className="modal-acciones">
          <button type="button" className="btn btn-fantasma" onClick={onCerrar} disabled={guardando}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primario" disabled={guardando || sinCambios}>
            {guardando ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </footer>
      </form>
    </div>
  )
}
