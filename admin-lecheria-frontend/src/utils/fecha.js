// Fechas en hora local del dispositivo (Colombia).
// No usar toISOString() para sacar la fecha: lo pasa a UTC y después de las 7 pm da el día siguiente.

// Date → 'YYYY-MM-DD' en hora local
export function fechaLocal(d = new Date()) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dia = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dia}`
}

// Fecha de hoy 'YYYY-MM-DD' en hora local
export const hoy = () => fechaLocal()
