import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import OfflineBanner from './components/OfflineBanner'
import Proveedores from './pages/proveedores/Proveedores'
import Rutas from './pages/rutas/Rutas'
import Conductores from './pages/conductores/Conductores'
import Quincenas from './pages/quincenas/Quincenas'
import Recolecciones from './pages/recolecciones/Recolecciones' 
import Recibos from './pages/recibos/Recibos'
import ResumenQuincena from './pages/resumen/ResumenQuincena'
import Transporte from './pages/transporte/Transporte'
import Descuentos from './pages/descuentos/Descuentos'
import Inicio from './pages/inicio/Inicio'

function App() {
  return (
    <>
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
      </Routes>
    </Layout>
    </>
  )
}

export default App
