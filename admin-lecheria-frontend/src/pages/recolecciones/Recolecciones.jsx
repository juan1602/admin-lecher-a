import { useState, useEffect } from 'react'
import api from '../../api/axios'
import { guardarPendiente, cachearDatos, getDatosCache } from '../../lib/offlineStore'
import { useRutaVista } from '../../context/RutaVistaContext'

function Recolecciones() {
  const { rutasSeleccionadas } = useRutaVista()
  const [quincenaAbierta, setQuincenaAbierta] = useState(null)
  const [conductores, setConductores] = useState([])
  const [proveedores, setProveedores] = useState([])
  const [recolecciones, setRecolecciones] = useState([])
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date().toISOString().split('T')[0])
  const [modal, setModal] = useState(null) // { proveedor, recoleccionId? }
  const [modalForm, setModalForm] = useState({ conductorId: '', litros: '', vale: '' })
  const [filtroLeche, setFiltroLeche] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [guardando, setGuardando] = useState(false)

  useEffect(() => { cargarDatos() }, [])

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

  const cargarDatos = async () => {
    try {
      const [quincenaRes, conductoresRes, proveedoresRes] = await Promise.all([
        api.get('/quincenas/abierta'),
        api.get('/conductores'),
        api.get('/proveedores')
      ])
      setQuincenaAbierta(quincenaRes.data)
      setConductores(conductoresRes.data)
      setProveedores(proveedoresRes.data)
      cachearDatos('QUINCENA', quincenaRes.data)
      cachearDatos('CONDUCTORES', conductoresRes.data)
      cachearDatos('PROVEEDORES', proveedoresRes.data)
      cargarRecolecciones(quincenaRes.data.id)
    } catch {
      const q = getDatosCache('QUINCENA')
      const c = getDatosCache('CONDUCTORES')
      const provs = getDatosCache('PROVEEDORES')
      if (q) setQuincenaAbierta(q)
      if (c) setConductores(c)
      if (provs) setProveedores(provs)
    }
  }

  const cargarRecolecciones = async (quincenaId) => {
    const res = await api.get(`/recolecciones/quincena/${quincenaId}`)
    setRecolecciones(res.data)
  }

  // Proveedores activos según las rutas seleccionadas, tipo de leche y búsqueda
  const proveedoresFiltrados = proveedores.filter(p =>
    p.ruta && rutasSeleccionadas.has(p.ruta.id) &&
    (!filtroLeche || (p.tipoLeche || 'vaca') === filtroLeche) &&
    (!busqueda || p.nombre.toLowerCase().includes(busqueda.toLowerCase()))
  )

  // Recoleccion del proveedor en la fecha seleccionada
  const getRecoleccion = (proveedorId) =>
    recolecciones.find(r => r.proveedor?.id === proveedorId && r.fecha === fechaSeleccionada)

  // Conductores disponibles para una ruta; si el conductor tiene rutaIds vacío, trabaja en todas
  const getConductoresPorRuta = (rutaId) =>
    conductores.filter(c => !c.rutaIds || c.rutaIds.length === 0 || c.rutaIds.includes(rutaId))

  const abrirModal = (proveedor) => {
    const rec = getRecoleccion(proveedor.id)
    const conductoresPorRuta = getConductoresPorRuta(proveedor.ruta?.id)
    const conductorDefault = rec?.conductor?.id?.toString() ||
      (conductoresPorRuta.length > 0 ? conductoresPorRuta[0].id.toString() : '')
    setModal({ proveedor, recoleccionId: rec?.id || null })
    setModalForm({
      conductorId: conductorDefault,
      litros: rec?.litrosRecolectados?.toString() || '',
      vale: rec?.vale || ''
    })
  }

  const cerrarModal = () => {
    setModal(null)
    setModalForm({ conductorId: '', litros: '', vale: '' })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (guardando) return
    setGuardando(true)
    try {
      if (modal.recoleccionId) {
        await api.put(`/recolecciones/${modal.recoleccionId}`, {
          litrosRecolectados: parseFloat(modalForm.litros),
          vale: modalForm.vale,
          conductor: { id: parseInt(modalForm.conductorId) }
        })
      } else {
        const payload = {
          proveedor: { id: modal.proveedor.id },
          conductor: { id: parseInt(modalForm.conductorId) },
          ruta: modal.proveedor.ruta,
          quincena: { id: quincenaAbierta.id },
          fecha: fechaSeleccionada,
          litrosRecolectados: parseFloat(modalForm.litros),
          vale: modalForm.vale,
          sincronizado: true
        }
        try {
          await api.post('/recolecciones', payload)
        } catch (netError) {
          if (!navigator.onLine || netError.code === 'ECONNABORTED' || netError.message === 'Network Error') {
            guardarPendiente({ ...payload, sincronizado: false })
            cerrarModal()
            alert('Sin internet — el registro se guardó en el celular y se enviará automáticamente cuando vuelva la conexión.')
            return
          }
          throw netError
        }
      }
      cerrarModal()
      cargarRecolecciones(quincenaAbierta.id)
    } catch (error) {
      if (error.response?.status === 409) {
        // Ya estaba registrada (otro dispositivo o un intento anterior que sí llegó): refrescar en vez de duplicar
        cerrarModal()
        cargarRecolecciones(quincenaAbierta.id)
        alert('Esta recolección ya estaba registrada. Se actualizó la lista; si los litros no son correctos, usa Editar.')
        return
      }
      const msg = error.response?.data
      alert('Error al guardar: ' + (typeof msg === 'string' ? msg : error.message))
    } finally {
      setGuardando(false)
    }
  }

  const eliminar = async (recId) => {
    if (confirm('¿Eliminar esta recolección?')) {
      await api.delete(`/recolecciones/${recId}`)
      cargarRecolecciones(quincenaAbierta.id)
    }
  }

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

  const registradosHoy = proveedoresFiltrados.filter(p => getRecoleccion(p.id))
  const totalLitrosDia = registradosHoy.reduce((s, p) => s + (getRecoleccion(p.id)?.litrosRecolectados ?? 0), 0)
  const totalLitros = recolecciones
    .filter(r => rutasSeleccionadas.has(r.proveedor?.ruta?.id))
    .reduce((s, r) => s + (r.litrosRecolectados ?? 0), 0)

  // Agrupar proveedores por nombre de ruta
  const porRuta = {}
  proveedoresFiltrados.forEach(p => {
    const key = p.ruta?.nombre || 'Sin ruta'
    if (!porRuta[key]) porRuta[key] = []
    porRuta[key].push(p)
  })

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
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ margin: 0 }}>Recolecciones</h2>
          <span style={{ fontSize: '13px', color: '#666' }}>Quincena: {quincenaAbierta.textoQuincena}</span>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar proveedor..."
            style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '13px', outline: 'none', minWidth: '180px' }}
          />
          {[['', 'Todos'], ['vaca', 'Vaca'], ['bufala', 'Búfala']].map(([val, label]) => (
            <button key={val} onClick={() => setFiltroLeche(val)} style={{
              padding: '6px 16px', borderRadius: '20px', border: '2px solid',
              borderColor: filtroLeche === val ? '#6c63ff' : '#e0e0e0',
              background: filtroLeche === val ? '#6c63ff' : 'white',
              color: filtroLeche === val ? 'white' : '#666',
              fontWeight: '600', fontSize: '13px', cursor: 'pointer'
            }}>{label}</button>
          ))}
        </div>
      </div>

      {/* Navegador de días */}
      <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: '20px', padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
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

          <div style={{ display: 'flex', gap: '20px', marginLeft: 'auto', flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '12px', color: '#888' }}>Registrados hoy</div>
              <div style={{ fontSize: '22px', fontWeight: '700', color: '#6c63ff' }}>
                {registradosHoy.length} / {proveedoresFiltrados.length}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '12px', color: '#888' }}>Litros hoy</div>
              <div style={{ fontSize: '22px', fontWeight: '700', color: '#0288d1' }}>
                {totalLitrosDia.toLocaleString('es-CO')} L
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '12px', color: '#888' }}>Total quincena</div>
              <div style={{ fontSize: '22px', fontWeight: '700', color: '#388e3c' }}>
                {totalLitros.toLocaleString('es-CO')} L
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tarjetas de proveedores agrupadas por ruta */}
      {proveedoresFiltrados.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#999', background: 'white', borderRadius: '12px' }}>
          No hay proveedores registrados para las rutas seleccionadas.
        </div>
      ) : (
        Object.entries(porRuta).map(([rutaNombre, provs]) => (
          <div key={rutaNombre} style={{ marginBottom: '24px' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '0.8px', color: '#888', marginBottom: '10px', textTransform: 'uppercase' }}>
              {rutaNombre}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: '12px' }}>
              {[...provs].sort((a, b) => a.nombre.localeCompare(b.nombre)).map(p => {
                const rec = getRecoleccion(p.id)
                return (
                  <div key={p.id} style={{
                    background: 'white',
                    borderRadius: '12px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
                    border: rec ? '2px solid #c8e6c9' : '2px solid #e8e8e8',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontWeight: '600', fontSize: '15px', color: '#1a1a2e' }}>{p.nombre}</div>
                        {p.zona && <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>{p.zona}</div>}
                      </div>
                      <span style={{ background: '#ede7f6', color: '#4527a0', padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: '600', whiteSpace: 'nowrap' }}>
                        {p.ruta?.nombre || '—'}
                      </span>
                    </div>

                    {rec ? (
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                          <div>
                            <div style={{ fontSize: '24px', fontWeight: '700', color: '#0288d1' }}>{rec.litrosRecolectados} L</div>
                            <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
                              {rec.conductor?.nombre}{rec.vale ? ` · Vale: ${rec.vale}` : ''}
                            </div>
                          </div>
                          <div style={{ background: '#e8f5e9', color: '#2e7d32', padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: '600' }}>
                            ✓ Registrado
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => abrirModal(p)}
                            style={{ flex: 1, background: '#f3f0ff', color: '#4527a0', border: 'none', padding: '8px', borderRadius: '7px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}>
                            Editar
                          </button>
                          <button onClick={() => eliminar(rec.id)}
                            style={{ background: '#ffebee', color: '#c62828', border: 'none', padding: '8px 14px', borderRadius: '7px', cursor: 'pointer', fontSize: '13px' }}>
                            ✕
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => abrirModal(p)}
                        style={{ background: '#6c63ff', color: 'white', border: 'none', padding: '10px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', width: '100%' }}>
                        + Registrar litros
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))
      )}

      {/* Modal de registro / edición */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '420px', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '17px' }}>
              {modal.recoleccionId ? 'Editar recolección' : 'Registrar litros'}
            </h3>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '20px' }}>
              <strong>{modal.proveedor.nombre}</strong> — {formatDiaLabel(fechaSeleccionada)}
            </div>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500' }}>Conductor</label>
                  <select value={modalForm.conductorId}
                    onChange={e => setModalForm({ ...modalForm, conductorId: e.target.value })} required
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box', fontSize: '14px' }}>
                    <option value="">Seleccionar...</option>
                    {getConductoresPorRuta(modal.proveedor.ruta?.id).map(c =>
                      <option key={c.id} value={c.id}>{c.nombre}</option>
                    )}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500' }}>Litros recolectados</label>
                  <input type="number" step="0.1" value={modalForm.litros}
                    onChange={e => setModalForm({ ...modalForm, litros: e.target.value })} required autoFocus
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box', fontSize: '14px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500' }}>Vale (opcional)</label>
                  <input type="text" value={modalForm.vale}
                    onChange={e => setModalForm({ ...modalForm, vale: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box', fontSize: '14px' }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button type="submit" disabled={guardando}
                  style={{ flex: 1, background: '#6c63ff', color: 'white', border: 'none', padding: '12px', borderRadius: '8px', cursor: guardando ? 'wait' : 'pointer', fontSize: '15px', fontWeight: '600', opacity: guardando ? 0.6 : 1 }}>
                  {guardando ? 'Guardando...' : modal.recoleccionId ? 'Actualizar' : 'Guardar'}
                </button>
                <button type="button" onClick={cerrarModal}
                  style={{ background: '#f5f5f5', color: '#444', border: 'none', padding: '12px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '15px' }}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Recolecciones
