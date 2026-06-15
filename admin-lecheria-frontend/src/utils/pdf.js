import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const fmt = v => Math.round(v ?? 0).toLocaleString('es-CO')
const fmtL = v => Number(v ?? 0).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 1 })

function encabezado(doc, titulo, subtitulo) {
  doc.setFillColor(26, 26, 46)
  doc.rect(0, 0, 210, 22, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.text(titulo, 14, 10)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(170, 170, 200)
  doc.text(subtitulo, 14, 17)
  doc.setTextColor(0, 0, 0)
  return 28
}

function seccionTitulo(doc, y, texto, color) {
  const [r, g, b] = color
  doc.setFillColor(r, g, b)
  doc.rect(14, y, 182, 7, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text(texto, 17, y + 5)
  doc.setTextColor(0, 0, 0)
  return y + 10
}

// ── Cuentas Personalizadas ────────────────────────────────────────────────────
export function pdfCuentaPersonalizada({ cuentaNombre, quincenaTexto, ingresos, descuentos }) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  let y = encabezado(doc, 'CUENTAS PERSONALIZADAS', `${cuentaNombre}  ·  ${quincenaTexto || ''}`)

  const totalIngresos   = ingresos.reduce((s, g) => s + g.valor, 0)
  const totalDescuentos = descuentos.reduce((s, d) => s + d.valor, 0)
  const saldoFinal      = totalIngresos - totalDescuentos

  // Ingresos
  y = seccionTitulo(doc, y, 'INGRESOS', [39, 174, 96])
  autoTable(doc, {
    startY: y,
    head: [['Recibo / Empresa', 'Litros totales', 'Valor']],
    body: [
      ...ingresos.map(g => [g.nombre, fmtL(g.litros) + ' L', '$ ' + fmt(g.valor)]),
      [{ content: 'TOTAL INGRESOS', styles: { fontStyle: 'bold' } }, '', { content: '$ ' + fmt(totalIngresos), styles: { fontStyle: 'bold', textColor: [39, 174, 96] } }],
    ],
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [39, 174, 96], textColor: 255, fontStyle: 'bold' },
    columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' } },
    margin: { left: 14, right: 14 },
  })

  y = doc.lastAutoTable.finalY + 8

  // Descuentos
  y = seccionTitulo(doc, y, 'DESCUENTOS', [231, 76, 60])
  autoTable(doc, {
    startY: y,
    head: [['Descripción', 'Valor']],
    body: [
      ...descuentos.map(d => [d.descripcion, '$ ' + fmt(d.valor)]),
      [{ content: 'TOTAL DESCUENTOS', styles: { fontStyle: 'bold' } }, { content: '$ ' + fmt(totalDescuentos), styles: { fontStyle: 'bold', textColor: [231, 76, 60] } }],
    ],
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [231, 76, 60], textColor: 255, fontStyle: 'bold' },
    columnStyles: { 1: { halign: 'right' } },
    margin: { left: 14, right: 14 },
  })

  y = doc.lastAutoTable.finalY + 10

  // Saldo final
  doc.setFillColor(245, 245, 245)
  doc.rect(14, y, 182, 14, 'F')
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(80, 80, 80)
  doc.text('SALDO FINAL', 18, y + 9)
  const saldoColor = saldoFinal >= 0 ? [39, 174, 96] : [231, 76, 60]
  doc.setTextColor(...saldoColor)
  doc.setFontSize(13)
  doc.text('$ ' + fmt(saldoFinal), 195, y + 9, { align: 'right' })

  doc.save(`cuenta-${cuentaNombre.replace(/\s+/g, '-').toLowerCase()}.pdf`)
}

