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
        if (abierta) {
          setQuincenaId(String(abierta.id))
          cargarResumen(abierta.id)
        }
      })
      .catch(() => setError('No se pudo conectar con el servidor.'))
  }, [])

  const cargarResumen = async (id) => {
    if (!id) return
    setCargando(true)
    setError(null)
    try {
      const r = await api.get(`/recibos/transporte/${id}`)
      setResumen(r.data)
    } catch (e) {
      setResumen(null)
      const msg = e?.response?.data?.message || e?.response?.status
      setError(`Error al cargar el transporte${msg ? `: ${msg}` : '.'}`)
    } finally {
      setCargando(false)
    }
  }

  const handleQuincenaChange = (e) => {
    setQuincenaId(e.target.value)
    setResumen(null)
    setError(null)
    if (e.target.value) cargarResumen(e.target.value)
  }

  // Para calcular totales por empresa (columnas de la tabla)
  const totalPorEmpresa = (nombreEmpresa) => {
    if (!resumen) return 0
    return resumen.dias.reduce((sum, dia) => {
      const emp = dia.empresas?.find(e => e.nombre === nombreEmpresa)
      return sum + (emp?.litros ?? 0)
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

      {/* Selector quincena */}
      <div style={{ background: 'white', padding: '16px', borderRadius: '12px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        <label style={{ fontSize: '14px', fontWeight: '500', marginRight: '12px' }}>Quincena:</label>
        <select value={quincenaId} onChange={handleQuincenaChange}
          style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px', minWidth: '280px' }}>
          <option value="">Seleccionar quincena...</option>
          {quincenas.map(q => (
            <option key={q.id} value={q.id}>
              {q.textoQuincena} {!q.cerrada ? '(Abierta)' : ''}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div style={{ padding: '16px 20px', borderRadius: '10px', background: '#ffebee', color: '#c62828', marginBottom: '16px', border: '1px solid #ffcdd2' }}>
          ⚠️ {error}
        </div>
      )}

      {cargando && (
        <div style={{ textAlign: 'center', padding: '60px', color: '#999' }}>Cargando datos de transporte...</div>
      )}

      {resumen && !cargando && (
        <>
          {/* Tarjetas de totales */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '28px' }}>
            <Tarjeta label="Total entregado a empresa" valor={`${fmtL(resumen.totalLitrosEntregados)} L`} color="#0288d1" />
            <Tarjeta label="Total recogido de proveedores" valor={`${fmtL(resumen.totalLitrosRecogidos)} L`} color="#388e3c" />
            <Tarjeta label="Rinde total" valor={`${fmtL(resumen.totalRinde)} L`} color={resumen.totalRinde >= 0 ? '#6c63ff' : '#c62828'} />
            <Tarjeta label="Valor transporte quincena" valor={`$${fmt(resumen.totalValorTransporte)}`} color="#e65100" />
          </div>

          {/* Tabla principal estilo TRANSPORTE Excel */}
          <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', overflow: 'auto' }}>
            <div style={{ background: '#1a1a2e', color: 'white', padding: '14px 20px', fontWeight: '600', fontSize: '14px', letterSpacing: '0.4px' }}>
              {resumen.textoQuincena?.toUpperCase()} — CONTROL DE TRANSPORTE Y RINDE
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
              <thead>
                {/* Fila de grupos */}
                <tr style={{ background: '#2a2a4a', color: 'white', fontSize: '11px', fontWeight: '600', letterSpacing: '0.5px' }}>
                  <th style={{ ...thE, width: '70px' }} rowSpan={2}>DIA</th>
                  {resumen.empresas.length > 0 && (
                    <th style={{ ...thE, textAlign: 'center', borderLeft: '2px solid #444' }}
                      colSpan={resumen.empresas.length}>
                      LITROS ENTREGADOS A EMPRESA
                    </th>
                  )}
                  <th style={{ ...thE, textAlign: 'right', borderLeft: '2px solid #4caf50', color: '#a5d6a7' }} rowSpan={2}>
                    TOTAL<br/>ENTREGADO
                  </th>
                  <th style={{ ...thE, textAlign: 'right', borderLeft: '2px solid #2196f3', color: '#90caf9' }} rowSpan={2}>
                    TOTAL<br/>RECOGIDO
                  </th>
                  <th style={{ ...thE, textAlign: 'right', borderLeft: '2px solid #ff9800', color: '#ffe082' }} rowSpan={2}>
                    RINDE
                  </th>
                </tr>
                {/* Fila de nombres empresa */}
                <tr style={{ background: '#333355', color: '#ddd', fontSize: '11px' }}>
                  {resumen.empresas.map((emp, i) => (
                    <th key={emp} style={{ ...thE, textAlign: 'right', fontWeight: '500', borderLeft: i === 0 ? '2px solid #444' : undefined }}>
                      {emp}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {resumen.dias.map((dia, i) => {
                  const tieneData = dia.litrosEntregados > 0 || dia.litrosRecogidos > 0
                  return (
                    <tr key={dia.fecha}
                      style={{
                        borderBottom: '1px solid #f0f0f0',
                        background: !tieneData ? '#fafafa' : i % 2 === 0 ? 'white' : '#f7f7ff',
                        opacity: !tieneData ? 0.5 : 1
                      }}>
                      <td style={{ ...tdE, fontWeight: '600', color: '#444', textAlign: 'center' }}>
                        {formatFecha(dia.fecha)}
                      </td>
                      {resumen.empresas.map((emp, j) => {
                        const entrega = dia.empresas?.find(e => e.nombre === emp)
                        return (
                          <td key={emp} style={{ ...tdE, textAlign: 'right', borderLeft: j === 0 ? '2px solid #eee' : undefined, color: entrega ? '#1a1a2e' : '#ccc' }}>
                            {entrega ? fmtL(entrega.litros) : '—'}
                          </td>
                        )
                      })}
                      <td style={{ ...tdE, textAlign: 'right', fontWeight: '600', borderLeft: '2px solid #e8f5e9', color: '#2e7d32' }}>
                        {dia.litrosEntregados > 0 ? fmtL(dia.litrosEntregados) : '—'}
                      </td>
                      <td style={{ ...tdE, textAlign: 'right', fontWeight: '600', borderLeft: '2px solid #e3f2fd', color: '#1565c0' }}>
                        {dia.litrosRecogidos > 0 ? fmtL(dia.litrosRecogidos) : '—'}
                      </td>
                      <td style={{
                        ...tdE, textAlign: 'right', fontWeight: '700',
                        borderLeft: '2px solid #fff3e0',
                        color: dia.rinde > 0 ? '#e65100' : dia.rinde < 0 ? '#c62828' : '#999'
                      }}>
                        {tieneData ? fmtL(dia.rinde) : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>

              <tfoot>
                <tr style={{ background: '#1a1a2e', color: 'white', fontWeight: '700', fontSize: '13px' }}>
                  <td style={{ ...tdE, color: 'white', textAlign: 'center' }}>TOTAL</td>
                  {resumen.empresas.map((emp, j) => (
                    <td key={emp} style={{ ...tdE, textAlign: 'right', color: 'white', borderLeft: j === 0 ? '2px solid #444' : undefined }}>
                      {fmtL(totalPorEmpresa(emp))}
                    </td>
                  ))}
                  <td style={{ ...tdE, textAlign: 'right', color: '#a5d6a7', borderLeft: '2px solid #444', fontSize: '14px' }}>
                    {fmtL(resumen.totalLitrosEntregados)}
                  </td>
                  <td style={{ ...tdE, textAlign: 'right', color: '#90caf9', borderLeft: '2px solid #444', fontSize: '14px' }}>
                    {fmtL(resumen.totalLitrosRecogidos)}
                  </td>
                  <td style={{ ...tdE, textAlign: 'right', color: '#ffe082', borderLeft: '2px solid #444', fontSize: '14px' }}>
                    {fmtL(resumen.totalRinde)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Tabla de desglose por empresa (precio transporte / proveedor) */}
          {resumen.empresas.length > 0 && (
            <div style={{ marginTop: '24px', background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
              <div style={{ background: '#1a1a2e', color: 'white', padding: '12px 18px', fontWeight: '600', fontSize: '13px', letterSpacing: '0.4px' }}>
                DESGLOSE POR EMPRESA — TRANSPORTE vs. PROVEEDOR
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f5f5f5', borderBottom: '1px solid #e0e0e0' }}>
                    <th style={thD}>Empresa</th>
                    <th style={{ ...thD, textAlign: 'right' }}>Total litros</th>
                    <th style={{ ...thD, textAlign: 'right' }}>$/Litro total</th>
                    <th style={{ ...thD, textAlign: 'right' }}>$/Transporte</th>
                    <th style={{ ...thD, textAlign: 'right' }}>$/Proveedor</th>
                    <th style={{ ...thD, textAlign: 'right', color: '#e65100' }}>Valor transporte</th>
                    <th style={{ ...thD, textAlign: 'right', color: '#1b5e20' }}>Valor a proveedores</th>
                    <th style={{ ...thD, textAlign: 'right' }}>Valor total</th>
                  </tr>
                </thead>
                <tbody>
                  {resumen.empresas.map((emp, i) => {
                    // Acumular valores de todos los días para esta empresa
                    let litros = 0, vTrans = 0, vProv = 0, vTotal = 0, precioL = 0, precioT = 0
                    resumen.dias.forEach(dia => {
                      const e = dia.empresas?.find(x => x.nombre === emp)
                      if (e) {
                        litros += e.litros ?? 0
                        vTrans += e.valorTransporte ?? 0
                        vProv  += e.valorProveedor ?? 0
                        vTotal += e.valorTotal ?? 0
                        precioL = e.precioLitro ?? precioL
                        precioT = e.precioTransporte ?? precioT
                      }
                    })
                    return (
                      <tr key={emp} style={{ borderBottom: '1px solid #f0f0f0', background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                        <td style={{ ...tdD, fontWeight: '600' }}>{emp}</td>
                        <td style={{ ...tdD, textAlign: 'right', fontWeight: '500' }}>{fmtL(litros)} L</td>
                        <td style={{ ...tdD, textAlign: 'right', color: '#666' }}>${fmt(precioL)}</td>
                        <td style={{ ...tdD, textAlign: 'right', color: '#e65100' }}>${fmt(precioT)}</td>
                        <td style={{ ...tdD, textAlign: 'right', color: '#1b5e20' }}>${fmt(precioL - precioT)}</td>
                        <td style={{ ...tdD, textAlign: 'right', color: '#e65100', fontWeight: '500' }}>${fmt(vTrans)}</td>
                        <td style={{ ...tdD, textAlign: 'right', color: '#1b5e20', fontWeight: '600' }}>${fmt(vProv)}</td>
                        <td style={{ ...tdD, textAlign: 'right', fontWeight: '500' }}>${fmt(vTotal)}</td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ background: '#1a1a2e', color: 'white', fontWeight: '700' }}>
                    <td style={{ ...tdD, color: 'white' }}>TOTAL</td>
                    <td style={{ ...tdD, textAlign: 'right', color: 'white' }}>{fmtL(resumen.totalLitrosEntregados)} L</td>
                    <td colSpan={3} style={tdD}></td>
                    <td style={{ ...tdD, textAlign: 'right', color: '#ef9a9a' }}>${fmt(resumen.totalValorTransporte)}</td>
                    <td style={{ ...tdD, textAlign: 'right', color: '#a5d6a7', fontSize: '15px' }}>${fmt(resumen.totalValorProveedor)}</td>
                    <td style={{ ...tdD, textAlign: 'right', color: 'white' }}>${fmt(resumen.totalValorTransporte + resumen.totalValorProveedor)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </>
      )}

      {!resumen && !cargando && quincenaId && !error && (
        <div style={{ textAlign: 'center', padding: '60px', color: '#999' }}>
          No hay recibos registrados en esta quincena. Ve a la sección de <strong>Recibos</strong> para agregar entregas.
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

const thE = { padding: '10px 12px', textAlign: 'left', fontSize: '11px', fontWeight: '600', letterSpacing: '0.3px' }
const tdE = { padding: '9px 12px', fontSize: '13px' }
const thD = { padding: '10px 14px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#444' }
const tdD = { padding: '10px 14px', fontSize: '13px' }

export default Transporte
