import { useState, useEffect } from 'react'
import api from '../../api/axios'

const fmt = (n) => Math.round(n ?? 0).toLocaleString('es-CO')

const formatFecha = (fechaStr) => {
  if (!fechaStr) return '—'
  const [, mes, dia] = fechaStr.split('-')
  return `${dia}/${mes}`
}

const FORM_VACIO = { proveedorId: '', concepto: '', valor: '', fecha: new Date().toISOString().split('T')[0] }

function Descuentos() {
  const [quincenaAbierta, setQuincenaAbierta] = useState(null)
  const [proveedores, setProveedores] = useState([])
  const [rutas, setRutas] = useState([])
  const [descuentos, setDescuentos] = useState([])
  const [form, setForm] = useState(FORM_VACIO)
  const [guardando, setGuardando] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [filtroLeche, setFiltroLeche] = useState('')
  const [filtroRuta, setFiltroRuta] = useState('')
  const [formFiltroRuta, setFormFiltroRuta] = useState('')
  const [formFiltroLeche, setFormFiltroLeche] = useState('')
  const [formBusqueda, setFormBusqueda] = useState('')

  useEffect(() => { cargarDatos() }, [])

  const cargarDatos = async () => {
    try {
      const [quincenaRes, provRes, rutasRes] = await Promise.all([
        api.get('/quincenas/abierta'),
        api.get('/proveedores'),
        api.get('/rutas')
      ])
      setQuincenaAbierta(quincenaRes.data)
      setProveedores(provRes.data)
      setRutas(rutasRes.data)
      cargarDescuentos(quincenaRes.data.id)
    } catch {
      // sin quincena abierta
    }
  }

  const cargarDescuentos = async (quincenaId) => {
    const res = await api.get(`/descuentos/quincena/${quincenaId}`)
    setDescuentos(res.data)
  }

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.proveedorId || !form.concepto || !form.valor) return
    setGuardando(true)
    try {
      await api.post('/descuentos', {
        quincena: { id: quincenaAbierta.id },
        proveedor: { id: parseInt(form.proveedorId) },
        concepto: form.concepto,
        valor: parseFloat(form.valor),
        fecha: form.fecha || null
      })
      setForm(FORM_VACIO)
      cargarDescuentos(quincenaAbierta.id)
    } catch {
      alert('Error al guardar el descuento')
    } finally {
      setGuardando(false)
    }
  }

  const eliminar = async (id) => {
    if (confirm('¿Eliminar este descuento?')) {
      await api.delete(`/descuentos/${id}`)
      cargarDescuentos(quincenaAbierta.id)
    }
  }

  // Mapa id → proveedor completo para acceder a ruta y tipoLeche
  const provMap = Object.fromEntries(proveedores.map(p => [p.id, p]))

  // Descuentos filtrados
  const descuentosFiltrados = descuentos.filter(d => {
    const prov = provMap[d.proveedor?.id]
    const nombre = d.proveedor?.nombre ?? ''
    if (busqueda && !nombre.toLowerCase().includes(busqueda.toLowerCase())) return false
    if (filtroLeche && (prov?.tipoLeche || 'vaca') !== filtroLeche) return false
    if (filtroRuta && String(prov?.ruta?.id ?? '') !== filtroRuta) return false
    return true
  })

  // Agrupar descuentos filtrados por proveedor
  const porProveedor = descuentosFiltrados.reduce((acc, d) => {
    const nombre = d.proveedor?.nombre ?? 'Sin nombre'
    if (!acc[nombre]) acc[nombre] = []
    acc[nombre].push(d)
    return acc
  }, {})

  const totalDescuentos = descuentosFiltrados.reduce((s, d) => s + (d.valor ?? 0), 0)

  if (!quincenaAbierta) {
    return (
      <div style={{ textAlign: 'center', padding: '60px', color: '#999' }}>
        <h2>No hay quincena abierta</h2>
        <p>Ve a la sección de Quincenas y crea una para registrar descuentos.</p>
      </div>
    )
  }

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ margin: 0 }}>Descuentos a proveedores</h2>
        <span style={{ fontSize: '13px', color: '#666' }}>{quincenaAbierta.textoQuincena}</span>
      </div>

      {/* Formulario */}
      <div style={{ background: 'white', padding: '24px', borderRadius: '12px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        <h3 style={{ margin: '0 0 16px', fontSize: '15px' }}>Registrar descuento</h3>
        <form onSubmit={handleSubmit}>
          {/* Filtros del selector de proveedor */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: '#888', fontWeight: '600', whiteSpace: 'nowrap' }}>Filtrar proveedor:</span>
            <input
              value={formBusqueda}
              onChange={e => { setFormBusqueda(e.target.value); setForm(f => ({ ...f, proveedorId: '' })) }}
              placeholder="Buscar nombre..."
              style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '13px', outline: 'none', width: '160px' }}
            />
            <select value={formFiltroRuta} onChange={e => { setFormFiltroRuta(e.target.value); setForm(f => ({ ...f, proveedorId: '' })) }}
              style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '13px', color: formFiltroRuta ? '#333' : '#999' }}>
              <option value="">Todas las rutas</option>
              {rutas.map(r => <option key={r.id} value={String(r.id)}>{r.nombre}</option>)}
            </select>
            {[['', 'Todos'], ['vaca', 'Vaca'], ['bufala', 'Búfala']].map(([val, label]) => (
              <button key={val} type="button" onClick={() => { setFormFiltroLeche(val); setForm(f => ({ ...f, proveedorId: '' })) }} style={{
                padding: '5px 14px', borderRadius: '20px', border: '2px solid',
                borderColor: formFiltroLeche === val ? '#6c63ff' : '#e0e0e0',
                background: formFiltroLeche === val ? '#6c63ff' : 'white',
                color: formFiltroLeche === val ? 'white' : '#666',
                fontWeight: '600', fontSize: '12px', cursor: 'pointer'
              }}>{label}</button>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 2fr 1fr auto', gap: '12px', alignItems: 'flex-end' }}>
            <div>
              <label style={lbl}>
                Proveedor
                {(() => {
                  const n = proveedores.filter(p =>
                    p.activo !== false &&
                    (!formFiltroRuta || String(p.ruta?.id) === formFiltroRuta) &&
                    (!formFiltroLeche || (p.tipoLeche || 'vaca') === formFiltroLeche) &&
                    (!formBusqueda || p.nombre.toLowerCase().includes(formBusqueda.toLowerCase()))
                  ).length
                  return <span style={{ color: '#aaa', fontWeight: '400', marginLeft: '6px' }}>({n})</span>
                })()}
              </label>
              <select name="proveedorId" value={form.proveedorId} onChange={handleChange} required style={inp}>
                <option value="">Seleccionar...</option>
                {proveedores
                  .filter(p =>
                    p.activo !== false &&
                    (!formFiltroRuta || String(p.ruta?.id) === formFiltroRuta) &&
                    (!formFiltroLeche || (p.tipoLeche || 'vaca') === formFiltroLeche) &&
                    (!formBusqueda || p.nombre.toLowerCase().includes(formBusqueda.toLowerCase()))
                  )
                  .sort((a, b) => a.nombre.localeCompare(b.nombre))
                  .map(p => (
                    <option key={p.id} value={p.id}>{p.nombre}</option>
                  ))}
              </select>
            </div>
            <div>
              <label style={lbl}>Fecha</label>
              <input name="fecha" value={form.fecha} onChange={handleChange}
                type="date"
                min={quincenaAbierta?.fechaInicio}
                max={quincenaAbierta?.fechaFin}
                style={inp} />
            </div>
            <div>
              <label style={lbl}>Concepto</label>
              <input name="concepto" value={form.concepto} onChange={handleChange} required
                placeholder="Ej: Repila de arroz, deuda semana anterior..."
                style={inp} />
            </div>
            <div>
              <label style={lbl}>Valor ($)</label>
              <input name="valor" value={form.valor} onChange={handleChange}
                type="number" min="1" step="1" required
                placeholder="85000"
                style={inp} />
            </div>
            <button type="submit" disabled={guardando}
              style={{ background: '#6c63ff', color: 'white', border: 'none', padding: '9px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', whiteSpace: 'nowrap' }}>
              + Agregar
            </button>
          </div>
        </form>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '16px' }}>
        <input
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre..."
          style={{ flex: 1, minWidth: '180px', padding: '8px 12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', outline: 'none' }}
        />
        <select value={filtroRuta} onChange={e => setFiltroRuta(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', color: filtroRuta ? '#333' : '#999' }}>
          <option value="">Todas las rutas</option>
          {rutas.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
        </select>
        {[['', 'Todos'], ['vaca', 'Vaca'], ['bufala', 'Búfala']].map(([val, label]) => (
          <button key={val} onClick={() => setFiltroLeche(val)} style={{
            padding: '7px 16px', borderRadius: '20px', border: '2px solid',
            borderColor: filtroLeche === val ? '#6c63ff' : '#e0e0e0',
            background: filtroLeche === val ? '#6c63ff' : 'white',
            color: filtroLeche === val ? 'white' : '#666',
            fontWeight: '600', fontSize: '13px', cursor: 'pointer', whiteSpace: 'nowrap'
          }}>{label}</button>
        ))}
      </div>

      {/* Resumen total */}
      {descuentosFiltrados.length > 0 && (
        <div style={{ background: '#fff3e0', border: '1px solid #ffe0b2', borderRadius: '10px', padding: '14px 20px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '14px', color: '#e65100', fontWeight: '500' }}>
            Total descuentos{busqueda || filtroLeche || filtroRuta ? ' (filtrados)' : ' de la quincena'}: <strong>{descuentosFiltrados.length} registros</strong>
          </span>
          <span style={{ fontSize: '20px', fontWeight: '700', color: '#c62828' }}>
            -${fmt(totalDescuentos)}
          </span>
        </div>
      )}

      {/* Lista agrupada por proveedor */}
      {Object.keys(porProveedor).length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {Object.entries(porProveedor)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([nombre, lista]) => {
              const total = lista.reduce((s, d) => s + (d.valor ?? 0), 0)
              return (
                <div key={nombre} style={{ background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
                  {/* Encabezado del proveedor */}
                  <div style={{ background: '#1a1a2e', color: 'white', padding: '12px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: '600', fontSize: '14px' }}>{nombre}</span>
                    <span style={{ color: '#ef9a9a', fontWeight: '700', fontSize: '15px' }}>-${fmt(total)}</span>
                  </div>
                  {/* Lista de descuentos */}
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <tbody>
                      {lista.map((d, i) => (
                        <tr key={d.id} style={{ borderBottom: '1px solid #f5f5f5', background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                          <td style={{ padding: '11px 18px', fontSize: '13px', color: '#888', whiteSpace: 'nowrap', width: '90px' }}>
                            {d.fecha ? formatFecha(d.fecha) : '—'}
                          </td>
                          <td style={{ padding: '11px 18px', fontSize: '14px' }}>
                            {d.concepto}
                          </td>
                          <td style={{ padding: '11px 18px', textAlign: 'right', fontWeight: '600', color: '#c62828', fontSize: '14px', whiteSpace: 'nowrap' }}>
                            -${fmt(d.valor)}
                          </td>
                          <td style={{ padding: '11px 18px', textAlign: 'right', width: '80px' }}>
                            <button onClick={() => eliminar(d.id)}
                              style={{ background: '#ffebee', color: '#c62828', border: 'none', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>
                              Eliminar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            })}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '60px', color: '#999', background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          No hay descuentos registrados en esta quincena.
        </div>
      )}
    </div>
  )
}

const lbl = { display: 'block', marginBottom: '5px', fontSize: '13px', color: '#555', fontWeight: '500' }
const inp = { width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px', boxSizing: 'border-box' }

export default Descuentos
