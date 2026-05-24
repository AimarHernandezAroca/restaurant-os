import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async () => {
    if (!username || !password) { setError('Completa todos los campos'); return }
    setLoading(true); setError('')
    try {
      const res = await api.post('/auth/login', { username, password })
      localStorage.setItem('token', res.data.access_token)
localStorage.setItem('user', JSON.stringify({ username: res.data.username, rol: res.data.rol }))

if (res.data.rol === 'cocina') {
  navigate('/cocina')
} else {
  navigate('/')
}
    } catch (e) {
      setError(e.response?.data?.detail || 'Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.logoBox}>R</div>
          <h1 style={styles.title}>RestaurantOS</h1>
          <p style={styles.subtitle}>Inicia sesión en tu cuenta</p>
        </div>

        <div style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Usuario</label>
            <input style={styles.input} placeholder="Tu nombre de usuario" value={username} onChange={e => setUsername(e.target.value)} autoFocus />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Contraseña</label>
            <input style={styles.input} type="password" placeholder="Tu contraseña" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
          </div>
          {error && <div style={styles.error}>{error}</div>}
          <button style={{ ...styles.btn, opacity: loading ? 0.7 : 1 }} onClick={handleSubmit} disabled={loading}>
            {loading ? 'Cargando...' : 'Iniciar sesión'}
          </button>
        </div>
      </div>
    </div>
  )
}

const styles = {
  page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg2)', padding: '24px' },
  card: { background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '16px', padding: '40px', width: '100%', maxWidth: '360px', boxShadow: 'var(--shadow-md)' },
  header: { textAlign: 'center', marginBottom: '32px' },
  logoBox: { width: '44px', height: '44px', background: '#2563eb', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '700', fontSize: '20px', margin: '0 auto 16px' },
  title: { fontSize: '20px', fontWeight: '700', color: 'var(--text)', marginBottom: '6px' },
  subtitle: { fontSize: '13px', color: 'var(--text3)' },
  form: { display: 'flex', flexDirection: 'column', gap: '16px' },
  field: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '12px', fontWeight: '600', color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.4px' },
  input: { padding: '10px 14px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)', fontSize: '14px', outline: 'none' },
  btn: { padding: '11px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
  error: { background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '10px 14px', borderRadius: '8px', fontSize: '13px' }
}