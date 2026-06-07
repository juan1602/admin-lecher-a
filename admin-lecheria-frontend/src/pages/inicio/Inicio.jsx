import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api/axios'
import { useRutaVista } from '../../context/RutaVistaContext'

const fmt  = (n) => Math.round(n ?? 0).toLocaleString('es-CO')
const fmtL = (n) => Number(n ?? 0).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 1 })

const HOY = new Date().toISOString().split('T')[0]

const ACCESOS = [
  { path: '/recolecciones', label: 'Recolecciones', desc: 'Registrar litros del día',  color: '#0288d1', icon: '🥛' },
  { path: '/recibos',       label: 'Recibos',        desc: 'Entregas a la empresa',    color: '#388e3c', icon: '🏭' },
  { path: '/resumen',       label: 'Resumen',         desc: 'Liquidación quincena',     color: '#6c63ff', icon: '💰' },
  { path: '/transporte',    label: 'Transporte',      desc: 'Rinde y control diario',   color: '#1565c0', icon: '🚛' },
  { path: '/descuentos',    label: 'Descuentos',      desc: 'Descontar a proveedores',  color: '#e65100', icon: '✂️' },
  { path: '/proveedores',   label: 'Proveedores',     desc: 'Gestionar finqueros',      color: '#558b2f', icon: '👨‍🌾' },
]

