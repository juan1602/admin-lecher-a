const fmt = (n) => Math.round(n).toLocaleString('es-CO')
const fmtL = (n) => Number(n).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 1 })

function ReciboProveedorModal({ proveedor, textoQuincena, onClose }) {
  if (!proveedor) return null

  const handlePrint = () => {
    const contenido = document.getElementById('recibo-imprimir')
    const ventana = window.open('', '_blank', 'width=700,height=900')
    ventana.document.write(`
      <html>
        <head>
          <title>Recibo - ${proveedor.nombre}</title>
          <style>
            body { font-family: Arial, sans-serif; font-size: 13px; margin: 30px; color: #000; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ccc; padding: 5px 8px; }
            th { background: #f0f0f0; font-weight: 600; }
            .header-row { margin-bottom: 6px; }
            .label { font-weight: 600; display: inline-block; min-width: 160px; }
            .totales td { border: none; padding: 3px 8px; }
            .total-final { font-weight: 700; font-size: 15px; border-top: 2px solid #000 !important; }
            .descuento { color: #c00; }
            h3 { margin: 0 0 16px; font-size: 16px; text-align: center; }
            thead tr { background: white !important; color: black !important; }
            thead th { color: black !important; background: white !important; font-weight: 700; border-bottom: 2px solid #000; border-top: 2px solid #000; }
          </style>
        </head>
        <body>${contenido.innerHTML}</body>
      </html>
    `)
    ventana.document.close()
    ventana.focus()
    setTimeout(() => { ventana.print(); ventana.close() }, 300)
  }

  const totalDescuentos = proveedor.descuento4x1000 + proveedor.totalOtrosDescuentos

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: '20px'
    }} onClick={onClose}>
      <div style={{
        background: 'white', borderRadius: '12px', maxWidth: '660px', width: '100%',
        maxHeight: '90vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }} onClick={e => e.stopPropagation()}>

        {/* Barra superior del modal */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '16px 20px', borderBottom: '1px solid #eee',
          background: '#1a1a2e', borderRadius: '12px 12px 0 0'
        }}>
          <span style={{ color: 'white', fontWeight: '600', fontSize: '15px' }}>
            Recibo de Pago — {proveedor.nombre}
          </span>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={handlePrint} style={{
              background: '#6c63ff', color: 'white', border: 'none',
              padding: '7px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px'
            }}>🖨️ Imprimir</button>
            <button onClick={onClose} style={{
              background: 'transparent', color: '#aaa', border: '1px solid #444',
              padding: '7px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px'
            }}>✕ Cerrar</button>
          </div>
        </div>

        {/* Contenido del recibo */}
        <div id="recibo-imprimir" style={{ padding: '24px' }}>
          <h3 style={{ textAlign: 'center', margin: '0 0 20px', fontSize: '15px', fontWeight: '700', letterSpacing: '0.5px' }}>
            RECIBO DE PAGO DE LECHE
          </h3>

          {/* Encabezado estilo Excel */}
          <div style={{ marginBottom: '20px', lineHeight: '1.9' }}>
            <div><span style={estiloLabel}>DEBE A:</span> <strong>{proveedor.nombre}</strong></div>
            {proveedor.rutaNombre && <div><span style={estiloLabel}>RUTA:</span> {proveedor.rutaNombre}</div>}
            <div><span style={estiloLabel}>POR CONCEPTO DE:</span> {textoQuincena}</div>
            {proveedor.conductores && (
              <div><span style={estiloLabel}>TRANSPORTADOR:</span> {proveedor.conductores}</div>
            )}
          </div>

          {/* Tabla diaria */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#1a1a2e', color: 'white' }}>
                <th style={thStyle}>FECHA</th>
                <th style={thStyle}>VALE</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>LITROS</th>
              </tr>
            </thead>
            <tbody>
              {proveedor.recolecciones?.map((r, i) => (
                <tr key={r.fecha} style={{ background: i % 2 === 0 ? 'white' : '#f9f9f9' }}>
                  <td style={tdStyle}>{formatFecha(r.fecha)}</td>
                  <td style={tdStyle}>{r.vale || ''}</td>
                  <td style={{ ...tdStyle, textAlign: 'right', fontWeight: '500' }}>{fmtL(r.litros)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ background: '#f0f0f0', fontWeight: '700' }}>
                <td colSpan={2} style={tdStyle}>TOTAL LITROS</td>
                <td style={{ ...tdStyle, textAlign: 'right' }}>{fmtL(proveedor.totalLitros)}</td>
              </tr>
            </tfoot>
          </table>

          {/* Sección de cálculos */}
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <tbody>
              <tr>
                <td style={calcLabel}>PRECIO ($/LITRO):</td>
                <td style={calcVal}>${fmt(proveedor.precioLitro)}</td>
              </tr>
              <tr>
                <td style={calcLabel}>TOTAL LITROS:</td>
                <td style={calcVal}>{fmtL(proveedor.totalLitros)}</td>
              </tr>
              <tr style={{ borderTop: '1px solid #eee' }}>
                <td style={calcLabel}>VALOR TOTAL:</td>
                <td style={calcVal}><strong>${fmt(proveedor.valorBruto)}</strong></td>
              </tr>

              {/* Descuento 4x1000 */}
              <tr style={{ borderTop: '1px solid #eee' }}>
                <td style={{ ...calcLabel, color: '#c62828' }}>DESCUENTO 4X1000:</td>
                <td style={{ ...calcVal, color: '#c62828' }}>- ${fmt(proveedor.descuento4x1000)}</td>
              </tr>

              {/* Otros descuentos */}
              {proveedor.otrosDescuentos?.map(d => (
                <tr key={d.id}>
                  <td style={{ ...calcLabel, color: '#c62828', paddingLeft: '24px' }}>↳ {d.concepto}:</td>
                  <td style={{ ...calcVal, color: '#c62828' }}>- ${fmt(d.valor)}</td>
                </tr>
              ))}

              {totalDescuentos > 0 && (
                <tr style={{ borderTop: '1px solid #ddd' }}>
                  <td style={{ ...calcLabel, color: '#c62828' }}>TOTAL DESCUENTOS:</td>
                  <td style={{ ...calcVal, color: '#c62828' }}>- ${fmt(totalDescuentos)}</td>
                </tr>
              )}

              {/* Valor neto final */}
              <tr style={{ borderTop: '2px solid #1a1a2e', background: '#f0fdf4' }}>
                <td style={{ ...calcLabel, fontWeight: '700', fontSize: '15px', color: '#1b5e20' }}>
                  VALOR A PAGAR:
                </td>
                <td style={{ ...calcVal, fontWeight: '700', fontSize: '16px', color: '#1b5e20' }}>
                  ${fmt(proveedor.valorNeto)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function formatFecha(fechaStr) {
  if (!fechaStr) return ''
  const [anio, mes, dia] = fechaStr.split('-')
  return `${dia}/${mes}`
}

const estiloLabel = {
  fontWeight: '600',
  display: 'inline-block',
  minWidth: '170px',
  color: '#555',
  fontSize: '13px'
}

const thStyle = {
  padding: '8px 12px',
  textAlign: 'left',
  fontSize: '12px',
  fontWeight: '600',
  letterSpacing: '0.3px'
}

const tdStyle = {
  padding: '7px 12px',
  fontSize: '13px',
  borderBottom: '1px solid #f0f0f0'
}

const calcLabel = {
  padding: '7px 12px 7px 0',
  fontSize: '13px',
  color: '#444',
  width: '60%'
}

const calcVal = {
  padding: '7px 12px',
  fontSize: '13px',
  textAlign: 'right'
}

export default ReciboProveedorModal
