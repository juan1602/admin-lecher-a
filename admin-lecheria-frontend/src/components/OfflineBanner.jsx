import { useState, useEffect, useCallback } from 'react'
import api from '../api/axios'
import { getPendientes, eliminarPendiente } from '../lib/offlineStore'

export default function OfflineBanner() {
  const [online, setOnline]       = useState(navigator.onLine)
  const [pendientes, setPendientes] = useState(getPendientes())
  const [sincronizando, setSincronizando] = useState(false)
  const [mensaje, setMensaje]     = useState(null)

  // Detectar cambios de conectividad
  useEffect(() => {
    const onOnline  = () => { setOnline(true);  setPendientes(getPendientes()) }
    const onOffline = () => setOnline(false)
    window.addEventListener('online',  onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.removeEventListener('online',  onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [])

  // Refrescar lista de pendientes cada vez que cambia online
  useEffect(() => {
    setPendientes(getPendientes())
    if (online && getPendientes().length > 0) sincronizar()
  }, [online])

  const sincronizar = useCallback(async () => {
    const lista = getPendientes()
    if (lista.length === 0 || sincronizando) return
    setSincronizando(true)
    setMensaje(null)
    let exitosos = 0
    for (const rec of lista) {
      try {
        const { _localId, ...payload } = rec
        await api.post('/recolecciones', payload)
        eliminarPendiente(_localId)
        exitosos++
      } catch (e) {
        // 409 = ya existe en el servidor (ej. se guardó aunque la petición pareció fallar): sacarlo de la cola
        if (e.response?.status === 409) eliminarPendiente(rec._localId)
        // otros errores: se intentará en el próximo ciclo
      }
    }
    setSincronizando(false)
    setPendientes(getPendientes())
    if (exitosos > 0) {
      setMensaje(`✅ ${exitosos} registro${exitosos > 1 ? 's' : ''} sincronizado${exitosos > 1 ? 's' : ''}`)
      setTimeout(() => setMensaje(null), 4000)
    }
  }, [sincronizando])

  // No mostrar nada si está online y no hay pendientes
  if (online && pendientes.length === 0 && !mensaje) return null

  return (
    <div style={{
      position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)',
      zIndex: 9999, display: 'flex', alignItems: 'center', gap: '12px',
      padding: '12px 20px', borderRadius: '10px', boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
      background: online ? (pendientes.length > 0 ? '#1565c0' : '#2e7d32') : '#b71c1c',
      color: 'white', fontSize: '14px', fontWeight: '500',
      maxWidth: '90vw', whiteSpace: 'nowrap'
    }}>
      {!online && (
        <>
          <span>📴 Sin internet — guardando en el celular</span>
        </>
      )}
      {online && pendientes.length > 0 && !sincronizando && (
        <>
          <span>📶 {pendientes.length} registro{pendientes.length > 1 ? 's' : ''} sin sincronizar</span>
          <button onClick={sincronizar}
            style={{ background: 'rgba(255,255,255,0.25)', border: 'none', color: 'white', padding: '5px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>
            Sincronizar ahora
          </button>
        </>
      )}
      {sincronizando && <span>⏳ Sincronizando...</span>}
      {mensaje && <span>{mensaje}</span>}
    </div>
  )
}
