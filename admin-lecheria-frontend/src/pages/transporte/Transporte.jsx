import { useState, useEffect, Fragment } from 'react'
import api from '../../api/axios'

const fmt  = (n) => Math.round(n ?? 0).toLocaleString('es-CO')
const fmtL = (n) => Number(n ?? 0).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 1 })

function formatFecha(f) {
  if (!f) return ''
  const [, mes, dia] = f.split('-')
  return `${dia}/${mes}`
}

const COLORES = ['#0288d1', '#388e3c', '#e65100', '#6c63ff', '#c62828', '#00838f']
const GRUPO_FORM_INIT = { nombre: '', tipoLeche: '', rutaIds: [], empresas: [], precioRinde: '' }

export default function Transporte() {
  const [quincenas, setQuincenas]               = useState([])
  const [quincenaId, setQuincenaId]             = useState('')
  const [grupos, setGrupos]                     = useState([])
  const [vistaCompleta, setVistaCompleta]       = useState(null)   // cuando hay grupos
  const [resumen, setResumen]                   = useState(null)   // fallback sin grupos
  const [rutas, setRutas]                       = useState([])
  const [empresasExistentes, setEmpresasExist]  = useState([])
  const [cargando, setCargando]                 = useState(false)
  const [error, setError]                       = useState(null)
  const [mostrarConfig, setMostrarConfig]       = useState(false)
  const [modal, setModal]                       = useState(null)
  const [form, setForm]                         = useState(GRUPO_FORM_INIT)
  const [empresaInput, setEmpresaInput]         = useState('')
  const [guardando, setGuardando]               = useState(false)

  useEffect(() => {
    Promise.all([
      api.get('/quincenas'),
      api.get('/grupos-rinde'),
      api.get('/rutas'),
      api.get('/recibos/empresas'),
    ]).then(([qRes, gRes, rRes, eRes]) => {
      setQuincenas(qRes.data)
      setGrupos(gRes.data)
      setRutas(rRes.data)
      setEmpresasExist(eRes.data ?? [])
      const abierta = qRes.data.find(q => !q.cerrada)
      if (abierta) { setQuincenaId(String(abierta.id)); cargarResumen(abierta.id, gRes.data) }
    }).catch(() => setError('No se pudo conectar con el servidor.'))
  }, [])

  const cargarResumen = async (id, gruposActuales = grupos) => {
    if (!id) return
    setCargando(true); setError(null)
    try {
      if (gruposActuales.length > 0) {
        const r = await api.get(`/grupos-rinde/vista-completa/${id}`)
        setVistaCompleta(r.data); setResumen(null)
      } else {
        const r = await api.get(`/recibos/transporte/${id}`)
        setResumen(r.data); setVistaCompleta(null)
      }
    } catch (e) {
      setError(`Error al cargar: ${e?.response?.status ?? 'sin conexión'}`)
    } finally { setCargando(false) }
  }

  const handleQuincena = (e) => {
    setQuincenaId(e.target.value); setVistaCompleta(null); setResumen(null); setError(null)
    if (e.target.value) cargarResumen(e.target.value)
  }

  // ── CRUD grupos ──────────────────────────────────────────────────────────
  const abrirNuevo  = () => { setForm(GRUPO_FORM_INIT); setEmpresaInput(''); setModal('nuevo') }
  const abrirEditar = (g) => {
    setForm({ id: g.id, nombre: g.nombre, tipoLeche: g.tipoLeche ?? '', rutaIds: [...g.rutaIds], empresas: [...g.empresas], precioRinde: g.precioRinde ?? '' })
    setEmpresaInput(''); setModal('editar')
  }
  const toggleRuta = (id) => setForm(f => ({
    ...f, rutaIds: f.rutaIds.includes(id) ? f.rutaIds.filter(r => r !== id) : [...f.rutaIds, id]
  }))
  const agregarEmpresa = () => {
    const v = empresaInput.trim()
    if (!v || form.empresas.map(e => e.toLowerCase()).includes(v.toLowerCase())) return
    setForm(f => ({ ...f, empresas: [...f.empresas, v] })); setEmpresaInput('')
  }
  const quitarEmpresa = (emp) => setForm(f => ({ ...f, empresas: f.empresas.filter(e => e !== emp) }))

  const guardarGrupo = async () => {
    if (!form.nombre.trim()) return
    setGuardando(true)
    const payload = {
      ...form,
      precioRinde: form.precioRinde !== '' ? parseFloat(form.precioRinde) : null,
    }
    try {
      if (form.id) await api.put(`/grupos-rinde/${form.id}`, payload)
      else await api.post('/grupos-rinde', payload)
      const r = await api.get('/grupos-rinde')
      setGrupos(r.data); setModal(null)
      if (quincenaId) cargarResumen(quincenaId, r.data)
    } finally { setGuardando(false) }
  }

  const eliminarGrupo = async (id) => {
    if (!confirm('¿Eliminar este grupo?')) return
    await api.delete(`/grupos-rinde/${id}`)
    const r = await api.get('/grupos-rinde')
    setGrupos(r.data)
    if (quincenaId) cargarResumen(quincenaId, r.data)
  }

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ margin: 0 }}>Control de Transporte</h2>
        <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#666' }}>
          Litros entregados vs. recogidos · Rinde por grupo
        </p>
      </div>

      {/* Selector quincena */}
      <div style={{ background: 'white', padding: '14px 16px', borderRadius: '12px', marginBottom: '14px', boxShadow: '0 2px 8px rgba(0,0,0,0.07)', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <label style={{ fontSize: '14px', fontWeight: '600' }}>Quincena:</label>
        <select value={quincenaId} onChange={handleQuincena}
          style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px', minWidth: '280px' }}>
          <option value="">Seleccionar...</option>
          {quincenas.map(q => <option key={q.id} value={q.id}>{q.textoQuincena}{!q.cerrada ? ' (Abierta)' : ''}</option>)}
        </select>
      </div>

      {/* Panel configuración grupos */}
      <div style={{ background: 'white', borderRadius: '12px', marginBottom: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
        <button onClick={() => setMostrarConfig(v => !v)} style={{
          width: '100%', background: 'none', border: 'none', padding: '13px 16px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          fontSize: '13px', fontWeight: '700', color: '#444',
        }}>
          <span>⚙ Grupos de Rinde {grupos.length > 0 ? `(${grupos.length})` : '— sin grupos configurados'}</span>
          <span style={{ fontSize: '11px', color: '#999' }}>{mostrarConfig ? '▲ Ocultar' : '▼ Ver / editar'}</span>
        </button>

        {mostrarConfig && (
          <div style={{ borderTop: '1px solid #f0f0f0', padding: '14px 16px' }}>
            {grupos.length === 0 && (
              <p style={{ margin: '0 0 12px', fontSize: '13px', color: '#999' }}>
                Crea grupos para separar el rinde por ruta o tipo de leche.
              </p>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
              {grupos.map((g, i) => (
                <div key={g.id} style={{
                  border: `1px solid ${COLORES[i % COLORES.length]}30`,
                  borderLeft: `4px solid ${COLORES[i % COLORES.length]}`,
                  borderRadius: '8px', padding: '9px 12px',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
                }}>
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '13px' }}>{g.nombre}</div>
                    <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>
                      {g.tipoLeche ? `Tipo: ${g.tipoLeche} · ` : ''}
                      Rutas: {g.rutaIds?.length ? g.rutaIds.map(id => rutas.find(r => r.id === id)?.nombre ?? id).join(', ') : 'todas'}
                      {' · '}
                      Empresas (rinde): {g.empresas?.join(', ') || '—'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                    <button onClick={() => abrirEditar(g)} style={btnSm(COLORES[i % COLORES.length])}>✏ Editar</button>
                    <button onClick={() => eliminarGrupo(g.id)} style={btnSm('#c62828')}>🗑</button>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={abrirNuevo} style={{ background: '#6c63ff', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>
              + Nuevo grupo
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '26px', width: '100%', maxWidth: '480px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ margin: 0, fontSize: '15px' }}>{form.id ? 'Editar grupo' : 'Nuevo grupo de rinde'}</h3>
              <button onClick={() => setModal(null)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#999' }}>✕</button>
            </div>

            <label style={lbl}>Nombre</label>
            <input value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} placeholder="Ej: Vaca Cairo" style={inp} />

            <label style={lbl}>Tipo de leche</label>
            <select value={form.tipoLeche} onChange={e => setForm(f => ({ ...f, tipoLeche: e.target.value }))} style={inp}>
              <option value="">Todos los tipos</option>
              <option value="vaca">Vaca</option>
              <option value="bufala">Búfala</option>
            </select>

            <label style={lbl}>$/litro del rinde — precio que paga la empresa</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <input
                value={form.precioRinde}
                onChange={e => setForm(f => ({ ...f, precioRinde: e.target.value }))}
                type="number" step="1" placeholder="Ej: 1925"
                style={{ ...inp, marginBottom: 0, flex: 1 }}
              />
              {form.precioRinde && (
                <div style={{ background: '#e8f5e9', borderRadius: '8px', padding: '8px 12px', fontSize: '13px', color: '#1b5e20', fontWeight: '600', whiteSpace: 'nowrap' }}>
                  ${Number(form.precioRinde).toLocaleString('es-CO')}/L
                </div>
              )}
            </div>

            <label style={lbl}>Rutas de proveedores (litros recogidos)</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
              {rutas.map(r => (
                <label key={r.id} style={{
                  display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer',
                  padding: '6px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: '500', userSelect: 'none',
                  border: `2px solid ${form.rutaIds.includes(r.id) ? '#6c63ff' : '#e0e0e0'}`,
                  background: form.rutaIds.includes(r.id) ? '#f0eeff' : 'white',
                  color: form.rutaIds.includes(r.id) ? '#6c63ff' : '#444',
                }}>
                  <input type="checkbox" checked={form.rutaIds.includes(r.id)} onChange={() => toggleRuta(r.id)} style={{ accentColor: '#6c63ff' }} />
                  {r.nombre}
                </label>
              ))}
            </div>

            <label style={lbl}>Empresas que cuentan para el rinde (litros entregados)</label>
            {empresasExistentes.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px', marginBottom: '10px' }}>
                {empresasExistentes.map(emp => {
                  const sel = form.empresas.map(e => e.toLowerCase()).includes(emp.toLowerCase())
                  return (
                    <button key={emp} type="button"
                      onClick={() => sel ? quitarEmpresa(emp) : setForm(f => ({ ...f, empresas: [...f.empresas, emp] }))}
                      style={{
                        padding: '5px 13px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', cursor: 'pointer',
                        border: `2px solid ${sel ? '#0288d1' : '#e0e0e0'}`,
                        background: sel ? '#e3f2fd' : 'white',
                        color: sel ? '#0288d1' : '#666',
                      }}>
                      {sel ? '✓ ' : ''}{emp}
                    </button>
                  )
                })}
              </div>
            )}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
              <input value={empresaInput} onChange={e => setEmpresaInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), agregarEmpresa())}
                placeholder="Agregar empresa nueva..." style={{ ...inp, marginBottom: 0, flex: 1 }} />
              <button onClick={agregarEmpresa} style={{ background: '#6c63ff', color: 'white', border: 'none', borderRadius: '8px', padding: '0 14px', cursor: 'pointer', fontWeight: '600' }}>+ Nueva</button>
            </div>
            {form.empresas.length > 0
              ? <p style={{ margin: '0 0 18px', fontSize: '12px', color: '#0288d1', fontWeight: '600' }}>Seleccionadas: {form.empresas.join(', ')}</p>
              : <p style={{ margin: '0 0 18px', fontSize: '12px', color: '#bbb' }}>Sin empresas seleccionadas</p>
            }

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setModal(null)} style={{ background: '#f5f5f5', border: 'none', borderRadius: '8px', padding: '10px 18px', cursor: 'pointer', fontWeight: '600' }}>Cancelar</button>
              <button onClick={guardarGrupo} disabled={guardando || !form.nombre.trim()} style={{ background: form.nombre.trim() ? '#6c63ff' : '#ccc', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 18px', cursor: 'pointer', fontWeight: '700' }}>
                {guardando ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {error && <div style={{ padding: '12px 16px', borderRadius: '10px', background: '#ffebee', color: '#c62828', marginBottom: '14px', border: '1px solid #ffcdd2' }}>⚠️ {error}</div>}
      {cargando && <div style={{ textAlign: 'center', padding: '60px', color: '#999' }}>Cargando datos...</div>}

      {/* Vista con grupos — tabla unificada */}
      {!cargando && vistaCompleta && <TablaCompleta vc={vistaCompleta} />}

      {/* Vista global sin grupos */}
      {!cargando && resumen && <GlobalView resumen={resumen} />}

      {!cargando && !vistaCompleta && !resumen && quincenaId && !error && (
        <div style={{ textAlign: 'center', padding: '60px', color: '#999', background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          {grupos.length === 0 ? 'Configura los grupos de rinde arriba, o ve a Recibos para registrar entregas.' : 'No hay recibos registrados para esta quincena.'}
        </div>
      )}
    </div>
  )
}

// ── Tabla unificada estilo Excel ─────────────────────────────────────────────
function TablaCompleta({ vc }) {
  const { todasEmpresas, grupos, dias, totalLitrosPorEmpresa, rindeTotal } = vc

  // Empresas que pertenecen a cada grupo (para saber cuánto colSpan usar)
  const empsPorGrupo = grupos.map(g =>
    todasEmpresas.filter(emp => g.empresasConfig.map(e => e.toLowerCase()).includes(emp.toLowerCase()))
  )
  // Empresas que no están en ningún grupo
  const empsSinGrupo = todasEmpresas.filter(emp =>
    !grupos.some(g => g.empresasConfig.map(e => e.toLowerCase()).includes(emp.toLowerCase()))
  )

  // Total rinde por grupo (para el footer)
  const totalRindePorGrupo = grupos.map(g =>
    dias.reduce((s, dia) => s + (dia.grupos.find(dg => dg.grupoId === g.grupoId)?.rinde ?? 0), 0)
  )

  return (
    <div>
      {/* KPI cards — una por grupo + total */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(grupos.length + 1, 4)}, 1fr)`, gap: '12px', marginBottom: '18px' }}>
        {grupos.map((g, i) => (
          <div key={g.grupoId} style={{ background: 'white', padding: '14px 16px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.07)', borderTop: `3px solid ${COLORES[i % COLORES.length]}` }}>
            <p style={{ margin: 0, fontSize: '11px', color: '#999', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{g.nombre}</p>
            <p style={{ margin: '4px 0 0', fontSize: '17px', fontWeight: '800', color: g.totalRinde >= 0 ? '#388e3c' : '#c62828' }}>
              {fmtL(g.totalRinde)} L
            </p>
            <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#aaa' }}>
              {fmtL(g.totalEntregado)} ent. / {fmtL(g.totalRecogido)} rec.
            </p>
          </div>
        ))}
        <div style={{ background: '#1a1a2e', padding: '14px 16px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <p style={{ margin: 0, fontSize: '11px', color: '#7c7caa', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Rinde total</p>
          <p style={{ margin: '4px 0 0', fontSize: '17px', fontWeight: '800', color: rindeTotal >= 0 ? '#a5d6a7' : '#ef9a9a' }}>
            {fmtL(rindeTotal)} L
          </p>
        </div>
      </div>

      {/* Tabla */}
      <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', overflow: 'auto' }}>
        <div style={{ background: '#1a1a2e', color: 'white', padding: '11px 16px', fontWeight: '700', fontSize: '13px' }}>
          {vc.textoQuincena?.toUpperCase()} — TRANSPORTE Y RINDE
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: `${80 + todasEmpresas.length * 75 + grupos.length * 200}px` }}>
          <thead>
            {/* Fila 1: encabezados de grupo */}
            <tr style={{ borderBottom: '1px solid #ddd' }}>
              <th rowSpan={2} style={{ ...thS, textAlign: 'center', background: '#f5f5f5', borderRight: '2px solid #e0e0e0', width: '55px' }}>DÍA</th>
              {grupos.map((g, i) => {
                const color = COLORES[i % COLORES.length]
                const cols = empsPorGrupo[i].length + 3
                return (
                  <th key={g.grupoId} colSpan={cols} style={{ ...thS, textAlign: 'center', background: color, color: 'white', borderRight: '2px solid white', letterSpacing: '0.5px' }}>
                    {g.nombre.toUpperCase()}
                  </th>
                )
              })}
              {empsSinGrupo.length > 0 && (
                <th colSpan={empsSinGrupo.length} style={{ ...thS, textAlign: 'center', background: '#607d8b', color: 'white' }}>
                  OTROS RECIBOS
                </th>
              )}
              <th rowSpan={2} style={{ ...thS, textAlign: 'center', background: '#1a1a2e', color: '#ffe082', borderLeft: '3px solid #333', whiteSpace: 'nowrap' }}>
                RINDE<br />TOTAL
              </th>
            </tr>

            {/* Fila 2: nombres de empresa + ENT/REC/RINDE por grupo */}
            <tr style={{ background: '#f9f9f9', borderBottom: '2px solid #ddd' }}>
              {grupos.map((g, i) => {
                const color = COLORES[i % COLORES.length]
                return (
                  <Fragment key={g.grupoId}>
                    {empsPorGrupo[i].map(emp => (
                      <th key={emp} style={{ ...thS, background: `${color}12`, color: '#333', fontWeight: '700', fontSize: '11px', maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={emp}>
                        {emp}
                      </th>
                    ))}
                    <th style={{ ...thS, background: '#e8f5e9', color: '#2e7d32', borderLeft: `2px solid ${color}30`, whiteSpace: 'nowrap' }}>ENT.</th>
                    <th style={{ ...thS, background: '#e3f2fd', color: '#1565c0', whiteSpace: 'nowrap' }}>REC.</th>
                    <th style={{ ...thS, background: `${color}20`, color, borderRight: '2px solid #e0e0e0', whiteSpace: 'nowrap' }}>RINDE</th>
                  </Fragment>
                )
              })}
              {empsSinGrupo.map(emp => (
                <th key={emp} style={{ ...thS, background: '#f5f5f5', fontSize: '11px', maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={emp}>
                  {emp}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {dias.map((dia, rowIdx) => {
              const tieneData = dia.rindeTotal !== 0 ||
                grupos.some(g => { const dg = dia.grupos.find(x => x.grupoId === g.grupoId); return (dg?.entregado ?? 0) > 0 || (dg?.recogido ?? 0) > 0 }) ||
                Object.values(dia.litrosPorEmpresa ?? {}).some(v => v > 0)

              return (
                <tr key={dia.fecha} style={{ borderBottom: '1px solid #f0f0f0', background: rowIdx % 2 === 0 ? 'white' : '#fafafa', opacity: tieneData ? 1 : 0.35 }}>
                  <td style={{ ...tdS, textAlign: 'center', fontWeight: '700', color: '#555', borderRight: '2px solid #e0e0e0' }}>
                    {formatFecha(dia.fecha)}
                  </td>

                  {grupos.map((g, gi) => {
                    const color = COLORES[gi % COLORES.length]
                    const dg = dia.grupos?.find(x => x.grupoId === g.grupoId)
                    return (
                      <Fragment key={g.grupoId}>
                        {empsPorGrupo[gi].map(emp => {
                          const litros = dia.litrosPorEmpresa?.[emp] ?? 0
                          return (
                            <td key={emp} style={{ ...tdS, textAlign: 'right', color: litros > 0 ? '#1a1a2e' : '#ddd' }}>
                              {litros > 0 ? fmtL(litros) : '—'}
                            </td>
                          )
                        })}
                        <td style={{ ...tdS, textAlign: 'right', fontWeight: '600', color: '#2e7d32', borderLeft: `2px solid ${color}20` }}>
                          {(dg?.entregado ?? 0) > 0 ? fmtL(dg.entregado) : '—'}
                        </td>
                        <td style={{ ...tdS, textAlign: 'right', fontWeight: '600', color: '#1565c0' }}>
                          {(dg?.recogido ?? 0) > 0 ? fmtL(dg.recogido) : '—'}
                        </td>
                        <td style={{ ...tdS, textAlign: 'right', fontWeight: '800', color: (dg?.rinde ?? 0) < 0 ? '#c62828' : '#e65100', borderRight: '2px solid #e0e0e0' }}>
                          {tieneData && ((dg?.entregado ?? 0) > 0 || (dg?.recogido ?? 0) > 0) ? fmtL(dg?.rinde ?? 0) : '—'}
                        </td>
                      </Fragment>
                    )
                  })}

                  {empsSinGrupo.map(emp => {
                    const litros = dia.litrosPorEmpresa?.[emp] ?? 0
                    return (
                      <td key={emp} style={{ ...tdS, textAlign: 'right', color: litros > 0 ? '#1a1a2e' : '#ddd' }}>
                        {litros > 0 ? fmtL(litros) : '—'}
                      </td>
                    )
                  })}

                  <td style={{ ...tdS, textAlign: 'right', fontWeight: '800', color: dia.rindeTotal < 0 ? '#c62828' : '#388e3c', borderLeft: '3px solid #e0e0e0' }}>
                    {tieneData ? fmtL(dia.rindeTotal) : '—'}
                  </td>
                </tr>
              )
            })}
          </tbody>

          {/* Footer */}
          <tfoot>
            {/* TOTAL LITROS */}
            <tr style={{ background: '#fff9c4', fontWeight: '700', borderTop: '3px solid #ddd' }}>
              <td style={{ ...tdS, fontWeight: '800', color: '#333', borderRight: '2px solid #ddd' }}>TOTAL L.</td>
              {grupos.map((g, gi) => (
                <Fragment key={g.grupoId}>
                  {empsPorGrupo[gi].map(emp => (
                    <td key={emp} style={{ ...tdS, textAlign: 'right', color: '#333' }}>{fmtL(totalLitrosPorEmpresa?.[emp] ?? 0)}</td>
                  ))}
                  <td style={{ ...tdS, textAlign: 'right', color: '#2e7d32', fontWeight: '800', borderLeft: '2px solid #ddd' }}>{fmtL(g.totalEntregado)}</td>
                  <td style={{ ...tdS, textAlign: 'right', color: '#1565c0', fontWeight: '800' }}>{fmtL(g.totalRecogido)}</td>
                  <td style={{ ...tdS, textAlign: 'right', color: g.totalRinde < 0 ? '#c62828' : '#e65100', fontWeight: '800', borderRight: '2px solid #ddd' }}>{fmtL(g.totalRinde)}</td>
                </Fragment>
              ))}
              {empsSinGrupo.map(emp => <td key={emp} style={{ ...tdS, textAlign: 'right' }}>{fmtL(totalLitrosPorEmpresa?.[emp] ?? 0)}</td>)}
              <td style={{ ...tdS, textAlign: 'right', color: rindeTotal < 0 ? '#c62828' : '#e65100', fontWeight: '800', borderLeft: '3px solid #ddd' }}>{fmtL(rindeTotal)}</td>
            </tr>

            {/* PRECIO TRANS */}
            <tr style={{ background: '#e3f2fd' }}>
              <td style={{ ...tdS, fontWeight: '700', color: '#1565c0', borderRight: '2px solid #ddd', fontSize: '11px' }}>$/TRANS</td>
              {grupos.map((g, gi) => (
                <Fragment key={g.grupoId}>
                  {empsPorGrupo[gi].map(emp => (
                    <td key={emp} style={{ ...tdS, textAlign: 'right', color: '#1565c0', fontSize: '11px' }}>
                      {(vc.precioTransportePorEmpresa?.[emp] ?? 0) > 0 ? fmt(vc.precioTransportePorEmpresa[emp]) : '—'}
                    </td>
                  ))}
                  <td style={{ ...tdS, borderLeft: '2px solid #ddd' }} /><td /><td style={{ borderRight: '2px solid #ddd' }} />
                </Fragment>
              ))}
              {empsSinGrupo.map(emp => (
                <td key={emp} style={{ ...tdS, textAlign: 'right', color: '#1565c0', fontSize: '11px' }}>
                  {(vc.precioTransportePorEmpresa?.[emp] ?? 0) > 0 ? fmt(vc.precioTransportePorEmpresa[emp]) : '—'}
                </td>
              ))}
              <td style={{ borderLeft: '3px solid #ddd' }} />
            </tr>

            {/* TOTAL TRANS */}
            <tr style={{ background: '#bbdefb' }}>
              <td style={{ ...tdS, fontWeight: '700', color: '#1565c0', borderRight: '2px solid #ddd', fontSize: '11px' }}>TOTAL TRANS</td>
              {grupos.map((g, gi) => (
                <Fragment key={g.grupoId}>
                  {empsPorGrupo[gi].map(emp => (
                    <td key={emp} style={{ ...tdS, textAlign: 'right', color: '#0d47a1', fontWeight: '600', fontSize: '11px' }}>
                      {(vc.totalTransportePorEmpresa?.[emp] ?? 0) > 0 ? `$${fmt(vc.totalTransportePorEmpresa[emp])}` : '—'}
                    </td>
                  ))}
                  <td style={{ ...tdS, borderLeft: '2px solid #ddd' }} /><td /><td style={{ borderRight: '2px solid #ddd' }} />
                </Fragment>
              ))}
              {empsSinGrupo.map(emp => (
                <td key={emp} style={{ ...tdS, textAlign: 'right', color: '#0d47a1', fontWeight: '600', fontSize: '11px' }}>
                  {(vc.totalTransportePorEmpresa?.[emp] ?? 0) > 0 ? `$${fmt(vc.totalTransportePorEmpresa[emp])}` : '—'}
                </td>
              ))}
              <td style={{ ...tdS, textAlign: 'right', fontWeight: '800', color: '#0d47a1', borderLeft: '3px solid #ddd', fontSize: '12px' }}>
                TRANS: ${fmt(vc.transporteTotal)}
              </td>
            </tr>

            {/* PRECIO LECHE */}
            <tr style={{ background: '#e8f5e9' }}>
              <td style={{ ...tdS, fontWeight: '700', color: '#2e7d32', borderRight: '2px solid #ddd', fontSize: '11px' }}>$/LECHE</td>
              {grupos.map((g, gi) => (
                <Fragment key={g.grupoId}>
                  {empsPorGrupo[gi].map(emp => (
                    <td key={emp} style={{ ...tdS, textAlign: 'right', color: '#2e7d32', fontSize: '11px' }}>
                      {(vc.precioLechePorEmpresa?.[emp] ?? 0) > 0 ? fmt(vc.precioLechePorEmpresa[emp]) : '—'}
                    </td>
                  ))}
                  {/* Precio de rinde del grupo */}
                  <td style={{ ...tdS, textAlign: 'right', color: '#1b5e20', fontWeight: '700', fontSize: '11px', borderLeft: '2px solid #ddd' }}>
                    {g.precioLecheRinde > 0 ? fmt(g.precioLecheRinde) : '—'}
                  </td>
                  <td /><td style={{ borderRight: '2px solid #ddd' }} />
                </Fragment>
              ))}
              {empsSinGrupo.map(emp => (
                <td key={emp} style={{ ...tdS, textAlign: 'right', color: '#2e7d32', fontSize: '11px' }}>
                  {(vc.precioLechePorEmpresa?.[emp] ?? 0) > 0 ? fmt(vc.precioLechePorEmpresa[emp]) : '—'}
                </td>
              ))}
              <td style={{ borderLeft: '3px solid #ddd' }} />
            </tr>

            {/* TOTAL LECHE */}
            <tr style={{ background: '#c8e6c9' }}>
              <td style={{ ...tdS, fontWeight: '700', color: '#1b5e20', borderRight: '2px solid #ddd', fontSize: '11px' }}>TOTAL LECHE</td>
              {grupos.map((g, gi) => (
                <Fragment key={g.grupoId}>
                  {empsPorGrupo[gi].map(emp => (
                    <td key={emp} style={{ ...tdS, textAlign: 'right', color: '#1b5e20', fontWeight: '600', fontSize: '11px' }}>
                      {(vc.totalLechePorEmpresa?.[emp] ?? 0) > 0 ? `$${fmt(vc.totalLechePorEmpresa[emp])}` : '—'}
                    </td>
                  ))}
                  {/* Valor de rinde del grupo en dinero */}
                  <td style={{ ...tdS, textAlign: 'right', color: '#1b5e20', fontWeight: '800', fontSize: '11px', borderLeft: '2px solid #ddd' }}>
                    {g.rindeValorDinero !== 0 ? `$${fmt(g.rindeValorDinero)}` : '—'}
                  </td>
                  <td /><td style={{ borderRight: '2px solid #ddd' }} />
                </Fragment>
              ))}
              {empsSinGrupo.map(emp => (
                <td key={emp} style={{ ...tdS, textAlign: 'right', color: '#1b5e20', fontWeight: '600', fontSize: '11px' }}>
                  {(vc.totalLechePorEmpresa?.[emp] ?? 0) > 0 ? `$${fmt(vc.totalLechePorEmpresa[emp])}` : '—'}
                </td>
              ))}
              <td style={{ ...tdS, textAlign: 'right', fontWeight: '800', color: '#1b5e20', borderLeft: '3px solid #ddd', fontSize: '12px' }}>
                RINDE: ${fmt(vc.rindeValorTotal)}
              </td>
            </tr>

            {/* TOTAL EMPRESA */}
            <tr style={{ background: '#1a1a2e', fontWeight: '700' }}>
              <td style={{ ...tdS, color: 'white', fontWeight: '800', borderRight: '2px solid #333' }}>TOTAL $</td>
              {grupos.map((g, gi) => (
                <Fragment key={g.grupoId}>
                  {empsPorGrupo[gi].map(emp => (
                    <td key={emp} style={{ ...tdS, textAlign: 'right', color: '#ffe082', fontWeight: '700' }}>
                      {(vc.totalValorPorEmpresa?.[emp] ?? 0) > 0 ? `$${fmt(vc.totalValorPorEmpresa[emp])}` : '—'}
                    </td>
                  ))}
                  <td style={{ borderLeft: '2px solid #333' }} /><td /><td style={{ borderRight: '2px solid #333' }} />
                </Fragment>
              ))}
              {empsSinGrupo.map(emp => (
                <td key={emp} style={{ ...tdS, textAlign: 'right', color: '#ffe082', fontWeight: '700' }}>
                  {(vc.totalValorPorEmpresa?.[emp] ?? 0) > 0 ? `$${fmt(vc.totalValorPorEmpresa[emp])}` : '—'}
                </td>
              ))}
              <td style={{ ...tdS, textAlign: 'right', fontWeight: '800', color: '#ffe082', borderLeft: '3px solid #555', fontSize: '12px' }}>
                PAGO: ${fmt(vc.pagoTotal)}
              </td>
            </tr>

            {/* RINDE + TRANSPORTE */}
            <tr style={{ background: '#0f3460' }}>
              <td colSpan={2 + todasEmpresas.length + grupos.length * 3} style={{ ...tdS, color: '#9090c0', fontSize: '11px', borderRight: '2px solid #333' }}>
                RINDE + TRANSPORTE
              </td>
              <td style={{ ...tdS, textAlign: 'right', fontWeight: '800', color: '#a5d6a7', fontSize: '13px', borderLeft: '3px solid #1a1a2e' }}>
                ${fmt(vc.rindeTransporteTotal)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}

// ── Vista global sin grupos ──────────────────────────────────────────────────
function GlobalView({ resumen }) {
  const total = (emp) => resumen.dias.reduce((s, d) => s + (d.empresas?.find(x => x.nombre === emp)?.litros ?? 0), 0)
  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
        <Tarjeta label="Total entregado"  valor={`${fmtL(resumen.totalLitrosEntregados)} L`} color="#0288d1" />
        <Tarjeta label="Total recogido"   valor={`${fmtL(resumen.totalLitrosRecogidos)} L`}  color="#388e3c" />
        <Tarjeta label="Rinde total"      valor={`${fmtL(resumen.totalRinde)} L`}             color={resumen.totalRinde >= 0 ? '#6c63ff' : '#c62828'} />
        <Tarjeta label="Valor transporte" valor={`$${fmt(resumen.totalValorTransporte)}`}     color="#e65100" />
      </div>
      <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', overflow: 'auto' }}>
        <div style={{ background: '#1a1a2e', color: 'white', padding: '11px 16px', fontWeight: '600', fontSize: '13px' }}>
          {resumen.textoQuincena?.toUpperCase()} — SIN GRUPOS CONFIGURADOS
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f0f0f0', borderBottom: '2px solid #ddd' }}>
              <th style={{ ...thS, textAlign: 'center' }}>DÍA</th>
              {resumen.empresas.map(emp => <th key={emp} style={{ ...thS, textAlign: 'right' }}>{emp}</th>)}
              <th style={{ ...thS, textAlign: 'right', background: '#e8f5e9', color: '#2e7d32' }}>ENTREGADO</th>
              <th style={{ ...thS, textAlign: 'right', background: '#e3f2fd', color: '#1565c0' }}>RECOGIDO</th>
              <th style={{ ...thS, textAlign: 'right', background: '#fff8e1', color: '#e65100' }}>RINDE</th>
            </tr>
          </thead>
          <tbody>
            {resumen.dias.map((dia, i) => {
              const ok = dia.litrosEntregados > 0 || dia.litrosRecogidos > 0
              return (
                <tr key={dia.fecha} style={{ borderBottom: '1px solid #f0f0f0', background: i % 2 === 0 ? 'white' : '#fafafa', opacity: ok ? 1 : 0.4 }}>
                  <td style={{ ...tdS, textAlign: 'center', fontWeight: '600' }}>{formatFecha(dia.fecha)}</td>
                  {resumen.empresas.map(emp => { const e = dia.empresas?.find(x => x.nombre === emp); return <td key={emp} style={{ ...tdS, textAlign: 'right', color: e ? '#1a1a2e' : '#ccc' }}>{e ? fmtL(e.litros) : '—'}</td> })}
                  <td style={{ ...tdS, textAlign: 'right', fontWeight: '600', color: '#2e7d32' }}>{dia.litrosEntregados > 0 ? fmtL(dia.litrosEntregados) : '—'}</td>
                  <td style={{ ...tdS, textAlign: 'right', fontWeight: '600', color: '#1565c0' }}>{dia.litrosRecogidos > 0 ? fmtL(dia.litrosRecogidos) : '—'}</td>
                  <td style={{ ...tdS, textAlign: 'right', fontWeight: '700', color: dia.rinde < 0 ? '#c62828' : '#e65100' }}>{ok ? fmtL(dia.rinde) : '—'}</td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr style={{ background: '#1a1a2e', color: 'white', fontWeight: '700' }}>
              <td style={{ ...tdS, textAlign: 'center', color: 'white' }}>TOTAL</td>
              {resumen.empresas.map(emp => <td key={emp} style={{ ...tdS, textAlign: 'right', color: 'white' }}>{fmtL(total(emp))}</td>)}
              <td style={{ ...tdS, textAlign: 'right', color: '#a5d6a7' }}>{fmtL(resumen.totalLitrosEntregados)}</td>
              <td style={{ ...tdS, textAlign: 'right', color: '#90caf9' }}>{fmtL(resumen.totalLitrosRecogidos)}</td>
              <td style={{ ...tdS, textAlign: 'right', color: '#ffe082' }}>{fmtL(resumen.totalRinde)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </>
  )
}

function Tarjeta({ label, valor, color }) {
  return (
    <div style={{ background: 'white', padding: '16px 18px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.07)', borderTop: `3px solid ${color}` }}>
      <p style={{ margin: 0, fontSize: '11px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</p>
      <p style={{ margin: '6px 0 0', fontSize: '20px', fontWeight: '700', color }}>{valor}</p>
    </div>
  )
}

const thS = { padding: '9px 10px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#444' }
const tdS = { padding: '8px 10px', fontSize: '12px' }
const lbl = { display: 'block', fontSize: '11px', fontWeight: '700', color: '#555', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.4px' }
const inp = { width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', marginBottom: '14px', boxSizing: 'border-box' }
const btnSm = (color) => ({ background: `${color}15`, color, border: `1px solid ${color}30`, borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' })
