import { useState } from 'react'
import { BadgeEstado, Estrellas, Portada } from './ui'
import { aFecha } from '../services/library'

const formato = new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })

// Tarjeta de un juego guardado en Mi biblioteca
export default function LibraryCard({ item, onAbrir, onEditar, onEliminar }) {
  const [confirmando, setConfirmando] = useState(false)
  const [eliminando, setEliminando] = useState(false)
  const actualizado = aFecha(item.updatedAt)

  async function eliminar() {
    setEliminando(true)
    const ok = await onEliminar(item)
    if (!ok) {
      setEliminando(false)
      setConfirmando(false)
    }
  }

  return (
    <article className={`lib-card ${eliminando ? 'saliendo' : ''}`}>
      <button className="lib-card-portada" onClick={() => onAbrir(item.gameId)} aria-label={`Ver detalle de ${item.title}`}>
        <Portada src={item.cover} alt={item.title} />
      </button>

      <div className="lib-card-cuerpo">
        <div className="lib-card-top">
          <BadgeEstado estado={item.status} />
          {item.rating > 0 && <Estrellas valor={item.rating} tamano="chica" />}
        </div>
        <h3>{item.title}</h3>
        {item.note ? <p className="nota">{item.note}</p> : <p className="nota nota-vacia">Sin nota</p>}
        {actualizado && <p className="fecha">Actualizado el {formato.format(actualizado)}</p>}

        <div className="lib-card-acciones">
          {confirmando ? (
            <>
              <span className="pregunta">¿Eliminar de tu biblioteca?</span>
              <button className="btn btn-peligro" onClick={eliminar} disabled={eliminando}>
                {eliminando ? 'Eliminando…' : 'Eliminar'}
              </button>
              <button className="btn btn-fantasma" onClick={() => setConfirmando(false)} disabled={eliminando}>
                Cancelar
              </button>
            </>
          ) : (
            <>
              <button className="btn btn-secundario" onClick={() => onEditar(item)}>
                Editar
              </button>
              <button className="btn btn-fantasma" onClick={() => setConfirmando(true)}>
                Eliminar
              </button>
            </>
          )}
        </div>
      </div>
    </article>
  )
}
