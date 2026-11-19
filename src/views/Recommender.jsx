import { useEffect, useMemo, useState } from 'react'
import { GENEROS, PLATAFORMAS, EPOCAS, MODOS, MAX_GENEROS, textoDe } from '../constants'
import { recomendarJuegos, USANDO_MOCK } from '../services/rawg'
import { leerPreferencias, guardarPreferencias, borrarPreferencias } from '../services/preferences'
import { mensajeFirebase } from '../services/library'
import GameCard from '../components/GameCard'
import { Mensaje, Spinner } from '../components/ui'

const VACIO = { genres: [], platforms: [], era: 'cualquiera', mode: 'cualquiera', quality: false }
const PASOS = ['Géneros', 'Plataformas', 'Época', 'Estilo']

function resumen(p) {
  const partes = [p.genres.map((g) => textoDe(GENEROS, g)).join(', ')]
  partes.push(p.platforms.length ? p.platforms.map((x) => textoDe(PLATAFORMAS, x)).join(', ') : 'Cualquier plataforma')
  if (p.era !== 'cualquiera') partes.push(textoDe(EPOCAS, p.era))
  if (p.mode !== 'cualquiera') partes.push(textoDe(MODOS, p.mode))
  if (p.quality) partes.push('Muy valorados')
  return partes
}

// Chip seleccionable (multi o única opción)
function Opcion({ activa, onClick, texto, detalle, deshabilitada }) {
  return (
    <button
      type="button"
      className={`opcion ${activa ? 'activa' : ''}`}
      aria-pressed={activa}
      onClick={onClick}
      disabled={deshabilitada}
    >
      <span>{texto}</span>
      {detalle && <small>{detalle}</small>}
    </button>
  )
}

