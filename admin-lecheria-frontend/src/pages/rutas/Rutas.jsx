import { useState, useEffect } from 'react'
import api from '../../api/axios'

function Rutas() {
  const [rutas, setRutas] = useState([])
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [form, setForm] = useState({ nombre: '', descripcion: '' })

  useEffect(() => { cargarRutas() }, [])

  const cargarRutas = async () => {
    const res = await api.get('/rutas')
    setRutas(res.data)
  }

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    await api.post('/rutas', form)
    setForm({ nombre: '', descripcion: '' })
    setMostrarFormulario(false)
    cargarRutas()
  }

  const eliminar = async (id) => {
    if (confirm('¿Eliminar esta ruta?')) {
      await api.delete(`/rutas/${id}`)
      cargarRutas()
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ margin: 0 }}>Rutas</h2>
        <button onClick={() => setMostrarFormulario(!mostrarFormulario)}
          style={{ background: '#6c63ff', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer' }}>
          {mostrarFormulario ? 'Cancelar' : '+ Nueva ruta'}
        </button>
      </div>

      {mostrarFormulario && (
        <div style={{ background: 'white', padding: '24px', borderRadius: '12px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <h3 style={{ marginTop: 0 }}>Nueva ruta</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px' }}>Nombre</label>
                <input name="nombre" value={form.nombre} onChange={handleChange} required
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ddd', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px' }}>Descripción</label>
                <input name="descripcion" value={form.descripcion} onChange={handleChange}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ddd', boxSizing: 'border-box' }} />
              </div>
            </div>
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
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', color: '#666' }}>Descripción</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', color: '#666' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {rutas.map((r, i) => (
              <tr key={r.id} style={{ borderTop: '1px solid #f0f0f0', background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                <td style={{ padding: '12px 16px', fontSize: '14px' }}>{r.nombre}</td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: '#666' }}>{r.descripcion}</td>
                <td style={{ padding: '12px 16px' }}>
                  <button onClick={() => eliminar(r.id)}
                    style={{ background: '#ffebee', color: '#c62828', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
            {rutas.length === 0 && (
              <tr><td colSpan={3} style={{ padding: '32px', textAlign: 'center', color: '#999' }}>No hay rutas registradas</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Rutas