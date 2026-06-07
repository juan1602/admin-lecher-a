import { useState, useEffect } from 'react'
import api from '../../api/axios'
import { guardarPendiente, cachearDatos, getDatosCache } from '../../lib/offlineStore'
import { useRutaVista } from '../../context/RutaVistaContext'

function Recolecciones() {
  const { rutasSeleccionadas } = useRutaVista()
  const [quincenaAbierta, setQuincenaAbierta] = useState(null)
  const [rutas, setRutas] = useState([])
  const [conductores, setConductores] = useState([])
  const [proveedores, setProveedores] = useState([])
  const [recolecciones, setRecolecciones] = useState([])
  const [rutaSeleccionada, setRutaSeleccionada] = useState('')
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date().toISOString().split('T')[0])
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState({
    proveedor: null,
    conductor: null,
    ruta: null,
    fecha: new Date().toISOString().split('T')[0],
    litrosRecolectados: '',
    vale: ''
  })

  useEffect(() => { cargarDatos() }, [])

  // Auto-refresh: recarga cuando vuelves a la pestaña o cada 60 segundos
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible' && quincenaAbierta) {
        cargarRecolecciones(quincenaAbierta.id)
      }
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [quincenaAbierta])

  useEffect(() => {
    if (!quincenaAbierta) return
    const intervalo = setInterval(() => cargarRecolecciones(quincenaAbierta.id), 60000)
    return () => clearInterval(intervalo)
  }, [quincenaAbierta])

  useEffect(() => {
    if (rutaSeleccionada) cargarProveedoresPorRuta(rutaSeleccionada)
  }, [rutaSeleccionada])

  const cargarDatos = async () => {
    try {
      const [quincenaRes, rutasRes, conductoresRes] = await Promise.all([
        api.get('/quincenas/abierta'),
        api.get('/rutas'),
        api.get('/conductores')
      ])
      setQuincenaAbierta(quincenaRes.data)
      setRutas(rutasRes.data)
      setConductores(conductoresRes.data)
      // Guardar datos en cache para uso offline
      cachearDatos('QUINCENA', quincenaRes.data)
      cachearDatos('RUTAS', rutasRes.data)
      cachearDatos('CONDUCTORES', conductoresRes.data)
      cargarRecolecciones(quincenaRes.data.id)
    } catch {
      // Sin internet: cargar desde cache local
      const q = getDatosCache('QUINCENA')
      const r = getDatosCache('RUTAS')
      const c = getDatosCache('CONDUCTORES')
      if (q) setQuincenaAbierta(q)
      if (r) setRutas(r)
      if (c) setConductores(c)
      const provs = getDatosCache('PROVEEDORES')
      if (provs) setProveedores(provs)
    }
  }

  const cargarProveedoresPorRuta = async (rutaId) => {
    try {
      const res = await api.get('/proveedores')
      cachearDatos('PROVEEDORES', res.data)
      setProveedores(res.data.filter(p => p.ruta?.id === parseInt(rutaId)))
    } catch {
      const cache = getDatosCache('PROVEEDORES') || []
      setProveedores(cache.filter(p => p.ruta?.id === parseInt(rutaId)))
    }
  }

  const cargarRecolecciones = async (quincenaId) => {
    const res = await api.get(`/recolecciones/quincena/${quincenaId}`)
    setRecolecciones(res.data)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    if (name === 'proveedor' || name === 'conductor' || name === 'ruta') {
      setForm({ ...form, [name]: value ? { id: parseInt(value) } : null })
    } else {
      setForm({ ...form, [name]: value })
    }
  }

  const handleRutaFiltro = (e) => {
    setRutaSeleccionada(e.target.value)
    setForm({ ...form, ruta: e.target.value ? { id: parseInt(e.target.value) } : null, proveedor: null })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editando) {
        await api.put(`/recolecciones/${editando}`, {
          litrosRecolectados: parseFloat(form.litrosRecolectados),
          vale: form.vale,
          conductor: form.conductor
        })
        setEditando(null)
      } else {
        const payload = {
          ...form,
          quincena: { id: quincenaAbierta.id },
          litrosRecolectados: parseFloat(form.litrosRecolectados),
          sincronizado: true
        }
        try {
          await api.post('/recolecciones', payload)
        } catch (netError) {
          // Sin internet: guardar localmente para sincronizar después
          if (!navigator.onLine || netError.code === 'ECONNABORTED' || netError.message === 'Network Error') {
            guardarPendiente({ ...payload, sincronizado: false })
            setForm({ proveedor: null, conductor: null, ruta: form.ruta, fecha: form.fecha, litrosRecolectados: '', vale: '' })
            setMostrarFormulario(false)
            alert('Sin internet — el registro se guardó en el celular y se enviará automáticamente cuando vuelva la conexión.')
            return
          }
          throw netError
        }
      }
      setForm({ proveedor: null, conductor: null, ruta: form.ruta, fecha: form.fecha, litrosRecolectados: '', vale: '' })
      setMostrarFormulario(false)
      cargarRecolecciones(quincenaAbierta.id)
    } catch (error) {
      alert('Este proveedor ya tiene recolección registrada en esta fecha. Por favor edita el registro existente.')
    }
  }

  const iniciarEdicion = (r) => {
    setEditando(r.id)
    setRutaSeleccionada(r.proveedor?.ruta?.id?.toString() || '')
    setForm({
      proveedor: { id: r.proveedor?.id },
      conductor: { id: r.conductor?.id },
      ruta: { id: r.proveedor?.ruta?.id },
      fecha: r.fecha,
      litrosRecolectados: r.litrosRecolectados,
      vale: r.vale || ''
    })
    setMostrarFormulario(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const cancelar = () => {
    setEditando(null)
    setMostrarFormulario(false)
    setForm({ proveedor: null, conductor: null, ruta: null, fecha: new Date().toISOString().split('T')[0], litrosRecolectados: '', vale: '' })
  }

  const eliminar = async (id) => {
    if (confirm('¿Eliminar esta recolección?')) {
      await api.delete(`/recolecciones/${id}`)
      cargarRecolecciones(quincenaAbierta.id)
    }
  }

  const enRutaActiva = (r) => rutasSeleccionadas.has(r.proveedor?.ruta?.id)

  // Registros del día seleccionado
  const delDia = recolecciones.filter(r => r.fecha === fechaSeleccionada && enRutaActiva(r))
  const totalLitrosDia = delDia.reduce((sum, r) => sum + (r.litrosRecolectados ?? 0), 0)
  const totalLitros = recolecciones.filter(enRutaActiva).reduce((sum, r) => sum + (r.litrosRecolectados ?? 0), 0)

  // Navegación de días dentro de la quincena
  const cambiarDia = (delta) => {
    const d = new Date(fechaSeleccionada + 'T12:00:00')
    d.setDate(d.getDate() + delta)
    const nueva = d.toISOString().split('T')[0]
    if (quincenaAbierta) {
      if (nueva < quincenaAbierta.fechaInicio || nueva > quincenaAbierta.fechaFin) return
    }
    setFechaSeleccionada(nueva)
  }

  const formatDiaLabel = (fecha) => {
    if (!fecha) return ''
    const [anio, mes, dia] = fecha.split('-')
    const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
    return `${parseInt(dia)} de ${meses[parseInt(mes) - 1]} de ${anio}`
  }

  if (!quincenaAbierta) {
    return (
      <div style={{ textAlign: 'center', padding: '60px', color: '#999' }}>
        <h2>No hay quincena abierta</h2>
        <p>Ve a la sección de Quincenas y crea una nueva para empezar a registrar recolecciones.</p>
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ margin: 0 }}>Recolecciones</h2>
          <span style={{ fontSize: '13px', color: '#666' }}>Quincena: {quincenaAbierta.textoQuincena}</span>
        </div>
        <button onClick={() => {
            setEditando(null)
            setForm(f => ({ ...f, fecha: fechaSeleccionada, proveedor: null, conductor: null, litrosRecolectados: '', vale: '' }))
            setMostrarFormulario(!mostrarFormulario)
          }}
          style={{ background: '#6c63ff', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer' }}>
          {mostrarFormulario ? 'Cancelar' : '+ Nueva recolección'}
        </button>
      </div>

      {/* Navegador de días */}
      <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: '20px', padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          {/* Botones anterior / siguiente */}
          <button onClick={() => cambiarDia(-1)}
            style={{ background: '#f0f0f0', border: 'none', borderRadius: '8px', padding: '10px 18px', fontSize: '18px', cursor: 'pointer', fontWeight: '700', color: '#333' }}>
            ‹
          </button>

          <div style={{ flex: 1, textAlign: 'center' }}>
            <input type="date" value={fechaSeleccionada}
              min={quincenaAbierta?.fechaInicio}
              max={quincenaAbierta?.fechaFin}
              onChange={e => setFechaSeleccionada(e.target.value)}
              style={{ border: 'none', fontSize: '15px', fontWeight: '600', color: '#1a1a2e', background: 'transparent', cursor: 'pointer', textAlign: 'center' }} />
            <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>
              {formatDiaLabel(fechaSeleccionada)}
            </div>
          </div>

          <button onClick={() => cambiarDia(1)}
            style={{ background: '#f0f0f0', border: 'none', borderRadius: '8px', padding: '10px 18px', fontSize: '18px', cursor: 'pointer', fontWeight: '700', color: '#333' }}>
            ›
          </button>

          {/* Resumen del día */}
          <div style={{ display: 'flex', gap: '20px', marginLeft: 'auto', flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '12px', color: '#888' }}>Registros hoy</div>
              <div style={{ fontSize: '22px', fontWeight: '700', color: '#6c63ff' }}>{delDia.length}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '12px', color: '#888' }}>Litros hoy</div>
              <div style={{ fontSize: '22px', fontWeight: '700', color: '#0288d1' }}>{totalLitrosDia.toLocaleString('es-CO')} L</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '12px', color: '#888' }}>Total quincena</div>
              <div style={{ fontSize: '22px', fontWeight: '700', color: '#388e3c' }}>{totalLitros.toLocaleString('es-CO')} L</div>
            </div>
          </div>
        </div>
      </div>

      {mostrarFormulario && (
        <div style={{ background: 'white', padding: '24px', borderRadius: '12px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <h3 style={{ marginTop: 0 }}>{editando ? 'Editar recolección' : 'Nueva recolección'}</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {!editando && (
                <>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px' }}>Ruta</label>
                    <select onChange={handleRutaFiltro} required
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ddd', boxSizing: 'border-box' }}>
                      <option value="">Seleccionar ruta...</option>
                      {rutas.filter(r => rutasSeleccionadas.has(r.id)).map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px' }}>Proveedor</label>
                    <select name="proveedor" onChange={handleChange} required
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ddd', boxSizing: 'border-box' }}>
                      <option value="">Seleccionar proveedor...</option>
                      {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                    </select>
                  </div>
                </>
              )}
              {editando && (
                <div style={{ gridColumn: '1 / -1', background: '#f5f5f5', padding: '12px', borderRadius: '8px', fontSize: '14px', color: '#444' }}>
                  Editando recolección de <strong>{recolecciones.find(r => r.id === editando)?.proveedor?.nombre}</strong> — {recolecciones.find(r => r.id === editando)?.fecha}
                </div>
              )}
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px' }}>Conductor</label>
                <select name="conductor" onChange={handleChange} required
                  value={form.conductor?.id || ''}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ddd', boxSizing: 'border-box' }}>
                  <option value="">Seleccionar conductor...</option>
                  {conductores.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px' }}>Fecha</label>
                <input name="fecha" value={form.fecha} onChange={handleChange} type="date" required disabled={!!editando}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ddd', boxSizing: 'border-box', background: editando ? '#f5f5f5' : 'white' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px' }}>Litros recolectados</label>
                <input name="litrosRecolectados" value={form.litrosRecolectados} onChange={handleChange} type="number" step="0.1" required
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ddd', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px' }}>Vale</label>
                <input name="vale" value={form.vale} onChange={handleChange}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ddd', boxSizing: 'border-box' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
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

      <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
        <div style={{ background: '#1a1a2e', color: 'white', padding: '12px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: '600', fontSize: '13px', letterSpacing: '0.4px' }}>
            REGISTROS DEL {formatDiaLabel(fechaSeleccionada).toUpperCase()}
          </span>
          <span style={{ fontSize: '12px', color: '#aaa' }}>{delDia.length} proveedor{delDia.length !== 1 ? 'es' : ''}</span>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f5f5f5', borderBottom: '1px solid #e0e0e0' }}>
              <th style={th}>Proveedor</th>
              <th style={th}>Ruta</th>
              <th style={th}>Conductor</th>
              <th style={{ ...th, textAlign: 'right' }}>Litros</th>
              <th style={th}>Vale</th>
              <th style={th}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {delDia.map((r, i) => (
              <tr key={r.id} style={{ borderBottom: '1px solid #f0f0f0', background: editando === r.id ? '#f3f0ff' : i % 2 === 0 ? 'white' : '#fafafa' }}>
                <td style={{ ...td, fontWeight: '500' }}>{r.proveedor?.nombre}</td>
                <td style={{ ...td, color: '#666' }}>
                  <span style={{ background: '#ede7f6', color: '#4527a0', padding: '2px 8px', borderRadius: '10px', fontSize: '12px' }}>
                    {r.proveedor?.ruta?.nombre || '—'}
                  </span>
                </td>
                <td style={{ ...td, color: '#666' }}>{r.conductor?.nombre}</td>
                <td style={{ ...td, textAlign: 'right', fontWeight: '600', color: '#0288d1' }}>{r.litrosRecolectados} L</td>
                <td style={{ ...td, color: '#666' }}>{r.vale || '—'}</td>
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
            ))}
            {delDia.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
                  No hay recolecciones registradas para este día.<br />
                  <span style={{ fontSize: '13px' }}>Usa el botón <strong>+ Nueva recolección</strong> para agregar.</span>
                </td>
              </tr>
            )}
          </tbody>
          {delDia.length > 0 && (
            <tfoot>
              <tr style={{ background: '#f0fdf4', borderTop: '2px solid #c8e6c9' }}>
                <td colSpan={3} style={{ ...td, fontWeight: '600', color: '#1b5e20' }}>Total del día</td>
                <td style={{ ...td, textAlign: 'right', fontWeight: '700', color: '#1b5e20', fontSize: '15px' }}>
                  {totalLitrosDia.toLocaleString('es-CO')} L
                </td>
                <td colSpan={2} style={td}></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  )
}

const th = { padding: '10px 14px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#444' }
const td = { padding: '10px 14px', fontSize: '13px' }

export default Recolecciones