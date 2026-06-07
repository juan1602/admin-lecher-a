import { useState, useEffect } from 'react'
import api from '../../api/axios'

function Conductores() {
  const [conductores, setConductores] = useState([])
  const [rutas, setRutas] = useState([])
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [form, setForm] = useState({ nombre: '', telefono: '', rutaIds: [] })
  const [editandoRutas, setEditandoRutas] = useState(null) // conductor en modal de edición

  useEffect(() => { cargarDatos() }, [])

  const cargarDatos = async () => {
    const [cRes, rRes] = await Promise.all([api.get('/conductores'), api.get('/rutas')])
    setConductores(cRes.data)
    setRutas(rRes.data)
  }

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const toggleRutaForm = (rutaId) => {
    setForm(f => ({
      ...f,
      rutaIds: f.rutaIds.includes(rutaId)
        ? f.rutaIds.filter(id => id !== rutaId)
        : [...f.rutaIds, rutaId]
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    await api.post('/conductores', form)
    setForm({ nombre: '', telefono: '', rutaIds: [] })
    setMostrarFormulario(false)
    cargarDatos()
  }

  const abrirEditarRutas = (c) => {
    setEditandoRutas({ ...c, rutaIds: c.rutaIds ? [...c.rutaIds] : [] })
  }

  const toggleRutaEdicion = (rutaId) => {
    setEditandoRutas(prev => ({
      ...prev,
      rutaIds: prev.rutaIds.includes(rutaId)
        ? prev.rutaIds.filter(id => id !== rutaId)
        : [...prev.rutaIds, rutaId]
    }))
  }

  const guardarRutas = async () => {
    await api.put(`/conductores/${editandoRutas.id}`, editandoRutas)
    setEditandoRutas(null)
    cargarDatos()
  }

  const desactivar = async (id) => {
    if (confirm('¿Desactivar este conductor?')) {
      await api.delete(`/conductores/${id}`)
      cargarDatos()
    }
  }

  const nombreRuta = (id) => rutas.find(r => r.id === id)?.nombre || id

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ margin: 0 }}>Conductores</h2>
        <button onClick={() => setMostrarFormulario(!mostrarFormulario)}
          style={{ background: '#6c63ff', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer' }}>
          {mostrarFormulario ? 'Cancelar' : '+ Nuevo conductor'}
        </button>
      </div>

      {mostrarFormulario && (
        <div style={{ background: 'white', padding: '24px', borderRadius: '12px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <h3 style={{ marginTop: 0 }}>Nuevo conductor</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px' }}>Nombre</label>
                <input name="nombre" value={form.nombre} onChange={handleChange} required
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ddd', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px' }}>Teléfono</label>
                <input name="telefono" value={form.telefono} onChange={handleChange}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ddd', boxSizing: 'border-box' }} />
              </div>
            </div>
            {rutas.length > 0 && (
              <div style={{ marginTop: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>Rutas en las que trabaja</label>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {rutas.map(r => (
                    <label key={r.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '14px' }}>
                      <input type="checkbox" checked={form.rutaIds.includes(r.id)} onChange={() => toggleRutaForm(r.id)} />
                      {r.nombre}
                    </label>
                  ))}
                </div>
                <div style={{ fontSize: '12px', color: '#888', marginTop: '6px' }}>
                  Sin selección = trabaja en todas las rutas
                </div>
              </div>
            )}
            <button type="submit"
              style={{ marginTop: '16px', background: '#6c63ff', color: 'white', border: 'none', padding: '10px 24px', borderRadius: '8px', cursor: 'pointer' }}>
              Guardar
            </button>
          </form>
        </div>
      )}

      <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8f8f8' }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', color: '#666' }}>Nombre</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', color: '#666' }}>Teléfono</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', color: '#666' }}>Rutas</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', color: '#666' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {conductores.map((c, i) => (
              <tr key={c.id} style={{ borderTop: '1px solid #f0f0f0', background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                <td style={{ padding: '12px 16px', fontSize: '14px' }}>{c.nombre}</td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: '#666' }}>{c.telefono}</td>
                <td style={{ padding: '12px 16px' }}>
                  {c.rutaIds && c.rutaIds.length > 0
                    ? c.rutaIds.map(id => (
                        <span key={id} style={{ background: '#ede7f6', color: '#4527a0', padding: '2px 8px', borderRadius: '10px', fontSize: '12px', marginRight: '4px' }}>
                          {nombreRuta(id)}
                        </span>
                      ))
                    : <span style={{ color: '#999', fontSize: '13px' }}>Todas</span>
                  }
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button onClick={() => abrirEditarRutas(c)}
                      style={{ background: '#e8eaf6', color: '#3949ab', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>
                      Editar rutas
                    </button>
                    <button onClick={() => desactivar(c.id)}
                      style={{ background: '#ffebee', color: '#c62828', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>
                      Desactivar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {conductores.length === 0 && (
              <tr><td colSpan={4} style={{ padding: '32px', textAlign: 'center', color: '#999' }}>No hay conductores registrados</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal editar rutas */}
      {editandoRutas && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '360px', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '17px' }}>Rutas de {editandoRutas.nombre}</h3>
            <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: '#888' }}>Sin selección = trabaja en todas las rutas</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
              {rutas.map(r => (
                <label key={r.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '15px' }}>
                  <input type="checkbox"
                    checked={editandoRutas.rutaIds.includes(r.id)}
                    onChange={() => toggleRutaEdicion(r.id)}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                  {r.nombre}
                </label>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={guardarRutas}
                style={{ flex: 1, background: '#6c63ff', color: 'white', border: 'none', padding: '12px', borderRadius: '8px', cursor: 'pointer', fontSize: '15px', fontWeight: '600' }}>
                Guardar
              </button>
              <button onClick={() => setEditandoRutas(null)}
                style={{ background: '#f5f5f5', color: '#444', border: 'none', padding: '12px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '15px' }}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Conductores
