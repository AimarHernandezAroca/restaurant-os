import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [hayAdmin, setHayAdmin] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    comprobarAdmin()
  }, [])

  const comprobarAdmin = async () => {
    try {
      const res = await api.get('/auth/hay-admin')
      setHayAdmin(res.data.hay_admin)
    } catch (e) {
      setHayAdmin(true)
    }
  }

  const handleSubmit = async () => {
    if (!username || !password) { setError('Completa todos los campos'); return }
    if (!hayAdmin && password !== passwordConfirm) { setError('Las contraseñas no coinciden'); return }
    if (!hayAdmin && password.length < 4) { setError('La contraseña debe tener al menos 4 caracteres'); return }

    setLoading(true); setError('')
    try {
      if (!hayAdmin) {
        await api.post('/auth/registro-inicial', { username, password, rol: 'admin' })
        setHayAdmin(true)
        setError('')
        setPassword('')
        setPasswordConfirm('')
        return
      }

      const res = await api.post('/auth/login', { username, password })
      localStorage.setItem('token', res.data.access_token)
      localStorage.setItem('user', JSON.stringify({ username: res.data.username, rol: res.data.rol }))
      if (res.data.rol === 'cocina') navigate('/cocina')
      else navigate('/')
    } catch (e) {
      setError(e.response?.data?.detail || 'Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  if (hayAdmin === null) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <p style={{ textAlign: 'center', color: 'var(--text3)', fontSize: '13px' }}>Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.logoBox}>R</div>
          <h1 style={styles.title}>RestaurantOS</h1>
          <p style={styles.subtitle}>
            {!hayAdmin ? 'Configura tu cuenta de administrador' : 'Inicia sesión en tu cuenta'}
          </p>
        </div>

        {!hayAdmin && (
          <div style={styles.infoBanner}>
            👋 Bienvenido. Eres el primer usuario — se creará una cuenta de administrador con acceso total.
          </div>
        )}

        <div style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Usuario</label>
            <input
              style={styles.input}
              placeholder="Tu nombre de usuario"
              value={username}
              onChange={e => setUsername(e.target.value)}
              autoFocus
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Contraseña</label>
            <input
              style={styles.input}
              type="password"
              placeholder="Tu contraseña"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !(!hayAdmin) && handleSubmit()}
            />
          </div>

          {!hayAdmin && (
            <div style={styles.field}>
              <label style={styles.label}>Confirmar contraseña</label>
              <input
                style={styles.input}
                type="password"
                placeholder="Repite tu contraseña"
                value={passwordConfirm}
                onChange={e => setPasswordConfirm(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              />
            </div>
          )}

          {error && <div style={styles.error}>{error}</div>}

          {hayAdmin === false && !error && username && password && password === passwordConfirm && (
            <div style={styles.successBanner}>
              ✅ Todo listo — haz clic en el botón para crear tu cuenta
            </div>
          )}

          <button
            style={{ ...styles.btn, opacity: loading ? 0.7 : 1 }}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? 'Cargando...' : !hayAdmin ? 'Crear cuenta de administrador' : 'Iniciar sesión'}
          </button>
        </div>

        {!hayAdmin && (
          <p style={styles.nota}>
            Una vez creada tu cuenta, podrás añadir empleados y gestionar usuarios desde el panel de administración.
          </p>
        )}
      </div>
    </div>
  )
}

const styles = {
  page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg2)', padding: '24px' },
  card: { background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '16px', padding: '40px', width: '100%', maxWidth: '380px', boxShadow: 'var(--shadow-md)' },
  header: { textAlign: 'center', marginBottom: '24px' },
  logoBox: { width: '44px', height: '44px', background: '#2563eb', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '700', fontSize: '20px', margin: '0 auto 16px' },
  title: { fontSize: '20px', fontWeight: '700', color: 'var(--text)', marginBottom: '6px' },
  subtitle: { fontSize: '13px', color: 'var(--text3)' },
  infoBanner: { background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1d4ed8', padding: '12px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '20px', lineHeight: '1.5' },
  successBanner: { background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#16a34a', padding: '10px 14px', borderRadius: '8px', fontSize: '13px' },
  form: { display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '16px' },
  field: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '12px', fontWeight: '600', color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.4px' },
  input: { padding: '10px 14px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)', fontSize: '14px', outline: 'none' },
  btn: { padding: '11px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
  error: { background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '10px 14px', borderRadius: '8px', fontSize: '13px' },
  nota: { fontSize: '12px', color: 'var(--text3)', textAlign: 'center', lineHeight: '1.5', marginTop: '8px' }
}