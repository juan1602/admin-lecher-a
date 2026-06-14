import { useState, useEffect } from 'react'
import api from '../../api/axios'

const fmt = v => Math.round(v ?? 0).toLocaleString('es-CO')

function valorRecibo(r) {
  if (!r) return 0
  if (r.soloTransporte) return (r.litrosRecibidos || 0) * (r.precioTransporte || 0)
  return (r.litrosRecibidos || 0) * (r.precioLitro || 0)
}

export default function CuentasPersonalizadas() {
  const [quincenas, setQuincenas]           = useState([])
  const [quincenaId, setQuincenaId]         = useState('')
  const [cuentas, setCuentas]               = useState([])
  const [cuentaActiva, setCuentaActiva]     = useState(null)
  const [recibos, setRecibos]               = useState([])          // todos los recibos de la quincena
  const [ingresosIds, setIngresosIds]       = useState(new Set())   // IDs de recibos vinculados
  const [descuentos, setDescuentos]         = useState([])
  const [nuevaCuenta, setNuevaCuenta]       = useState('')
  const [formDesc, setFormDesc]             = useState({ descripcion: '', valor: '' })
  const [vistaMovil, setVistaMovil]         = useState('lista')     // 'lista' | 'detalle'

  // Carga inicial
  useEffect(() => {
    api.get('/quincenas').then(r => {
      setQuincenas(r.data)
      const abierta = r.data.find(q => !q.cerrada)
      if (abierta) setQuincenaId(String(abierta.id))
    }).catch(() => {})
    api.get('/cuentas-personalizadas').then(r => setCuentas(r.data)).catch(() => {})
  }, [])

  // Recarga recibos al cambiar de quincena
  useEffect(() => {
    if (!quincenaId) return
    api.get(`/recibos/quincena/${quincenaId}`).then(r => setRecibos(r.data)).catch(() => {})
    if (cuentaActiva) cargarDetalle(cuentaActiva.id, quincenaId)
  }, [quincenaId])

  async function cargarDetalle(cuentaId, qId) {
    try {
      const [ri, rd] = await Promise.all([
        api.get(`/cuentas-personalizadas/${cuentaId}/ingresos?quincenaId=${qId}`),
        api.get(`/cuentas-personalizadas/${cuentaId}/descuentos?quincenaId=${qId}`),
      ])
      setIngresosIds(new Set(ri.data.map(i => i.recibo.id)))
      setDescuentos(rd.data)
    } catch (e) {
      console.error(e)
    }
  }

  function seleccionarCuenta(cuenta) {
    setCuentaActiva(cuenta)
    setIngresosIds(new Set())
    setDescuentos([])
    if (quincenaId) cargarDetalle(cuenta.id, quincenaId)
    setVistaMovil('detalle')
  }

  async function crearCuenta() {
    if (!nuevaCuenta.trim()) return
    try {
      const { data } = await api.post('/cuentas-personalizadas', { nombre: nuevaCuenta.trim() })
      setCuentas(prev => [...prev, data])
      setNuevaCuenta('')
      seleccionarCuenta(data)
    } catch (e) { console.error(e) }
  }

  async function eliminarCuenta(e, id) {
    e.stopPropagation()
    if (!window.confirm('¿Eliminar esta cuenta y todos sus datos?')) return
    try {
      await api.delete(`/cuentas-personalizadas/${id}`)
      setCuentas(prev => prev.filter(c => c.id !== id))
      if (cuentaActiva?.id === id) {
        setCuentaActiva(null)
        setIngresosIds(new Set())
        setDescuentos([])
        setVistaMovil('lista')
      }
    } catch (e) { console.error(e) }
  }

  async function toggleIngreso(reciboId) {
    if (!cuentaActiva || !quincenaId) return
    try {
      if (ingresosIds.has(reciboId)) {
        await api.delete(`/cuentas-personalizadas/${cuentaActiva.id}/ingresos/${reciboId}`)
        setIngresosIds(prev => { const s = new Set(prev); s.delete(reciboId); return s })
      } else {
        await api.post(`/cuentas-personalizadas/${cuentaActiva.id}/ingresos/${reciboId}`)
        setIngresosIds(prev => new Set([...prev, reciboId]))
      }
    } catch (e) { console.error(e) }
  }

  async function agregarDescuento() {
    if (!formDesc.descripcion.trim() || !formDesc.valor || !cuentaActiva || !quincenaId) return
    try {
      const { data } = await api.post(
        `/cuentas-personalizadas/${cuentaActiva.id}/descuentos?quincenaId=${quincenaId}`,
        { descripcion: formDesc.descripcion.trim(), valor: parseFloat(formDesc.valor) }
      )
      setDescuentos(prev => [...prev, data])
      setFormDesc({ descripcion: '', valor: '' })
    } catch (e) { console.error(e) }
  }

  async function eliminarDescuento(id) {
    try {
      await api.delete(`/cuentas-personalizadas/descuentos/${id}`)
      setDescuentos(prev => prev.filter(d => d.id !== id))
    } catch (e) { console.error(e) }
  }

  // Totales
  const recibosSeleccionados = recibos.filter(r => ingresosIds.has(r.id))
  const totalIngresos        = recibosSeleccionados.reduce((s, r) => s + valorRecibo(r), 0)
  const totalDescuentos      = descuentos.reduce((s, d) => s + d.valor, 0)
  const saldoFinal           = totalIngresos - totalDescuentos

  // ── Sub-componentes de UI ────────────────────────────────────────────────

  const panelCuentas = (
    <div style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
      <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: '700', color: '#1a1a2e' }}>Mis cuentas</h3>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <input
          value={nuevaCuenta}
          onChange={e => setNuevaCuenta(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && crearCuenta()}
          placeholder="Nueva cuenta..."
          style={{ flex: 1, padding: '9px 12px', borderRadius: '8px', border: '1px solid #e0e0e0', fontSize: '13px', outline: 'none' }}
        />
        <button onClick={crearCuenta} style={{
          background: '#6c63ff', color: 'white', border: 'none', borderRadius: '8px',
          width: '36px', fontSize: '20px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>+</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {cuentas.length === 0 && (
          <p style={{ color: '#bbb', fontSize: '13px', textAlign: 'center', padding: '20px 0', margin: 0 }}>
            Crea tu primera cuenta
          </p>
        )}
        {cuentas.map(c => (
          <div key={c.id} onClick={() => seleccionarCuenta(c)} style={{
            display: 'flex', alignItems: 'center', gap: '8px', padding: '11px 12px',
            borderRadius: '8px', cursor: 'pointer', transition: 'all 0.15s',
            background: cuentaActiva?.id === c.id ? '#f0efff' : '#fafafa',
            border: `1px solid ${cuentaActiva?.id === c.id ? '#6c63ff44' : '#f0f0f0'}`,
          }}>
            <span style={{ flex: 1, fontSize: '13px', fontWeight: '500', color: cuentaActiva?.id === c.id ? '#6c63ff' : '#333' }}>
              {c.nombre}
            </span>
            <button onClick={e => eliminarCuenta(e, c.id)} style={{
              background: 'none', border: 'none', cursor: 'pointer', color: '#ccc', fontSize: '14px', padding: '2px', lineHeight: 1,
            }}>✕</button>
          </div>
        ))}
      </div>
    </div>
  )

  const panelDetalle = !cuentaActiva ? (
    <div style={{
      background: 'white', borderRadius: '12px', padding: '60px 24px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)', textAlign: 'center', color: '#bbb',
    }}>
      <div style={{ fontSize: '40px', marginBottom: '12px' }}>📋</div>
      <p style={{ fontSize: '14px', margin: 0 }}>Selecciona o crea una cuenta</p>
    </div>
  ) : (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* Header + quincena selector */}
      <div style={{ background: 'white', borderRadius: '12px', padding: '16px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        <button onClick={() => setVistaMovil('lista')} className="btn-volver"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', fontSize: '18px', padding: 0, lineHeight: 1, display: 'none' }}>
          ←
        </button>
        <h2 style={{ margin: 0, fontSize: '17px', fontWeight: '700', color: '#1a1a2e', flex: 1 }}>
          {cuentaActiva.nombre}
        </h2>
        <select
          value={quincenaId}
          onChange={e => setQuincenaId(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #e0e0e0', fontSize: '13px', color: '#333', outline: 'none' }}
        >
          <option value="">— Quincena —</option>
          {quincenas.map(q => (
            <option key={q.id} value={q.id}>{q.textoQuincena || `Quincena ${q.id}`}</option>
          ))}
        </select>
      </div>

      {/* Dos columnas: ingresos | descuentos */}
      <div className="cp-cols" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

        {/* ── Ingresos ── */}
        <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid #f0f0f0', background: '#f9fff9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: '700', fontSize: '14px', color: '#27ae60' }}>Ingresos (recibos)</span>
            <span style={{ fontWeight: '700', fontSize: '13px', color: '#27ae60' }}>${fmt(totalIngresos)}</span>
          </div>
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {recibos.length === 0 && (
              <p style={{ textAlign: 'center', color: '#bbb', padding: '30px', fontSize: '13px', margin: 0 }}>
                {quincenaId ? 'Sin recibos en esta quincena' : 'Selecciona una quincena'}
              </p>
            )}
            {recibos.map(r => {
              const seleccionado = ingresosIds.has(r.id)
              const valor = valorRecibo(r)
              return (
                <div key={r.id} onClick={() => toggleIngreso(r.id)} style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '12px 18px', cursor: 'pointer',
                  borderBottom: '1px solid #f5f5f5',
                  background: seleccionado ? '#f0fff4' : 'white',
                  transition: 'background 0.15s',
                }}>
                  <div style={{
                    width: '18px', height: '18px', borderRadius: '4px', flexShrink: 0,
                    border: `2px solid ${seleccionado ? '#27ae60' : '#ddd'}`,
                    background: seleccionado ? '#27ae60' : 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {seleccionado && <span style={{ color: 'white', fontSize: '12px', fontWeight: '700', lineHeight: 1 }}>✓</span>}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: '500', color: '#333', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {r.nombreRecibo}
                    </div>
                    <div style={{ fontSize: '11px', color: '#aaa', marginTop: '2px' }}>
                      {fmt(r.litrosRecibidos)} L × ${fmt(r.soloTransporte ? r.precioTransporte : r.precioLitro)}
                    </div>
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: seleccionado ? '#27ae60' : '#999', flexShrink: 0 }}>
                    ${fmt(valor)}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Descuentos ── */}
        <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid #f0f0f0', background: '#fff9f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: '700', fontSize: '14px', color: '#e74c3c' }}>Descuentos</span>
            <span style={{ fontWeight: '700', fontSize: '13px', color: '#e74c3c' }}>−${fmt(totalDescuentos)}</span>
          </div>

          {/* Form agregar */}
          <div style={{ padding: '12px 18px', borderBottom: '1px solid #f5f5f5', background: '#fafafa', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <input
              value={formDesc.descripcion}
              onChange={e => setFormDesc(f => ({ ...f, descripcion: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && agregarDescuento()}
              placeholder="Descripción..."
              style={{ flex: 2, minWidth: '100px', padding: '7px 10px', borderRadius: '7px', border: '1px solid #e0e0e0', fontSize: '13px', outline: 'none' }}
            />
            <input
              type="number"
              value={formDesc.valor}
              onChange={e => setFormDesc(f => ({ ...f, valor: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && agregarDescuento()}
              placeholder="Valor"
              style={{ width: '100px', padding: '7px 10px', borderRadius: '7px', border: '1px solid #e0e0e0', fontSize: '13px', outline: 'none' }}
            />
            <button onClick={agregarDescuento} style={{
              background: '#e74c3c', color: 'white', border: 'none', borderRadius: '7px',
              padding: '7px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', flexShrink: 0,
            }}>+ Agregar</button>
          </div>

          <div style={{ maxHeight: '340px', overflowY: 'auto' }}>
            {descuentos.length === 0 && (
              <p style={{ textAlign: 'center', color: '#bbb', padding: '30px', fontSize: '13px', margin: 0 }}>
                Sin descuentos
              </p>
            )}
            {descuentos.map(d => (
              <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 18px', borderBottom: '1px solid #f5f5f5' }}>
                <span style={{ flex: 1, fontSize: '13px', color: '#333' }}>{d.descripcion}</span>
                <span style={{ fontSize: '13px', fontWeight: '600', color: '#e74c3c', flexShrink: 0 }}>−${fmt(d.valor)}</span>
                <button onClick={() => eliminarDescuento(d.id)} style={{
                  background: 'none', border: 'none', cursor: 'pointer', color: '#ddd', fontSize: '14px', padding: '2px', lineHeight: 1,
                }}>✕</button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Resumen final */}
      <div style={{ background: 'white', borderRadius: '12px', padding: '18px 24px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', display: 'flex', gap: '32px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: '11px', color: '#aaa', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '4px' }}>Total ingresos</div>
          <div style={{ fontSize: '18px', fontWeight: '700', color: '#27ae60' }}>${fmt(totalIngresos)}</div>
        </div>
        <div style={{ color: '#ddd', fontSize: '20px' }}>−</div>
        <div>
          <div style={{ fontSize: '11px', color: '#aaa', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '4px' }}>Total descuentos</div>
          <div style={{ fontSize: '18px', fontWeight: '700', color: '#e74c3c' }}>${fmt(totalDescuentos)}</div>
        </div>
        <div style={{ color: '#ddd', fontSize: '20px' }}>=</div>
        <div>
          <div style={{ fontSize: '11px', color: '#aaa', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '4px' }}>Saldo final</div>
          <div style={{ fontSize: '22px', fontWeight: '800', color: saldoFinal >= 0 ? '#27ae60' : '#e74c3c' }}>${fmt(saldoFinal)}</div>
        </div>
      </div>
    </div>
  )

  return (
    <>
      <style>{`
        @media (max-width: 700px) {
          .cp-layout { flex-direction: column !important; }
          .cp-panel-lista { display: ${vistaMovil === 'lista' ? 'block' : 'none'} !important; width: auto !important; }
          .cp-panel-detalle { display: ${vistaMovil === 'detalle' ? 'block' : 'none'} !important; }
          .btn-volver { display: flex !important; }
          .cp-cols { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: '#1a1a2e' }}>Cuentas Personalizadas</h1>
      </div>

      <div className="cp-layout" style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
        <div className="cp-panel-lista" style={{ width: '260px', flexShrink: 0 }}>
          {panelCuentas}
        </div>
        <div className="cp-panel-detalle" style={{ flex: 1, minWidth: 0 }}>
          {panelDetalle}
        </div>
      </div>
    </>
  )
}
