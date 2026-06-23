import { useState, useEffect } from 'react'
import api from '../../api/axios'
import { pdfCuentaPersonalizada } from '../../utils/pdf'

const fmt = v => Math.round(v ?? 0).toLocaleString('es-CO')

function valorRecibo(r) {
  if (!r) return 0
  if (r.soloTransporte) return (r.litrosRecibidos || 0) * (r.precioTransporte || 0)
  return (r.litrosRecibidos || 0) * (r.precioLitro || 0)
}

export default function CuentasPersonalizadas() {
  const [quincenas, setQuincenas]             = useState([])
  const [quincenaId, setQuincenaId]           = useState('')
  const [cuentas, setCuentas]                 = useState([])
  const [cuentaActiva, setCuentaActiva]       = useState(null)
  const [recibosAgrupados, setRecibosAgrupados] = useState([])
  const [ingresosNombres, setIngresosNombres] = useState(new Set())
  const [ingresosManual, setIngresosManual]   = useState([])
  const [descuentos, setDescuentos]           = useState([])
  const [formDesc, setFormDesc]               = useState({ descripcion: '', valor: '' })
  const [formManual, setFormManual]           = useState({ descripcion: '', valor: '' })
  const [editandoManual, setEditandoManual]   = useState(null)
  const [vistaMovil, setVistaMovil]           = useState('lista')

  // Modales
  const [modalCrear, setModalCrear]           = useState(false)
  const [modalIngresos, setModalIngresos]     = useState(false)
  const [nombreNueva, setNombreNueva]         = useState('')
  const [seleccionModal, setSeleccionModal]   = useState(new Set()) // temporal en modal

  // ── Carga inicial ────────────────────────────────────────────────────────
  useEffect(() => {
    api.get('/quincenas').then(r => {
      setQuincenas(r.data)
      const abierta = r.data.find(q => !q.cerrada)
      if (abierta) setQuincenaId(String(abierta.id))
    }).catch(() => {})
    api.get('/cuentas-personalizadas').then(r => setCuentas(r.data)).catch(() => {})
  }, [])

  // ── Recibos agrupados al cambiar quincena ────────────────────────────────
  useEffect(() => {
    if (!quincenaId) { setRecibosAgrupados([]); return }
    api.get(`/recibos/quincena/${quincenaId}`).then(r => {
      const grupos = Object.values(
        r.data.reduce((acc, rec) => {
          const key = rec.nombreRecibo
          if (!acc[key]) acc[key] = { nombre: key, litros: 0, valor: 0 }
          acc[key].litros += rec.litrosRecibidos || 0
          acc[key].valor  += valorRecibo(rec)
          return acc
        }, {})
      ).sort((a, b) => a.nombre.localeCompare(b.nombre))
      setRecibosAgrupados(grupos)
    }).catch(() => {})

    if (cuentaActiva) cargarDetalle(cuentaActiva.id, quincenaId)
  }, [quincenaId])

  async function cargarDetalle(cuentaId, qId) {
    try {
      const [ri, rm, rd] = await Promise.all([
        api.get(`/cuentas-personalizadas/${cuentaId}/ingresos?quincenaId=${qId}`),
        api.get(`/cuentas-personalizadas/${cuentaId}/ingresos-manual?quincenaId=${qId}`),
        api.get(`/cuentas-personalizadas/${cuentaId}/descuentos?quincenaId=${qId}`),
      ])
      let ingresos = ri.data
      if (ingresos.length === 0) {
        const heredados = await api.post(`/cuentas-personalizadas/${cuentaId}/ingresos/heredar?quincenaId=${qId}`)
        ingresos = heredados.data
      }
      setIngresosNombres(new Set(ingresos.map(i => i.nombreRecibo)))
      setIngresosManual(rm.data)
      setDescuentos(rd.data)
    } catch (e) { console.error(e) }
  }

  async function agregarIngresoManual() {
    if (!formManual.descripcion.trim() || !formManual.valor || !cuentaActiva || !quincenaId) return
    try {
      const { data } = await api.post(
        `/cuentas-personalizadas/${cuentaActiva.id}/ingresos-manual?quincenaId=${quincenaId}`,
        { descripcion: formManual.descripcion.trim(), valor: parseFloat(formManual.valor) }
      )
      setIngresosManual(prev => [...prev, data])
      setFormManual({ descripcion: '', valor: '' })
    } catch (e) { console.error(e) }
  }

  async function guardarEdicionManual() {
    if (!editandoManual) return
    try {
      const { data } = await api.put(
        `/cuentas-personalizadas/ingresos-manual/${editandoManual.id}`,
        { descripcion: editandoManual.descripcion, valor: parseFloat(editandoManual.valor) }
      )
      setIngresosManual(prev => prev.map(m => m.id === data.id ? data : m))
      setEditandoManual(null)
    } catch (e) { console.error(e) }
  }

  async function eliminarIngresoManual(id) {
    try {
      await api.delete(`/cuentas-personalizadas/ingresos-manual/${id}`)
      setIngresosManual(prev => prev.filter(m => m.id !== id))
    } catch (e) { console.error(e) }
  }

  function seleccionarCuenta(cuenta) {
    setCuentaActiva(cuenta)
    setIngresosNombres(new Set())
    setIngresosManual([])
    setDescuentos([])
    if (quincenaId) cargarDetalle(cuenta.id, quincenaId)
    setVistaMovil('detalle')
  }

  async function eliminarCuenta(e, id) {
    e.stopPropagation()
    if (!window.confirm('¿Eliminar esta cuenta y todos sus datos?')) return
    try {
      await api.delete(`/cuentas-personalizadas/${id}`)
      setCuentas(prev => prev.filter(c => c.id !== id))
      if (cuentaActiva?.id === id) {
        setCuentaActiva(null); setIngresosNombres(new Set()); setIngresosManual([]); setDescuentos([])
        setVistaMovil('lista')
      }
    } catch (e) { console.error(e) }
  }

  // ── Modal crear cuenta ────────────────────────────────────────────────────
  function abrirModalCrear() {
    setNombreNueva('')
    setSeleccionModal(new Set())
    setModalCrear(true)
  }

  async function confirmarCrear() {
    if (!nombreNueva.trim()) return
    try {
      const { data: cuenta } = await api.post('/cuentas-personalizadas', { nombre: nombreNueva.trim() })
      // Vincular ingresos seleccionados
      if (quincenaId) {
        for (const nombre of seleccionModal) {
          await api.post(`/cuentas-personalizadas/${cuenta.id}/ingresos?quincenaId=${quincenaId}`, { nombreRecibo: nombre })
        }
      }
      setCuentas(prev => [...prev, cuenta])
      setModalCrear(false)
      seleccionarCuenta(cuenta)
    } catch (e) { console.error(e) }
  }

  // ── Modal editar ingresos ─────────────────────────────────────────────────
  function abrirModalIngresos() {
    setSeleccionModal(new Set(ingresosNombres))
    setModalIngresos(true)
  }

  async function confirmarIngresos() {
    if (!cuentaActiva || !quincenaId) return
    try {
      // Agregar los nuevos
      for (const nombre of seleccionModal) {
        if (!ingresosNombres.has(nombre)) {
          await api.post(`/cuentas-personalizadas/${cuentaActiva.id}/ingresos?quincenaId=${quincenaId}`, { nombreRecibo: nombre })
        }
      }
      // Quitar los que se desmarcaron
      for (const nombre of ingresosNombres) {
        if (!seleccionModal.has(nombre)) {
          await api.delete(`/cuentas-personalizadas/${cuentaActiva.id}/ingresos?quincenaId=${quincenaId}&nombreRecibo=${encodeURIComponent(nombre)}`)
        }
      }
      setIngresosNombres(new Set(seleccionModal))
      setModalIngresos(false)
    } catch (e) { console.error(e) }
  }

  function toggleModal(nombre) {
    setSeleccionModal(prev => {
      const s = new Set(prev)
      if (s.has(nombre)) s.delete(nombre); else s.add(nombre)
      return s
    })
  }

  // ── Descuentos ────────────────────────────────────────────────────────────
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

  // ── Totales ───────────────────────────────────────────────────────────────
  const ingresosSeleccionados = recibosAgrupados.filter(g => ingresosNombres.has(g.nombre))
  const totalRecibos    = ingresosSeleccionados.reduce((s, g) => s + g.valor, 0)
  const totalManual     = ingresosManual.reduce((s, m) => s + m.valor, 0)
  const totalIngresos   = totalRecibos + totalManual
  const totalDescuentos = descuentos.reduce((s, d) => s + d.valor, 0)
  const saldoFinal      = totalIngresos - totalDescuentos

  // ── Picker de recibos (usado en ambos modales) ────────────────────────────
  const pickerRecibos = (
    <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #eee', borderRadius: '8px' }}>
      {recibosAgrupados.length === 0 && (
        <p style={{ color: '#aaa', textAlign: 'center', padding: '20px', margin: 0, fontSize: '13px' }}>
          {quincenaId ? 'Sin recibos en esta quincena' : 'Selecciona primero una quincena'}
        </p>
      )}
      {recibosAgrupados.map(g => {
        const sel = seleccionModal.has(g.nombre)
        return (
          <div key={g.nombre} onClick={() => toggleModal(g.nombre)} style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            padding: '11px 16px', cursor: 'pointer', borderBottom: '1px solid #f5f5f5',
            background: sel ? '#f0fff4' : 'white', transition: 'background 0.15s',
          }}>
            <div style={{
              width: '18px', height: '18px', borderRadius: '4px', flexShrink: 0,
              border: `2px solid ${sel ? '#27ae60' : '#ddd'}`,
              background: sel ? '#27ae60' : 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {sel && <span style={{ color: 'white', fontSize: '11px', fontWeight: '700' }}>✓</span>}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '13px', fontWeight: '500', color: '#333' }}>{g.nombre}</div>
              <div style={{ fontSize: '11px', color: '#aaa', marginTop: '1px' }}>{fmt(g.litros)} L — ${fmt(g.valor)}</div>
            </div>
          </div>
        )
      })}
    </div>
  )

  // ── Panel izquierdo: lista de cuentas ─────────────────────────────────────
  const panelCuentas = (
    <div style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#1a1a2e' }}>Mis cuentas</h3>
        <button onClick={abrirModalCrear} style={{
          background: '#6c63ff', color: 'white', border: 'none', borderRadius: '8px',
          padding: '7px 14px', fontSize: '13px', fontWeight: '600', cursor: 'pointer',
        }}>+ Nueva</button>
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

  // ── Panel derecho: detalle de cuenta ──────────────────────────────────────
  const panelDetalle = !cuentaActiva ? (
    <div style={{ background: 'white', borderRadius: '12px', padding: '60px 24px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', textAlign: 'center', color: '#bbb' }}>
      <div style={{ fontSize: '40px', marginBottom: '12px' }}>📋</div>
      <p style={{ fontSize: '14px', margin: 0 }}>Selecciona o crea una cuenta</p>
    </div>
  ) : (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* Header */}
      <div style={{ background: 'white', borderRadius: '12px', padding: '16px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        <button onClick={() => setVistaMovil('lista')} className="btn-volver"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', fontSize: '18px', padding: 0, lineHeight: 1, display: 'none' }}>
          ←
        </button>
        <h2 style={{ margin: 0, fontSize: '17px', fontWeight: '700', color: '#1a1a2e', flex: 1 }}>{cuentaActiva.nombre}</h2>
        <button
          onClick={() => pdfCuentaPersonalizada({
            cuentaNombre: cuentaActiva.nombre,
            quincenaTexto: quincenas.find(q => String(q.id) === quincenaId)?.textoQuincena || '',
            ingresos: ingresosSeleccionados,
            descuentos,
          })}
          style={{ background: '#e74c3c', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 14px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', flexShrink: 0 }}
        >
          PDF
        </button>
        <select value={quincenaId} onChange={e => setQuincenaId(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #e0e0e0', fontSize: '13px', color: '#333', outline: 'none' }}>
          <option value="">— Quincena —</option>
          {quincenas.map(q => <option key={q.id} value={q.id}>{q.textoQuincena || `Quincena ${q.id}`}</option>)}
        </select>
      </div>

      {/* Dos columnas */}
      <div className="cp-cols" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

        {/* Ingresos */}
        <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid #f0f0f0', background: '#f9fff9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: '700', fontSize: '14px', color: '#27ae60' }}>Ingresos</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontWeight: '700', fontSize: '13px', color: '#27ae60' }}>${fmt(totalIngresos)}</span>
              <button onClick={abrirModalIngresos} style={{
                background: '#27ae60', color: 'white', border: 'none', borderRadius: '6px',
                padding: '4px 10px', fontSize: '12px', fontWeight: '600', cursor: 'pointer',
              }}>Editar</button>
            </div>
          </div>
          <div>
            {ingresosSeleccionados.length === 0 ? (
              <div style={{ padding: '24px 18px', textAlign: 'center' }}>
                <p style={{ color: '#bbb', fontSize: '13px', margin: '0 0 12px' }}>Sin ingresos seleccionados</p>
                <button onClick={abrirModalIngresos} style={{
                  background: '#f0efff', color: '#6c63ff', border: 'none', borderRadius: '8px',
                  padding: '8px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer',
                }}>+ Agregar recibos</button>
              </div>
            ) : (
              ingresosSeleccionados.map(g => (
                <div key={g.nombre} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 18px', borderBottom: '1px solid #f5f5f5' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '500', color: '#333' }}>{g.nombre}</div>
                    <div style={{ fontSize: '11px', color: '#aaa', marginTop: '2px' }}>{fmt(g.litros)} L total</div>
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: '#27ae60' }}>${fmt(g.valor)}</div>
                </div>
              ))
            )}
            {ingresosManual.map(m => (
              <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 18px', borderBottom: '1px solid #f5f5f5' }}>
                <div style={{ fontSize: '13px', fontWeight: '500', color: '#333' }}>{m.descripcion}</div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#27ae60' }}>${fmt(m.valor)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Descuentos */}
        <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid #f0f0f0', background: '#fff9f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: '700', fontSize: '14px', color: '#e74c3c' }}>Descuentos</span>
            <span style={{ fontWeight: '700', fontSize: '13px', color: '#e74c3c' }}>−${fmt(totalDescuentos)}</span>
          </div>
          <div style={{ padding: '12px 18px', borderBottom: '1px solid #f5f5f5', background: '#fafafa', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <input value={formDesc.descripcion} onChange={e => setFormDesc(f => ({ ...f, descripcion: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && agregarDescuento()} placeholder="Descripción..."
              style={{ flex: 2, minWidth: '100px', padding: '7px 10px', borderRadius: '7px', border: '1px solid #e0e0e0', fontSize: '13px', outline: 'none' }} />
            <input type="number" value={formDesc.valor} onChange={e => setFormDesc(f => ({ ...f, valor: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && agregarDescuento()} placeholder="Valor"
              style={{ width: '100px', padding: '7px 10px', borderRadius: '7px', border: '1px solid #e0e0e0', fontSize: '13px', outline: 'none' }} />
            <button onClick={agregarDescuento} style={{
              background: '#e74c3c', color: 'white', border: 'none', borderRadius: '7px',
              padding: '7px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', flexShrink: 0,
            }}>+ Agregar</button>
          </div>
          <div>
            {descuentos.length === 0 && (
              <p style={{ textAlign: 'center', color: '#bbb', padding: '24px', fontSize: '13px', margin: 0 }}>Sin descuentos</p>
            )}
            {descuentos.map(d => (
              <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 18px', borderBottom: '1px solid #f5f5f5' }}>
                <span style={{ flex: 1, fontSize: '13px', color: '#333' }}>{d.descripcion}</span>
                <span style={{ fontSize: '13px', fontWeight: '600', color: '#e74c3c', flexShrink: 0 }}>−${fmt(d.valor)}</span>
                <button onClick={() => eliminarDescuento(d.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ddd', fontSize: '14px', padding: '2px', lineHeight: 1 }}>✕</button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Saldo final */}
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

  // ── Modal compartido ──────────────────────────────────────────────────────
  const modalOverlay = (titulo, onConfirm, onClose, extraContent) => (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ background: 'white', borderRadius: '16px', width: '100%', maxWidth: '480px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#1a1a2e' }}>{titulo}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', fontSize: '20px', lineHeight: 1 }}>✕</button>
        </div>
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {extraContent}
          <div>
            <div style={{ fontSize: '12px', fontWeight: '600', color: '#888', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '8px' }}>
              Seleccionar recibos
            </div>
            {pickerRecibos}
          </div>
        </div>
        <div style={{ padding: '16px 24px', borderTop: '1px solid #f0f0f0', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button onClick={onClose} style={{ background: '#f5f5f5', color: '#555', border: 'none', borderRadius: '8px', padding: '10px 20px', fontSize: '14px', cursor: 'pointer' }}>
            Cancelar
          </button>
          <button onClick={onConfirm} style={{ background: '#6c63ff', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 24px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
            Aceptar
          </button>
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
        <div className="cp-panel-lista" style={{ width: '260px', flexShrink: 0 }}>{panelCuentas}</div>
        <div className="cp-panel-detalle" style={{ flex: 1, minWidth: 0 }}>{panelDetalle}</div>
      </div>

      {/* Modal: crear cuenta */}
      {modalCrear && modalOverlay(
        'Nueva cuenta',
        confirmarCrear,
        () => setModalCrear(false),
        <div>
          <label style={{ fontSize: '12px', fontWeight: '600', color: '#888', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Nombre de la cuenta</label>
          <input
            autoFocus
            value={nombreNueva}
            onChange={e => setNombreNueva(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && confirmarCrear()}
            placeholder="Ej: Cuentas a Dayana"
            style={{ width: '100%', marginTop: '6px', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e0e0e0', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>
      )}

      {/* Modal: editar ingresos */}
      {modalIngresos && modalOverlay(
        'Seleccionar ingresos',
        confirmarIngresos,
        () => setModalIngresos(false),
        <div>
          <div style={{ fontSize: '12px', fontWeight: '600', color: '#888', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '8px' }}>
            Ingresos manuales
          </div>
          {ingresosManual.map(m => (
            <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 0', borderBottom: '1px solid #f5f5f5' }}>
              {editandoManual?.id === m.id ? (
                <>
                  <input
                    value={editandoManual.descripcion}
                    onChange={e => setEditandoManual(prev => ({ ...prev, descripcion: e.target.value }))}
                    style={{ flex: 1, padding: '5px 8px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '13px', outline: 'none' }}
                  />
                  <input
                    type="number"
                    value={editandoManual.valor}
                    onChange={e => setEditandoManual(prev => ({ ...prev, valor: e.target.value }))}
                    onKeyDown={e => e.key === 'Enter' && guardarEdicionManual()}
                    style={{ width: '90px', padding: '5px 8px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '13px', outline: 'none' }}
                  />
                  <button onClick={guardarEdicionManual} style={{ background: '#27ae60', color: 'white', border: 'none', borderRadius: '5px', padding: '5px 10px', fontSize: '12px', cursor: 'pointer' }}>✓</button>
                  <button onClick={() => setEditandoManual(null)} style={{ background: '#f5f5f5', color: '#666', border: 'none', borderRadius: '5px', padding: '5px 8px', fontSize: '12px', cursor: 'pointer' }}>✕</button>
                </>
              ) : (
                <>
                  <span onClick={() => setEditandoManual({ id: m.id, descripcion: m.descripcion, valor: m.valor })} style={{ flex: 1, fontSize: '13px', color: '#333', cursor: 'pointer' }}>{m.descripcion}</span>
                  <span onClick={() => setEditandoManual({ id: m.id, descripcion: m.descripcion, valor: m.valor })} style={{ fontSize: '13px', fontWeight: '600', color: '#27ae60', cursor: 'pointer' }}>${fmt(m.valor)}</span>
                  <button onClick={() => eliminarIngresoManual(m.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ccc', fontSize: '16px', lineHeight: 1, padding: '2px' }}>✕</button>
                </>
              )}
            </div>
          ))}
          <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
            <input
              value={formManual.descripcion}
              onChange={e => setFormManual(f => ({ ...f, descripcion: e.target.value }))}
              placeholder="Descripción..."
              style={{ flex: 1, padding: '7px 10px', borderRadius: '7px', border: '1px solid #e0e0e0', fontSize: '13px', outline: 'none' }}
            />
            <input
              type="number"
              value={formManual.valor}
              onChange={e => setFormManual(f => ({ ...f, valor: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && agregarIngresoManual()}
              placeholder="Valor"
              style={{ width: '100px', padding: '7px 10px', borderRadius: '7px', border: '1px solid #e0e0e0', fontSize: '13px', outline: 'none' }}
            />
            <button onClick={agregarIngresoManual} style={{ background: '#27ae60', color: 'white', border: 'none', borderRadius: '7px', padding: '7px 14px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', flexShrink: 0 }}>+</button>
          </div>
        </div>
      )}
    </>
  )
}
