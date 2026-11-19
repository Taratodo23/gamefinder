const ICONOS = {
  descubrir: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16l4.5 4.5" />
    </svg>
  ),
  biblioteca: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="4" y="4" width="4" height="16" rx="1" />
      <rect x="10" y="4" width="4" height="16" rx="1" />
      <rect x="16" y="4.5" width="4" height="15.5" rx="1" transform="rotate(-12 18 12)" />
    </svg>
  ),
}

export default function Sidebar({ vista, onNavegar, cantidad }) {
  const items = [
    { id: 'descubrir', texto: 'Descubrir' },
    { id: 'biblioteca', texto: 'Mi biblioteca', extra: cantidad },
  ]
  const activa = vista === 'detalle' ? 'descubrir' : vista

  return (
    <nav className="sidebar" aria-label="Navegación principal">
      <div className="marca">
        <span className="marca-logo" aria-hidden="true" />
        <span>GameFinder</span>
      </div>
      <ul>
        {items.map((it) => (
          <li key={it.id}>
            <button
              className={activa === it.id ? 'activo' : ''}
              aria-current={activa === it.id ? 'page' : undefined}
              onClick={() => onNavegar(it.id)}
            >
              {ICONOS[it.id]}
              <span>{it.texto}</span>
              {it.extra > 0 && <span className="contador">{it.extra}</span>}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  )
}