// ── Cuentas Generales ─────────────────────────────────────────────────────────
export function pdfCuentasGenerales({ quincenaTexto, rutaNombres, transporteTotal, rindeTotal, descuentos, combustibles, totalExcedentes }) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  const subtitulo = `${quincenaTexto || ''}  ·  Rutas: ${rutaNombres || 'todas'}`
  let y = encabezado(doc, 'CUENTAS GENERALES', subtitulo)

  const descTrans = descuentos.filter(d => d.tipo === 'TRANSPORTE')
  const descRinde = descuentos.filter(d => d.tipo === 'RINDE')
  const totalComb     = combustibles.reduce((s, c) => s + c.valor, 0)
  const totalDescTrans = descTrans.reduce((s, d) => s + d.valor, 0) + totalComb
  const totalDescRinde = descRinde.reduce((s, d) => s + d.valor, 0) + totalExcedentes
  const netoTrans  = transporteTotal - totalDescTrans
  const netoRinde  = rindeTotal - totalDescRinde
  const totalFinal = netoTrans + netoRinde

  // ── TRANSPORTE ──
  y = seccionTitulo(doc, y, 'TRANSPORTE', [2, 136, 209])
  const bodyTrans = [
    ['Valor base transporte', '$ ' + fmt(transporteTotal)],
    ...combustibles.map(c => ['  Combustible: ' + c.descripcion, '−$ ' + fmt(c.valor)]),
    ...descTrans.map(d => ['  ' + d.nombre, '−$ ' + fmt(d.valor)]),
    [{ content: 'NETO TRANSPORTE', styles: { fontStyle: 'bold' } }, { content: '$ ' + fmt(netoTrans), styles: { fontStyle: 'bold', textColor: netoTrans >= 0 ? [2, 136, 209] : [231, 76, 60] } }],
  ]
  autoTable(doc, {
    startY: y,
    body: bodyTrans,
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: { 1: { halign: 'right' } },
    alternateRowStyles: { fillColor: [240, 248, 255] },
    margin: { left: 14, right: 14 },
  })

  y = doc.lastAutoTable.finalY + 8

  // ── RINDE ──
  y = seccionTitulo(doc, y, 'RINDE', [56, 142, 60])
  const bodyRinde = [
    ['Valor base rinde', '$ ' + fmt(rindeTotal)],
    ...(totalExcedentes > 0 ? [['  Excedentes pagados (auto)', '−$ ' + fmt(totalExcedentes)]] : []),
    ...descRinde.map(d => ['  ' + d.nombre, '−$ ' + fmt(d.valor)]),
    [{ content: 'NETO RINDE', styles: { fontStyle: 'bold' } }, { content: '$ ' + fmt(netoRinde), styles: { fontStyle: 'bold', textColor: netoRinde >= 0 ? [56, 142, 60] : [231, 76, 60] } }],
  ]
  autoTable(doc, {
    startY: y,
    body: bodyRinde,
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: { 1: { halign: 'right' } },
    alternateRowStyles: { fillColor: [240, 255, 240] },
    margin: { left: 14, right: 14 },
  })

  y = doc.lastAutoTable.finalY + 10

  // ── TOTAL FINAL ──
  doc.setFillColor(26, 26, 46)
  doc.rect(14, y, 182, 16, 'F')
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(200, 200, 220)
  doc.text('TOTAL FINAL', 18, y + 10)
  doc.setTextColor(255, 224, 130)
  doc.setFontSize(14)
  doc.text('$ ' + fmt(totalFinal), 195, y + 10, { align: 'right' })

  doc.save('cuentas-generales.pdf')
}

