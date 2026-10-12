import { useState, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { getToken, EVENTO_SESION } from './lib/auth'
import Login from './pages/login/Login'
import Layout from './components/Layout'
import OfflineBanner from './components/OfflineBanner'
import { RutaVistaProvider } from './context/RutaVistaContext'
import Proveedores from './pages/proveedores/Proveedores'
import Rutas from './pages/rutas/Rutas'
import Conductores from './pages/conductores/Conductores'
import Quincenas from './pages/quincenas/Quincenas'
import Recolecciones from './pages/recolecciones/Recolecciones' 
import Recibos from './pages/recibos/Recibos'
import ResumenQuincena from './pages/resumen/ResumenQuincena'
import Transporte from './pages/transporte/Transporte'
import Descuentos from './pages/descuentos/Descuentos'
import CuentasGenerales from './pages/cuentas/CuentasGenerales'
import CuentasPersonalizadas from './pages/cuentas/CuentasPersonalizadas'
import Inicio from './pages/inicio/Inicio'

function App() {
  const [conSesion, setConSesion] = useState(!!getToken())

  useEffect(() => {
    const actualizar = () => setConSesion(!!getToken())
    window.addEventListener(EVENTO_SESION, actualizar)
    return () => window.removeEventListener(EVENTO_SESION, actualizar)
  }, [])

  if (!conSesion) return <Login />

  return (
    <RutaVistaProvider>
    <OfflineBanner />
    <Layout>
      <Routes>
        <Route path="/" element={<Inicio />} />
        <Route path="/proveedores" element={<Proveedores />} />
        <Route path="/rutas" element={<Rutas />} />
        <Route path="/conductores" element={<Conductores />} />
        <Route path="/quincenas" element={<Quincenas />} />
        <Route path="/recolecciones" element={<Recolecciones />} />
        <Route path="/recibos" element={<Recibos />} />
        <Route path="/resumen" element={<ResumenQuincena />} />
        <Route path="/transporte" element={<Transporte />} />
        <Route path="/descuentos" element={<Descuentos />} />
        <Route path="/cuentas-generales" element={<CuentasGenerales />} />
        <Route path="/cuentas-personalizadas" element={<CuentasPersonalizadas />} />
      </Routes>
    </Layout>
    </RutaVistaProvider>
  )
}

export default App
