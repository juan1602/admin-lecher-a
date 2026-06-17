import { useState, useEffect } from 'react'
import api from '../../api/axios'
import ReciboProveedorModal from './ReciboProveedorModal'
import { useRutaVista } from '../../context/RutaVistaContext'

const fmt = (n) => Math.round(n).toLocaleString('es-CO')
const fmtL = (n) => Number(n).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 1 })

function ResumenQuincena() {
  const { rutasSeleccionadas } = useRutaVista()
  const [quincenas, setQuincenas] = useState([])
  const [quincenaId, setQuincenaId] = useState('')
  const [quincenaTexto, setQuincenaTexto] = useState('')
  const [resumen, setResumen] = useState(null)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState(null)
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState(null)
  const [excedentes, setExcedentes] = useState({}) // { proveedorId: valorPorLitro }
  const [modalImpresion, setModalImpresion] = useState(false)
  const [seleccionImpresion, setSeleccionImpresion] = useState(new Set())
  const [filtroLeche, setFiltroLeche] = useState('')

  useEffect(() => {
    api.get('/quincenas')
      .then(r => {
        setQuincenas(r.data)
        const abierta = r.data.find(q => !q.cerrada)
        if (abierta) {
          setQuincenaId(String(abierta.id))
          setQuincenaTexto(abierta.textoQuincena || '')
          cargarResumen(abierta.id)
          cargarExcedentes(abierta.id)
        }
      })
      .catch(() => setError('No se pudo conectar con el servidor. Verifica que el backend esté corriendo en el puerto 8092.'))
  }, [])

  const cargarResumen = async (id) => {
    if (!id) return
    setCargando(true)
    setError(null)
    try {
      const r = await api.get(`/recolecciones/resumen/${id}`)
      setResumen(r.data)
    } catch (e) {
      setResumen(null)
      const msg = e?.response?.data?.message || e?.response?.status
      setError(`Error al cargar el resumen${msg ? `: ${msg}` : '. Verifica que el servidor esté activo.'}`)
    } finally {
      setCargando(false)
    }
  }

  const cargarExcedentes = async (id) => {
    try {
      await api.post(`/excedentes/quincena/${id}/heredar`)
      const r = await api.get(`/excedentes/quincena/${id}`)
      const map = {}
      r.data.forEach(e => { map[e.proveedor.id] = e.valorPorLitro })
      setExcedentes(map)
    } catch {}
  }

  const handleExcedenteBlur = async (proveedorId, valor) => {
    const v = parseFloat(valor) || 0
    try {
      if (v > 0) {
        await api.post(`/excedentes/quincena/${quincenaId}/proveedor/${proveedorId}`, { valorPorLitro: v })
      } else {
        await api.delete(`/excedentes/quincena/${quincenaId}/proveedor/${proveedorId}`)
      }
      cargarExcedentes(quincenaId)
    } catch {}
  }

  const handleQuincenaChange = (e) => {
    const q = quincenas.find(q => String(q.id) === e.target.value)
    setQuincenaId(e.target.value)
    setQuincenaTexto(q?.textoQuincena || '')
    setResumen(null)
    setError(null)
    setExcedentes({})
    if (e.target.value) {
      cargarResumen(e.target.value)
      cargarExcedentes(e.target.value)
    }
  }

  const provsFiltrados = resumen
    ? resumen.proveedores.filter(p =>
        (!p.rutaId || rutasSeleccionadas.has(p.rutaId)) &&
        (!filtroLeche || (p.tipoLeche || 'vaca') === filtroLeche)
      )
    : []

  const abrirModalImpresion = () => {
    setSeleccionImpresion(new Set(provsFiltrados.map(p => p.proveedorId)))
    setModalImpresion(true)
  }

  const toggleSeleccion = (id) => {
    setSeleccionImpresion(prev => {
      const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s
    })
  }

  const imprimirLista = () => {
    const totL     = provsFiltrados.reduce((s, p) => s + p.totalLitros, 0)
    const totBruto = provsFiltrados.reduce((s, p) => s + p.valorBruto, 0)
    const totDesc  = provsFiltrados.reduce((s, p) => s + p.descuento4x1000 + p.totalOtrosDescuentos, 0)
    const totNeto  = provsFiltrados.reduce((s, p) => s + p.valorNeto, 0)

    const conExcedentes = provsFiltrados.filter(p => (excedentes[p.proveedorId] || 0) > 0)
    const totExced = conExcedentes.reduce((s, p) => s + p.totalLitros * excedentes[p.proveedorId], 0)

    const ventana = window.open('', '_blank', 'width=900,height=700')
    ventana.document.write(`<html><head><title>Lista de pagos</title><style>
      body{font-family:Arial,sans-serif;font-size:12px;margin:20px;color:#000}
      h3{text-align:center;margin:0 0 12px;font-size:15px;font-weight:700}
      h4{margin:20px 0 8px;font-size:13px;font-weight:700;background:#4a1a2e;color:white;padding:6px 10px;border-radius:4px}
      table{width:100%;border-collapse:collapse;margin-bottom:4px}
      th{background:#f0f0f0;padding:6px 10px;border:1px solid #ccc;font-size:11px;font-weight:700;text-align:left}
      td{padding:7px 10px;border:1px solid #ddd;font-size:12px}
      .r{text-align:right}.c{text-align:center}
      .rojo{color:#c00}
      .tfoot-main td{background:#1a1a2e;color:white;font-weight:700}
      .tfoot-exc td{background:#4a1a2e;color:white;font-weight:700}
    </style></head><body>
      <h3>PAGO DE PROVEEDORES — ${quincenaTexto?.toUpperCase()}</h3>
      <table>
        <thead><tr>
          <th class="c" style="width:28px">#</th>
          <th>PROVEEDOR</th>
          <th>ZONA</th>
          <th class="r">LITROS</th>
          <th class="r">$/LITRO</th>
          <th class="r">VALOR BRUTO</th>
          <th class="r">DESCUENTOS</th>
          <th class="r">TOTAL A PAGAR</th>
        </tr></thead>
        <tbody>${provsFiltrados.map((p, i) => {
          const desc = p.descuento4x1000 + p.totalOtrosDescuentos
          return `<tr style="background:${i % 2 === 0 ? 'white' : '#fafafa'}">
            <td class="c" style="color:#bbb;font-size:11px">${i + 1}</td>
            <td><strong>${p.nombre}</strong>${p.tipoLeche === 'búfala' ? ' <span style="font-size:10px;background:#e3f2fd;color:#1565c0;padding:1px 5px;border-radius:3px">Búfala</span>' : ''}</td>
            <td style="color:#666">${p.zona || '—'}</td>
            <td class="r">${fmtL(p.totalLitros)}</td>
            <td class="r" style="color:#666">$${fmt(p.precioLitro)}</td>
            <td class="r">$${fmt(p.valorBruto)}</td>
            <td class="r rojo">${desc > 0 ? `-$${fmt(desc)}` : '—'}</td>
            <td class="r"><strong>$${fmt(p.valorNeto)}</strong></td>
          </tr>`
        }).join('')}
        </tbody>
        <tfoot><tr class="tfoot-main">
          <td colspan="3">TOTAL A PAGAR</td>
          <td class="r">${fmtL(totL)}</td>
          <td></td>
          <td class="r">$${fmt(totBruto)}</td>
          <td class="r">-$${fmt(totDesc)}</td>
          <td class="r" style="font-size:14px">$${fmt(totNeto)}</td>
        </tr></tfoot>
      </table>

      ${conExcedentes.length > 0 ? `
      <h4>EXCEDENTES PAGADOS</h4>
      <table>
        <thead><tr>
          <th>PROVEEDOR</th>
          <th class="r">LITROS</th>
          <th class="r">EXCEDENTE $/LITRO</th>
          <th class="r">TOTAL EXCEDENTE</th>
        </tr></thead>
        <tbody>${conExcedentes.map((p, i) => {
          const excVal = excedentes[p.proveedorId]
          return `<tr style="background:${i % 2 === 0 ? 'white' : '#fafafa'}">
            <td>${p.nombre}</td>
            <td class="r" style="color:#666">${fmtL(p.totalLitros)}</td>
            <td class="r">$${fmt(excVal)}</td>
            <td class="r rojo"><strong>-$${fmt(p.totalLitros * excVal)}</strong></td>
          </tr>`
        }).join('')}
        </tbody>
        <tfoot><tr class="tfoot-exc">
          <td colspan="3">TOTAL EXCEDENTES</td>
          <td class="r">-$${fmt(totExced)}</td>
        </tr></tfoot>
      </table>` : ''}
    </body></html>`)
    ventana.document.close()
    ventana.focus()
    setTimeout(() => { ventana.print(); ventana.close() }, 350)
  }

  const imprimirSeleccionados = () => {
    const selec = provsFiltrados.filter(p => seleccionImpresion.has(p.proveedorId))
    if (!selec.length) return
    const fmtF = (f) => { const [,m,d] = (f||'').split('-'); return `${d}/${m}` }
    const css = `
      body{font-family:Arial,sans-serif;font-size:13px;margin:30px;color:#000}
      table{width:100%;border-collapse:collapse;margin-bottom:20px}
      th,td{border:1px solid #ccc;padding:5px 8px}
      thead tr{background:white!important;color:black!important}
      thead th{color:black!important;background:white!important;font-weight:700;border-bottom:2px solid #000;border-top:2px solid #000}
      .recibo{page-break-after:always;padding-bottom:20px}
      .recibo:last-child{page-break-after:avoid}
      h3{margin:0 0 16px;font-size:16px;text-align:center}
      .lbl{font-weight:600;display:inline-block;min-width:170px;color:#555}
      .cl{padding:7px 12px 7px 0;font-size:13px;color:#444;width:60%}
      .cv{padding:7px 12px;font-size:13px;text-align:right}
      .rojo{color:#c00}
      .verde{font-weight:700;font-size:15px;color:#1b5e20;border-top:2px solid #000}
    `
    const html = selec.map(p => {
      const totDesc = p.descuento4x1000 + p.totalOtrosDescuentos
      return `<div class="recibo">
        <h3>RECIBO DE PAGO DE LECHE</h3>
        <div style="margin-bottom:20px;line-height:1.9">
          <div><span class="lbl">DEBE A:</span> <strong>${p.nombre}</strong></div>
          ${p.rutaNombre ? `<div><span class="lbl">RUTA:</span> ${p.rutaNombre}</div>` : ''}
          <div><span class="lbl">POR CONCEPTO DE:</span> ${quincenaTexto}</div>
          ${p.conductores ? `<div><span class="lbl">TRANSPORTADOR:</span> ${p.conductores}</div>` : ''}
        </div>
        <table>
          <thead><tr><th>FECHA</th><th>VALE</th><th style="text-align:right">LITROS</th></tr></thead>
          <tbody>${p.recolecciones.map(r => `
            <tr><td>${fmtF(r.fecha)}</td><td>${r.vale||''}</td><td style="text-align:right">${fmtL(r.litros)}</td></tr>
          `).join('')}</tbody>
          <tfoot><tr style="background:#f0f0f0;font-weight:700">
            <td colspan="2">TOTAL LITROS</td><td style="text-align:right">${fmtL(p.totalLitros)}</td>
          </tr></tfoot>
        </table>
        <table><tbody>
          <tr><td class="cl">PRECIO ($/LITRO):</td><td class="cv">$${fmt(p.precioLitro)}</td></tr>
          <tr><td class="cl">TOTAL LITROS:</td><td class="cv">${fmtL(p.totalLitros)}</td></tr>
          <tr><td class="cl">VALOR TOTAL:</td><td class="cv"><strong>$${fmt(p.valorBruto)}</strong></td></tr>
          <tr class="rojo"><td class="cl">DESCUENTO 4X1000:</td><td class="cv">- $${fmt(p.descuento4x1000)}</td></tr>
          ${(p.otrosDescuentos||[]).map(d => `<tr class="rojo"><td class="cl" style="padding-left:24px">↳ ${d.concepto}:</td><td class="cv">- $${fmt(d.valor)}</td></tr>`).join('')}
          ${totDesc > 0 ? `<tr class="rojo"><td class="cl">TOTAL DESCUENTOS:</td><td class="cv">- $${fmt(totDesc)}</td></tr>` : ''}
          <tr class="verde"><td class="cl" style="font-weight:700">VALOR A PAGAR:</td><td class="cv" style="font-size:16px">$${fmt(p.valorNeto)}</td></tr>
        </tbody></table>
      </div>`
    }).join('')
    const ventana = window.open('', '_blank', 'width=750,height=900')
    ventana.document.write(`<html><head><title>Recibos — ${quincenaTexto}</title><style>${css}</style></head><body>${html}</body></html>`)
    ventana.document.close()
    ventana.focus()
    setTimeout(() => { ventana.print(); ventana.close() }, 400)
    setModalImpresion(false)
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ margin: 0 }}>Resumen de Quincena</h2>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          {[['', 'Todos'], ['vaca', 'Vaca'], ['bufala', 'Búfala']].map(([val, label]) => (
            <button key={val} onClick={() => setFiltroLeche(val)} style={{
              padding: '6px 16px', borderRadius: '20px', border: '2px solid',
              borderColor: filtroLeche === val ? '#0288d1' : '#e0e0e0',
              background: filtroLeche === val ? '#0288d1' : 'white',
              color: filtroLeche === val ? 'white' : '#666',
              fontWeight: '600', fontSize: '13px', cursor: 'pointer'
            }}>{label}</button>
          ))}
          {resumen && <>
            <button onClick={imprimirLista}
              style={{ background: '#f0f4ff', color: '#3949ab', border: '1px solid #c5cae9', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>
              Imprimir lista
            </button>
            <button onClick={abrirModalImpresion}
              style={{ background: '#1a1a2e', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>
              Imprimir recibos
            </button>
          </>}
        </div>
      </div>

      {/* Selector de quincena */}
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
        <div style={{ textAlign: 'center', padding: '60px', color: '#999' }}>Calculando resumen...</div>
      )}

      {resumen && !cargando && (() => {
        const totL      = provsFiltrados.reduce((s, p) => s + p.totalLitros, 0)
        const totBruto  = provsFiltrados.reduce((s, p) => s + p.valorBruto, 0)
        const totDesc   = provsFiltrados.reduce((s, p) => s + p.descuento4x1000 + p.totalOtrosDescuentos, 0)
        const totNeto   = provsFiltrados.reduce((s, p) => s + p.valorNeto, 0)
        const totExced  = provsFiltrados.reduce((s, p) => s + p.totalLitros * (excedentes[p.proveedorId] || 0), 0)

        return (
        <>
          {/* Tarjetas de totales globales */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '28px' }}>
            <Tarjeta label="Proveedores" valor={provsFiltrados.length} color="#6c63ff" />
            <Tarjeta label="Total litros" valor={`${fmtL(totL)} L`} color="#0288d1" />
            <Tarjeta label="Total descuentos" valor={`$${fmt(totDesc)}`} color="#e65100" />
            <Tarjeta label="TOTAL A PAGAR" valor={`$${fmt(totNeto)}`} color="#1b5e20" grande />
          </div>

          {/* Tabla principal de proveedores */}
          <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
            <div style={{
              background: '#1a1a2e', color: 'white', padding: '14px 20px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <span style={{ fontWeight: '600', fontSize: '14px', letterSpacing: '0.5px' }}>
                PAGO DE PROVEEDORES — {resumen.textoQuincena?.toUpperCase()}
              </span>
              <span style={{ fontSize: '12px', color: '#aaa' }}>
                Haz clic en un proveedor para ver su recibo detallado
              </span>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f5f5f5', borderBottom: '2px solid #e0e0e0' }}>
                  <th style={{ ...th, width: '40px', textAlign: 'center', color: '#999' }}>#</th>
                  <th style={th}>Proveedor</th>
                  <th style={th}>Zona</th>
                  <th style={{ ...th, textAlign: 'right' }}>Litros</th>
                  <th style={{ ...th, textAlign: 'right' }}>$/Litro</th>
                  <th style={{ ...th, textAlign: 'right' }}>Valor bruto</th>
                  <th style={{ ...th, textAlign: 'right' }}>Descuentos</th>
                  <th style={{ ...th, textAlign: 'right', color: '#1b5e20' }}>Total a pagar</th>
                  <th style={{ ...th, textAlign: 'center', width: '80px' }}></th>
                </tr>
              </thead>
              <tbody>
                {provsFiltrados.map((p, i) => (
                  <tr key={p.proveedorId}
                    style={{
                      borderBottom: '1px solid #f0f0f0',
                      background: i % 2 === 0 ? 'white' : '#fafafa',
                      cursor: 'pointer',
                      transition: 'background 0.15s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f0f4ff'}
                    onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? 'white' : '#fafafa'}
                    onClick={() => setProveedorSeleccionado(p)}
                  >
                    <td style={{ ...td, textAlign: 'center', color: '#bbb', fontSize: '12px' }}>{i + 1}</td>
                    <td style={{ ...td, fontWeight: '600' }}>
                      {p.nombre}
                      {p.tipoLeche === 'búfala' && (
                        <span style={{ marginLeft: '6px', fontSize: '11px', background: '#e3f2fd', color: '#1565c0', padding: '2px 6px', borderRadius: '4px' }}>
                          Búfala
                        </span>
                      )}
                    </td>
                    <td style={{ ...td, color: '#666', fontSize: '13px' }}>{p.zona || '—'}</td>
                    <td style={{ ...td, textAlign: 'right' }}>{fmtL(p.totalLitros)}</td>
                    <td style={{ ...td, textAlign: 'right', color: '#666' }}>${fmt(p.precioLitro)}</td>
                    <td style={{ ...td, textAlign: 'right' }}>${fmt(p.valorBruto)}</td>
                    <td style={{ ...td, textAlign: 'right', color: (p.descuento4x1000 + p.totalOtrosDescuentos) > 0 ? '#c62828' : '#ccc', fontSize: '13px' }}>
                      {(p.descuento4x1000 + p.totalOtrosDescuentos) > 0
                        ? `-$${fmt(p.descuento4x1000 + p.totalOtrosDescuentos)}`
                        : '—'}
                    </td>
                    <td style={{ ...td, textAlign: 'right', fontWeight: '700', color: '#1b5e20', fontSize: '15px' }}>
                      ${fmt(p.valorNeto)}
                    </td>
                    <td style={{ ...td, textAlign: 'center' }}>
                      <span style={{ fontSize: '12px', color: '#6c63ff', cursor: 'pointer' }}>Ver recibo</span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: '#1a1a2e', color: 'white', fontWeight: '700' }}>
                  <td colSpan={3} style={{ ...td, color: 'white', fontSize: '13px', letterSpacing: '0.5px' }}>TOTAL A PAGAR</td>
                  <td style={{ ...td, textAlign: 'right', color: 'white' }}>{fmtL(totL)}</td>
                  <td style={td}></td>
                  <td style={{ ...td, textAlign: 'right', color: 'white' }}>${fmt(totBruto)}</td>
                  <td style={{ ...td, textAlign: 'right', color: '#ef9a9a' }}>-${fmt(totDesc)}</td>
                  <td style={{ ...td, textAlign: 'right', color: '#a5d6a7', fontSize: '16px' }}>${fmt(totNeto)}</td>
                  <td style={td}></td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Tabla de excedentes */}
          <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', overflow: 'hidden', marginTop: '24px' }}>
            <div style={{ background: '#4a1a2e', color: 'white', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: '600', fontSize: '14px', letterSpacing: '0.5px' }}>
                EXCEDENTES PAGADOS — {resumen.textoQuincena?.toUpperCase()}
              </span>
              <span style={{ fontSize: '12px', color: '#f8bbd0' }}>
                Escribe el excedente por litro y haz clic fuera para guardar
              </span>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f5f5f5', borderBottom: '2px solid #e0e0e0' }}>
                  <th style={th}>Proveedor</th>
                  <th style={{ ...th, textAlign: 'right' }}>Litros</th>
                  <th style={{ ...th, textAlign: 'right' }}>Excedente $/litro</th>
                  <th style={{ ...th, textAlign: 'right', color: '#c62828' }}>Total excedente</th>
                </tr>
              </thead>
              <tbody>
                {provsFiltrados.map((p, i) => {
                  const excVal = excedentes[p.proveedorId] || 0
                  const totalExc = p.totalLitros * excVal
                  return (
                    <tr key={p.proveedorId} style={{ borderBottom: '1px solid #f0f0f0', background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                      <td style={{ ...td, fontWeight: '500' }}>{p.nombre}</td>
                      <td style={{ ...td, textAlign: 'right', color: '#666' }}>{fmtL(p.totalLitros)}</td>
                      <td style={{ ...td, textAlign: 'right' }}>
                        <input
                          type="number"
                          step="1"
                          min="0"
                          key={`exc-${p.proveedorId}-${excVal}`}
                          defaultValue={excVal > 0 ? excVal : ''}
                          onBlur={e => handleExcedenteBlur(p.proveedorId, e.target.value)}
                          placeholder="0"
                          style={{ width: '110px', padding: '6px 8px', borderRadius: '6px', border: '1px solid #ddd', textAlign: 'right', fontSize: '14px', boxSizing: 'border-box' }}
                        />
                      </td>
                      <td style={{ ...td, textAlign: 'right', fontWeight: '600', color: totalExc > 0 ? '#c62828' : '#ccc' }}>
                        {totalExc > 0 ? `-$${fmt(totalExc)}` : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr style={{ background: '#fce4ec', borderTop: '2px solid #f48fb1' }}>
                  <td colSpan={3} style={{ ...td, fontWeight: '700', color: '#880e4f', fontSize: '13px', letterSpacing: '0.5px' }}>
                    TOTAL EXCEDENTES
                  </td>
                  <td style={{ ...td, textAlign: 'right', fontWeight: '700', color: '#c62828', fontSize: '15px' }}>
                    {totExced > 0 ? `-$${fmt(totExced)}` : '$0'}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </>
        )
      })()}

      {!resumen && !cargando && quincenaId && !error && (
        <div style={{ textAlign: 'center', padding: '60px', color: '#999' }}>
          No hay recolecciones en esta quincena
        </div>
      )}

      {/* Modal de recibo individual */}
      {proveedorSeleccionado && (
        <ReciboProveedorModal
          proveedor={proveedorSeleccionado}
          textoQuincena={quincenaTexto}
          onClose={() => setProveedorSeleccionado(null)}
        />
      )}

      {/* Modal: imprimir recibos en lote */}
      {modalImpresion && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
          onClick={() => setModalImpresion(false)}>
          <div style={{ background: 'white', borderRadius: '16px', width: '100%', maxWidth: '460px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', overflow: 'hidden' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ background: '#1a1a2e', color: 'white', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: '700', fontSize: '15px' }}>Seleccionar recibos a imprimir</span>
              <button onClick={() => setModalImpresion(false)} style={{ background: 'none', border: 'none', color: '#aaa', fontSize: '20px', cursor: 'pointer', lineHeight: 1 }}>✕</button>
            </div>
            <div style={{ padding: '12px 20px', borderBottom: '1px solid #f0f0f0', display: 'flex', gap: '10px' }}>
              <button onClick={() => setSeleccionImpresion(new Set(provsFiltrados.map(p => p.proveedorId)))}
                style={{ fontSize: '12px', background: '#f0f4ff', color: '#3949ab', border: '1px solid #c5cae9', borderRadius: '6px', padding: '5px 12px', cursor: 'pointer', fontWeight: '600' }}>
                Todos
              </button>
              <button onClick={() => setSeleccionImpresion(new Set())}
                style={{ fontSize: '12px', background: '#fafafa', color: '#888', border: '1px solid #e0e0e0', borderRadius: '6px', padding: '5px 12px', cursor: 'pointer', fontWeight: '600' }}>
                Ninguno
              </button>
              <span style={{ marginLeft: 'auto', fontSize: '13px', color: '#888', alignSelf: 'center' }}>
                {seleccionImpresion.size} seleccionados
              </span>
            </div>
            <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
              {provsFiltrados.map(p => {
                const sel = seleccionImpresion.has(p.proveedorId)
                return (
                  <div key={p.proveedorId} onClick={() => toggleSeleccion(p.proveedorId)} style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '11px 20px', cursor: 'pointer', borderBottom: '1px solid #f5f5f5',
                    background: sel ? '#f0fff4' : 'white',
                  }}>
                    <div style={{
                      width: '18px', height: '18px', borderRadius: '4px', flexShrink: 0,
                      border: `2px solid ${sel ? '#27ae60' : '#ddd'}`,
                      background: sel ? '#27ae60' : 'white',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {sel && <span style={{ color: 'white', fontSize: '11px', fontWeight: '700' }}>✓</span>}
                    </div>
                    <span style={{ flex: 1, fontSize: '13px', fontWeight: '500', color: '#333' }}>{p.nombre}</span>
                    <span style={{ fontSize: '12px', color: '#888' }}>${fmt(p.valorNeto)}</span>
                  </div>
                )
              })}
            </div>
            <div style={{ padding: '14px 20px', borderTop: '1px solid #f0f0f0', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => setModalImpresion(false)}
                style={{ background: '#f5f5f5', color: '#555', border: 'none', borderRadius: '8px', padding: '10px 18px', cursor: 'pointer', fontWeight: '600' }}>
                Cancelar
              </button>
              <button onClick={imprimirSeleccionados} disabled={seleccionImpresion.size === 0}
                style={{ background: seleccionImpresion.size > 0 ? '#1a1a2e' : '#ccc', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 20px', cursor: seleccionImpresion.size > 0 ? 'pointer' : 'default', fontWeight: '700', fontSize: '13px' }}>
                Imprimir {seleccionImpresion.size > 0 ? `(${seleccionImpresion.size})` : ''}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Tarjeta({ label, valor, color, grande = false }) {
  return (
    <div style={{
      background: 'white', padding: '20px', borderRadius: '12px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderTop: `3px solid ${color}`
    }}>
      <p style={{ margin: 0, fontSize: '11px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</p>
      <p style={{ margin: '6px 0 0', fontSize: grande ? '22px' : '19px', fontWeight: '700', color }}>
        {valor}
      </p>
    </div>
  )
}

const th = {
  padding: '11px 14px',
  textAlign: 'left',
  fontSize: '12px',
  fontWeight: '600',
  letterSpacing: '0.3px',
  color: '#444'
}

const td = {
  padding: '11px 14px',
  fontSize: '14px'
}

export default ResumenQuincena
