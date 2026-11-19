import { useEffect } from 'react'

// Mensaje flotante de éxito, información o error. Se cierra a los 4 s.
export default function Toast({ toast, onCerrar }) {
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(onCerrar, 4000)
    return () => clearTimeout(t)
  }, [toast, onCerrar])

  return (
    <div className="toast-zona" aria-live="polite">
      {toast && (
        <div key={toast.id} className={`toast toast-${toast.tipo}`} role={toast.tipo === 'error' ? 'alert' : 'status'}>
          <span className="toast-icono" aria-hidden="true">
            {toast.tipo === 'ok' ? '✓' : toast.tipo === 'error' ? '!' : 'i'}
          </span>
          <span>{toast.texto}</span>
          <button onClick={onCerrar} aria-label="Cerrar mensaje">×</button>
        </div>
      )}
    </div>
  )
}
