import { createContext, useContext, useState, useEffect } from 'react'
import api from '../api/axios'

const RutaVistaContext = createContext(null)

function cargarSeleccionGuardada() {
  try {
    const saved = localStorage.getItem('ruta_vista_ids')
    return saved ? new Set(JSON.parse(saved)) : new Set()
  } catch {
    return new Set()
  }
}

export function RutaVistaProvider({ children }) {
  const [rutasDisponibles, setRutasDisponibles] = useState([])
  const [rutasSeleccionadas, setRutasSeleccionadas] = useState(cargarSeleccionGuardada)

  useEffect(() => {
    api.get('/rutas').then(r => {
      setRutasDisponibles(r.data)
      setRutasSeleccionadas(prev => {
        if (prev.size === 0) {
          const todas = new Set(r.data.map(rt => rt.id))
          localStorage.setItem('ruta_vista_ids', JSON.stringify([...todas]))
          return todas
        }
        return prev
      })
    }).catch(() => {})
  }, [])

  const toggleRuta = (id) => {
    setRutasSeleccionadas(prev => {
      if (prev.has(id) && prev.size === 1) return prev
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      localStorage.setItem('ruta_vista_ids', JSON.stringify([...next]))
      return next
    })
  }

  return (
    <RutaVistaContext.Provider value={{ rutasDisponibles, rutasSeleccionadas, toggleRuta }}>
      {children}
    </RutaVistaContext.Provider>
  )
}

export function useRutaVista() {
  return useContext(RutaVistaContext)
}
