import { useState, useEffect, Fragment } from 'react'
import api from '../../api/axios'

const fmt  = (n) => Math.round(n ?? 0).toLocaleString('es-CO')
const fmtL = (n) => Number(n ?? 0).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 1 })

function formatFecha(fechaStr) {
  if (!fechaStr) return ''
  const [, mes, dia] = fechaStr.split('-')
  return `${dia}/${mes}`
}

function Transporte() {
  const [quincenas, setQuincenas]   = useState([])
  const [quincenaId, setQuincenaId] = useState('')
  const [resumen, setResumen]       = useState(null)
  const [cargando, setCargando]     = useState(false)
  const [error, setError]           = useState(null)

  useEffect(() => {
    api.get('/quincenas')
      .then(r => {
        setQuincenas(r.data)
        const abierta = r.data.find(q => !q.cerrada)
        if (abierta) { setQuincenaId(String(abierta.id)); cargarResumen(abierta.id) }
      })
      .catch(() => setError('No se pudo conectar con el servidor.'))
  }, [])

  const cargarResumen = async (id) => {
    if (!id) return
    setCargando(true); setError(null)
    try {
      const r = await api.get(`/recibos/transporte/${id}`)
      setResumen(r.data)
    } catch (e) {
      setResumen(null)
      setError(`Error al cargar: ${e?.response?.status ?? 'sin conexión'}`)
    } finally { setCargando(false) }
  }

  const handleChange = (e) => {
    setQuincenaId(e.target.value); setResumen(null); setError(null)
    if (e.target.value) cargarResumen(e.target.value)
  }

  const totalPorEmpresa = (nombre) => {
    if (!resumen) return 0
    return resumen.dias.reduce((sum, dia) => {
      const e = dia.empresas?.find(x => x.nombre === nombre)
      return sum + (e?.litros ?? 0)
    }, 0)
  }

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ margin: 0 }}>Control de Transporte</h2>
        <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#666' }}>
          Litros entregados a empresa vs. litros recogidos de proveedores · Rinde diario
        </p>
      </div>

      <div style={{ background: 'white', padding: '16px', borderRadius: '12px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        <label style={{ fontSize: '14px', fontWeight: '500', marginRight: '12px' }}>Quincena:</label>
        <select value={quincenaId} onChange={handleChange}
          style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px', minWidth: '280px' }}>
          <option value="">Seleccionar quincena...</option>
          {quincenas.map(q => (
            <option key={q.id} value={q.id}>{q.textoQuincena} {!q.cerrada ? '(Abierta)' : ''}</option>
          ))}
        </select>
      </div>

      {error && (
        <div style={{ padding: '14px 18px', borderRadius: '10px', background: '#ffebee', color: '#c62828', marginBottom: '16px', border: '1px solid #ffcdd2' }}>
          ⚠️ {error}
        </div>
      )}

      {cargando && <div style={{ textAlign: 'center', padding: '60px', color: '#999' }}>Cargando datos...</div>}

      {resumen && !cargando && (
        <>
          {/* Tarjetas */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '24px' }}>
            <Tarjeta label="Total entregado" valor={`${fmtL(resumen.totalLitrosEntregados)} L`} color="#0288d1" />
            <Tarjeta label="Total recogido" valor={`${fmtL(resumen.totalLitrosRecogidos)} L`} color="#388e3c" />
            <Tarjeta label="Rinde total" valor={`${fmtL(resumen.totalRinde)} L`} color={resumen.totalRinde >= 0 ? '#6c63ff' : '#c62828'} />
            <Tarjeta label="Valor transporte" valor={`$${fmt(resumen.totalValorTransporte)}`} color="#e65100" />
          </div>

          {/* Tabla principal con encabezado simple (1 sola fila) */}
          <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', overflow: 'auto', marginBottom: '24px' }}>
            <div style={{ background: '#1a1a2e', color: 'white', padding: '13px 18px', fontWeight: '600', fontSize: '13px' }}>
              {resumen.textoQuincena?.toUpperCase()} — TRANSPORTE Y RINDE
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: `${220 + resumen.empresas.length * 90}px` }}>
              <thead>
                <tr style={{ background: '#f0f0f0', borderBottom: '2px solid #ddd' }}>
                  <th style={{ ...th, width: '60px', textAlign: 'center' }}>DÍA</th>
                  {resumen.empresas.map(emp => (
                    <th key={emp} style={{ ...th, textAlign: 'right', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {emp}
                    </th>
                  ))}
                  <th style={{ ...th, textAlign: 'right', background: '#e8f5e9', color: '#2e7d32', borderLeft: '2px solid #c8e6c9' }}>ENTREGADO</th>
                  <th style={{ ...th, textAlign: 'right', background: '#e3f2fd', color: '#1565c0', borderLeft: '2px solid #bbdefb' }}>RECOGIDO</th>
                  <th style={{ ...th, textAlign: 'right', background: '#fff8e1', color: '#e65100', borderLeft: '2px solid #ffe0b2' }}>RINDE</th>
                </tr>
              </thead>
              <tbody>
                {resumen.dias.map((dia, i) => {
                  const tieneData = dia.litrosEntregados > 0 || dia.litrosRecogidos > 0
                  return (
                    <tr key={dia.fecha} style={{
                      borderBottom: '1px solid #f0f0f0',
                      background: tieneData ? (i % 2 === 0 ? 'white' : '#fafafa') : '#fafafa',
                      opacity: tieneData ? 1 : 0.4
                    }}>
                      <td style={{ ...td, textAlign: 'center', fontWeight: '600', color: '#555' }}>
                        {formatFecha(dia.fecha)}
                      </td>
                      {resumen.empresas.map(emp => {
                        const e = dia.empresas?.find(x => x.nombre === emp)
                        return (
                          <td key={emp} style={{ ...td, textAlign: 'right', color: e ? '#1a1a2e' : '#ccc' }}>
                            {e ? fmtL(e.litros) : '—'}
                          </td>
                        )
                      })}
                      <td style={{ ...td, textAlign: 'right', fontWeight: '600', color: '#2e7d32', borderLeft: '2px solid #e8f5e9' }}>
                        {dia.litrosEntregados > 0 ? fmtL(dia.litrosEntregados) : '—'}
                      </td>
                      <td style={{ ...td, textAlign: 'right', fontWeight: '600', color: '#1565c0', borderLeft: '2px solid #e3f2fd' }}>
                        {dia.litrosRecogidos > 0 ? fmtL(dia.litrosRecogidos) : '—'}
                      </td>
                      <td style={{
                        ...td, textAlign: 'right', fontWeight: '700', borderLeft: '2px solid #fff8e1',
                        color: dia.rinde > 0 ? '#e65100' : dia.rinde < 0 ? '#c62828' : '#999'
                      }}>
                        {tieneData ? fmtL(dia.rinde) : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr style={{ background: '#1a1a2e', color: 'white', fontWeight: '700' }}>
                  <td style={{ ...td, color: 'white', textAlign: 'center' }}>TOTAL</td>
                  {resumen.empresas.map(emp => (
                    <td key={emp} style={{ ...td, textAlign: 'right', color: 'white' }}>
                      {fmtL(totalPorEmpresa(emp))}
                    </td>
                  ))}
                  <td style={{ ...td, textAlign: 'right', color: '#a5d6a7', fontSize: '14px', borderLeft: '2px solid #2a4a2a' }}>
                    {fmtL(resumen.totalLitrosEntregados)}
                  </td>
                  <td style={{ ...td, textAlign: 'right', color: '#90caf9', fontSize: '14px', borderLeft: '2px solid #1a2a4a' }}>
                    {fmtL(resumen.totalLitrosRecogidos)}
                  </td>
                  <td style={{ ...td, textAlign: 'right', color: '#ffe082', fontSize: '14px', borderLeft: '2px solid #4a3a1a' }}>
                    {fmtL(resumen.totalRinde)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Desglose por empresa */}
          {resumen.empresas.length > 0 && (
            <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
              <div style={{ background: '#1a1a2e', color: 'white', padding: '12px 18px', fontWeight: '600', fontSize: '13px' }}>
                DESGLOSE POR EMPRESA — TRANSPORTE vs. PROVEEDOR
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f5f5f5', borderBottom: '1px solid #e0e0e0' }}>
                    <th style={th}>Empresa</th>
                    <th style={{ ...th, textAlign: 'right' }}>Litros</th>
                    <th style={{ ...th, textAlign: 'right' }}>$/Litro</th>
                    <th style={{ ...th, textAlign: 'right' }}>$/Trans.</th>
                    <th style={{ ...th, textAlign: 'right' }}>$/Proveedor</th>
                    <th style={{ ...th, textAlign: 'right', color: '#e65100' }}>Transporte</th>
                    <th style={{ ...th, textAlign: 'right', color: '#1b5e20' }}>A proveedores</th>
                    <th style={{ ...th, textAlign: 'right' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {resumen.empresas.map((emp, i) => {
                    let litros=0, vTrans=0, vProv=0, vTotal=0, pl=0, pt=0
                    resumen.dias.forEach(dia => {
                      const e = dia.empresas?.find(x => x.nombre === emp)
                      if (e) {
                        litros += e.litros ?? 0
                        vTrans += e.valorTransporte ?? 0
                        vProv  += e.valorProveedor ?? 0
                        vTotal += e.valorTotal ?? 0
                        pl = e.precioLitro ?? pl
                        pt = e.precioTransporte ?? pt
                      }
                    })
                    return (
                      <tr key={emp} style={{ borderBottom: '1px solid #f0f0f0', background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                        <td style={{ ...td, fontWeight: '600' }}>{emp}</td>
                        <td style={{ ...td, textAlign: 'right', fontWeight: '500' }}>{fmtL(litros)} L</td>
                        <td style={{ ...td, textAlign: 'right', color: '#666' }}>${fmt(pl)}</td>
                        <td style={{ ...td, textAlign: 'right', color: '#e65100' }}>${fmt(pt)}</td>
                        <td style={{ ...td, textAlign: 'right', color: '#1b5e20' }}>${fmt(pl - pt)}</td>
                        <td style={{ ...td, textAlign: 'right', color: '#e65100', fontWeight: '500' }}>${fmt(vTrans)}</td>
                        <td style={{ ...td, textAlign: 'right', color: '#1b5e20', fontWeight: '600' }}>${fmt(vProv)}</td>
                        <td style={{ ...td, textAlign: 'right', fontWeight: '500' }}>${fmt(vTotal)}</td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ background: '#1a1a2e', color: 'white', fontWeight: '700' }}>
                    <td style={{ ...td, color: 'white' }}>TOTAL</td>
                    <td style={{ ...td, textAlign: 'right', color: 'white' }}>{fmtL(resumen.totalLitrosEntregados)} L</td>
                    <td colSpan={3} style={td}></td>
                    <td style={{ ...td, textAlign: 'right', color: '#ef9a9a' }}>${fmt(resumen.totalValorTransporte)}</td>
                    <td style={{ ...td, textAlign: 'right', color: '#a5d6a7', fontSize: '15px' }}>${fmt(resumen.totalValorProveedor)}</td>
                    <td style={{ ...td, textAlign: 'right', color: 'white' }}>${fmt(resumen.totalValorTransporte + resumen.totalValorProveedor)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </>
      )}

      {!resumen && !cargando && quincenaId && !error && (
        <div style={{ textAlign: 'center', padding: '60px', color: '#999', background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          No hay recibos registrados. Ve a <strong>Recibos</strong> para agregar entregas.
        </div>
      )}
    </div>
  )
}

function Tarjeta({ label, valor, color }) {
  return (
    <div style={{ background: 'white', padding: '18px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderTop: `3px solid ${color}` }}>
      <p style={{ margin: 0, fontSize: '11px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</p>
      <p style={{ margin: '6px 0 0', fontSize: '20px', fontWeight: '700', color }}>{valor}</p>
    </div>
  )
}

const th = { padding: '10px 12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#444' }
const td = { padding: '9px 12px', fontSize: '13px' }

export default Transporte
