import { useState, useEffect } from 'react'
import api from '../../api/axios'
import { useRutaVista } from '../../context/RutaVistaContext'

const fmt = (n) => Math.round(n).toLocaleString('es-CO')

function CuentasGenerales() {
  const { rutasSeleccionadas } = useRutaVista()
  const [quincenas, setQuincenas] = useState([])
  const [quincenaId, setQuincenaId] = useState('')
  const [quincenaTexto, setQuincenaTexto] = useState('')
  const [cargando, setCargando] = useState(false)
  const [transporteTotal, setTransporteTotal] = useState(0)
  const [rindeTotal, setRindeTotal] = useState(0)
  const [descuentos, setDescuentos] = useState([]) // todos los descuentos
  const [combustibles, setCombustibles] = useState([])
  // Formulario nuevo descuento
  const [formDesc, setFormDesc] = useState({ tipo: 'TRANSPORTE', nombre: '', valor: '' })
  const [mostrarFormTrans, setMostrarFormTrans] = useState(false)
  const [mostrarFormRinde, setMostrarFormRinde] = useState(false)
  // Formulario combustible
  const [formComb, setFormComb] = useState({ descripcion: '', valor: '' })
  const [mostrarFormComb, setMostrarFormComb] = useState(false)
  // Edición inline
  const [editando, setEditando] = useState(null) // { id, nombre, valor }

  useEffect(() => {
    api.get('/quincenas').then(r => {
      setQuincenas(r.data)
      const abierta = r.data.find(q => !q.cerrada)
      if (abierta) {
        setQuincenaId(String(abierta.id))
        setQuincenaTexto(abierta.textoQuincena || '')
        cargarTodo(abierta.id)
      }
    })
  }, [])

  const cargarTodo = async (id) => {
    setCargando(true)
    try {
      const rutaParam = [...rutasSeleccionadas].join(',')
      const [vistaRes, descRes, combRes] = await Promise.all([
        api.get(`/grupos-rinde/vista-completa/${id}${rutaParam ? `?rutaIds=${rutaParam}` : ''}`),
        cargarDescuentos(id),
        api.get(`/combustibles/quincena/${id}`)
      ])
      setTransporteTotal(vistaRes.data.transporteTotal || 0)
      setRindeTotal(vistaRes.data.rindeValorTotal || 0)
      setCombustibles(combRes.data)
    } catch {}
    setCargando(false)
  }

  const cargarDescuentos = async (id) => {
    try { await api.post(`/descuentos-cuenta/quincena/${id}/heredar`) } catch {}
    const r = await api.get(`/descuentos-cuenta/quincena/${id}`)
    setDescuentos(r.data)
    return r
  }

  const recargarDescuentos = async () => {
    const r = await api.get(`/descuentos-cuenta/quincena/${quincenaId}`)
    setDescuentos(r.data)
  }

  const recargarCombustibles = async () => {
    const r = await api.get(`/combustibles/quincena/${quincenaId}`)
    setCombustibles(r.data)
  }

  const handleQuincenaChange = (e) => {
    const q = quincenas.find(q => String(q.id) === e.target.value)
    setQuincenaId(e.target.value)
    setQuincenaTexto(q?.textoQuincena || '')
    setDescuentos([])
    setCombustibles([])
    setTransporteTotal(0)
    setRindeTotal(0)
    if (e.target.value) cargarTodo(e.target.value)
  }

  const agregarDescuento = async (tipo) => {
    const nombre = formDesc.nombre.trim()
    const valor = parseFloat(formDesc.valor)
    if (!nombre || !valor) return
    await api.post('/descuentos-cuenta', {
      quincena: { id: parseInt(quincenaId) },
      tipo,
      nombre,
      valor
    })
    setFormDesc({ tipo: 'TRANSPORTE', nombre: '', valor: '' })
    setMostrarFormTrans(false)
    setMostrarFormRinde(false)
    recargarDescuentos()
  }

  const eliminarDescuento = async (id) => {
    await api.delete(`/descuentos-cuenta/${id}`)
    recargarDescuentos()
  }

  const guardarEdicion = async () => {
    if (!editando) return
    await api.put(`/descuentos-cuenta/${editando.id}`, {
      nombre: editando.nombre,
      valor: parseFloat(editando.valor)
    })
    setEditando(null)
    recargarDescuentos()
  }

  const agregarCombustible = async () => {
    const desc = formComb.descripcion.trim()
    const valor = parseFloat(formComb.valor)
    if (!desc || !valor) return
    await api.post('/combustibles', {
      quincena: { id: parseInt(quincenaId) },
      descripcion: desc,
      valor
    })
    setFormComb({ descripcion: '', valor: '' })
    setMostrarFormComb(false)
    recargarCombustibles()
  }

  const eliminarCombustible = async (id) => {
    await api.delete(`/combustibles/${id}`)
    recargarCombustibles()
  }

  const descTrans = descuentos.filter(d => d.tipo === 'TRANSPORTE')
  const descRinde = descuentos.filter(d => d.tipo === 'RINDE')
  const totalCombustibles = combustibles.reduce((s, c) => s + (c.valor || 0), 0)
  const totalDescTrans = descTrans.reduce((s, d) => s + (d.valor || 0), 0) + totalCombustibles
  const totalDescRinde = descRinde.reduce((s, d) => s + (d.valor || 0), 0)
  const netoTrans = transporteTotal - totalDescTrans
  const netoRinde = rindeTotal - totalDescRinde

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ margin: 0 }}>Cuentas Generales</h2>
      </div>

      {/* Selector de quincena */}
      <div style={{ background: 'white', padding: '16px', borderRadius: '12px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        <label style={{ fontSize: '14px', fontWeight: '500', marginRight: '12px' }}>Quincena:</label>
        <select value={quincenaId} onChange={handleQuincenaChange}
          style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px', minWidth: '280px' }}>
          <option value="">Seleccionar quincena...</option>
          {quincenas.map(q => (
            <option key={q.id} value={q.id}>{q.textoQuincena} {!q.cerrada ? '(Abierta)' : ''}</option>
          ))}
        </select>
      </div>

      {cargando && <div style={{ textAlign: 'center', padding: '60px', color: '#999' }}>Cargando...</div>}

      {!cargando && quincenaId && (
        <>
          {/* Fila con caja Transporte y caja Rinde */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>

            {/* CAJA TRANSPORTE */}
            <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
              <div style={{ background: '#0d47a1', color: 'white', padding: '14px 20px' }}>
                <div style={{ fontSize: '11px', letterSpacing: '0.8px', opacity: 0.8, marginBottom: '4px' }}>TRANSPORTE</div>
                <div style={{ fontSize: '22px', fontWeight: '700' }}>${fmt(transporteTotal)}</div>
              </div>
              <div style={{ padding: '16px 20px' }}>
                <div style={{ fontSize: '12px', fontWeight: '600', color: '#888', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Descuentos</div>

                {/* Combustibles como línea automática */}
                {totalCombustibles > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                    <div>
                      <span style={{ fontSize: '14px', color: '#333' }}>Combustibles</span>
                      <span style={{ marginLeft: '6px', fontSize: '11px', background: '#e3f2fd', color: '#1565c0', padding: '1px 6px', borderRadius: '4px' }}>auto</span>
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: '600', color: '#c62828' }}>-${fmt(totalCombustibles)}</span>
                  </div>
                )}

                {/* Descuentos libres de transporte */}
                {descTrans.map(d => (
                  <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                    {editando?.id === d.id ? (
                      <div style={{ display: 'flex', gap: '6px', flex: 1 }}>
                        <input value={editando.nombre} onChange={e => setEditando({ ...editando, nombre: e.target.value })}
                          style={{ flex: 1, padding: '4px 8px', borderRadius: '5px', border: '1px solid #ddd', fontSize: '13px' }} />
                        <input type="number" value={editando.valor} onChange={e => setEditando({ ...editando, valor: e.target.value })}
                          style={{ width: '90px', padding: '4px 8px', borderRadius: '5px', border: '1px solid #ddd', fontSize: '13px' }} />
                        <button onClick={guardarEdicion} style={{ background: '#6c63ff', color: 'white', border: 'none', padding: '4px 10px', borderRadius: '5px', cursor: 'pointer', fontSize: '12px' }}>✓</button>
                        <button onClick={() => setEditando(null)} style={{ background: '#f5f5f5', color: '#666', border: 'none', padding: '4px 8px', borderRadius: '5px', cursor: 'pointer', fontSize: '12px' }}>✕</button>
                      </div>
                    ) : (
                      <>
                        <span style={{ fontSize: '14px', color: '#333', cursor: 'pointer' }} onClick={() => setEditando({ id: d.id, nombre: d.nombre, valor: d.valor })}>
                          {d.nombre}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '14px', fontWeight: '600', color: '#c62828' }}>-${fmt(d.valor)}</span>
                          <button onClick={() => eliminarDescuento(d.id)}
                            style={{ background: 'none', border: 'none', color: '#ccc', cursor: 'pointer', fontSize: '16px', lineHeight: 1 }}>✕</button>
                        </div>
                      </>
                    )}
                  </div>
                ))}

                {mostrarFormTrans ? (
                  <div style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
                    <input placeholder="Nombre" value={formDesc.nombre}
                      onChange={e => setFormDesc({ ...formDesc, nombre: e.target.value })}
                      style={{ flex: 1, padding: '7px 10px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '13px' }} />
                    <input type="number" placeholder="Valor" value={formDesc.valor}
                      onChange={e => setFormDesc({ ...formDesc, valor: e.target.value })}
                      style={{ width: '100px', padding: '7px 10px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '13px' }}
                      onKeyDown={e => e.key === 'Enter' && agregarDescuento('TRANSPORTE')} />
                    <button onClick={() => agregarDescuento('TRANSPORTE')}
                      style={{ background: '#6c63ff', color: 'white', border: 'none', padding: '7px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>+</button>
                    <button onClick={() => { setMostrarFormTrans(false); setFormDesc({ tipo: 'TRANSPORTE', nombre: '', valor: '' }) }}
                      style={{ background: '#f5f5f5', color: '#666', border: 'none', padding: '7px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>✕</button>
                  </div>
                ) : (
                  <button onClick={() => setMostrarFormTrans(true)}
                    style={{ marginTop: '10px', background: 'none', border: '1px dashed #ddd', color: '#888', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', width: '100%' }}>
                    + Agregar descuento
                  </button>
                )}

                <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '2px solid #e0e0e0', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13px', color: '#888' }}>Total descuentos</span>
                  <span style={{ fontSize: '14px', fontWeight: '600', color: '#c62828' }}>-${fmt(totalDescTrans)}</span>
                </div>
                <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', fontWeight: '700', color: '#1a1a2e' }}>NETO TRANSPORTE</span>
                  <span style={{ fontSize: '20px', fontWeight: '700', color: netoTrans >= 0 ? '#1b5e20' : '#c62828' }}>${fmt(netoTrans)}</span>
                </div>
              </div>
            </div>

            {/* CAJA RINDE */}
            <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
              <div style={{ background: '#1b5e20', color: 'white', padding: '14px 20px' }}>
                <div style={{ fontSize: '11px', letterSpacing: '0.8px', opacity: 0.8, marginBottom: '4px' }}>RINDE</div>
                <div style={{ fontSize: '22px', fontWeight: '700' }}>${fmt(rindeTotal)}</div>
              </div>
              <div style={{ padding: '16px 20px' }}>
                <div style={{ fontSize: '12px', fontWeight: '600', color: '#888', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Descuentos</div>

                {descRinde.map(d => (
                  <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                    {editando?.id === d.id ? (
                      <div style={{ display: 'flex', gap: '6px', flex: 1 }}>
                        <input value={editando.nombre} onChange={e => setEditando({ ...editando, nombre: e.target.value })}
                          style={{ flex: 1, padding: '4px 8px', borderRadius: '5px', border: '1px solid #ddd', fontSize: '13px' }} />
                        <input type="number" value={editando.valor} onChange={e => setEditando({ ...editando, valor: e.target.value })}
                          style={{ width: '90px', padding: '4px 8px', borderRadius: '5px', border: '1px solid #ddd', fontSize: '13px' }} />
                        <button onClick={guardarEdicion} style={{ background: '#6c63ff', color: 'white', border: 'none', padding: '4px 10px', borderRadius: '5px', cursor: 'pointer', fontSize: '12px' }}>✓</button>
                        <button onClick={() => setEditando(null)} style={{ background: '#f5f5f5', color: '#666', border: 'none', padding: '4px 8px', borderRadius: '5px', cursor: 'pointer', fontSize: '12px' }}>✕</button>
                      </div>
                    ) : (
                      <>
                        <span style={{ fontSize: '14px', color: '#333', cursor: 'pointer' }} onClick={() => setEditando({ id: d.id, nombre: d.nombre, valor: d.valor })}>
                          {d.nombre}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '14px', fontWeight: '600', color: '#c62828' }}>-${fmt(d.valor)}</span>
                          <button onClick={() => eliminarDescuento(d.id)}
                            style={{ background: 'none', border: 'none', color: '#ccc', cursor: 'pointer', fontSize: '16px', lineHeight: 1 }}>✕</button>
                        </div>
                      </>
                    )}
                  </div>
                ))}

                {mostrarFormRinde ? (
                  <div style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
                    <input placeholder="Nombre" value={formDesc.nombre}
                      onChange={e => setFormDesc({ ...formDesc, nombre: e.target.value })}
                      style={{ flex: 1, padding: '7px 10px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '13px' }} />
                    <input type="number" placeholder="Valor" value={formDesc.valor}
                      onChange={e => setFormDesc({ ...formDesc, valor: e.target.value })}
                      style={{ width: '100px', padding: '7px 10px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '13px' }}
                      onKeyDown={e => e.key === 'Enter' && agregarDescuento('RINDE')} />
                    <button onClick={() => agregarDescuento('RINDE')}
                      style={{ background: '#6c63ff', color: 'white', border: 'none', padding: '7px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>+</button>
                    <button onClick={() => { setMostrarFormRinde(false); setFormDesc({ tipo: 'RINDE', nombre: '', valor: '' }) }}
                      style={{ background: '#f5f5f5', color: '#666', border: 'none', padding: '7px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>✕</button>
                  </div>
                ) : (
                  <button onClick={() => setMostrarFormRinde(true)}
                    style={{ marginTop: '10px', background: 'none', border: '1px dashed #ddd', color: '#888', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', width: '100%' }}>
                    + Agregar descuento
                  </button>
                )}

                {descRinde.length === 0 && !mostrarFormRinde && (
                  <div style={{ padding: '20px 0', textAlign: 'center', color: '#bbb', fontSize: '13px' }}>
                    Sin descuentos registrados
                  </div>
                )}

                <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '2px solid #e0e0e0', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13px', color: '#888' }}>Total descuentos</span>
                  <span style={{ fontSize: '14px', fontWeight: '600', color: '#c62828' }}>-${fmt(totalDescRinde)}</span>
                </div>
                <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', fontWeight: '700', color: '#1a1a2e' }}>NETO RINDE</span>
                  <span style={{ fontSize: '20px', fontWeight: '700', color: netoRinde >= 0 ? '#1b5e20' : '#c62828' }}>${fmt(netoRinde)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* CAJA COMBUSTIBLES */}
          <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
            <div style={{ background: '#e65100', color: 'white', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '11px', letterSpacing: '0.8px', opacity: 0.8, marginBottom: '2px' }}>COMBUSTIBLES — {quincenaTexto}</div>
                <div style={{ fontSize: '13px', opacity: 0.85 }}>El total se aplica automáticamente como descuento en Transporte</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '11px', opacity: 0.8 }}>Total</div>
                <div style={{ fontSize: '22px', fontWeight: '700' }}>${fmt(totalCombustibles)}</div>
              </div>
            </div>
            <div style={{ padding: '0 20px 16px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #f0f0f0' }}>
                    <th style={{ padding: '12px 0 8px', textAlign: 'left', fontSize: '12px', color: '#888', fontWeight: '600' }}>Descripción</th>
                    <th style={{ padding: '12px 0 8px', textAlign: 'right', fontSize: '12px', color: '#888', fontWeight: '600' }}>Valor</th>
                    <th style={{ width: '40px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {combustibles.map((c, i) => (
                    <tr key={c.id} style={{ borderBottom: '1px solid #f8f8f8', background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                      <td style={{ padding: '10px 0', fontSize: '14px' }}>{c.descripcion}</td>
                      <td style={{ padding: '10px 0', textAlign: 'right', fontSize: '14px', fontWeight: '600', color: '#e65100' }}>${fmt(c.valor)}</td>
                      <td style={{ padding: '10px 0', textAlign: 'right' }}>
                        <button onClick={() => eliminarCombustible(c.id)}
                          style={{ background: 'none', border: 'none', color: '#ccc', cursor: 'pointer', fontSize: '16px' }}>✕</button>
                      </td>
                    </tr>
                  ))}
                  {combustibles.length === 0 && (
                    <tr>
                      <td colSpan={3} style={{ padding: '24px 0', textAlign: 'center', color: '#bbb', fontSize: '13px' }}>
                        Sin registros de combustible en esta quincena
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {mostrarFormComb ? (
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                  <input placeholder="Descripción (ej: Gasolina carro Omar)"
                    value={formComb.descripcion}
                    onChange={e => setFormComb({ ...formComb, descripcion: e.target.value })}
                    style={{ flex: 1, padding: '9px 12px', borderRadius: '7px', border: '1px solid #ddd', fontSize: '14px' }} />
                  <input type="number" placeholder="Valor"
                    value={formComb.valor}
                    onChange={e => setFormComb({ ...formComb, valor: e.target.value })}
                    style={{ width: '120px', padding: '9px 12px', borderRadius: '7px', border: '1px solid #ddd', fontSize: '14px' }}
                    onKeyDown={e => e.key === 'Enter' && agregarCombustible()} />
                  <button onClick={agregarCombustible}
                    style={{ background: '#e65100', color: 'white', border: 'none', padding: '9px 18px', borderRadius: '7px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>
                    Guardar
                  </button>
                  <button onClick={() => { setMostrarFormComb(false); setFormComb({ descripcion: '', valor: '' }) }}
                    style={{ background: '#f5f5f5', color: '#666', border: 'none', padding: '9px 14px', borderRadius: '7px', cursor: 'pointer', fontSize: '14px' }}>
                    Cancelar
                  </button>
                </div>
              ) : (
                <button onClick={() => setMostrarFormComb(true)}
                  style={{ marginTop: '12px', background: 'none', border: '1px dashed #ffccbc', color: '#e65100', padding: '8px 16px', borderRadius: '7px', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>
                  + Registrar combustible
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default CuentasGenerales
