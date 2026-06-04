import { useState, useEffect } from 'react'
import api from '../../api/axios'

const fmt = (n) => Math.round(n ?? 0).toLocaleString('es-CO')
const fmtL = (n) => Number(n ?? 0).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 1 })

const FORM_VACIO = {
  nombreRecibo: '',
  litrosRecibidos: '',
  precioLitro: '',
  precioTransporte: '',
  soloTransporte: false,
  fecha: new Date().toISOString().split('T')[0]
}

function Recibos() {
  const [quincenaAbierta, setQuincenaAbierta] = useState(null)
  const [recibos, setRecibos] = useState([])
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState(FORM_VACIO)

  useEffect(() => { cargarDatos() }, [])

  const cargarDatos = async () => {
    try {
      const quincenaRes = await api.get('/quincenas/abierta')
      setQuincenaAbierta(quincenaRes.data)
      cargarRecibos(quincenaRes.data.id)
    } catch {
      // No hay quincena abierta
    }
  }

  const cargarRecibos = async (quincenaId) => {
    const res = await api.get(`/recibos/quincena/${quincenaId}`)
    setRecibos(res.data)
  }

  // Auto-rellena precios cuando el nombre coincide con una empresa ya registrada
  const handleNombreChange = (e) => {
    const nombre = e.target.value
    const existente = recibos.find(
      r => r.nombreRecibo?.toLowerCase() === nombre.toLowerCase() && r.id !== editando
    )
    if (existente) {
      setForm(f => ({
        ...f,
        nombreRecibo: nombre,
        precioLitro: existente.precioLitro ?? f.precioLitro,
        precioTransporte: existente.precioTransporte ?? f.precioTransporte
      }))
    } else {
      setForm(f => ({ ...f, nombreRecibo: nombre }))
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const payload = {
      nombreRecibo: form.nombreRecibo,
      litrosRecibidos: parseFloat(form.litrosRecibidos),
      precioLitro: parseFloat(form.precioLitro),
      precioTransporte: form.precioTransporte ? parseFloat(form.precioTransporte) : null,
      soloTransporte: !!form.soloTransporte,
      fecha: form.fecha,
      quincena: { id: quincenaAbierta.id }
    }
    try {
      if (editando) {
        await api.put(`/recibos/${editando}`, payload)
        setEditando(null)
      } else {
        await api.post('/recibos', payload)
      }
      setForm(FORM_VACIO)
      setMostrarFormulario(false)
      cargarRecibos(quincenaAbierta.id)
    } catch {
      alert('Error al guardar el recibo')
    }
  }

  const iniciarEdicion = (r) => {
    setEditando(r.id)
    setForm({
      nombreRecibo: r.nombreRecibo ?? '',
      litrosRecibidos: r.litrosRecibidos ?? '',
      precioLitro: r.precioLitro ?? '',
      precioTransporte: r.precioTransporte ?? '',
      soloTransporte: r.soloTransporte ?? false,
      fecha: r.fecha ?? new Date().toISOString().split('T')[0]
    })
    setMostrarFormulario(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const cancelar = () => {
    setEditando(null)
    setMostrarFormulario(false)
    setForm(FORM_VACIO)
  }

  const eliminar = async (id) => {
    if (confirm('¿Eliminar este recibo?')) {
      await api.delete(`/recibos/${id}`)
      cargarRecibos(quincenaAbierta.id)
    }
  }

  // Totales globales
  const totalLitros = recibos.reduce((s, r) => s + (r.litrosRecibidos ?? 0), 0)
  const totalValor  = recibos.reduce((s, r) => s + (r.litrosRecibidos ?? 0) * (r.precioLitro ?? 0), 0)
  const totalTrans  = recibos.reduce((s, r) => s + (r.litrosRecibidos ?? 0) * (r.precioTransporte ?? 0), 0)
  const totalProvee = totalValor - totalTrans

  // Resumen por empresa
  const porEmpresa = recibos.reduce((acc, r) => {
    const k = r.nombreRecibo ?? 'Sin nombre'
    if (!acc[k]) acc[k] = { litros: 0, valorTotal: 0, valorTrans: 0, valorProv: 0, precioLitro: r.precioLitro, precioTrans: r.precioTransporte }
    acc[k].litros     += r.litrosRecibidos ?? 0
    acc[k].valorTotal += (r.litrosRecibidos ?? 0) * (r.precioLitro ?? 0)
    acc[k].valorTrans += (r.litrosRecibidos ?? 0) * (r.precioTransporte ?? 0)
    acc[k].valorProv  += (r.litrosRecibidos ?? 0) * ((r.precioLitro ?? 0) - (r.precioTransporte ?? 0))
    return acc
  }, {})

  if (!quincenaAbierta) {
    return (
      <div style={{ textAlign: 'center', padding: '60px', color: '#999' }}>
        <h2>No hay quincena abierta</h2>
        <p>Ve a la sección de Quincenas y crea una para empezar a registrar recibos.</p>
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ margin: 0 }}>Recibos de la empresa</h2>
          <span style={{ fontSize: '13px', color: '#666' }}>{quincenaAbierta.textoQuincena}</span>
        </div>
        <button onClick={() => { setEditando(null); setMostrarFormulario(!mostrarFormulario) }}
          style={{ background: '#6c63ff', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer' }}>
          {mostrarFormulario ? 'Cancelar' : '+ Nuevo recibo'}
        </button>
      </div>

      {/* Tarjetas de totales */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '24px' }}>
        <Tarjeta label="Total litros" valor={`${fmtL(totalLitros)} L`} color="#0288d1" />
        <Tarjeta label="Valor total recibido" valor={`$${fmt(totalValor)}`} color="#388e3c" />
        <Tarjeta label="Valor transporte" valor={`$${fmt(totalTrans)}`} color="#e65100" />
        <Tarjeta label="Valor a proveedores" valor={`$${fmt(totalProvee)}`} color="#6c63ff" />
      </div>

      {/* Formulario */}
      {mostrarFormulario && (
        <div style={{ background: 'white', padding: '24px', borderRadius: '12px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <h3 style={{ marginTop: 0, marginBottom: '16px' }}>{editando ? 'Editar recibo' : 'Nuevo recibo'}</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px', marginBottom: '14px' }}>
              <div>
                <label style={lbl}>Empresa / Nombre</label>
                <input name="nombreRecibo" value={form.nombreRecibo} onChange={handleNombreChange} required
                  placeholder="Ej: Consuelo, Tatiana..."
                  style={inp} list="empresas-list" />
                <datalist id="empresas-list">
                  {Object.keys(porEmpresa).map(n => <option key={n} value={n} />)}
                </datalist>
              </div>
              <div>
                <label style={lbl}>Fecha</label>
                <input name="fecha" value={form.fecha} onChange={handleChange} type="date" required style={inp} />
              </div>
              <div>
                <label style={lbl}>Litros recibidos</label>
                <input name="litrosRecibidos" value={form.litrosRecibidos} onChange={handleChange}
                  type="number" step="0.1" required style={inp} />
              </div>
              <div>
                <label style={lbl}>Precio total ($/litro que paga empresa)</label>
                <input name="precioLitro" value={form.precioLitro} onChange={handleChange}
                  type="number" step="1" required style={inp} placeholder="Ej: 1925" />
              </div>
              <div>
                <label style={lbl}>Precio transporte ($/litro)</label>
                <input name="precioTransporte" value={form.precioTransporte} onChange={handleChange}
                  type="number" step="1" style={inp} placeholder="Ej: 225" />
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                {form.precioLitro && form.precioTransporte && (
                  <div style={{ padding: '8px 12px', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0', width: '100%' }}>
                    <div style={{ fontSize: '12px', color: '#666' }}>Precio proveedor (calculado):</div>
                    <div style={{ fontSize: '16px', fontWeight: '700', color: '#166534' }}>
                      ${fmt(parseFloat(form.precioLitro || 0) - parseFloat(form.precioTransporte || 0))}/litro
                    </div>
                  </div>
                )}
              </div>
            </div>
            {/* Checkbox solo transporte */}
            <label style={{
              display: 'inline-flex', alignItems: 'center', gap: '10px', cursor: 'pointer',
              marginBottom: '14px', padding: '10px 16px', borderRadius: '8px',
              background: form.soloTransporte ? '#fff3e0' : '#f5f5f5',
              border: form.soloTransporte ? '1px solid #ffcc80' : '1px solid #e0e0e0',
              fontSize: '14px', color: form.soloTransporte ? '#e65100' : '#555'
            }}>
              <input type="checkbox" name="soloTransporte"
                checked={!!form.soloTransporte} onChange={handleChange}
                style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#e65100' }} />
              <span>
                <strong>Solo transporte</strong> — ellos le pagan directo al proveedor
                {form.soloTransporte && <span style={{ marginLeft: '8px', fontSize: '12px' }}>
                  (no cuenta para el rinde)
                </span>}
              </span>
            </label>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button type="submit"
                style={{ background: '#6c63ff', color: 'white', border: 'none', padding: '10px 24px', borderRadius: '8px', cursor: 'pointer' }}>
                {editando ? 'Actualizar' : 'Guardar'}
              </button>
              <button type="button" onClick={cancelar}
                style={{ background: '#f5f5f5', color: '#444', border: 'none', padding: '10px 24px', borderRadius: '8px', cursor: 'pointer' }}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Resumen por empresa */}
      {Object.keys(porEmpresa).length > 0 && (
        <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: '24px', overflow: 'hidden' }}>
          <div style={{ background: '#1a1a2e', color: 'white', padding: '12px 18px', fontWeight: '600', fontSize: '13px', letterSpacing: '0.4px' }}>
            RESUMEN POR EMPRESA
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f5f5f5', borderBottom: '1px solid #e0e0e0' }}>
                <th style={th}>Empresa</th>
                <th style={{ ...th, textAlign: 'right' }}>$/Litro total</th>
                <th style={{ ...th, textAlign: 'right' }}>$/Trans.</th>
                <th style={{ ...th, textAlign: 'right' }}>$/Proveedor</th>
                <th style={{ ...th, textAlign: 'right' }}>Litros</th>
                <th style={{ ...th, textAlign: 'right' }}>Valor total</th>
                <th style={{ ...th, textAlign: 'right', color: '#e65100' }}>Transporte</th>
                <th style={{ ...th, textAlign: 'right', color: '#1b5e20' }}>A proveedores</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(porEmpresa).map(([nombre, d], i) => (
                <tr key={nombre} style={{ borderBottom: '1px solid #f0f0f0', background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                  <td style={{ ...td, fontWeight: '600' }}>{nombre}</td>
                  <td style={{ ...td, textAlign: 'right', color: '#666' }}>${fmt(d.precioLitro)}</td>
                  <td style={{ ...td, textAlign: 'right', color: '#e65100' }}>${fmt(d.precioTrans)}</td>
                  <td style={{ ...td, textAlign: 'right', color: '#1b5e20' }}>${fmt((d.precioLitro ?? 0) - (d.precioTrans ?? 0))}</td>
                  <td style={{ ...td, textAlign: 'right', fontWeight: '500' }}>{fmtL(d.litros)} L</td>
                  <td style={{ ...td, textAlign: 'right' }}>${fmt(d.valorTotal)}</td>
                  <td style={{ ...td, textAlign: 'right', color: '#e65100' }}>${fmt(d.valorTrans)}</td>
                  <td style={{ ...td, textAlign: 'right', fontWeight: '600', color: '#1b5e20' }}>${fmt(d.valorProv)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ background: '#1a1a2e', color: 'white', fontWeight: '600' }}>
                <td colSpan={4} style={{ ...td, color: 'white' }}>TOTAL</td>
                <td style={{ ...td, textAlign: 'right', color: 'white' }}>{fmtL(totalLitros)} L</td>
                <td style={{ ...td, textAlign: 'right', color: 'white' }}>${fmt(totalValor)}</td>
                <td style={{ ...td, textAlign: 'right', color: '#ef9a9a' }}>${fmt(totalTrans)}</td>
                <td style={{ ...td, textAlign: 'right', color: '#a5d6a7', fontSize: '15px' }}>${fmt(totalProvee)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* Lista detallada de recibos */}
      <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
        <div style={{ background: '#1a1a2e', color: 'white', padding: '12px 18px', fontWeight: '600', fontSize: '13px', letterSpacing: '0.4px' }}>
          REGISTRO DIARIO
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f5f5f5', borderBottom: '1px solid #e0e0e0' }}>
              <th style={th}>Empresa</th>
              <th style={th}>Fecha</th>
              <th style={{ ...th, textAlign: 'right' }}>Litros</th>
              <th style={{ ...th, textAlign: 'right' }}>$/Litro total</th>
              <th style={{ ...th, textAlign: 'right' }}>$/Trans.</th>
              <th style={{ ...th, textAlign: 'right' }}>Valor transporte</th>
              <th style={{ ...th, textAlign: 'right', color: '#1b5e20' }}>Valor proveedor</th>
              <th style={th}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {recibos
              .slice()
              .sort((a, b) => (a.fecha > b.fecha ? 1 : a.fecha < b.fecha ? -1 : 0))
              .map((r, i) => {
                const vTrans = (r.litrosRecibidos ?? 0) * (r.precioTransporte ?? 0)
                const vProv  = (r.litrosRecibidos ?? 0) * ((r.precioLitro ?? 0) - (r.precioTransporte ?? 0))
                return (
                  <tr key={r.id} style={{ borderBottom: '1px solid #f0f0f0', background: editando === r.id ? '#f3f0ff' : i % 2 === 0 ? 'white' : '#fafafa' }}>
                    <td style={{ ...td, fontWeight: '500' }}>
                      {r.nombreRecibo}
                      {r.soloTransporte && (
                        <span style={{ marginLeft: '6px', fontSize: '11px', background: '#fff3e0', color: '#e65100', padding: '2px 6px', borderRadius: '4px' }}>
                          solo trans.
                        </span>
                      )}
                    </td>
                    <td style={{ ...td, color: '#666' }}>{r.fecha}</td>
                    <td style={{ ...td, textAlign: 'right' }}>{fmtL(r.litrosRecibidos)} L</td>
                    <td style={{ ...td, textAlign: 'right', color: '#666' }}>${fmt(r.precioLitro)}</td>
                    <td style={{ ...td, textAlign: 'right', color: r.precioTransporte ? '#e65100' : '#ccc' }}>
                      {r.precioTransporte ? `$${fmt(r.precioTransporte)}` : '—'}
                    </td>
                    <td style={{ ...td, textAlign: 'right', color: '#e65100' }}>
                      {r.precioTransporte ? `$${fmt(vTrans)}` : '—'}
                    </td>
                    <td style={{ ...td, textAlign: 'right', fontWeight: '500', color: '#1b5e20' }}>
                      ${fmt(r.precioTransporte ? vProv : (r.litrosRecibidos ?? 0) * (r.precioLitro ?? 0))}
                    </td>
                    <td style={{ ...td }}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button onClick={() => iniciarEdicion(r)}
                          style={{ background: '#e8f5e9', color: '#2e7d32', border: 'none', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>
                          Editar
                        </button>
                        <button onClick={() => eliminar(r.id)}
                          style={{ background: '#ffebee', color: '#c62828', border: 'none', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            {recibos.length === 0 && (
              <tr><td colSpan={8} style={{ padding: '32px', textAlign: 'center', color: '#999' }}>No hay recibos en esta quincena</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Tarjeta({ label, valor, color }) {
  return (
    <div style={{ background: 'white', padding: '18px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderTop: `3px solid ${color}` }}>
      <p style={{ margin: 0, fontSize: '11px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</p>
      <p style={{ margin: '6px 0 0', fontSize: '20px', fontWeight: '700', color }}>{valor}</p>
    </div>
  )
}

const lbl = { display: 'block', marginBottom: '5px', fontSize: '13px', color: '#555', fontWeight: '500' }
const inp = { width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px', boxSizing: 'border-box' }
const th  = { padding: '10px 14px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#444' }
const td  = { padding: '10px 14px', fontSize: '13px' }

export default Recibos
