import { useState, useEffect } from 'react'
import api from '../../api/axios'
import { useRutaVista } from '../../context/RutaVistaContext'

function Proveedores() {
  const { rutasSeleccionadas } = useRutaVista()
  const [proveedores, setProveedores] = useState([])
  const [rutas, setRutas] = useState([])
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [editando, setEditando] = useState(null)
  const [soloActivos, setSoloActivos] = useState(true)
  const [form, setForm] = useState({
    nombre: '',
    zona: '',
    precioLitro: '',
    cuotaLitros: '',
    tipoLeche: 'vaca',
    ruta: null,
    aplica4x1000: true
  })

  useEffect(() => {
    cargarProveedores()
    cargarRutas()
  }, [])

  const cargarProveedores = async () => {
    const res = await api.get('/proveedores/todos')
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
    setForm({ nombre: '', zona: '', precioLitro: '', cuotaLitros: '', tipoLeche: 'vaca', ruta: null, aplica4x1000: true })
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
      ruta: p.ruta ? { id: p.ruta.id } : null,
      aplica4x1000: p.aplica4x1000 !== false
    })
    setMostrarFormulario(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const cancelar = () => {
    setEditando(null)
    setMostrarFormulario(false)
    setForm({ nombre: '', zona: '', precioLitro: '', cuotaLitros: '', tipoLeche: 'vaca', ruta: null, aplica4x1000: true })
  }

  const toggleActivo = async (p) => {
    const accion = p.activo ? 'inactivar' : 'activar'
    if (confirm(`¿${accion.charAt(0).toUpperCase() + accion.slice(1)} a ${p.nombre}?`)) {
      await api.patch(`/proveedores/${p.id}/toggle-activo`)
      cargarProveedores()
    }
  }

  const lista = proveedores
    .filter(p => !p.ruta || rutasSeleccionadas.has(p.ruta.id))
    .filter(p => !soloActivos || p.activo)

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ margin: 0 }}>Proveedores</h2>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button
            onClick={() => setSoloActivos(v => !v)}
            style={{
              background: soloActivos ? '#f5f5f5' : '#fff3e0',
              color: soloActivos ? '#666' : '#e65100',
              border: '1px solid #ddd', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px'
            }}>
            {soloActivos ? 'Ver todos' : 'Ver solo activos'}
          </button>
          <button onClick={() => { cancelar(); setMostrarFormulario(!mostrarFormulario) }}
            style={{ background: '#6c63ff', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer' }}>
            {mostrarFormulario ? 'Cancelar' : '+ Nuevo proveedor'}
          </button>
        </div>
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <label style={{ fontSize: '14px' }}>Aplica 4x1000</label>
                <button type="button"
                  onClick={() => setForm(f => ({ ...f, aplica4x1000: !f.aplica4x1000 }))}
                  style={{
                    background: form.aplica4x1000 ? '#e8f5e9' : '#ffebee',
                    color: form.aplica4x1000 ? '#2e7d32' : '#c62828',
                    border: 'none', padding: '6px 16px', borderRadius: '20px', cursor: 'pointer', fontWeight: '600', fontSize: '13px'
                  }}>
                  {form.aplica4x1000 ? 'Sí' : 'No'}
                </button>
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
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', color: '#666' }}>4x1000</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', color: '#666' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {lista.map((p, i) => {
              const inactivo = !p.activo
              return (
                <tr key={p.id} style={{
                  borderTop: '1px solid #f0f0f0',
                  background: editando === p.id ? '#f3f0ff' : inactivo ? '#fafafa' : i % 2 === 0 ? 'white' : '#fafafa',
                  opacity: inactivo ? 0.6 : 1
                }}>
                  <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: '500', textDecoration: inactivo ? 'line-through' : 'none', color: inactivo ? '#999' : 'inherit' }}>
                    {p.nombre}
                    {inactivo && <span style={{ marginLeft: '8px', fontSize: '11px', background: '#eeeeee', color: '#757575', padding: '1px 8px', borderRadius: '10px' }}>inactivo</span>}
                  </td>
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
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      background: p.aplica4x1000 !== false ? '#e8f5e9' : '#ffebee',
                      color: p.aplica4x1000 !== false ? '#2e7d32' : '#c62828',
                      padding: '2px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '600'
                    }}>
                      {p.aplica4x1000 !== false ? 'Sí' : 'No'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', display: 'flex', gap: '8px' }}>
                    <button onClick={() => iniciarEdicion(p)}
                      style={{ background: '#e8f5e9', color: '#2e7d32', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>
                      Editar
                    </button>
                    <button onClick={() => toggleActivo(p)}
                      style={{
                        background: inactivo ? '#e3f2fd' : '#ffebee',
                        color: inactivo ? '#1565c0' : '#c62828',
                        border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px'
                      }}>
                      {inactivo ? 'Activar' : 'Inactivar'}
                    </button>
                  </td>
                </tr>
              )
            })}
            {lista.length === 0 && (
              <tr>
                <td colSpan={8} style={{ padding: '32px', textAlign: 'center', color: '#999' }}>No hay proveedores registrados</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Proveedores
