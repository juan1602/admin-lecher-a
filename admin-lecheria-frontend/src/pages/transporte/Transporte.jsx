import { useState, useEffect } from 'react'
import api from '../../api/axios'

const fmt  = (n) => Math.round(n ?? 0).toLocaleString('es-CO')
const fmtL = (n) => Number(n ?? 0).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 1 })

function formatFecha(fechaStr) {
  if (!fechaStr) return ''
  const [, mes, dia] = fechaStr.split('-')
  return `${dia}/${mes}`
}

const TIPO_LECHE_OPTS = [
  { value: '',       label: 'Todos los tipos' },
  { value: 'vaca',   label: 'Vaca' },
  { value: 'bufala', label: 'Búfala' },
]

const GRUPO_FORM_INIT = { nombre: '', tipoLeche: '', rutaIds: [], empresas: [] }

// ── Colores para diferenciar grupos visualmente ──
const GRUPO_COLORES = ['#0288d1', '#388e3c', '#e65100', '#6c63ff', '#c62828', '#00838f']

export default function Transporte() {
  const [quincenas, setQuincenas]         = useState([])
  const [quincenaId, setQuincenaId]       = useState('')
  const [grupos, setGrupos]               = useState([])
  const [resumenGrupos, setResumenGrupos] = useState([])
  const [resumen, setResumen]             = useState(null)   // fallback sin grupos
  const [rutas, setRutas]                 = useState([])
  const [cargando, setCargando]           = useState(false)
  const [error, setError]                 = useState(null)
  const [mostrarConfig, setMostrarConfig] = useState(false)
  const [modal, setModal]                 = useState(null)   // null=cerrado | GRUPO_FORM_INIT | grupo existente
  const [form, setForm]                   = useState(GRUPO_FORM_INIT)
  const [empresaInput, setEmpresaInput]   = useState('')
  const [guardando, setGuardando]         = useState(false)
  const [empresasExistentes, setEmpresasExistentes] = useState([])

  useEffect(() => {
    Promise.all([
      api.get('/quincenas'),
      api.get('/grupos-rinde'),
      api.get('/rutas'),
      api.get('/recibos/empresas'),
    ]).then(([qRes, gRes, rRes, eRes]) => {
      setEmpresasExistentes(eRes.data ?? [])
      setQuincenas(qRes.data)
      setGrupos(gRes.data)
      setRutas(rRes.data)
      const abierta = qRes.data.find(q => !q.cerrada)
      if (abierta) {
        setQuincenaId(String(abierta.id))
        cargarResumen(abierta.id, gRes.data)
      }
    }).catch(() => setError('No se pudo conectar con el servidor.'))
  }, [])

  const cargarResumen = async (id, gruposActuales = grupos) => {
    if (!id) return
    setCargando(true); setError(null)
    try {
      if (gruposActuales.length > 0) {
        const r = await api.get(`/grupos-rinde/transporte/${id}`)
        setResumenGrupos(r.data)
        setResumen(null)
      } else {
        const r = await api.get(`/recibos/transporte/${id}`)
        setResumen(r.data)
        setResumenGrupos([])
      }
    } catch (e) {
      setError(`Error al cargar: ${e?.response?.status ?? 'sin conexión'}`)
    } finally {
      setCargando(false) }
  }

  const handleQuincena = (e) => {
    setQuincenaId(e.target.value); setResumen(null); setResumenGrupos([]); setError(null)
    if (e.target.value) cargarResumen(e.target.value)
  }

  // ── CRUD grupos ──
  const abrirNuevo = () => { setForm(GRUPO_FORM_INIT); setEmpresaInput(''); setModal('nuevo') }
  const abrirEditar = (g) => {
    setForm({ id: g.id, nombre: g.nombre, tipoLeche: g.tipoLeche ?? '', rutaIds: [...g.rutaIds], empresas: [...g.empresas] })
    setEmpresaInput('')
    setModal('editar')
  }

  const toggleRuta = (id) => {
    setForm(f => ({
      ...f,
      rutaIds: f.rutaIds.includes(id) ? f.rutaIds.filter(r => r !== id) : [...f.rutaIds, id]
    }))
  }

  const agregarEmpresa = () => {
    const v = empresaInput.trim()
    if (!v || form.empresas.map(e => e.toLowerCase()).includes(v.toLowerCase())) return
    setForm(f => ({ ...f, empresas: [...f.empresas, v] }))
    setEmpresaInput('')
  }

  const quitarEmpresa = (emp) => setForm(f => ({ ...f, empresas: f.empresas.filter(e => e !== emp) }))

  const guardarGrupo = async () => {
    if (!form.nombre.trim()) return
    setGuardando(true)
    try {
      if (form.id) {
        await api.put(`/grupos-rinde/${form.id}`, form)
      } else {
        await api.post('/grupos-rinde', form)
      }
      const r = await api.get('/grupos-rinde')
      setGrupos(r.data)
      setModal(null)
      if (quincenaId) cargarResumen(quincenaId, r.data)
    } catch { /* mostrar error */ }
    finally { setGuardando(false) }
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
      {/* ── HEADER ── */}
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ margin: 0 }}>Control de Transporte</h2>
        <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#666' }}>
          Litros entregados a empresa vs. litros recogidos · Rinde por grupo
        </p>
      </div>

      {/* ── SELECTOR QUINCENA ── */}
      <div style={{ background: 'white', padding: '16px', borderRadius: '12px', marginBottom: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.07)', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <label style={{ fontSize: '14px', fontWeight: '600' }}>Quincena:</label>
        <select value={quincenaId} onChange={handleQuincena}
          style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px', minWidth: '280px', flex: 1 }}>
          <option value="">Seleccionar quincena...</option>
          {quincenas.map(q => (
            <option key={q.id} value={q.id}>{q.textoQuincena}{!q.cerrada ? ' (Abierta)' : ''}</option>
          ))}
        </select>
      </div>

      {/* ── PANEL CONFIGURACIÓN GRUPOS ── */}
      <div style={{ background: 'white', borderRadius: '12px', marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
        <button onClick={() => setMostrarConfig(v => !v)} style={{
          width: '100%', background: 'none', border: 'none', padding: '14px 18px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          fontSize: '13px', fontWeight: '700', color: '#444',
        }}>
          <span>⚙ Grupos de Rinde {grupos.length > 0 ? `(${grupos.length})` : '— sin grupos configurados'}</span>
          <span style={{ fontSize: '11px', color: '#999' }}>{mostrarConfig ? '▲ Ocultar' : '▼ Ver / editar'}</span>
        </button>

        {mostrarConfig && (
          <div style={{ borderTop: '1px solid #f0f0f0', padding: '16px 18px' }}>
            {grupos.length === 0 ? (
              <p style={{ margin: '0 0 14px', fontSize: '13px', color: '#999' }}>
                Sin grupos configurados. Crea uno para separar el rinde por tipo de leche o ruta.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '14px' }}>
                {grupos.map((g, i) => (
                  <div key={g.id} style={{
                    border: `1px solid ${GRUPO_COLORES[i % GRUPO_COLORES.length]}30`,
                    borderLeft: `4px solid ${GRUPO_COLORES[i % GRUPO_COLORES.length]}`,
                    borderRadius: '8px', padding: '10px 14px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
                    background: `${GRUPO_COLORES[i % GRUPO_COLORES.length]}05`,
                  }}>
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '14px', color: '#1a1a2e' }}>{g.nombre}</div>
                      <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>
                        {g.tipoLeche ? `Tipo: ${g.tipoLeche} · ` : ''}
                        Rutas: {g.rutaIds?.length ? g.rutaIds.map(id => rutas.find(r => r.id === id)?.nombre ?? id).join(', ') : 'todas'}
                        {' · '}
                        Empresas: {g.empresas?.length ? g.empresas.join(', ') : '—'}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                      <button onClick={() => abrirEditar(g)} style={btnSm('#0288d1')}>✏ Editar</button>
                      <button onClick={() => eliminarGrupo(g.id)} style={btnSm('#c62828')}>🗑</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button onClick={abrirNuevo} style={{
              background: '#6c63ff', color: 'white', border: 'none', borderRadius: '8px',
              padding: '8px 16px', cursor: 'pointer', fontWeight: '600', fontSize: '13px',
            }}>
              + Nuevo grupo
            </button>
          </div>
        )}
      </div>

      {/* ── MODAL FORMULARIO GRUPO ── */}
      {modal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
        }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '480px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '16px' }}>{form.id ? 'Editar grupo' : 'Nuevo grupo de rinde'}</h3>
              <button onClick={() => setModal(null)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#999' }}>✕</button>
            </div>

            {/* Nombre */}
            <label style={labelStyle}>Nombre del grupo</label>
            <input value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
              placeholder="Ej: Vaca Cairo" style={inputStyle} />

            {/* Tipo de leche */}
            <label style={labelStyle}>Tipo de leche (opcional)</label>
            <select value={form.tipoLeche} onChange={e => setForm(f => ({ ...f, tipoLeche: e.target.value }))} style={inputStyle}>
              {TIPO_LECHE_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>

            {/* Rutas */}
            <label style={labelStyle}>Rutas de proveedores (litros recogidos)</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
              {rutas.length === 0 && <span style={{ fontSize: '12px', color: '#999' }}>No hay rutas creadas</span>}
              {rutas.map(r => (
                <label key={r.id} style={{
                  display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer',
                  padding: '6px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: '500',
                  border: `2px solid ${form.rutaIds.includes(r.id) ? '#6c63ff' : '#e0e0e0'}`,
                  background: form.rutaIds.includes(r.id) ? '#f0eeff' : 'white',
                  color: form.rutaIds.includes(r.id) ? '#6c63ff' : '#444',
                  userSelect: 'none',
                }}>
                  <input type="checkbox" checked={form.rutaIds.includes(r.id)} onChange={() => toggleRuta(r.id)}
                    style={{ accentColor: '#6c63ff' }} />
                  {r.nombre}
                </label>
              ))}
            </div>

            {/* Empresas */}
            <label style={labelStyle}>Empresas compradoras (litros entregados)</label>

            {/* Chips seleccionables de empresas ya existentes en recibos */}
            {empresasExistentes.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                {empresasExistentes.map(emp => {
                  const seleccionada = form.empresas.map(e => e.toLowerCase()).includes(emp.toLowerCase())
                  return (
                    <button key={emp} type="button" onClick={() => seleccionada ? quitarEmpresa(emp) : setForm(f => ({ ...f, empresas: [...f.empresas, emp] }))}
                      style={{
                        padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: '600',
                        cursor: 'pointer', border: `2px solid ${seleccionada ? '#0288d1' : '#e0e0e0'}`,
                        background: seleccionada ? '#e8f4fd' : 'white',
                        color: seleccionada ? '#0288d1' : '#666',
                        transition: 'all 0.15s',
                      }}>
                      {seleccionada ? '✓ ' : ''}{emp}
                    </button>
                  )
                })}
              </div>
            )}

            {/* Campo para agregar una empresa nueva que aún no tiene recibos */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <input value={empresaInput} onChange={e => setEmpresaInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), agregarEmpresa())}
                placeholder={empresasExistentes.length > 0 ? 'Agregar empresa nueva...' : 'Ej: TATIANA'}
                style={{ ...inputStyle, marginBottom: 0, flex: 1 }} />
              <button onClick={agregarEmpresa} style={{ background: '#6c63ff', color: 'white', border: 'none', borderRadius: '8px', padding: '0 14px', cursor: 'pointer', fontWeight: '600', whiteSpace: 'nowrap' }}>
                + Nueva
              </button>
            </div>
            {form.empresas.length === 0 && (
              <p style={{ margin: '0 0 16px', fontSize: '12px', color: '#bbb' }}>Sin empresas seleccionadas</p>
            )}
            {form.empresas.length > 0 && (
              <p style={{ margin: '0 0 16px', fontSize: '12px', color: '#0288d1', fontWeight: '600' }}>
                Seleccionadas: {form.empresas.join(', ')}
              </p>
            )}

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setModal(null)} style={{ background: '#f5f5f5', border: 'none', borderRadius: '8px', padding: '10px 20px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}>
                Cancelar
              </button>
              <button onClick={guardarGrupo} disabled={guardando || !form.nombre.trim()} style={{
                background: form.nombre.trim() ? '#6c63ff' : '#ccc', color: 'white', border: 'none',
                borderRadius: '8px', padding: '10px 20px', cursor: form.nombre.trim() ? 'pointer' : 'default',
                fontWeight: '700', fontSize: '14px',
              }}>
                {guardando ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ERROR ── */}
      {error && (
        <div style={{ padding: '14px 18px', borderRadius: '10px', background: '#ffebee', color: '#c62828', marginBottom: '16px', border: '1px solid #ffcdd2' }}>
          ⚠️ {error}
        </div>
      )}

      {cargando && <div style={{ textAlign: 'center', padding: '60px', color: '#999' }}>Cargando datos...</div>}

      {/* ── VISTA POR GRUPOS ── */}
      {!cargando && resumenGrupos.length > 0 && resumenGrupos.map((g, gi) => (
        <GrupoView key={g.grupoId} grupo={g} color={GRUPO_COLORES[gi % GRUPO_COLORES.length]} />
      ))}

      {/* ── VISTA GLOBAL (sin grupos) ── */}
      {!cargando && resumen && <GlobalView resumen={resumen} />}

      {/* ── ESTADO VACÍO ── */}
      {!cargando && !resumen && resumenGrupos.length === 0 && quincenaId && !error && (
        <div style={{ textAlign: 'center', padding: '60px', color: '#999', background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          {grupos.length === 0
            ? 'Configura los grupos de rinde arriba, o ve a Recibos para registrar entregas.'
            : 'No hay recibos registrados para esta quincena.'}
        </div>
      )}
    </div>
  )
}

// ── Vista de un grupo de rinde ──────────────────────────────────────────────
function GrupoView({ grupo, color }) {
  const totalPorEmpresa = (nombre) =>
    grupo.dias.reduce((s, d) => s + (d.empresas?.find(x => x.nombre === nombre)?.litros ?? 0), 0)

  return (
    <div style={{ marginBottom: '28px' }}>
      {/* Cabecera del grupo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
        <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: color, flexShrink: 0 }} />
        <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: '#1a1a2e', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
          {grupo.nombre}
        </h3>
        <span style={{ fontSize: '12px', color: '#aaa' }}>
          {grupo.rutaNombres?.length ? `Rutas: ${grupo.rutaNombres.join(', ')}` : ''}
          {grupo.tipoLeche ? ` · ${grupo.tipoLeche}` : ''}
        </span>
      </div>

      {/* KPIs del grupo */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '14px' }}>
        <Tarjeta label="Total entregado"   valor={`${fmtL(grupo.totalEntregados)} L`}   color="#0288d1" />
        <Tarjeta label="Total recogido"    valor={`${fmtL(grupo.totalRecogidos)} L`}    color="#388e3c" />
        <Tarjeta label="Rinde total"       valor={`${fmtL(grupo.rinde)} L`}             color={grupo.rinde >= 0 ? '#6c63ff' : '#c62828'} />
        <Tarjeta label="Valor transporte"  valor={`$${fmt(grupo.totalValorTransporte)}`} color="#e65100" />
      </div>

      {/* Tabla diaria del grupo */}
      <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.07)', overflow: 'auto', marginBottom: '14px' }}>
        <div style={{ background: color, color: 'white', padding: '11px 16px', fontWeight: '700', fontSize: '13px' }}>
          {grupo.nombre.toUpperCase()} — RINDE DIARIO
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: `${200 + grupo.empresas.length * 90}px` }}>
          <thead>
            <tr style={{ background: '#f5f5f5', borderBottom: '2px solid #e0e0e0' }}>
              <th style={{ ...th, width: '60px', textAlign: 'center' }}>DÍA</th>
              {grupo.empresas.map(emp => (
                <th key={emp} style={{ ...th, textAlign: 'right' }}>{emp}</th>
              ))}
              <th style={{ ...th, textAlign: 'right', background: '#e8f5e9', color: '#2e7d32', borderLeft: '2px solid #c8e6c9' }}>ENTREGADO</th>
              <th style={{ ...th, textAlign: 'right', background: '#e3f2fd', color: '#1565c0', borderLeft: '2px solid #bbdefb' }}>RECOGIDO</th>
              <th style={{ ...th, textAlign: 'right', background: '#fff8e1', color: '#e65100', borderLeft: '2px solid #ffe0b2' }}>RINDE</th>
            </tr>
          </thead>
          <tbody>
            {grupo.dias.map((dia, i) => {
              const tieneData = dia.litrosEntregados > 0 || dia.litrosRecogidos > 0
              return (
                <tr key={dia.fecha} style={{
                  borderBottom: '1px solid #f0f0f0',
                  background: tieneData ? (i % 2 === 0 ? 'white' : '#fafafa') : '#fafafa',
                  opacity: tieneData ? 1 : 0.4,
                }}>
                  <td style={{ ...td, textAlign: 'center', fontWeight: '600', color: '#555' }}>{formatFecha(dia.fecha)}</td>
                  {grupo.empresas.map(emp => {
                    const e = dia.empresas?.find(x => x.nombre === emp)
                    return (
                      <td key={emp} style={{ ...td, textAlign: 'right', color: e ? '#1a1a2e' : '#ccc' }}>
                        {e ? fmtL(e.litros) : '—'}
                      </td>
                    )
                  })}
                  <td style={{ ...td, textAlign: 'right', fontWeight: '600', color: '#2e7d32', borderLeft: '2px solid #e8f5e9' }}>
                    {dia.litrosEntregados > 0 ? fmtL(dia.litrosEntregados) : '—'}
                  </td>
                  <td style={{ ...td, textAlign: 'right', fontWeight: '600', color: '#1565c0', borderLeft: '2px solid #e3f2fd' }}>
                    {dia.litrosRecogidos > 0 ? fmtL(dia.litrosRecogidos) : '—'}
                  </td>
                  <td style={{ ...td, textAlign: 'right', fontWeight: '700', borderLeft: '2px solid #fff8e1', color: dia.rinde > 0 ? '#e65100' : dia.rinde < 0 ? '#c62828' : '#999' }}>
                    {tieneData ? fmtL(dia.rinde) : '—'}
                  </td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr style={{ background: '#1a1a2e', color: 'white', fontWeight: '700' }}>
              <td style={{ ...td, textAlign: 'center', color: 'white' }}>TOTAL</td>
              {grupo.empresas.map(emp => (
                <td key={emp} style={{ ...td, textAlign: 'right', color: 'white' }}>{fmtL(totalPorEmpresa(emp))}</td>
              ))}
              <td style={{ ...td, textAlign: 'right', color: '#a5d6a7', borderLeft: '2px solid #2a4a2a' }}>{fmtL(grupo.totalEntregados)}</td>
              <td style={{ ...td, textAlign: 'right', color: '#90caf9', borderLeft: '2px solid #1a2a4a' }}>{fmtL(grupo.totalRecogidos)}</td>
              <td style={{ ...td, textAlign: 'right', color: '#ffe082', borderLeft: '2px solid #4a3a1a' }}>{fmtL(grupo.rinde)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Desglose por empresa del grupo */}
      {grupo.empresas.length > 0 && (
        <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
          <div style={{ background: '#f5f5f5', borderBottom: '1px solid #e0e0e0', padding: '10px 16px', fontSize: '12px', fontWeight: '700', color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {grupo.nombre} — Desglose por empresa
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#fafafa', borderBottom: '1px solid #e0e0e0' }}>
                <th style={th}>Empresa</th>
                <th style={{ ...th, textAlign: 'right' }}>Litros</th>
                <th style={{ ...th, textAlign: 'right' }}>$/Litro</th>
                <th style={{ ...th, textAlign: 'right' }}>$/Trans.</th>
                <th style={{ ...th, textAlign: 'right' }}>$/Proveedor</th>
                <th style={{ ...th, textAlign: 'right', color: '#e65100' }}>Transporte</th>
                <th style={{ ...th, textAlign: 'right', color: '#1b5e20' }}>A proveedores</th>
              </tr>
            </thead>
            <tbody>
              {grupo.empresas.map((emp, i) => {
                let litros = 0, vTrans = 0, vProv = 0, pl = 0, pt = 0
                grupo.dias.forEach(dia => {
                  const e = dia.empresas?.find(x => x.nombre === emp)
                  if (e) { litros += e.litros ?? 0; vTrans += e.valorTransporte ?? 0; vProv += e.valorProveedor ?? 0; pl = e.precioLitro ?? pl; pt = e.precioTransporte ?? pt }
                })
                return (
                  <tr key={emp} style={{ borderBottom: '1px solid #f0f0f0', background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                    <td style={{ ...td, fontWeight: '600' }}>{emp}</td>
                    <td style={{ ...td, textAlign: 'right' }}>{fmtL(litros)} L</td>
                    <td style={{ ...td, textAlign: 'right', color: '#666' }}>${fmt(pl)}</td>
                    <td style={{ ...td, textAlign: 'right', color: '#e65100' }}>${fmt(pt)}</td>
                    <td style={{ ...td, textAlign: 'right', color: '#1b5e20' }}>${fmt(pl - pt)}</td>
                    <td style={{ ...td, textAlign: 'right', color: '#e65100', fontWeight: '500' }}>${fmt(vTrans)}</td>
                    <td style={{ ...td, textAlign: 'right', color: '#1b5e20', fontWeight: '600' }}>${fmt(vProv)}</td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr style={{ background: '#1a1a2e', color: 'white', fontWeight: '700' }}>
                <td style={{ ...td, color: 'white' }}>TOTAL</td>
                <td style={{ ...td, textAlign: 'right', color: 'white' }}>{fmtL(grupo.totalEntregados)} L</td>
                <td colSpan={3} style={td} />
                <td style={{ ...td, textAlign: 'right', color: '#ef9a9a' }}>${fmt(grupo.totalValorTransporte)}</td>
                <td style={{ ...td, textAlign: 'right', color: '#a5d6a7' }}>${fmt(grupo.totalValorProveedor)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  )
}

// ── Vista global sin grupos (comportamiento anterior) ─────────────────────
function GlobalView({ resumen }) {
  const totalPorEmpresa = (nombre) =>
    resumen.dias.reduce((s, d) => s + (d.empresas?.find(x => x.nombre === nombre)?.litros ?? 0), 0)

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '24px' }}>
        <Tarjeta label="Total entregado" valor={`${fmtL(resumen.totalLitrosEntregados)} L`} color="#0288d1" />
        <Tarjeta label="Total recogido"  valor={`${fmtL(resumen.totalLitrosRecogidos)} L`}  color="#388e3c" />
        <Tarjeta label="Rinde total"     valor={`${fmtL(resumen.totalRinde)} L`}             color={resumen.totalRinde >= 0 ? '#6c63ff' : '#c62828'} />
        <Tarjeta label="Valor transporte" valor={`$${fmt(resumen.totalValorTransporte)}`}    color="#e65100" />
      </div>

      <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', overflow: 'auto', marginBottom: '24px' }}>
        <div style={{ background: '#1a1a2e', color: 'white', padding: '13px 18px', fontWeight: '600', fontSize: '13px' }}>
          {resumen.textoQuincena?.toUpperCase()} — TRANSPORTE Y RINDE
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: `${220 + resumen.empresas.length * 90}px` }}>
          <thead>
            <tr style={{ background: '#f0f0f0', borderBottom: '2px solid #ddd' }}>
              <th style={{ ...th, width: '60px', textAlign: 'center' }}>DÍA</th>
              {resumen.empresas.map(emp => <th key={emp} style={{ ...th, textAlign: 'right' }}>{emp}</th>)}
              <th style={{ ...th, textAlign: 'right', background: '#e8f5e9', color: '#2e7d32', borderLeft: '2px solid #c8e6c9' }}>ENTREGADO</th>
              <th style={{ ...th, textAlign: 'right', background: '#e3f2fd', color: '#1565c0', borderLeft: '2px solid #bbdefb' }}>RECOGIDO</th>
              <th style={{ ...th, textAlign: 'right', background: '#fff8e1', color: '#e65100', borderLeft: '2px solid #ffe0b2' }}>RINDE</th>
            </tr>
          </thead>
          <tbody>
            {resumen.dias.map((dia, i) => {
              const tieneData = dia.litrosEntregados > 0 || dia.litrosRecogidos > 0
              return (
                <tr key={dia.fecha} style={{ borderBottom: '1px solid #f0f0f0', background: tieneData ? (i % 2 === 0 ? 'white' : '#fafafa') : '#fafafa', opacity: tieneData ? 1 : 0.4 }}>
                  <td style={{ ...td, textAlign: 'center', fontWeight: '600', color: '#555' }}>{formatFecha(dia.fecha)}</td>
                  {resumen.empresas.map(emp => {
                    const e = dia.empresas?.find(x => x.nombre === emp)
                    return <td key={emp} style={{ ...td, textAlign: 'right', color: e ? '#1a1a2e' : '#ccc' }}>{e ? fmtL(e.litros) : '—'}</td>
                  })}
                  <td style={{ ...td, textAlign: 'right', fontWeight: '600', color: '#2e7d32', borderLeft: '2px solid #e8f5e9' }}>{dia.litrosEntregados > 0 ? fmtL(dia.litrosEntregados) : '—'}</td>
                  <td style={{ ...td, textAlign: 'right', fontWeight: '600', color: '#1565c0', borderLeft: '2px solid #e3f2fd' }}>{dia.litrosRecogidos > 0 ? fmtL(dia.litrosRecogidos) : '—'}</td>
                  <td style={{ ...td, textAlign: 'right', fontWeight: '700', borderLeft: '2px solid #fff8e1', color: dia.rinde > 0 ? '#e65100' : dia.rinde < 0 ? '#c62828' : '#999' }}>{tieneData ? fmtL(dia.rinde) : '—'}</td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr style={{ background: '#1a1a2e', color: 'white', fontWeight: '700' }}>
              <td style={{ ...td, textAlign: 'center', color: 'white' }}>TOTAL</td>
              {resumen.empresas.map(emp => <td key={emp} style={{ ...td, textAlign: 'right', color: 'white' }}>{fmtL(totalPorEmpresa(emp))}</td>)}
              <td style={{ ...td, textAlign: 'right', color: '#a5d6a7', borderLeft: '2px solid #2a4a2a' }}>{fmtL(resumen.totalLitrosEntregados)}</td>
              <td style={{ ...td, textAlign: 'right', color: '#90caf9', borderLeft: '2px solid #1a2a4a' }}>{fmtL(resumen.totalLitrosRecogidos)}</td>
              <td style={{ ...td, textAlign: 'right', color: '#ffe082', borderLeft: '2px solid #4a3a1a' }}>{fmtL(resumen.totalRinde)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {resumen.empresas.length > 0 && (
        <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
          <div style={{ background: '#1a1a2e', color: 'white', padding: '12px 18px', fontWeight: '600', fontSize: '13px' }}>
            DESGLOSE POR EMPRESA — TRANSPORTE vs. PROVEEDOR
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f5f5f5', borderBottom: '1px solid #e0e0e0' }}>
                <th style={th}>Empresa</th>
                <th style={{ ...th, textAlign: 'right' }}>Litros</th>
                <th style={{ ...th, textAlign: 'right' }}>$/Litro</th>
                <th style={{ ...th, textAlign: 'right' }}>$/Trans.</th>
                <th style={{ ...th, textAlign: 'right' }}>$/Proveedor</th>
                <th style={{ ...th, textAlign: 'right', color: '#e65100' }}>Transporte</th>
                <th style={{ ...th, textAlign: 'right', color: '#1b5e20' }}>A proveedores</th>
                <th style={{ ...th, textAlign: 'right' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {resumen.empresas.map((emp, i) => {
                let litros=0, vTrans=0, vProv=0, vTotal=0, pl=0, pt=0
                resumen.dias.forEach(dia => {
                  const e = dia.empresas?.find(x => x.nombre === emp)
                  if (e) { litros += e.litros??0; vTrans += e.valorTransporte??0; vProv += e.valorProveedor??0; vTotal += e.valorTotal??0; pl = e.precioLitro??pl; pt = e.precioTransporte??pt }
                })
                return (
                  <tr key={emp} style={{ borderBottom: '1px solid #f0f0f0', background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                    <td style={{ ...td, fontWeight: '600' }}>{emp}</td>
                    <td style={{ ...td, textAlign: 'right' }}>{fmtL(litros)} L</td>
                    <td style={{ ...td, textAlign: 'right', color: '#666' }}>${fmt(pl)}</td>
                    <td style={{ ...td, textAlign: 'right', color: '#e65100' }}>${fmt(pt)}</td>
                    <td style={{ ...td, textAlign: 'right', color: '#1b5e20' }}>${fmt(pl - pt)}</td>
                    <td style={{ ...td, textAlign: 'right', color: '#e65100', fontWeight: '500' }}>${fmt(vTrans)}</td>
                    <td style={{ ...td, textAlign: 'right', color: '#1b5e20', fontWeight: '600' }}>${fmt(vProv)}</td>
                    <td style={{ ...td, textAlign: 'right', fontWeight: '500' }}>${fmt(vTotal)}</td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr style={{ background: '#1a1a2e', color: 'white', fontWeight: '700' }}>
                <td style={{ ...td, color: 'white' }}>TOTAL</td>
                <td style={{ ...td, textAlign: 'right', color: 'white' }}>{fmtL(resumen.totalLitrosEntregados)} L</td>
                <td colSpan={3} style={td} />
                <td style={{ ...td, textAlign: 'right', color: '#ef9a9a' }}>${fmt(resumen.totalValorTransporte)}</td>
                <td style={{ ...td, textAlign: 'right', color: '#a5d6a7', fontSize: '15px' }}>${fmt(resumen.totalValorProveedor)}</td>
                <td style={{ ...td, textAlign: 'right', color: 'white' }}>${fmt(resumen.totalValorTransporte + resumen.totalValorProveedor)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
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

const th = { padding: '10px 12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#444' }
const td = { padding: '9px 12px', fontSize: '13px' }
const labelStyle = { display: 'block', fontSize: '12px', fontWeight: '700', color: '#555', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.4px' }
const inputStyle = { width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', marginBottom: '16px', boxSizing: 'border-box', outline: 'none' }
const btnSm = (color) => ({ background: `${color}15`, color, border: `1px solid ${color}30`, borderRadius: '6px', padding: '5px 10px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' })
