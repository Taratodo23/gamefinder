import { useCallback, useEffect, useRef, useState } from 'react'

// Galería de capturas con visor a pantalla completa
export default function Gallery({ capturas, titulo }) {
  const [abierta, setAbierta] = useState(null) // índice de la captura abierta o null
  const tira = useRef(null)
  const total = capturas.length

  const cerrar = useCallback(() => setAbierta(null), [])
  const mover = useCallback((paso) => setAbierta((i) => (i === null ? null : (i + paso + total) % total)), [total])

  // Teclado en el visor: ← → para pasar, Esc para cerrar
  useEffect(() => {
    if (abierta === null) return
    const tecla = (e) => {
      if (e.key === 'Escape') cerrar()
      if (e.key === 'ArrowRight') mover(1)
      if (e.key === 'ArrowLeft') mover(-1)
    }
    document.addEventListener('keydown', tecla)
    document.body.classList.add('sin-scroll')
    return () => {
      document.removeEventListener('keydown', tecla)
      document.body.classList.remove('sin-scroll')
    }
  }, [abierta, cerrar, mover])

  // Deslizar con el dedo en el visor (celular)
  const toqueX = useRef(null)
  const alTocar = (e) => (toqueX.current = e.touches[0].clientX)
  const alSoltar = (e) => {
    if (toqueX.current === null) return
    const dx = e.changedTouches[0].clientX - toqueX.current
    if (Math.abs(dx) > 50) mover(dx < 0 ? 1 : -1)
    toqueX.current = null
  }

  const desplazar = (dir) => tira.current?.scrollBy({ left: dir * tira.current.clientWidth * 0.8, behavior: 'smooth' })

  return (
    <section className="galeria" aria-label={`Capturas de ${titulo}`}>
      <div className="galeria-cabecera">
        <h2>
          Galería <span className="ayuda">{total} capturas</span>
        </h2>
        {total > 3 && (
          <div className="galeria-flechas">
            <button className="flecha" onClick={() => desplazar(-1)} aria-label="Ver capturas anteriores">‹</button>
            <button className="flecha" onClick={() => desplazar(1)} aria-label="Ver más capturas">›</button>
          </div>
        )}
      </div>

      <ul className="galeria-tira" ref={tira}>
        {capturas.map((c, i) => (
          <li key={c.id}>
            <button onClick={() => setAbierta(i)} aria-label={`Ampliar captura ${i + 1} de ${total}`}>
              <img src={c.imagen} alt={`${titulo}, captura ${i + 1}`} loading="lazy" />
            </button>
          </li>
        ))}
      </ul>

      {abierta !== null && (
        <div
          className="visor"
          role="dialog"
          aria-modal="true"
          aria-label={`Captura ${abierta + 1} de ${total}`}
          onClick={(e) => e.target === e.currentTarget && cerrar()}
          onTouchStart={alTocar}
          onTouchEnd={alSoltar}
        >
          <button className="visor-cerrar" onClick={cerrar} aria-label="Cerrar galería">×</button>
          {total > 1 && (
            <button className="visor-flecha visor-anterior" onClick={() => mover(-1)} aria-label="Captura anterior">‹</button>
          )}
          <figure className="visor-figura" onClick={(e) => e.target === e.currentTarget && cerrar()}>
            <img key={capturas[abierta].id} src={capturas[abierta].imagen} alt={`${titulo}, captura ${abierta + 1}`} />
            <figcaption>
              {abierta + 1} / {total}
            </figcaption>
          </figure>
          {total > 1 && (
            <button className="visor-flecha visor-siguiente" onClick={() => mover(1)} aria-label="Captura siguiente">›</button>
          )}
        </div>
      )}
    </section>
  )
}
