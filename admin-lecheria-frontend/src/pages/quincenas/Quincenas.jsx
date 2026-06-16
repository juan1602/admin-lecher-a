import { useState, useEffect } from 'react'
import api from '../../api/axios'

function Quincenas() {
  const [quincenas, setQuincenas] = useState([])
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [form, setForm] = useState({ fechaInicio: '', fechaFin: '', textoQuincena: '' })

  useEffect(() => { cargarQuincenas() }, [])

  const cargarQuincenas = async () => {
    const res = await api.get('/quincenas')
    setQuincenas(res.data)
  }

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    await api.post('/quincenas', form)
    setForm({ fechaInicio: '', fechaFin: '', textoQuincena: '' })
    setMostrarFormulario(false)
    cargarQuincenas()
  }

  const cerrar = async (id) => {
    if (confirm('¿Cerrar esta quincena? Ya no se podrán agregar recolecciones.')) {
      await api.put(`/quincenas/${id}/cerrar`)
      cargarQuincenas()
    }
  }

  const reabrir = async (id) => {
    if (confirm('¿Reabrir esta quincena?')) {
      try {
        await api.put(`/quincenas/${id}/reabrir`)
        cargarQuincenas()
      } catch (e) {
        alert(e.response?.data || 'No se pudo reabrir la quincena.')
      }
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ margin: 0 }}>Quincenas</h2>
        <button onClick={() => setMostrarFormulario(!mostrarFormulario)}
          style={{ background: '#6c63ff', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer' }}>
          {mostrarFormulario ? 'Cancelar' : '+ Nueva quincena'}
        </button>
      </div>

      {mostrarFormulario && (
        <div style={{ background: 'white', padding: '24px', borderRadius: '12px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <h3 style={{ marginTop: 0 }}>Nueva quincena</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px' }}>Fecha inicio</label>
                <input name="fechaInicio" value={form.fechaInicio} onChange={handleChange} type="date" required
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ddd', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px' }}>Fecha fin</label>
                <input name="fechaFin" value={form.fechaFin} onChange={handleChange} type="date" required
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ddd', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px' }}>Descripción</label>
                <input name="textoQuincena" value={form.textoQuincena} onChange={handleChange} placeholder="Ej: 1-15 Mayo 2026"
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
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', color: '#666' }}>Descripción</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', color: '#666' }}>Fecha inicio</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', color: '#666' }}>Fecha fin</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', color: '#666' }}>Estado</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', color: '#666' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {quincenas.map((q, i) => (
              <tr key={q.id} style={{ borderTop: '1px solid #f0f0f0', background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                <td style={{ padding: '12px 16px', fontSize: '14px' }}>{q.textoQuincena}</td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: '#666' }}>{q.fechaInicio}</td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: '#666' }}>{q.fechaFin}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{
                    background: q.cerrada ? '#ffebee' : '#e8f5e9',
                    color: q.cerrada ? '#c62828' : '#2e7d32',
                    padding: '2px 10px', borderRadius: '12px', fontSize: '12px'
                  }}>
                    {q.cerrada ? 'Cerrada' : 'Abierta'}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', display: 'flex', gap: '8px' }}>
                  {!q.cerrada && (
                    <button onClick={() => cerrar(q.id)}
                      style={{ background: '#fff3e0', color: '#e65100', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>
                      Cerrar quincena
                    </button>
                  )}
                  {q.cerrada && (
                    <button onClick={() => reabrir(q.id)}
                      style={{ background: '#e3f2fd', color: '#1565c0', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>
                      Reabrir
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {quincenas.length === 0 && (
              <tr><td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: '#999' }}>No hay quincenas registradas</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Quincenas