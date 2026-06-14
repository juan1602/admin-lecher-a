import { useState, useEffect, useMemo } from 'react'
import api from '../../api/axios'
import { useRutaVista } from '../../context/RutaVistaContext'

const fmt = (n) => Math.round(n).toLocaleString('es-CO')

function CuentasGenerales() {
  const { rutasSeleccionadas } = useRutaVista()
  const [rutas, setRutas] = useState([])
  // Selector de rutas propio de esta página (independiente del sidebar)
  const [rutasContexto, setRutasContexto] = useState(() => new Set(rutasSeleccionadas))

  const [quincenas, setQuincenas] = useState([])
  const [quincenaId, setQuincenaId] = useState('')
  const [quincenaTexto, setQuincenaTexto] = useState('')
  const [cargando, setCargando] = useState(false)
  const [transporteTotal, setTransporteTotal] = useState(0)
  const [rindeTotal, setRindeTotal] = useState(0)
  const [descuentos, setDescuentos] = useState([])
  const [combustibles, setCombustibles] = useState([])
  const [excedentesData, setExcedentesData] = useState([])
  const [resumenProveedores, setResumenProveedores] = useState([])
  const [formDesc, setFormDesc] = useState({ nombre: '', valor: '' })
  const [mostrarFormTrans, setMostrarFormTrans] = useState(false)
  const [mostrarFormRinde, setMostrarFormRinde] = useState(false)
  const [formComb, setFormComb] = useState({ descripcion: '', valor: '' })
  const [mostrarFormComb, setMostrarFormComb] = useState(false)
  const [editando, setEditando] = useState(null)

  // Clave de ruta: IDs ordenados separados por coma, ej: "1,2" o "3"
  const rutaContexto = useMemo(
    () => [...rutasContexto].sort((a, b) => a - b).join(','),
    [rutasContexto]
  )

  useEffect(() => {
    Promise.all([api.get('/rutas'), api.get('/quincenas')]).then(([rRes, qRes]) => {
      setRutas(rRes.data)
      setQuincenas(qRes.data)
      const abierta = qRes.data.find(q => !q.cerrada)
      if (abierta) {
        setQuincenaId(String(abierta.id))
        setQuincenaTexto(abierta.textoQuincena || '')
      }
    })
  }, [])

  // Recarga datos cuando cambia quincena o selección de rutas
  useEffect(() => {
    if (quincenaId && rutaContexto) cargarTodo(quincenaId, rutaContexto)
  }, [quincenaId, rutaContexto])

  const cargarTodo = async (id, ctx) => {
    if (!id || !ctx) return
    setCargando(true)
    try {
      const [vistaRes, excRes, resumenRes] = await Promise.all([
        api.get(`/grupos-rinde/vista-completa/${id}?rutaIds=${ctx}`),
        api.get(`/excedentes/quincena/${id}`),
        api.get(`/recolecciones/resumen/${id}`)
      ])
      setTransporteTotal(vistaRes.data.transporteTotal || 0)
      setRindeTotal(vistaRes.data.rindeValorTotal || 0)
      setExcedentesData(excRes.data)
      setResumenProveedores(resumenRes.data.proveedores || [])
      await cargarDescuentos(id, ctx)
      await cargarCombustibles(id, ctx)
    } catch {}
    setCargando(false)
  }

  const cargarDescuentos = async (id, ctx) => {
    try { await api.post(`/descuentos-cuenta/quincena/${id}/heredar?rutaContexto=${ctx}`) } catch {}
    const r = await api.get(`/descuentos-cuenta/quincena/${id}?rutaContexto=${ctx}`)
    setDescuentos(r.data)
  }

  const cargarCombustibles = async (id, ctx) => {
    const r = await api.get(`/combustibles/quincena/${id}?rutaContexto=${ctx}`)
    setCombustibles(r.data)
  }

  const toggleRuta = (id) => {
    setRutasContexto(prev => {
      if (prev.has(id) && prev.size === 1) return prev
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleQuincenaChange = (e) => {
    const q = quincenas.find(q => String(q.id) === e.target.value)
    setQuincenaId(e.target.value)
    setQuincenaTexto(q?.textoQuincena || '')
    setDescuentos([])
    setCombustibles([])
    setExcedentesData([])
    setResumenProveedores([])
    setTransporteTotal(0)
    setRindeTotal(0)
  }

  const recargarDescuentos = () => cargarDescuentos(quincenaId, rutaContexto)
  const recargarCombustibles = () => cargarCombustibles(quincenaId, rutaContexto)

  const agregarDescuento = async (tipo) => {
    const nombre = formDesc.nombre.trim()
    const valor = parseFloat(formDesc.valor)
    if (!nombre || !valor) return
    await api.post('/descuentos-cuenta', {
      quincena: { id: parseInt(quincenaId) },
      tipo,
      nombre,
      valor,
      rutaContexto
    })
    setFormDesc({ nombre: '', valor: '' })
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
      valor,
      rutaContexto
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

  // Excedentes filtrados por las rutas del contexto actual
  const rutasContextoIds = new Set(rutaContexto.split(',').map(Number).filter(Boolean))
  const totalExcedentes = excedentesData.reduce((sum, exc) => {
    const rutaId = exc.proveedor?.ruta?.id
    if (!rutaId || !rutasContextoIds.has(rutaId)) return sum
    const prov = resumenProveedores.find(p => p.proveedorId === exc.proveedor.id)
    return sum + (prov?.totalLitros || 0) * (exc.valorPorLitro || 0)
  }, 0)

  const totalDescTrans = descTrans.reduce((s, d) => s + (d.valor || 0), 0) + totalCombustibles
  const totalDescRinde = descRinde.reduce((s, d) => s + (d.valor || 0), 0) + totalExcedentes
  const netoTrans = transporteTotal - totalDescTrans
  const netoRinde = rindeTotal - totalDescRinde

  const nombreRutas = rutas
    .filter(r => rutasContexto.has(r.id))
    .map(r => r.nombre)
    .join(' + ') || '—'

  const filaEdicion = (d) => (
    <div style={{ display: 'flex', gap: '6px', flex: 1 }}>
      <input value={editando.nombre} onChange={e => setEditando({ ...editando, nombre: e.target.value })}
        style={{ flex: 1, padding: '4px 8px', borderRadius: '5px', border: '1px solid #ddd', fontSize: '13px' }} />
      <input type="number" value={editando.valor} onChange={e => setEditando({ ...editando, valor: e.target.value })}
        style={{ width: '90px', padding: '4px 8px', borderRadius: '5px', border: '1px solid #ddd', fontSize: '13px' }} />
      <button onClick={guardarEdicion} style={{ background: '#6c63ff', color: 'white', border: 'none', padding: '4px 10px', borderRadius: '5px', cursor: 'pointer', fontSize: '12px' }}>✓</button>
      <button onClick={() => setEditando(null)} style={{ background: '#f5f5f5', color: '#666', border: 'none', padding: '4px 8px', borderRadius: '5px', cursor: 'pointer', fontSize: '12px' }}>✕</button>
    </div>
  )

  const filaDescuento = (d, i) => (
    <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
      {editando?.id === d.id ? filaEdicion(d) : (
        <>
          <span style={{ fontSize: '14px', color: '#333', cursor: 'pointer' }}
            onClick={() => setEditando({ id: d.id, nombre: d.nombre, valor: d.valor })}>
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
  )

  const formDescuento = (tipo, mostrar, setMostrar) => mostrar ? (
    <div style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
      <input placeholder="Nombre" value={formDesc.nombre}
        onChange={e => setFormDesc({ ...formDesc, nombre: e.target.value })}
        style={{ flex: 1, padding: '7px 10px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '13px' }} />
      <input type="number" placeholder="Valor" value={formDesc.valor}
        onChange={e => setFormDesc({ ...formDesc, valor: e.target.value })}
        style={{ width: '100px', padding: '7px 10px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '13px' }}
        onKeyDown={e => e.key === 'Enter' && agregarDescuento(tipo)} />
      <button onClick={() => agregarDescuento(tipo)}
        style={{ background: '#6c63ff', color: 'white', border: 'none', padding: '7px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>+</button>
      <button onClick={() => { setMostrar(false); setFormDesc({ nombre: '', valor: '' }) }}
        style={{ background: '#f5f5f5', color: '#666', border: 'none', padding: '7px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>✕</button>
    </div>
  ) : (
    <button onClick={() => setMostrar(true)}
      style={{ marginTop: '10px', background: 'none', border: '1px dashed #ddd', color: '#888', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', width: '100%' }}>
      + Agregar descuento
    </button>
  )

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ margin: 0 }}>Cuentas Generales</h2>
      </div>

      {/* Selectores: quincena + rutas */}
      <div style={{ background: 'white', padding: '16px 20px', borderRadius: '12px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div>
          <label style={{ fontSize: '13px', fontWeight: '500', color: '#666', display: 'block', marginBottom: '6px' }}>Quincena</label>
          <select value={quincenaId} onChange={handleQuincenaChange}
            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px', minWidth: '240px' }}>
            <option value="">Seleccionar quincena...</option>
            {quincenas.map(q => (
              <option key={q.id} value={q.id}>{q.textoQuincena} {!q.cerrada ? '(Abierta)' : ''}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ fontSize: '13px', fontWeight: '500', color: '#666', display: 'block', marginBottom: '6px' }}>¿Qué quieres ver?</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            {rutas.map(r => {
              const activa = rutasContexto.has(r.id)
              return (
                <button key={r.id} onClick={() => toggleRuta(r.id)} style={{
                  padding: '8px 16px', borderRadius: '20px', border: '2px solid',
                  borderColor: activa ? '#6c63ff' : '#e0e0e0',
                  background: activa ? '#6c63ff' : 'white',
                  color: activa ? 'white' : '#666',
                  cursor: 'pointer', fontSize: '13px', fontWeight: '600',
                  transition: 'all 0.15s'
                }}>
                  {r.nombre}
                </button>
              )
            })}
          </div>
        </div>

        {rutaContexto && (
          <div style={{ marginLeft: 'auto', padding: '8px 14px', background: '#f0f4ff', borderRadius: '8px', fontSize: '13px', color: '#4527a0' }}>
            Viendo: <strong>{nombreRutas}</strong>
          </div>
        )}
      </div>

      {cargando && <div style={{ textAlign: 'center', padding: '60px', color: '#999' }}>Cargando...</div>}

      {!cargando && quincenaId && rutaContexto && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>

            {/* CAJA TRANSPORTE */}
            <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
              <div style={{ background: '#0d47a1', color: 'white', padding: '14px 20px' }}>
                <div style={{ fontSize: '11px', letterSpacing: '0.8px', opacity: 0.8, marginBottom: '4px' }}>TRANSPORTE · {nombreRutas}</div>
                <div style={{ fontSize: '22px', fontWeight: '700' }}>${fmt(transporteTotal)}</div>
              </div>
              <div style={{ padding: '16px 20px' }}>
                <div style={{ fontSize: '12px', fontWeight: '600', color: '#888', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Descuentos</div>

                {totalCombustibles > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                    <div>
                      <span style={{ fontSize: '14px', color: '#333' }}>Combustibles</span>
                      <span style={{ marginLeft: '6px', fontSize: '11px', background: '#e3f2fd', color: '#1565c0', padding: '1px 6px', borderRadius: '4px' }}>auto</span>
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: '600', color: '#c62828' }}>-${fmt(totalCombustibles)}</span>
                  </div>
                )}

                {descTrans.map((d, i) => filaDescuento(d, i))}
                {formDescuento('TRANSPORTE', mostrarFormTrans, setMostrarFormTrans)}

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
                <div style={{ fontSize: '11px', letterSpacing: '0.8px', opacity: 0.8, marginBottom: '4px' }}>RINDE · {nombreRutas}</div>
                <div style={{ fontSize: '22px', fontWeight: '700' }}>${fmt(rindeTotal)}</div>
              </div>
              <div style={{ padding: '16px 20px' }}>
                <div style={{ fontSize: '12px', fontWeight: '600', color: '#888', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Descuentos</div>

                {totalExcedentes > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                    <div>
                      <span style={{ fontSize: '14px', color: '#333' }}>Excedentes</span>
                      <span style={{ marginLeft: '6px', fontSize: '11px', background: '#fce4ec', color: '#880e4f', padding: '1px 6px', borderRadius: '4px' }}>auto</span>
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: '600', color: '#c62828' }}>-${fmt(totalExcedentes)}</span>
                  </div>
                )}

                {descRinde.map((d, i) => filaDescuento(d, i))}

                {descRinde.length === 0 && totalExcedentes === 0 && !mostrarFormRinde && (
                  <div style={{ padding: '16px 0', textAlign: 'center', color: '#bbb', fontSize: '13px' }}>Sin descuentos registrados</div>
                )}

                {formDescuento('RINDE', mostrarFormRinde, setMostrarFormRinde)}

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

          {/* TOTAL FINAL */}
          <div style={{ background: '#1a1a2e', borderRadius: '12px', padding: '20px 28px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '11px', color: '#888', letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: '4px' }}>
                Neto transporte + Neto rinde · {nombreRutas}
              </div>
              <div style={{ fontSize: '13px', color: '#aaa' }}>
                ${fmt(netoTrans)} + ${fmt(netoRinde)}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>TOTAL FINAL</div>
              <div style={{ fontSize: '32px', fontWeight: '700', color: (netoTrans + netoRinde) >= 0 ? '#a5d6a7' : '#ef9a9a' }}>
                ${fmt(netoTrans + netoRinde)}
              </div>
            </div>
          </div>

          {/* CAJA COMBUSTIBLES */}
          <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
            <div style={{ background: '#e65100', color: 'white', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '11px', letterSpacing: '0.8px', opacity: 0.8, marginBottom: '2px' }}>COMBUSTIBLES · {nombreRutas} · {quincenaTexto}</div>
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
