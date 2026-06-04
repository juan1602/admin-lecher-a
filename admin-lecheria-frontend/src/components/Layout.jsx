import { Link, useLocation } from 'react-router-dom'

function Layout({ children }) {
  const location = useLocation()

  const menu = [
    { path: '/', label: 'Inicio' },
    { path: '/proveedores', label: 'Proveedores' },
    { path: '/rutas', label: 'Rutas' },
    { path: '/conductores', label: 'Conductores' },
    { path: '/quincenas', label: 'Quincenas' },
    { path: '/recolecciones', label: 'Recolecciones' },
    { path: '/recibos', label: 'Recibos' },
    { path: '/resumen', label: 'Resumen Quincena' },
    { path: '/transporte', label: 'Transporte' },
    { path: '/descuentos', label: 'Descuentos' }
  ]

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <aside style={{
        width: '220px',
        background: '#1a1a2e',
        color: 'white',
        padding: '24px 0',
        flexShrink: 0
      }}>
        <div style={{ padding: '0 24px 24px', borderBottom: '1px solid #2a2a4a' }}>
          <h2 style={{ margin: 0, fontSize: '18px', color: '#e0e0e0' }}>🥛 Admin Lechería</h2>
        </div>
        <nav style={{ marginTop: '16px' }}>
          {menu.map(item => (
            <Link
              key={item.path}
              to={item.path}
              style={{
                display: 'block',
                padding: '12px 24px',
                color: location.pathname === item.path ? '#fff' : '#aaa',
                background: location.pathname === item.path ? '#2a2a4a' : 'transparent',
                textDecoration: 'none',
                fontSize: '14px',
                borderLeft: location.pathname === item.path ? '3px solid #6c63ff' : '3px solid transparent',
              }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main style={{ flex: 1, padding: '32px', background: '#f5f5f5' }}>
        {children}
      </main>
    </div>
  )
}

export default Layout