export default function Inicio() {
  const { rutasSeleccionadas } = useRutaVista()
  const [quincena, setQuincena] = useState(null)
  const [stats, setStats]       = useState(null)
  const [litrosPorDia, setLitrosPorDia] = useState([])
  const [todosRecs, setTodosRecs] = useState([])
  const [todosProvs, setTodosProvs] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => { cargarDatos() }, [])

  const cargarDatos = async () => {
    setCargando(true)
    try {
      const [qRes, provRes] = await Promise.all([
        api.get('/quincenas/abierta'),
        api.get('/proveedores'),
      ])
      const q = qRes.data
      setQuincena(q)
      setTodosProvs(provRes.data ?? [])

      const recolRes = await api.get(`/recolecciones/quincena/${q.id}`)
      const recs = recolRes.data ?? []
      setTodosRecs(recs)

      calcularStats(recs, provRes.data ?? [], rutasSeleccionadas, q)
    } catch {
      setQuincena(null)
      setStats(null)
      setLitrosPorDia([])
    } finally {
      setCargando(false)
    }
  }

  const calcularStats = (recs, provs, rutasSel, q) => {
    const recsFilt = recs.filter(r => rutasSel.has(r.proveedor?.ruta?.id))
    const provsFilt = provs.filter(p => rutasSel.has(p.ruta?.id))

    const hoy = recsFilt.filter(r => r.fecha === HOY)
    const totalLitros = recsFilt.reduce((s, r) => s + (r.litrosRecolectados ?? 0), 0)

    // Agrupar litros por fecha para la gráfica
    const porFecha = {}
    recsFilt.forEach(r => {
      porFecha[r.fecha] = (porFecha[r.fecha] ?? 0) + (r.litrosRecolectados ?? 0)
    })

    // Generar todos los días del rango de la quincena
    const dias = []
    const inicio = new Date(q.fechaInicio + 'T00:00:00')
    const fin    = new Date(q.fechaFin    + 'T00:00:00')
    const hoyDate = new Date(HOY + 'T00:00:00')
    for (let d = new Date(inicio); d <= fin && d <= hoyDate; d.setDate(d.getDate() + 1)) {
      const key = d.toISOString().split('T')[0]
      dias.push({ fecha: key, litros: porFecha[key] ?? 0 })
    }
    setLitrosPorDia(dias)

    setStats({
      proveedores:    provsFilt.length,
      litrosHoy:      hoy.reduce((s, r) => s + (r.litrosRecolectados ?? 0), 0),
      recolsHoy:      hoy.length,
      litrosQuincena: totalLitros,
      diasConDatos:   [...new Set(recsFilt.map(r => r.fecha))].length,
      estimadoPago:   totalLitros * 1900,
    })
  }

  // Re-calcular cuando cambia la selección de rutas
  useEffect(() => {
    if (todosRecs.length > 0 && quincena) {
      calcularStats(todosRecs, todosProvs, rutasSeleccionadas, quincena)
    }
  }, [rutasSeleccionadas])

  const fechaHoy = () => {
    const d = new Date()
    const meses = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']
    return `${d.getDate()} de ${meses[d.getMonth()]} de ${d.getFullYear()}`
  }

  const progresoQuincena = () => {
    if (!quincena?.fechaInicio || !quincena?.fechaFin) return { pct: 0, dias: 0, total: 0 }
    const ini  = new Date(quincena.fechaInicio + 'T00:00:00')
    const fin  = new Date(quincena.fechaFin    + 'T00:00:00')
    const hoyD = new Date(HOY + 'T00:00:00')
    const total = Math.round((fin - ini) / 86400000) + 1
    const dias  = Math.min(Math.round((hoyD - ini) / 86400000) + 1, total)
    return { pct: Math.round((dias / total) * 100), dias, total }
  }

  const { pct, dias, total } = progresoQuincena()
  const maxLitros = litrosPorDia.length ? Math.max(...litrosPorDia.map(d => d.litros), 1) : 1

  return (
    <div style={{ fontFamily: 'inherit' }}>

      {/* ── HEADER ── */}
      <div style={{
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 60%, #0f3460 100%)',
        borderRadius: '16px', padding: '28px 32px 24px', marginBottom: '20px',
        color: 'white', position: 'relative', overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
      }}>
        {/* Decoración fondo */}
        <div style={{ position: 'absolute', top: '-30px', right: '-10px', fontSize: '160px', opacity: 0.05, userSelect: 'none' }}>🥛</div>
        <div style={{ position: 'absolute', bottom: '-20px', right: '140px', fontSize: '100px', opacity: 0.04, userSelect: 'none' }}>🐄</div>

        <div style={{ position: 'relative' }}>
          {/* Fecha y título */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div style={{ fontSize: '12px', color: '#7c7caa', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>
                {fechaHoy()}
              </div>
              <h1 style={{ margin: '0 0 4px', fontSize: '24px', fontWeight: '800', color: 'white', letterSpacing: '-0.3px' }}>
                Admin Lechería
              </h1>
              {quincena ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
                  <span style={{
                    background: 'rgba(108,99,255,0.85)', backdropFilter: 'blur(4px)',
                    color: 'white', padding: '3px 10px', borderRadius: '20px',
                    fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px',
                  }}>● QUINCENA ABIERTA</span>
                  <span style={{ color: '#b0b0d8', fontSize: '13px' }}>{quincena.textoQuincena}</span>
                </div>
              ) : (
                <span style={{ color: '#ef9a9a', fontSize: '13px', marginTop: '6px', display: 'block' }}>
                  ⚠️ Sin quincena abierta —{' '}
                  <Link to="/quincenas" style={{ color: '#90caf9' }}>crear una</Link>
                </span>
              )}
            </div>

            {/* Badge días restantes */}
            {quincena && (
              <div style={{
                background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px', padding: '12px 18px', textAlign: 'center', minWidth: '90px',
              }}>
                <div style={{ fontSize: '28px', fontWeight: '800', color: 'white', lineHeight: 1 }}>
                  {total - dias >= 0 ? total - dias : 0}
                </div>
                <div style={{ fontSize: '11px', color: '#9090c0', marginTop: '4px' }}>días restantes</div>
              </div>
            )}
          </div>

          {/* Barra de progreso quincena */}
          {quincena && (
            <div style={{ marginTop: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '11px', color: '#7c7caa' }}>Progreso de la quincena</span>
                <span style={{ fontSize: '11px', color: '#b0b0d8', fontWeight: '600' }}>
                  {dias} de {total} días — {pct}%
                </span>
              </div>
              <div style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '8px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', width: `${pct}%`, borderRadius: '8px',
                  background: 'linear-gradient(90deg, #6c63ff, #a78bfa)',
                  transition: 'width 0.8s ease',
                }} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── KPI CARDS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '20px' }}>
        {cargando ? (
          [1,2,3,4].map(i => (
            <div key={i} style={{ height: '100px', borderRadius: '14px', background: '#f0f0f5', animation: 'pulse 1.5s infinite' }} />
          ))
        ) : stats ? (<>
          <KpiCard
            label="Litros hoy"
            valor={`${fmtL(stats.litrosHoy)} L`}
            sub={`${stats.recolsHoy} recolecciones`}
            icon="🥛" color="#0288d1"
          />
          <KpiCard
            label="Total quincena"
            valor={`${fmtL(stats.litrosQuincena)} L`}
            sub={`${stats.diasConDatos} días con datos`}
            icon="📈" color="#6c63ff"
          />
          <KpiCard
            label="Estimado a pagar"
            valor={`$${fmt(stats.estimadoPago)}`}
            sub="a proveedores (ref. $1.900/L)"
            icon="💰" color="#388e3c"
          />
          <KpiCard
            label="Proveedores activos"
            valor={stats.proveedores}
            sub="en esta quincena"
            icon="👨‍🌾" color="#e65100"
          />
        </>) : null}
      </div>

      {/* ── GRÁFICA LITROS POR DÍA ── */}
      {litrosPorDia.length > 0 && (
        <div style={{
          background: 'white', borderRadius: '14px', padding: '20px 24px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.07)', marginBottom: '20px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '13px', color: '#444', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Litros por día — quincena actual
            </h3>
            <span style={{ fontSize: '12px', color: '#999' }}>
              Máx: {fmtL(maxLitros)} L
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '80px' }}>
            {litrosPorDia.map((d, i) => {
              const esHoy = d.fecha === HOY
              const altura = d.litros ? Math.max(Math.round((d.litros / maxLitros) * 80), 4) : 4
              const dia = d.fecha.slice(8)
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                  <div title={`${d.fecha}: ${fmtL(d.litros)} L`} style={{
                    width: '100%', height: `${altura}px`,
                    background: esHoy
                      ? 'linear-gradient(180deg, #6c63ff, #a78bfa)'
                      : d.litros
                        ? 'linear-gradient(180deg, #0288d1, #4fc3f7)'
                        : '#f0f0f5',
                    borderRadius: '4px 4px 2px 2px',
                    cursor: 'default',
                    boxShadow: esHoy ? '0 2px 8px rgba(108,99,255,0.4)' : 'none',
                    transition: 'opacity 0.2s',
                  }} />
                  <span style={{
                    fontSize: '10px', color: esHoy ? '#6c63ff' : '#bbb',
                    fontWeight: esHoy ? '700' : '400',
                  }}>{dia}</span>
                </div>
              )
            })}
          </div>
          <div style={{ marginTop: '10px', display: 'flex', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'linear-gradient(#6c63ff,#a78bfa)' }} />
              <span style={{ fontSize: '11px', color: '#999' }}>Hoy</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'linear-gradient(#0288d1,#4fc3f7)' }} />
              <span style={{ fontSize: '11px', color: '#999' }}>Días anteriores</span>
            </div>
          </div>
        </div>
      )}

      {/* ── ACCESOS RÁPIDOS ── */}
      <div>
        <h3 style={{ margin: '0 0 12px', fontSize: '12px', color: '#999', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>
          Acceso rápido
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
          {ACCESOS.map(a => (
            <Link key={a.path} to={a.path} style={{ textDecoration: 'none' }}>
              <div
                style={{
                  background: 'white', borderRadius: '12px', padding: '16px 18px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  borderLeft: `4px solid ${a.color}`,
                  display: 'flex', alignItems: 'center', gap: '12px',
                  transition: 'transform 0.15s, box-shadow 0.15s',
                  cursor: 'pointer',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 6px 18px rgba(0,0,0,0.11)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'
                }}
              >
                <div style={{
                  width: '40px', height: '40px', borderRadius: '10px', flexShrink: 0,
                  background: `${a.color}15`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '20px',
                }}>{a.icon}</div>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '13px', color: '#1a1a2e' }}>{a.label}</div>
                  <div style={{ fontSize: '11px', color: '#999', marginTop: '1px' }}>{a.desc}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

    </div>
  )
}

function KpiCard({ label, valor, sub, icon, color }) {
  return (
    <div style={{
      background: 'white', padding: '18px 20px', borderRadius: '14px',
      boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
      borderTop: `3px solid ${color}`,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
        <p style={{ margin: 0, fontSize: '11px', color: '#999', textTransform: 'uppercase', letterSpacing: '0.5px', lineHeight: 1.4 }}>{label}</p>
        <span style={{ fontSize: '20px' }}>{icon}</span>
      </div>
      <p style={{ margin: 0, fontSize: '22px', fontWeight: '800', color, letterSpacing: '-0.5px' }}>{valor}</p>
      {sub && <p style={{ margin: '3px 0 0', fontSize: '11px', color: '#bbb' }}>{sub}</p>}
    </div>
  )
}
