import { useMemo, useState } from 'react'
import { ESTADOS } from '../constants'
import LibraryCard from '../components/LibraryCard'
import { Mensaje, Spinner } from '../components/ui'

export default function Library({ items, cargando, error, onRecargar, onAbrir, onEditar, onEliminar, onIrADescubrir }) {
  const [filtro, setFiltro] = useState('todos')

  const conteo = useMemo(() => {
    const c = { todos: items.length }
    for (const e of ESTADOS) c[e.valor] = items.filter((i) => i.status === e.valor).length
    return c
  }, [items])

  const visibles = filtro === 'todos' ? items : items.filter((i) => i.status === filtro)
  const filtros = [{ valor: 'todos', texto: 'Todos' }, ...ESTADOS]

  return (
    <section className="vista" aria-labelledby="titulo-biblioteca">
      <header className="vista-cabecera">
        <div>
          <p className="sobretitulo">Mi biblioteca</p>
          <h1 id="titulo-biblioteca">Tus juegos</h1>
        </div>
      </header>

      {!cargando && !error && items.length > 0 && (
        <div className="filtros" role="tablist" aria-label="Filtrar por estado">
          {filtros.map((f) => (
            <button
              key={f.valor}
              role="tab"
              aria-selected={filtro === f.valor}
              className={`filtro ${filtro === f.valor ? 'activo' : ''} ${f.valor !== 'todos' ? `filtro-${f.valor}` : ''}`}
              onClick={() => setFiltro(f.valor)}
            >
              {f.texto}
              <span className="contador">{conteo[f.valor]}</span>
            </button>
          ))}
        </div>
      )}

      {cargando && <Spinner texto="Cargando tu biblioteca desde Firebase…" />}

      {!cargando && error && (
        <Mensaje
          tipo="error"
          titulo="No pudimos cargar tu biblioteca"
          texto={error}
          accion={
            <button className="btn btn-secundario" onClick={onRecargar}>
              Reintentar
            </button>
          }
        />
      )}

      {!cargando && !error && items.length === 0 && (
        <Mensaje
          titulo="Tu biblioteca está vacía"
          texto="Buscá juegos en Descubrir y agregalos para organizar qué querés jugar, qué estás jugando y qué terminaste."
          accion={
            <button className="btn btn-primario" onClick={onIrADescubrir}>
              Ir a Descubrir
            </button>
          }
        />
      )}

      {!cargando && !error && items.length > 0 && visibles.length === 0 && (
        <Mensaje titulo="Nada por acá" texto="No tenés juegos con este estado." />
      )}

      {!cargando && !error && visibles.length > 0 && (
        <div className="lista-biblioteca">
          {visibles.map((i) => (
            <LibraryCard key={i.id} item={i} onAbrir={onAbrir} onEditar={onEditar} onEliminar={onEliminar} />
          ))}
        </div>
      )}
    </section>
  )
}
