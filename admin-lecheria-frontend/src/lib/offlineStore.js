// Almacenamiento local para uso offline
// Guarda recolecciones pendientes de sincronizar y datos de referencia

const KEYS = {
  PENDIENTES: 'lecheria_pendientes',
  PROVEEDORES: 'lecheria_proveedores',
  CONDUCTORES: 'lecheria_conductores',
  RUTAS: 'lecheria_rutas',
  QUINCENA: 'lecheria_quincena',
}

// --- Recolecciones pendientes ---

export function guardarPendiente(recoleccion) {
  const lista = getPendientes()
  const nueva = { ...recoleccion, _localId: Date.now() + Math.random() }
  lista.push(nueva)
  localStorage.setItem(KEYS.PENDIENTES, JSON.stringify(lista))
  return nueva
}

export function getPendientes() {
  try {
    return JSON.parse(localStorage.getItem(KEYS.PENDIENTES) || '[]')
  } catch {
    return []
  }
}

export function eliminarPendiente(localId) {
  const lista = getPendientes().filter(r => r._localId !== localId)
  localStorage.setItem(KEYS.PENDIENTES, JSON.stringify(lista))
}

export function limpiarPendientes() {
  localStorage.removeItem(KEYS.PENDIENTES)
}

// --- Datos de referencia (para formulario offline) ---

export function cachearDatos(clave, datos) {
  try {
    localStorage.setItem(KEYS[clave], JSON.stringify(datos))
  } catch {
    // localStorage lleno — ignorar
  }
}

export function getDatosCache(clave) {
  try {
    return JSON.parse(localStorage.getItem(KEYS[clave]) || 'null')
  } catch {
    return null
  }
}
