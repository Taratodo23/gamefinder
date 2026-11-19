import { useEffect, useRef, useState } from 'react'

// Círculo de usuario: foto de Google, inicial del mail o silueta anónima
function Avatar({ perfil, tamano = 34 }) {
  const [fallo, setFallo] = useState(false)

  if (perfil.anonimo) {
    return (
      <span className="avatar avatar-anonimo" style={{ width: tamano, height: tamano }} aria-hidden="true">
        <svg viewBox="0 0 24 24">
          <circle cx="12" cy="9" r="3.6" />
          <path d="M5.5 19.5c1.3-3.2 3.7-4.8 6.5-4.8s5.2 1.6 6.5 4.8" />
        </svg>
      </span>
    )
  }

  if (perfil.foto && !fallo) {
    return (
      <img
        className="avatar"
        src={perfil.foto}
        alt=""
        width={tamano}
        height={tamano}
        referrerPolicy="no-referrer"
        onError={() => setFallo(true)}
      />
    )
  }

  const inicial = (perfil.email || perfil.nombre || '?').trim().charAt(0).toUpperCase()
  return (
    <span className="avatar avatar-inicial" style={{ width: tamano, height: tamano }} aria-hidden="true">
      {inicial}
    </span>
  )
}

// Botón de cuenta de la barra superior
export default function Account({ perfil, onIniciar, onCerrar }) {
  const [ocupado, setOcupado] = useState(false)
  const [abierto, setAbierto] = useState(false)
  const caja = useRef(null)

  // Cerrar el menú al hacer clic afuera o con Escape
  useEffect(() => {
    if (!abierto) return
    const fuera = (e) => caja.current && !caja.current.contains(e.target) && setAbierto(false)
    const tecla = (e) => e.key === 'Escape' && setAbierto(false)
    document.addEventListener('mousedown', fuera)
    document.addEventListener('keydown', tecla)
    return () => {
      document.removeEventListener('mousedown', fuera)
      document.removeEventListener('keydown', tecla)
    }
  }, [abierto])

  async function accion(fn) {
    setOcupado(true)
    await fn()
    setOcupado(false)
    setAbierto(false)
  }

  if (!perfil) return null

  // Sin sesión: "Acceder" abre directamente la ventana de Google
  if (perfil.anonimo) {
    return (
      <button
        className="acceder"
        onClick={() => accion(onIniciar)}
        disabled={ocupado}
        title="Iniciá sesión con Google para ver tu biblioteca en todos tus dispositivos"
      >
        <Avatar perfil={perfil} tamano={30} />
        <span>{ocupado ? 'Conectando…' : 'Acceder'}</span>
      </button>
    )
  }

  // Con sesión: foto o inicial, con menú para cerrar sesión
  return (
    <div className="cuenta-menu-zona" ref={caja}>
      <button
        className="cuenta-avatar"
        onClick={() => setAbierto((v) => !v)}
        aria-expanded={abierto}
        aria-haspopup="menu"
        aria-label={`Cuenta de ${perfil.nombre || perfil.email || 'Google'}`}
      >
        <Avatar perfil={perfil} tamano={36} />
      </button>

      {abierto && (
        <div className="cuenta-menu" role="menu">
          <div className="cuenta-menu-perfil">
            <Avatar perfil={perfil} tamano={40} />
            <div>
              {perfil.nombre && <p className="cuenta-nombre">{perfil.nombre}</p>}
              {perfil.email && <p className="cuenta-email">{perfil.email}</p>}
            </div>
          </div>
          <p className="cuenta-ayuda">Tu biblioteca y tus gustos se sincronizan en todos tus dispositivos.</p>
          <button className="btn btn-secundario" onClick={() => accion(onCerrar)} disabled={ocupado} role="menuitem">
            {ocupado ? 'Cerrando…' : 'Cerrar sesión'}
          </button>
        </div>
      )}
    </div>
  )
}
