import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useRutaVista } from '../context/RutaVistaContext'

const MENU = [
  { path: '/',             label: 'Inicio' },
  { path: '/proveedores',  label: 'Proveedores' },
  { path: '/rutas',        label: 'Rutas' },
  { path: '/conductores',  label: 'Conductores' },
  { path: '/quincenas',    label: 'Quincenas' },
  { path: '/recolecciones',label: 'Recolecciones' },
  { path: '/recibos',      label: 'Recibos' },
  { path: '/descuentos',   label: 'Descuentos' },
  { path: '/transporte',   label: 'Transporte' },
  { path: '/resumen',      label: 'Resumen Quincena' },
]

function useIsMobile() {
  const [mobile, setMobile] = useState(window.innerWidth < 768)
  useEffect(() => {
    const fn = () => setMobile(window.innerWidth < 768)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])
  return mobile
}

function Layout({ children }) {
  const location  = useLocation()
  const isMobile  = useIsMobile()
  const [abierto, setAbierto] = useState(false)
  const { rutasDisponibles, rutasSeleccionadas, toggleRuta } = useRutaVista()

  // Cierra el menú al navegar
  useEffect(() => { setAbierto(false) }, [location.pathname])

  const itemStyle = (path) => ({
    display: 'block',
    padding: '13px 24px',
    color: location.pathname === path ? '#fff' : '#aaa',
    background: location.pathname === path ? '#2a2a4a' : 'transparent',
    textDecoration: 'none',
    fontSize: '14px',
    borderLeft: location.pathname === path ? '3px solid #6c63ff' : '3px solid transparent',
  })

  const sidebar = (
    <aside style={{
      width: '220px',
      background: '#1a1a2e',
      color: 'white',
      padding: '0',
      flexShrink: 0,
      // Móvil: panel deslizante fijo
      ...(isMobile && {
        position: 'fixed',
        top: 0,
        left: abierto ? 0 : '-220px',
        height: '100vh',
        zIndex: 200,
        transition: 'left 0.25s ease',
        overflowY: 'auto',
      })
    }}>
      <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #2a2a4a', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ margin: 0, fontSize: '16px', color: '#e0e0e0' }}>🥛 Admin Lechería</h2>
        {isMobile && (
          <button onClick={() => setAbierto(false)}
            style={{ background: 'none', border: 'none', color: '#aaa', fontSize: '20px', cursor: 'pointer', lineHeight: 1 }}>
            ✕
          </button>
        )}
      </div>
      <nav style={{ marginTop: '8px' }}>
        {MENU.map(item => (
          <Link key={item.path} to={item.path} style={itemStyle(item.path)}>
            {item.label}
          </Link>
        ))}
      </nav>

      {rutasDisponibles.length > 0 && (
        <div style={{ padding: '12px 16px', borderTop: '1px solid #2a2a4a', marginTop: '8px' }}>
          <div style={{ fontSize: '10px', color: '#555', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: '600' }}>
            Vista de rutas
          </div>
          {rutasDisponibles.map(r => {
            const activa = rutasSeleccionadas.has(r.id)
            return (
              <button key={r.id} onClick={() => toggleRuta(r.id)} style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                width: '100%', textAlign: 'left', padding: '7px 10px',
                marginBottom: '4px', borderRadius: '8px', border: 'none',
                cursor: 'pointer', transition: 'background 0.15s',
                background: activa ? '#2a2a4a' : 'transparent',
                color: activa ? '#a89fff' : '#555',
                fontSize: '13px',
              }}>
                <span style={{
                  width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0,
                  background: activa ? '#6c63ff' : '#444',
                  boxShadow: activa ? '0 0 6px #6c63ff88' : 'none',
                }} />
                {r.nombre}
              </button>
            )
          })}
        </div>
      )}
    </aside>
  )

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Overlay oscuro al abrir el menú en móvil */}
      {isMobile && abierto && (
        <div onClick={() => setAbierto(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 199 }} />
      )}

      {sidebar}

      <main style={{
        flex: 1,
        minWidth: 0,
        padding: isMobile ? '16px' : '32px',
        paddingTop: isMobile ? '64px' : '32px',
        background: '#f5f5f5',
      }}>
        {/* Barra superior en móvil */}
        {isMobile && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
            background: '#1a1a2e', height: '52px',
            display: 'flex', alignItems: 'center', padding: '0 16px', gap: '16px',
          }}>
            <button onClick={() => setAbierto(true)}
              style={{ background: 'none', border: 'none', color: 'white', fontSize: '22px', cursor: 'pointer', lineHeight: 1, padding: '4px' }}>
              ☰
            </button>
            <span style={{ color: '#e0e0e0', fontSize: '15px', fontWeight: '600' }}>
              {MENU.find(m => m.path === location.pathname)?.label || 'Admin Lechería'}
            </span>
          </div>
        )}

        {children}
      </main>
    </div>
  )
}

export default Layout