// ── Transporte ────────────────────────────────────────────────────────────────
export function pdfTransporte({ vistaCompleta, resumen }) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

  if (vistaCompleta) {
    const { grupos, dias, textoQuincena, rindeValorTotal, transporteTotal, pagoTotal, rindeTransporteTotal } = vistaCompleta
    let y = encabezado(doc, 'CONTROL DE TRANSPORTE', textoQuincena?.toUpperCase() || '')

    // Un bloque por grupo
    grupos.forEach((g, gi) => {
      if (y > 160) { doc.addPage(); y = 14 }
      const COLORES_RGB = [[2, 136, 209], [56, 142, 60], [230, 81, 0], [108, 99, 255], [198, 40, 40], [0, 131, 143]]
      const color = COLORES_RGB[gi % COLORES_RGB.length]

      y = seccionTitulo(doc, y, `${g.nombre.toUpperCase()}  ·  Entregado: ${fmtL(g.totalEntregado)} L  ·  Recogido: ${fmtL(g.totalRecogido)} L  ·  Rinde: ${fmtL(g.totalRinde)} L`, color)

      const rows = dias
        .map(dia => {
          const dg = dia.grupos?.find(x => x.grupoId === g.grupoId)
          const tieneData = (dg?.entregado ?? 0) > 0 || (dg?.recogido ?? 0) > 0
          if (!tieneData) return null
          const [, mes, d] = (dia.fecha || '').split('-')
          return [`${d}/${mes}`, fmtL(dg?.entregado ?? 0), fmtL(dg?.recogido ?? 0), fmtL(dg?.rinde ?? 0)]
        })
        .filter(Boolean)

      if (rows.length > 0) {
        autoTable(doc, {
          startY: y,
          head: [['Día', 'Entregado (L)', 'Recogido (L)', 'Rinde (L)']],
          body: rows,
          styles: { fontSize: 8, cellPadding: 2 },
          headStyles: { fillColor: color, textColor: 255 },
          columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' } },
          margin: { left: 14, right: 14 },
          tableWidth: 120,
        })
        y = doc.lastAutoTable.finalY + 10
      }
    })

    // Resumen final
    if (y > 160) { doc.addPage(); y = 14 }
    y = seccionTitulo(doc, y, 'RESUMEN FINAL', [26, 26, 46])
    autoTable(doc, {
      startY: y,
      body: [
        ['Valor transporte', '$ ' + fmt(transporteTotal)],
        ['Rinde (valor)', '$ ' + fmt(rindeValorTotal)],
        ['Rinde + Transporte', '$ ' + fmt(rindeTransporteTotal)],
        [{ content: 'PAGO TOTAL', styles: { fontStyle: 'bold' } }, { content: '$ ' + fmt(pagoTotal), styles: { fontStyle: 'bold', textColor: [255, 160, 0] } }],
      ],
      styles: { fontSize: 10, cellPadding: 4 },
      columnStyles: { 1: { halign: 'right' } },
      margin: { left: 14, right: 14 },
    })

  } else if (resumen) {
    let y = encabezado(doc, 'CONTROL DE TRANSPORTE', resumen.textoQuincena?.toUpperCase() || '')

    const head = [['Día', ...resumen.empresas, 'Entregado L', 'Recogido L', 'Rinde L']]
    const body = resumen.dias
      .filter(d => d.litrosEntregados > 0 || d.litrosRecogidos > 0)
      .map(d => {
        const [, mes, dia] = (d.fecha || '').split('-')
        return [
          `${dia}/${mes}`,
          ...resumen.empresas.map(emp => { const e = d.empresas?.find(x => x.nombre === emp); return e ? fmtL(e.litros) : '—' }),
          fmtL(d.litrosEntregados),
          fmtL(d.litrosRecogidos),
          fmtL(d.rinde),
        ]
      })

    autoTable(doc, {
      startY: y,
      head,
      body,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [26, 26, 46], textColor: 255 },
      margin: { left: 14, right: 14 },
    })

    y = doc.lastAutoTable.finalY + 8
    autoTable(doc, {
      startY: y,
      body: [
        ['Total entregado', fmtL(resumen.totalLitrosEntregados) + ' L'],
        ['Total recogido', fmtL(resumen.totalLitrosRecogidos) + ' L'],
        ['Rinde total', fmtL(resumen.totalRinde) + ' L'],
        ['Valor transporte', '$ ' + fmt(resumen.totalValorTransporte)],
      ],
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: { 1: { halign: 'right', fontStyle: 'bold' } },
      margin: { left: 14, right: 14 },
    })
  }

  doc.save('transporte.pdf')
}
