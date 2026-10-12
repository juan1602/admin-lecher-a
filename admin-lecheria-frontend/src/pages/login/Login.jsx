import { useState } from 'react'
import api from '../../api/axios'
import { iniciarSesion } from '../../lib/auth'

function Login() {
  const [password, setPassword] = useState('')
  const [entrando, setEntrando] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (entrando || !password) return
    setEntrando(true)
    setError(null)
    try {
      const res = await api.post('/auth/login', { password })
      iniciarSesion(res.data.token)
    } catch (err) {
      const msg = err.response?.data
      if (typeof msg === 'string') setError(msg)
      else if (!err.response) setError('No hay conexión con el servidor. Si acaba de despertar, espera unos segundos e intenta otra vez.')
      else setError('No se pudo entrar.')
    } finally {
      setEntrando(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#1a1a2e', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', boxSizing: 'border-box' }}>
      <form onSubmit={handleSubmit}
        style={{ background: 'white', padding: '32px 28px', borderRadius: '12px', width: '100%', maxWidth: '340px', boxShadow: '0 8px 32px rgba(0,0,0,0.3)', boxSizing: 'border-box' }}>
        <h2 style={{ margin: '0 0 4px', fontSize: '20px', color: '#1a1a2e' }}>🥛 Admin Lechería</h2>
        <p style={{ margin: '0 0 24px', fontSize: '14px', color: '#888' }}>Escribe la contraseña para entrar</p>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Contraseña"
          autoFocus
          autoComplete="current-password"
          style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '15px', boxSizing: 'border-box' }}
        />
        {error && <div style={{ marginTop: '12px', color: '#c62828', fontSize: '13px' }}>{error}</div>}
        <button type="submit" disabled={entrando || !password}
          style={{ marginTop: '20px', width: '100%', background: '#6c63ff', color: 'white', border: 'none', padding: '11px', borderRadius: '8px', fontSize: '15px', cursor: entrando ? 'not-allowed' : 'pointer', opacity: entrando || !password ? 0.6 : 1 }}>
          {entrando ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </div>
  )
}

export default Login
