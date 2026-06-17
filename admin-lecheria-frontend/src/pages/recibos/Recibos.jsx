import { useState, useEffect } from 'react'
import api from '../../api/axios'
import { useRutaVista } from '../../context/RutaVistaContext'

const fmt  = (n) => Math.round(n ?? 0).toLocaleString('es-CO')
const fmtL = (n) => Number(n ?? 0).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 1 })

const FORM_VACIO = {
  nombreRecibo: '', litrosRecibidos: '', precioLitro: '',
  precioTransporte: '', soloTransporte: false,
  fecha: new Date().toISOString().split('T')[0], rutaId: ''
}

function Recibos() {
  const { rutasDisponibles, rutasSeleccionadas } = useRutaVista()
  const [quincenaAbierta, setQuincenaAbierta] = useState(null)
  const [recibos, setRecibos]               = useState([])
  const [fechaSeleccionada, setFecha]       = useState(new Date().toISOString().split('T')[0])
  const [modal, setModal]                   = useState(null)  // { modo: 'nuevo'|'editar', empresa, recibo }
  const [form, setForm]                     = useState(FORM_VACIO)
  const [error, setError]                   = useState(null)
  const [guardando, setGuardando]           = useState(false)
  const [busqueda, setBusqueda]             = useState('')

  useEffect(() => { cargarDatos() }, [])

  const cargarDatos = async () => {
    try {
      const q = await api.get('/quincenas/abierta')
      setQuincenaAbierta(q.data)
      cargarRecibos(q.data.id)
    } catch { /* sin quincena */ }
  }

  const cargarRecibos = async (qId) => {
    const res = await api.get(`/recibos/quincena/${qId}`)
    setRecibos(res.data)
  }

  // Navegar días
  const cambiarDia = (delta) => {
    const d = new Date(fechaSeleccionada + 'T12:00:00')
    d.setDate(d.getDate() + delta)
    const nueva = d.toISOString().split('T')[0]
    if (quincenaAbierta) {
      if (nueva < quincenaAbierta.fechaInicio || nueva > quincenaAbierta.fechaFin) return
    }
    setFecha(nueva)
  }

  const formatDiaLabel = (f) => {
    if (!f) return ''
    const [a, m, d] = f.split('-')
    const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
    return `${parseInt(d)} de ${meses[parseInt(m)-1]} de ${a}`
  }

  // Empresas únicas de la quincena (normalizadas), filtradas por ruta activa
  const empresasMap = {}
  recibos.forEach(r => {
    const key = (r.nombreRecibo ?? '').trim().toLowerCase()
    if (key && !empresasMap[key]) {
      empresasMap[key] = {
        nombre: r.nombreRecibo.trim(),
        rutaId: r.ruta?.id ?? null,
        precioLitro: r.precioLitro,
        precioTransporte: r.precioTransporte,
        soloTransporte: r.soloTransporte
      }
    }
  })
  const todasEmpresas = Object.values(empresasMap).sort((a, b) => a.nombre.localeCompare(b.nombre))
  // Empresas asignadas a las rutas activas
  const empresas = todasEmpresas.filter(e =>
    e.rutaId && rutasSeleccionadas.has(e.rutaId) &&
    (!busqueda || e.nombre.toLowerCase().includes(busqueda.toLowerCase()))
  )
  // Empresas sin ruta asignada (siempre visibles para poder gestionarlas)
  const empresasSinRuta = todasEmpresas.filter(e =>
    !e.rutaId &&
    (!busqueda || e.nombre.toLowerCase().includes(busqueda.toLowerCase()))
  )

  // Recibos del día seleccionado
  const delDia = recibos.filter(r => r.fecha === fechaSeleccionada)
  const delDiaMap = {}
  delDia.forEach(r => { delDiaMap[(r.nombreRecibo ?? '').trim().toLowerCase()] = r })

  const enRutaActiva = (r) => !r.ruta?.id || rutasSeleccionadas.has(r.ruta.id)

  // Totales del día (solo rutas activas)
  const litrosDia   = delDia.filter(enRutaActiva).reduce((s, r) => s + (r.litrosRecibidos ?? 0), 0)
  const litrosTotal = recibos.filter(enRutaActiva).reduce((s, r) => s + (r.litrosRecibidos ?? 0), 0)

  const rutaUnica = rutasSeleccionadas.size === 1 ? [...rutasSeleccionadas][0] : ''

  // Abrir modal para agregar a empresa conocida
  const abrirAgregar = (empresa) => {
    setError(null)
    setForm({
      nombreRecibo: empresa.nombre,
      litrosRecibidos: '',
      precioLitro: empresa.precioLitro ?? '',
      precioTransporte: empresa.precioTransporte ?? '',
      soloTransporte: empresa.soloTransporte ?? false,
      fecha: fechaSeleccionada,
      rutaId: empresa.rutaId ?? rutaUnica
    })
    setModal({ modo: 'agregar', empresa })
  }

  // Abrir modal para editar recibo existente
  const abrirEditar = (recibo) => {
    setError(null)
    setForm({
      nombreRecibo: recibo.nombreRecibo ?? '',
      litrosRecibidos: recibo.litrosRecibidos ?? '',
      precioLitro: recibo.precioLitro ?? '',
      precioTransporte: recibo.precioTransporte ?? '',
      soloTransporte: recibo.soloTransporte ?? false,
      fecha: recibo.fecha ?? fechaSeleccionada,
      rutaId: recibo.ruta?.id ?? rutaUnica
    })
    setModal({ modo: 'editar', recibo })
  }

  // Abrir modal para nueva empresa
  const abrirNuevo = () => {
    setError(null)
    setForm({ ...FORM_VACIO, fecha: fechaSeleccionada, rutaId: rutaUnica })
    setModal({ modo: 'nuevo' })
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setGuardando(true)
    setError(null)
    const payload = {
      nombreRecibo: form.nombreRecibo.trim(),
      litrosRecibidos: parseFloat(form.litrosRecibidos),
      precioLitro: parseFloat(form.precioLitro),
      precioTransporte: form.precioTransporte ? parseFloat(form.precioTransporte) : null,
      soloTransporte: !!form.soloTransporte,
      fecha: form.fecha,
      quincena: { id: quincenaAbierta.id },
      ruta: form.rutaId ? { id: parseInt(form.rutaId) } : null
    }
    try {
      if (modal?.modo === 'editar') {
        await api.put(`/recibos/${modal.recibo.id}`, payload)
      } else {
        await api.post('/recibos', payload)
      }
      setModal(null)
      cargarRecibos(quincenaAbierta.id)
    } catch (err) {
      const msg = err?.response?.data || err?.response?.data?.message
      setError(typeof msg === 'string' ? msg : 'Error al guardar. Verifica que no sea un duplicado.')
    } finally {
      setGuardando(false)
    }
  }

  const eliminar = async (id) => {
    if (confirm('¿Eliminar este recibo?')) {
      await api.delete(`/recibos/${id}`)
      cargarRecibos(quincenaAbierta.id)
    }
  }

  const heredarEmpresas = async () => {
    if (!confirm('¿Copiar las empresas de la quincena anterior con sus precios?\n\nSe creará un registro con 0 litros en el primer día para cada empresa nueva.')) return
    try {
      const res = await api.post(`/recibos/quincena/${quincenaAbierta.id}/heredar`)
      await cargarRecibos(quincenaAbierta.id)
      const n = res.data.length
      if (n === 0) alert('Todas las empresas de la quincena anterior ya están registradas.')
      else alert(`Se heredaron ${n} empresa${n > 1 ? 's' : ''} con sus precios.`)
    } catch {
      alert('No se pudo heredar. Verifica que haya una quincena anterior con recibos.')
    }
  }

  if (!quincenaAbierta) {
    return (
      <div style={{ textAlign: 'center', padding: '60px', color: '#999' }}>
        <h2>No hay quincena abierta</h2>
        <p>Ve a Quincenas y crea una para empezar.</p>
      </div>
    )
  }

  return (
    <div>
      {/* Encabezado */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ margin: 0 }}>Recibos de la empresa</h2>
          <span style={{ fontSize: '13px', color: '#666' }}>{quincenaAbierta.textoQuincena}</span>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={heredarEmpresas}
            style={{ background: '#f0f4ff', color: '#4527a0', border: '1px solid #d1c4e9', padding: '10px 18px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>
            Heredar quincena anterior
          </button>
          <button onClick={abrirNuevo}
            style={{ background: '#6c63ff', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>
            + Nueva empresa
          </button>
        </div>
      </div>

      {/* Buscador */}
      <div style={{ marginBottom: '16px' }}>
        <input
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          placeholder="Buscar empresa..."
          style={{ width: '100%', padding: '9px 14px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
        />
      </div>

      {/* Navegador de días */}
      <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: '20px', padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <button onClick={() => cambiarDia(-1)}
            style={{ background: '#f0f0f0', border: 'none', borderRadius: '8px', padding: '10px 18px', fontSize: '18px', cursor: 'pointer', fontWeight: '700' }}>‹</button>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <input type="date" value={fechaSeleccionada}
              min={quincenaAbierta.fechaInicio} max={quincenaAbierta.fechaFin}
              onChange={e => setFecha(e.target.value)}
              style={{ border: 'none', fontSize: '15px', fontWeight: '600', color: '#1a1a2e', background: 'transparent', cursor: 'pointer', textAlign: 'center' }} />
            <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>{formatDiaLabel(fechaSeleccionada)}</div>
          </div>
          <button onClick={() => cambiarDia(1)}
            style={{ background: '#f0f0f0', border: 'none', borderRadius: '8px', padding: '10px 18px', fontSize: '18px', cursor: 'pointer', fontWeight: '700' }}>›</button>
          <div style={{ display: 'flex', gap: '20px', marginLeft: 'auto' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '12px', color: '#888' }}>Litros hoy</div>
              <div style={{ fontSize: '22px', fontWeight: '700', color: '#0288d1' }}>{fmtL(litrosDia)} L</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '12px', color: '#888' }}>Total quincena</div>
              <div style={{ fontSize: '22px', fontWeight: '700', color: '#388e3c' }}>{fmtL(litrosTotal)} L</div>
            </div>
          </div>
        </div>
      </div>

      {/* Panel de empresas del día */}
      {empresas.length === 0 && empresasSinRuta.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#999', background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          Aún no hay empresas registradas. Toca <strong>+ Nueva empresa</strong> para comenzar.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {empresas.map(emp => {
            const key = emp.nombre.toLowerCase()
            const rec = delDiaMap[key]
            const tieneEntrada = !!rec
            const vProv = rec ? (rec.litrosRecibidos ?? 0) * ((rec.precioLitro ?? 0) - (rec.precioTransporte ?? 0)) : 0

            return (
              <div key={emp.nombre} style={{
                background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                borderLeft: `4px solid ${tieneEntrada ? '#2e7d32' : '#e0e0e0'}`,
                padding: '14px 18px',
                display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap'
              }}>
                {/* Nombre y precios */}
                <div style={{ flex: 1, minWidth: '140px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: '600', fontSize: '15px', color: '#1a1a2e' }}>{emp.nombre}</span>
                    {emp.soloTransporte && (
                      <span style={{ fontSize: '11px', background: '#fff3e0', color: '#e65100', padding: '2px 6px', borderRadius: '4px' }}>
                        solo trans.
                      </span>
                    )}
                    {emp.rutaId ? (
                      <span style={{ fontSize: '11px', background: '#ede7f6', color: '#4527a0', padding: '2px 8px', borderRadius: '10px' }}>
                        {rutasDisponibles.find(r => r.id === emp.rutaId)?.nombre ?? '?'}
                      </span>
                    ) : (
                      <span style={{ fontSize: '11px', background: '#f5f5f5', color: '#999', padding: '2px 8px', borderRadius: '10px' }}>
                        Sin ruta
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>
                    ${fmt(emp.precioLitro)}/L
                    {emp.precioTransporte ? ` · Trans: $${fmt(emp.precioTransporte)}/L · Prov: $${fmt((emp.precioLitro ?? 0) - (emp.precioTransporte ?? 0))}/L` : ''}
                  </div>
                </div>

                {/* Estado del día */}
                {tieneEntrada ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '11px', color: '#888' }}>Litros</div>
                      <div style={{ fontSize: '18px', fontWeight: '700', color: '#0288d1' }}>{fmtL(rec.litrosRecibidos)}</div>
                    </div>
                    {rec.precioTransporte && (
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '11px', color: '#888' }}>A proveedores</div>
                        <div style={{ fontSize: '16px', fontWeight: '600', color: '#1b5e20' }}>${fmt(vProv)}</div>
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => abrirEditar(rec)}
                        style={{ background: '#e8f5e9', color: '#2e7d32', border: 'none', padding: '7px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}>
                        ✏️ Editar
                      </button>
                      <button onClick={() => eliminar(rec.id)}
                        style={{ background: '#ffebee', color: '#c62828', border: 'none', padding: '7px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>
                        🗑
                      </button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => abrirAgregar(emp)}
                    style={{ background: '#f3f0ff', color: '#6c63ff', border: '1px dashed #6c63ff', padding: '8px 18px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
                    + Agregar litros
                  </button>
                )}
              </div>
            )
          })}

          {/* Sección: empresas sin ruta asignada */}
          {empresasSinRuta.length > 0 && (
            <div style={{ marginTop: '8px' }}>
              <div style={{ fontSize: '11px', color: '#e65100', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                ⚠️ Sin ruta asignada — edita cada empresa para asignarle su ruta
              </div>
              {empresasSinRuta.map(emp => {
                const key = emp.nombre.toLowerCase()
                const rec = delDiaMap[key]
                return (
                  <div key={emp.nombre} style={{
                    background: '#fffde7', borderRadius: '12px',
                    borderLeft: '4px solid #ffc107',
                    padding: '12px 18px', marginBottom: '8px',
                    display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap'
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '600', fontSize: '14px', color: '#5d4037' }}>{emp.nombre}</div>
                      <div style={{ fontSize: '11px', color: '#8d6e63', marginTop: '2px' }}>Sin ruta — haz clic en Editar para asignarla</div>
                    </div>
                    {rec && (
                      <div style={{ fontSize: '13px', color: '#666' }}>
                        {rec.litrosRecibidos} L hoy
                      </div>
                    )}
                    {rec && (
                      <button onClick={() => abrirEditar(rec)}
                        style={{ background: '#fff3e0', color: '#e65100', border: 'none', padding: '7px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}>
                        ✏️ Asignar ruta
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal de formulario */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}
          onClick={() => setModal(null)}>
          <div style={{ background: 'white', borderRadius: '12px', padding: '28px', width: '100%', maxWidth: '460px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}
            onClick={e => e.stopPropagation()}>

            <h3 style={{ margin: '0 0 20px', fontSize: '16px' }}>
              {modal.modo === 'editar' ? `Editar — ${modal.recibo?.nombreRecibo}` :
               modal.modo === 'agregar' ? `Agregar litros — ${modal.empresa?.nombre}` :
               'Nueva empresa'}
            </h3>

            {error && (
              <div style={{ background: '#ffebee', color: '#c62828', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>
                ⚠️ {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

                {/* Nombre solo para modo nuevo */}
                {modal.modo === 'nuevo' && (
                  <div>
                    <label style={lbl}>Empresa / Nombre</label>
                    <input name="nombreRecibo" value={form.nombreRecibo} onChange={handleChange} required
                      placeholder="Tatiana, Consuelo, Jhoan..." style={inp}
                      list="empresas-list" />
                    <datalist id="empresas-list">
                      {empresas.map(e => <option key={e.nombre} value={e.nombre} />)}
                    </datalist>
                  </div>
                )}

                {/* Ruta — siempre visible si hay más de una disponible */}
                {rutasDisponibles.length > 1 && (
                  <div>
                    <label style={lbl}>Ruta</label>
                    <select name="rutaId" value={form.rutaId} onChange={handleChange} required style={inp}>
                      <option value="">Seleccionar ruta...</option>
                      {rutasDisponibles.map(r => (
                        <option key={r.id} value={r.id}>{r.nombre}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label style={lbl}>Fecha</label>
                  <input name="fecha" value={form.fecha} onChange={handleChange} type="date"
                    min={quincenaAbierta.fechaInicio} max={quincenaAbierta.fechaFin}
                    disabled={modal.modo === 'editar'} style={{ ...inp, background: modal.modo === 'editar' ? '#f5f5f5' : 'white' }} />
                </div>

                <div>
                  <label style={lbl}>Litros recibidos</label>
                  <input name="litrosRecibidos" value={form.litrosRecibidos} onChange={handleChange}
                    type="number" step="0.1" required autoFocus style={inp} placeholder="Ej: 150" />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={lbl}>$/litro total</label>
                    <input name="precioLitro" value={form.precioLitro} onChange={handleChange}
                      type="number" step="1" required style={inp} placeholder="1925" />
                  </div>
                  <div>
                    <label style={lbl}>$/transporte</label>
                    <input name="precioTransporte" value={form.precioTransporte} onChange={handleChange}
                      type="number" step="1" style={inp} placeholder="225" />
                  </div>
                </div>

                {form.precioLitro && form.precioTransporte && (
                  <div style={{ background: '#f0fdf4', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: '#1b5e20' }}>
                    Precio proveedor: <strong>${fmt(parseFloat(form.precioLitro||0) - parseFloat(form.precioTransporte||0))}/litro</strong>
                  </div>
                )}

                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '14px',
                  padding: '10px', borderRadius: '8px', background: form.soloTransporte ? '#fff3e0' : '#f5f5f5' }}>
                  <input type="checkbox" name="soloTransporte" checked={!!form.soloTransporte} onChange={handleChange}
                    style={{ width: '16px', height: '16px', accentColor: '#e65100' }} />
                  <span><strong>Solo transporte</strong> — ellos pagan directo al proveedor</span>
                </label>

                <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                  <button type="submit" disabled={guardando}
                    style={{ flex: 1, background: '#6c63ff', color: 'white', border: 'none', padding: '11px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}>
                    {guardando ? 'Guardando...' : modal.modo === 'editar' ? 'Actualizar' : 'Guardar'}
                  </button>
                  <button type="button" onClick={() => setModal(null)}
                    style={{ background: '#f5f5f5', color: '#444', border: 'none', padding: '11px 18px', borderRadius: '8px', cursor: 'pointer' }}>
                    Cancelar
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

const lbl = { display: 'block', marginBottom: '5px', fontSize: '13px', color: '#555', fontWeight: '500' }
const inp = { width: '100%', padding: '9px 11px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', boxSizing: 'border-box' }

export default Recibos
