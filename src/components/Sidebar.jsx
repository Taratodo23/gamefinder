const ICONOS = {
  descubrir: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16l4.5 4.5" />
    </svg>
  ),
  recomendador: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3l2.4 5.2 5.6.6-4.2 3.8 1.2 5.5L12 15.3 7 18.1l1.2-5.5L4 8.8l5.6-.6z" />
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

const SOL = (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </svg>
)

const LUNA = (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />
  </svg>
)

// Botón de modo claro/oscuro (se usa en la barra lateral y, en el celular, flotante)
export function BotonTema({ tema, onCambiar, className = '' }) {
  const claro = tema === 'light'
  return (
    <button
      className={`tema-toggle ${className}`}
      onClick={onCambiar}
      aria-label={claro ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
      title={claro ? 'Modo oscuro' : 'Modo claro'}
    >
      {claro ? LUNA : SOL}
      <span>{claro ? 'Modo oscuro' : 'Modo claro'}</span>
    </button>
  )
}

export default function Sidebar({ vista, onNavegar, cantidad, tema, onCambiarTema }) {
  const items = [
    { id: 'descubrir', texto: 'Descubrir' },
    { id: 'recomendador', texto: 'Encontrá tu juego' },
    { id: 'biblioteca', texto: 'Mi biblioteca', extra: cantidad },
  ]
  const activa = vista === 'detalle' ? 'descubrir' : vista

  return (
    <nav className="sidebar" aria-label="Navegación principal">
      <button className="marca" onClick={() => onNavegar('descubrir')} aria-label="GameFinder, ir al inicio">
        <span className="marca-logo" aria-hidden="true" />
        <span>GameFinder</span>
      </button>
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
      <BotonTema tema={tema} onCambiar={onCambiarTema} className="tema-escritorio" />
    </nav>
  )
}
