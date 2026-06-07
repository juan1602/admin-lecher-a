import { useState, useEffect } from 'react'
import api from '../../api/axios'
import { useRutaVista } from '../../context/RutaVistaContext'

function Proveedores() {
  const { rutasSeleccionadas } = useRutaVista()
  const [proveedores, setProveedores] = useState([])
  const [rutas, setRutas] = useState([])
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState({
    nombre: '',
    zona: '',
    precioLitro: '',
    cuotaLitros: '',
    tipoLeche: 'vaca',
    ruta: null
  })

  useEffect(() => {
    cargarProveedores()
    cargarRutas()
  }, [])

  const cargarProveedores = async () => {
    const res = await api.get('/proveedores')
    setProveedores(res.data)
  }

  const cargarRutas = async () => {
    const res = await api.get('/rutas')
    setRutas(res.data)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    if (name === 'ruta') {
      setForm({ ...form, ruta: value ? { id: parseInt(value) } : null })
    } else {
      setForm({ ...form, [name]: value })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const payload = {
      ...form,
      precioLitro: parseFloat(form.precioLitro),
      cuotaLitros: form.cuotaLitros ? parseFloat(form.cuotaLitros) : null,
    }
    if (editando) {
      await api.put(`/proveedores/${editando}`, payload)
      setEditando(null)
    } else {
      await api.post('/proveedores', payload)
    }
    setForm({ nombre: '', zona: '', precioLitro: '', cuotaLitros: '', tipoLeche: 'vaca', ruta: null })
    setMostrarFormulario(false)
    cargarProveedores()
  }

  const iniciarEdicion = (p) => {
    setEditando(p.id)
    setForm({
      nombre: p.nombre ?? '',
      zona: p.zona ?? '',
      precioLitro: p.precioLitro ?? '',
      cuotaLitros: p.cuotaLitros ?? '',
      tipoLeche: p.tipoLeche ?? 'vaca',
      ruta: p.ruta ? { id: p.ruta.id } : null
    })
    setMostrarFormulario(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const cancelar = () => {
    setEditando(null)
    setMostrarFormulario(false)
    setForm({ nombre: '', zona: '', precioLitro: '', cuotaLitros: '', tipoLeche: 'vaca', ruta: null })
  }

  const desactivar = async (id) => {
    if (confirm('¿Desactivar este proveedor?')) {
      await api.delete(`/proveedores/${id}`)
      cargarProveedores()
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ margin: 0 }}>Proveedores</h2>
        <button onClick={() => { cancelar(); setMostrarFormulario(!mostrarFormulario) }}
          style={{ background: '#6c63ff', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer' }}>
          {mostrarFormulario ? 'Cancelar' : '+ Nuevo proveedor'}
        </button>
      </div>

      {mostrarFormulario && (
        <div style={{ background: 'white', padding: '24px', borderRadius: '12px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderLeft: editando ? '4px solid #6c63ff' : 'none' }}>
          <h3 style={{ marginTop: 0 }}>{editando ? 'Editar proveedor' : 'Nuevo proveedor'}</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px' }}>Nombre</label>
                <input name="nombre" value={form.nombre} onChange={handleChange} required
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ddd', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px' }}>Zona / Vereda</label>
                <input name="zona" value={form.zona} onChange={handleChange}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ddd', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px' }}>Ruta</label>
                <select name="ruta" onChange={handleChange} required
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ddd', boxSizing: 'border-box' }}>
                  <option value="">Seleccionar ruta...</option>
                  {rutas.map(r => (
                    <option key={r.id} value={r.id}>{r.nombre}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px' }}>Precio por litro</label>
                <input name="precioLitro" value={form.precioLitro} onChange={handleChange} type="number" required
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ddd', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px' }}>Cuota litros</label>
                <input name="cuotaLitros" value={form.cuotaLitros} onChange={handleChange} type="number"
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ddd', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px' }}>Tipo de leche</label>
                <select name="tipoLeche" value={form.tipoLeche} onChange={handleChange}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ddd', boxSizing: 'border-box' }}>
                  <option value="vaca">Vaca</option>
                  <option value="bufala">Búfala</option>
                </select>
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
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8f8f8' }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', color: '#666' }}>Nombre</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', color: '#666' }}>Zona</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', color: '#666' }}>Ruta</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', color: '#666' }}>Precio/litro</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', color: '#666' }}>Cuota</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', color: '#666' }}>Tipo</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', color: '#666' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {proveedores.filter(p => !p.ruta || rutasSeleccionadas.has(p.ruta.id)).map((p, i) => (
              <tr key={p.id} style={{ borderTop: '1px solid #f0f0f0', background: editando === p.id ? '#f3f0ff' : i % 2 === 0 ? 'white' : '#fafafa' }}>
                <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: '500' }}>{p.nombre}</td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: '#666' }}>{p.zona}</td>
                <td style={{ padding: '12px 16px', fontSize: '14px' }}>
                  <span style={{ background: '#ede7f6', color: '#4527a0', padding: '2px 10px', borderRadius: '12px', fontSize: '12px' }}>
                    {p.ruta?.nombre || 'Sin ruta'}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: '600', color: '#1b5e20' }}>
                  ${p.precioLitro?.toLocaleString('es-CO')}
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px' }}>{p.cuotaLitros} L</td>
                <td style={{ padding: '12px 16px', fontSize: '14px' }}>
                  <span style={{
                    background: p.tipoLeche === 'vaca' ? '#e8f5e9' : '#fff3e0',
                    color: p.tipoLeche === 'vaca' ? '#2e7d32' : '#e65100',
                    padding: '2px 10px', borderRadius: '12px', fontSize: '12px'
                  }}>
                    {p.tipoLeche}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', display: 'flex', gap: '8px' }}>
                  <button onClick={() => iniciarEdicion(p)}
                    style={{ background: '#e8f5e9', color: '#2e7d32', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>
                    Editar
                  </button>
                  <button onClick={() => desactivar(p.id)}
                    style={{ background: '#ffebee', color: '#c62828', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>
                    Desactivar
                  </button>
                </td>
              </tr>
            ))}
            {proveedores.filter(p => !p.ruta || rutasSeleccionadas.has(p.ruta.id)).length === 0 && (
              <tr>
                <td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: '#999' }}>No hay proveedores registrados</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Proveedores