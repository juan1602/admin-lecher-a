// Sesión con contraseña compartida: la llave (token) queda guardada en el dispositivo ~30 días.
// Las recolecciones pendientes offline NO se borran al cerrar sesión.

const KEY = 'auth_token'
export const EVENTO_SESION = 'sesion-cambio'

export function getToken() {
  try {
    return localStorage.getItem(KEY)
  } catch {
    return null
  }
}

export function iniciarSesion(token) {
  localStorage.setItem(KEY, token)
  window.dispatchEvent(new Event(EVENTO_SESION))
}

export function cerrarSesion() {
  localStorage.removeItem(KEY)
  window.dispatchEvent(new Event(EVENTO_SESION))
}
