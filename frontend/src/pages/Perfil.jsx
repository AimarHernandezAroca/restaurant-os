import { useState } from 'react'
import { getUser } from '../api/axios'
import api from '../api/axios'
import { User, Lock, Check } from 'lucide-react'

export default function Perfil() {
  const user = getUser()
  const [passwordActual, setPasswordActual] = useState('')
  const [passwordNueva, setPasswordNueva] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [error, setError] = useState('')
  const [exito, setExito] = useState('')
  const [loading, setLoading] = useState(false)

  const cambiarPassword = async () => {
    setError(''); setExito('')
    if (!passwordActual || !passwordNueva) { setError('Completa todos los campos'); return }
    if (passwordNueva !== passwordConfirm) { setError('Las contraseñas no coinciden'); return }
    if (passwordNueva.length < 4) { setError('La contraseña debe tener al menos 4 caracteres'); return }

    setLoading(true)
    try {
      await api.post('/auth/cambiar-password', {
        password_actual: passwordActual,
        password_nueva: passwordNueva
      })
      setExito('Contraseña cambiada correctamente')
      setPasswordActual(''); setPasswordNueva(''); setPasswordConfirm('')
    } catch (e) {
      setError(e.response?.data?.detail || 'Error al cambiar la contraseña')
    } finally {
      setLoading(false)
    }
  }

  const rolColors = { admin: '#2563eb', camarero: '#16a34a', cocina: '#d97706' }
  const rolColor = rolColors[user?.rol] || '#64748b'

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <h1 style={styles.pageTitle}>Mi perfil</h1>

        <div style={styles.grid}>
          <div style={styles.panel}>
            <h3 style={styles.panelTitle}>Información de cuenta</h3>
            <div style={styles.userCard}>
              <div style={styles.avatar}>{user?.username?.[0]?.toUpperCase()}</div>
              <div>
                <p style={styles.userName}>{user?.username}</p>
                <span style={{ ...styles.rolBadge, background: rolColor + '18', color: rolColor }}>
                  {user?.rol}
                </span>
              </div>
            </div>
            <div style={styles.infoRow}>
              <User size={14} color="var(--text3)" />
              <span style={styles.infoLabel}>Usuario</span>
              <span style={styles.infoValue}>{user?.username}</span>
            </div>
            <div style={styles.infoRow}>
              <Lock size={14} color="var(--text3)" />
              <span style={styles.infoLabel}>Contraseña</span>
              <span style={styles.infoValue}>••••••••</span>
            </div>
          </div>

          <div style={styles.panel}>
            <h3 style={styles.panelTitle}>Cambiar contraseña</h3>
            <div style={styles.field}>
              <label style={styles.label}>Contraseña actual</label>
              <input style={styles.input} type="password" placeholder="Tu contraseña actual" value={passwordActual} onChange={e => setPasswordActual(e.target.value)} />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Nueva contraseña</label>
              <input style={styles.input} type="password" placeholder="Nueva contraseña" value={passwordNueva} onChange={e => setPasswordNueva(e.target.value)} />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Confirmar nueva contraseña</label>
              <input style={styles.input} type="password" placeholder="Repite la nueva contraseña" value={passwordConfirm} onChange={e => setPasswordConfirm(e.target.value)} />
            </div>
            {error && <div style={styles.error}>{error}</div>}
            {exito && <div style={styles.success}><Check size={13} /> {exito}</div>}
            <button style={{ ...styles.btnPrimary, opacity: loading ? 0.7 : 1 }} onClick={cambiarPassword} disabled={loading}>
              {loading ? 'Guardando...' : 'Cambiar contraseña'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const styles = {
  page: { background: 'var(--bg2)', minHeight: 'calc(100vh - 56px)', padding: '32px 0' },
  container: { maxWidth: '800px', margin: '0 auto', padding: '0 24px' },
  pageTitle: { fontSize: '22px', fontWeight: '700', color: 'var(--text)', marginBottom: '24px' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' },
  panel: { background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px', boxShadow: 'var(--shadow)' },
  panelTitle: { fontSize: '12px', fontWeight: '600', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '20px' },
  userCard: { display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', padding: '16px', background: 'var(--bg2)', borderRadius: '10px' },
  avatar: { width: '48px', height: '48px', background: 'var(--primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '18px', fontWeight: '700' },
  userName: { fontSize: '15px', fontWeight: '600', color: 'var(--text)', marginBottom: '6px' },
  rolBadge: { padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600' },
  infoRow: { display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 0', borderBottom: '1px solid var(--border)' },
  infoLabel: { fontSize: '13px', color: 'var(--text3)', flex: 1 },
  infoValue: { fontSize: '13px', color: 'var(--text)', fontWeight: '500' },
  field: { marginBottom: '14px' },
  label: { display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text2)', marginBottom: '6px' },
  input: { width: '100%', padding: '9px 12px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)', fontSize: '13px' },
  btnPrimary: { width: '100%', padding: '10px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', marginTop: '4px' },
  error: { background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '12px' },
  success: { display: 'flex', alignItems: 'center', gap: '6px', background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#16a34a', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '12px' }
}