export default function Recommender({ uid, porId, onAbrir, onAgregar, puedeGuardar, avisar }) {
  // pantalla: cargando | inicio | preguntas | resultados
  const [pantalla, setPantalla] = useState('cargando')
  const [guardadas, setGuardadas] = useState(null)
  const [prefs, setPrefs] = useState(VACIO)
  const [paso, setPaso] = useState(0)
  const [guardando, setGuardando] = useState(false)

  const [resultados, setResultados] = useState([])
  const [pagina, setPagina] = useState(1)
  const [hayMas, setHayMas] = useState(false)
  const [estadoRes, setEstadoRes] = useState('cargando')
  const [errorRes, setErrorRes] = useState('')
  const [cargandoMas, setCargandoMas] = useState(false)
  // Lo que ya estaba en la biblioteca al buscar (así lo que agregues ahora no desaparece)
  const [excluidos, setExcluidos] = useState(() => new Set())

  // 1. Al entrar, leer los gustos guardados en Firestore
  useEffect(() => {
    let activo = true
    leerPreferencias(uid)
      .then((p) => {
        if (!activo) return
        if (p) {
          const limpias = { ...VACIO, ...p }
          setGuardadas(limpias)
          setPrefs(limpias)
          setPantalla('inicio')
        } else {
          setPantalla('preguntas')
        }
      })
      .catch((e) => {
        if (!activo) return
        avisar('error', mensajeFirebase(e))
        setPantalla('preguntas')
      })
    return () => {
      activo = false
    }
  }, [uid, avisar])

  const cambiar = (campo, valor) => setPrefs((p) => ({ ...p, [campo]: valor }))
  const alternar = (campo, valor) =>
    setPrefs((p) => ({
      ...p,
      [campo]: p[campo].includes(valor) ? p[campo].filter((x) => x !== valor) : [...p[campo], valor],
    }))

  async function buscar(p, pag = 1) {
    if (pag === 1) {
      setEstadoRes('cargando')
      setErrorRes('')
      setExcluidos(new Set(porId.keys()))
    } else {
      setCargandoMas(true)
    }
    try {
      const r = await recomendarJuegos(p, { pagina: pag })
      setResultados((xs) => {
        if (pag === 1) return r.resultados
        const vistos = new Set(xs.map((x) => x.id))
        return [...xs, ...r.resultados.filter((x) => !vistos.has(x.id))]
      })
      setHayMas(r.hayMas)
      setPagina(pag)
      setEstadoRes('listo')
    } catch (e) {
      if (pag === 1) setEstadoRes('error')
      setErrorRes(e.message)
    } finally {
      setCargandoMas(false)
    }
  }

  // 2. Guardar gustos en Firestore y mostrar recomendaciones
  async function terminar() {
    setGuardando(true)
    try {
      await guardarPreferencias(uid, prefs)
      setGuardadas(prefs)
      avisar('ok', 'Guardamos tus gustos para la próxima vez.')
    } catch (e) {
      avisar('error', `No se pudieron guardar tus gustos. ${mensajeFirebase(e)}`)
    } finally {
      setGuardando(false)
    }
    setPantalla('resultados')
    buscar(prefs, 1)
  }

  function verRecomendaciones() {
    setPantalla('resultados')
    buscar(guardadas, 1)
  }

  function editar() {
    setPaso(0)
    setPantalla('preguntas')
  }

  async function empezarDeCero() {
    try {
      await borrarPreferencias(uid)
      setGuardadas(null)
      setPrefs(VACIO)
      setPaso(0)
      setPantalla('preguntas')
      avisar('ok', 'Borramos tus gustos guardados.')
    } catch (e) {
      avisar('error', mensajeFirebase(e))
    }
  }

  // 3. Quitar lo que ya está en la biblioteca y ordenar por afinidad
  const recomendados = useMemo(() => {
    const elegidos = new Set(prefs.genres)
    return resultados
      .filter((j) => !excluidos.has(String(j.id)))
      .map((j) => {
        const coincidencias = (j.genreSlugs || []).filter((s) => elegidos.has(s))
        return { ...j, coincidencias, afinidad: coincidencias.length * 2 + (j.rating || 0) }
      })
      .sort((a, b) => b.afinidad - a.afinidad)
  }, [resultados, excluidos, prefs.genres])

  const yaTenias = resultados.length - recomendados.length
  const puedeAvanzar = paso !== 0 || prefs.genres.length > 0

  return (
    <section className="vista" aria-labelledby="titulo-recomendador">
      <header className="vista-cabecera">
        <div>
          <p className="sobretitulo">Recomendador</p>
          <h1 id="titulo-recomendador">Juegos a tu medida</h1>
          <p className="bajada">Contanos qué te gusta y te armamos una lista, sin repetir lo que ya está en tu biblioteca.</p>
        </div>
      </header>

      {USANDO_MOCK && (
        <div className="aviso-mock" role="note">
          <strong>Datos de prueba.</strong> Las recomendaciones son juegos ficticios.
        </div>
      )}

      {pantalla === 'cargando' && <Spinner texto="Buscando tus gustos guardados…" />}

      {/* Gustos ya guardados */}
      {pantalla === 'inicio' && guardadas && (
        <div className="perfil-gustos">
          <p className="sobretitulo">Tus gustos guardados</p>
          <ul className="chips-resumen">
            {resumen(guardadas).map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
          <div className="acciones-fila">
            <button className="btn btn-primario" onClick={verRecomendaciones}>Ver recomendaciones</button>
            <button className="btn btn-secundario" onClick={editar}>Cambiar gustos</button>
            <button className="btn btn-fantasma" onClick={empezarDeCero}>Empezar de cero</button>
          </div>
        </div>
      )}

      {/* Cuestionario */}
      {pantalla === 'preguntas' && (
        <div className="cuestionario">
          <ol className="pasos" aria-label="Progreso">
            {PASOS.map((p, i) => (
              <li key={p} className={i === paso ? 'actual' : i < paso ? 'hecho' : ''} aria-current={i === paso ? 'step' : undefined}>
                <span>{i + 1}</span>
                {p}
              </li>
            ))}
          </ol>

          <div className="paso-pregunta" key={paso}>
            {paso === 0 && (
              <>
                <h2>¿Qué géneros te gustan?</h2>
                <p className="ayuda">Elegí entre 1 y {MAX_GENEROS}. Llevás {prefs.genres.length}.</p>
                <div className="opciones">
                  {GENEROS.map((g) => {
                    const activa = prefs.genres.includes(g.valor)
                    return (
                      <Opcion
                        key={g.valor}
                        texto={g.texto}
                        activa={activa}
                        deshabilitada={!activa && prefs.genres.length >= MAX_GENEROS}
                        onClick={() => alternar('genres', g.valor)}
                      />
                    )
                  })}
                </div>
              </>
            )}

            {paso === 1 && (
              <>
                <h2>¿En qué jugás?</h2>
                <p className="ayuda">Si no elegís ninguna, buscamos en todas.</p>
                <div className="opciones">
                  {PLATAFORMAS.map((p) => (
                    <Opcion
                      key={p.valor}
                      texto={p.texto}
                      activa={prefs.platforms.includes(p.valor)}
                      onClick={() => alternar('platforms', p.valor)}
                    />
                  ))}
                </div>
              </>
            )}

            {paso === 2 && (
              <>
                <h2>¿De qué época?</h2>
                <div className="opciones opciones-grandes">
                  {EPOCAS.map((e) => (
                    <Opcion
                      key={e.valor}
                      texto={e.texto}
                      detalle={e.detalle}
                      activa={prefs.era === e.valor}
                      onClick={() => cambiar('era', e.valor)}
                    />
                  ))}
                </div>
              </>
            )}

            {paso === 3 && (
              <>
                <h2>¿Cómo te gusta jugar?</h2>
                <div className="opciones opciones-grandes">
                  {MODOS.map((m) => (
                    <Opcion
                      key={m.valor}
                      texto={m.texto}
                      detalle={m.detalle}
                      activa={prefs.mode === m.valor}
                      onClick={() => cambiar('mode', m.valor)}
                    />
                  ))}
                </div>
                <label className="interruptor">
                  <input
                    type="checkbox"
                    checked={prefs.quality}
                    onChange={(e) => cambiar('quality', e.target.checked)}
                  />
                  <span className="interruptor-pista" aria-hidden="true" />
                  <span>
                    Solo juegos muy valorados
                    <small>Metacritic 75 o más. Puede dejar afuera juegos nuevos o indies sin puntaje.</small>
                  </span>
                </label>
              </>
            )}
          </div>

          <div className="cuestionario-acciones">
            {paso > 0 ? (
              <button className="btn btn-fantasma" onClick={() => setPaso((p) => p - 1)} disabled={guardando}>
                ← Atrás
              </button>
            ) : guardadas ? (
              <button className="btn btn-fantasma" onClick={() => setPantalla('inicio')}>
                Cancelar
              </button>
            ) : (
              <span />
            )}
            {paso < PASOS.length - 1 ? (
              <button className="btn btn-primario" onClick={() => setPaso((p) => p + 1)} disabled={!puedeAvanzar}>
                Siguiente →
              </button>
            ) : (
              <button className="btn btn-primario" onClick={terminar} disabled={guardando}>
                {guardando ? 'Guardando…' : 'Ver mis recomendaciones'}
              </button>
            )}
          </div>
          {paso === 0 && !puedeAvanzar && <p className="ayuda centro-texto">Elegí al menos un género para seguir.</p>}
        </div>
      )}

      {/* Resultados */}
      {pantalla === 'resultados' && (
        <>
          <div className="resultados-cabecera">
            <ul className="chips-resumen">
              {resumen(prefs).map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
            <button className="btn btn-secundario" onClick={editar}>Cambiar gustos</button>
          </div>

          {estadoRes === 'cargando' && (
            <div className="grilla" aria-busy="true" aria-label="Cargando recomendaciones">
              {Array.from({ length: 8 }, (_, i) => (
                <div key={i} className="esqueleto" />
              ))}
            </div>
          )}

          {estadoRes === 'error' && (
            <Mensaje
              tipo="error"
              titulo="No pudimos armar tus recomendaciones"
              texto={errorRes}
              accion={<button className="btn btn-secundario" onClick={() => buscar(prefs, 1)}>Reintentar</button>}
            />
          )}

          {estadoRes === 'listo' && recomendados.length === 0 && (
            <Mensaje
              titulo={resultados.length > 0 ? 'Ya tenés todos estos' : 'No encontramos juegos con esa combinación'}
              texto={
                resultados.length > 0
                  ? 'Todos los resultados ya están en tu biblioteca. Probá con otros géneros o cargá más.'
                  : 'Probá con menos filtros: sacá la época, el modo o “Solo muy valorados”.'
              }
              accion={<button className="btn btn-secundario" onClick={editar}>Cambiar gustos</button>}
            />
          )}

          {estadoRes === 'listo' && recomendados.length > 0 && (
            <>
              <div className="seccion-titulo">
                <h2>Te pueden gustar</h2>
                {yaTenias > 0 && <span className="ayuda">Ocultamos {yaTenias} que ya están en tu biblioteca</span>}
              </div>
              <div className="grilla">
                {recomendados.map((j) => (
                  <GameCard
                    key={j.id}
                    juego={j}
                    enBiblioteca={porId.has(String(j.id))}
                    onAbrir={onAbrir}
                    onAgregar={onAgregar}
                    puedeGuardar={puedeGuardar}
                    motivo={
                      j.coincidencias.length
                        ? `Coincide con: ${j.coincidencias.map((s) => textoDe(GENEROS, s)).join(', ')}`
                        : null
                    }
                  />
                ))}
              </div>
              {errorRes && <p className="error-form centro">{errorRes}</p>}
              {hayMas && (
                <div className="centro">
                  <button className="btn btn-secundario" onClick={() => buscar(prefs, pagina + 1)} disabled={cargandoMas}>
                    {cargandoMas ? 'Buscando…' : 'Mostrame más'}
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}
    </section>
  )
}
