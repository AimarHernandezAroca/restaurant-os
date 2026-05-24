import { useState, useEffect } from 'react'
import { Plus, Trash2, Edit2, Check, X } from 'lucide-react'
import api from '../api/axios'
import { getUser } from '../api/axios'
import ModalConfirm from '../components/ModalConfirm'

const ROLES = [
  { value: 'admin', label: 'Administrador', desc: 'Acceso completo', icon: '🛡️' },
  { value: 'camarero', label: 'Camarero', desc: 'Mesas, pedidos y reservas', icon: '🍽️' },
  { value: 'cocina', label: 'Cocina', desc: 'Vista de cocina', icon: '👨‍🍳' }
]

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([])
  const [form, setForm] = useState({ username: '', password: '', rol: 'camarero' })
  const [editando, setEditando] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [error, setError] = useState('')
  const [exito, setExito] = useState('')
  const currentUser = getUser()
const [confirmar, setConfirmar] = useState(null)

  useEffect(() => { cargar() }, [])

  const cargar = async () => {
    const res = await api.get('/auth/usuarios')
    setUsuarios(res.data)
  }

  const crear = async () => {
    if (!form.username || !form.password) { setError('Completa todos los campos'); return }
    setError(''); setExito('')
    try {
      await api.post('/auth/registro', form)
      setForm({ username: '', password: '', rol: 'camarero' })
      setExito('Usuario creado correctamente')
      cargar()
    } catch (e) {
      setError(e.response?.data?.detail || 'Error al crear usuario')
    }
  }

  const iniciarEdicion = (u) => {
    setEditando(u.id)
    setEditForm({ username: u.username, password: '', rol: u.rol })
  }

  const guardarEdicion = async (id) => {
    if (!editForm.username) return
    try {
      await api.put(`/auth/usuarios/${id}`, {
        username: editForm.username,
        password: editForm.password || '___keep___',
        rol: editForm.rol
      })
      setEditando(null)
      setExito('Usuario actualizado')
      cargar()
    } catch (e) {
      setError(e.response?.data?.detail || 'Error al actualizar')
    }
  }

  const eliminar = (id, username) => {
  if (username === currentUser?.username) { setError('No puedes eliminar tu propia cuenta'); return }
  setConfirmar({ id, username })
}
const confirmarEliminar = async () => {
  await api.delete(`/auth/usuarios/${confirmar.id}`)
  setConfirmar(null)
  cargar()
}

  const rolConfig = {
    admin: { color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
    camarero: { color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
    cocina: { color: '#d97706', bg: '#fffbeb', border: '#fde68a' }
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.pageHeader}>
          <div>
            <h1 style={styles.pageTitle}>Usuarios</h1>
            <p style={styles.pageSubtitle}>{usuarios.length} usuarios registrados</p>
          </div>
        </div>

        <div style={styles.rolesInfo}>
          {ROLES.map(r => (
            <div key={r.value} style={styles.rolCard}>
              <span style={styles.rolIcon}>{r.icon}</span>
              <div>
                <p style={styles.rolNombre}>{r.label}</p>
                <p style={styles.rolDesc}>{r.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div style={styles.formPanel}>
          <h3 style={styles.panelTitle}>Crear usuario manualmente</h3>
          <div style={styles.formRow}>
            <div style={styles.field}>
              <label style={styles.label}>Usuario</label>
              <input style={styles.input} placeholder="Nombre de usuario" value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Contraseña</label>
              <input style={styles.input} type="password" placeholder="Contraseña" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Rol</label>
              <select style={styles.select} value={form.rol} onChange={e => setForm(f => ({ ...f, rol: e.target.value }))}>
                {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
            <div style={styles.fieldBtn}>
              <button style={styles.btnPrimary} onClick={crear}>
                <Plus size={14} /> Crear
              </button>
            </div>
          </div>
          {error && <div style={styles.error}>{error}</div>}
          {exito && <div style={styles.success}>{exito}</div>}
        </div>

        <div style={styles.tabla}>
          <div style={styles.tablaHeader}>
            <span>Usuario</span>
            <span>Rol</span>
            <span>Acciones</span>
          </div>
          {usuarios.map(u => {
            const cfg = rolConfig[u.rol] || rolConfig.camarero
            const esActual = u.username === currentUser?.username
            const estaEditando = editando === u.id

            return (
              <div key={u.id} style={{ ...styles.tablaRow, background: esActual ? 'var(--bg2)' : 'transparent' }}>
                {estaEditando ? (
                  <>
                    <input
                      style={{ ...styles.input, fontSize: '13px' }}
                      value={editForm.username}
                      onChange={e => setEditForm(f => ({ ...f, username: e.target.value }))}
                      placeholder="Usuario"
                    />
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input
                        style={{ ...styles.input, fontSize: '13px', flex: 1 }}
                        type="password"
                        value={editForm.password}
                        onChange={e => setEditForm(f => ({ ...f, password: e.target.value }))}
                        placeholder="Nueva contraseña (vacío = no cambiar)"
                      />
                      <select style={styles.select} value={editForm.rol} onChange={e => setEditForm(f => ({ ...f, rol: e.target.value }))}>
                        {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                      </select>
                    </div>
                    <div style={styles.actions}>
                      <button style={styles.btnSave} onClick={() => guardarEdicion(u.id)}><Check size={14} /></button>
                      <button style={styles.btnCancelEdit} onClick={() => setEditando(null)}><X size={14} /></button>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={styles.userCell}>
                      <div style={styles.userAvatar}>{u.username[0].toUpperCase()}</div>
                      <div>
                        <p style={styles.userName}>{u.username}</p>
                        {esActual && <p style={styles.userYou}>Sesión actual</p>}
                      </div>
                    </div>
                    <span style={{ ...styles.badge, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                      {ROLES.find(r => r.value === u.rol)?.label || u.rol}
                    </span>
                    <div style={styles.actions}>
                      <button style={styles.editBtn} onClick={() => iniciarEdicion(u)} title="Editar"><Edit2 size={14} /></button>
                      <button
                        style={{ ...styles.deleteBtn, opacity: esActual ? 0.3 : 1 }}
                        onClick={() => !esActual && eliminar(u.id, u.username)}
                        disabled={esActual}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>
      {confirmar && (
  <ModalConfirm
    titulo="Eliminar usuario"
    mensaje={`¿Estás seguro de que quieres eliminar al usuario "${confirmar.username}"? Esta acción no se puede deshacer.`}
    onConfirmar={confirmarEliminar}
    onCancelar={() => setConfirmar(null)}
    textoBtn="Eliminar usuario"
  />
)}

    </div>
  )
}

const styles = {
  page: { background: 'var(--bg2)', minHeight: 'calc(100vh - 56px)', padding: '32px 0' },
  container: { maxWidth: '900px', margin: '0 auto', padding: '0 24px' },
  pageHeader: { marginBottom: '24px' },
  pageTitle: { fontSize: '22px', fontWeight: '700', color: 'var(--text)', marginBottom: '4px' },
  pageSubtitle: { fontSize: '13px', color: 'var(--text3)' },
  rolesInfo: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' },
  rolCard: { display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '10px', padding: '16px', boxShadow: 'var(--shadow)' },
  rolIcon: { fontSize: '24px' },
  rolNombre: { fontSize: '13px', fontWeight: '600', color: 'var(--text)', marginBottom: '2px' },
  rolDesc: { fontSize: '12px', color: 'var(--text3)' },
  formPanel: { background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px', marginBottom: '24px', boxShadow: 'var(--shadow)' },
  panelTitle: { fontSize: '12px', fontWeight: '600', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '16px' },
  formRow: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '12px', alignItems: 'flex-end' },
  field: { display: 'flex', flexDirection: 'column', gap: '6px' },
  fieldBtn: { display: 'flex', alignItems: 'flex-end' },
  label: { fontSize: '12px', fontWeight: '600', color: 'var(--text2)' },
  input: { padding: '9px 12px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)', fontSize: '13px' },
  select: { padding: '9px 12px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)', fontSize: '13px' },
  btnPrimary: { display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', whiteSpace: 'nowrap' },
  error: { background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginTop: '12px' },
  success: { background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#16a34a', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginTop: '12px' },
  tabla: { background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden', boxShadow: 'var(--shadow)' },
  tablaHeader: { display: 'grid', gridTemplateColumns: '2fr 1fr 120px', padding: '10px 20px', background: 'var(--bg2)', borderBottom: '1px solid var(--border)', fontSize: '11px', fontWeight: '600', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px' },
  tablaRow: { display: 'grid', gridTemplateColumns: '2fr 1fr 120px', padding: '14px 20px', alignItems: 'center', borderBottom: '1px solid var(--border)', gap: '12px' },
  userCell: { display: 'flex', alignItems: 'center', gap: '12px' },
  userAvatar: { width: '32px', height: '32px', background: 'var(--primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '13px', fontWeight: '700', flexShrink: 0 },
  userName: { fontSize: '13px', fontWeight: '500', color: 'var(--text)' },
  userYou: { fontSize: '11px', color: 'var(--text3)' },
  badge: { display: 'inline-flex', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600' },
  actions: { display: 'flex', gap: '6px', alignItems: 'center' },
  editBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', width: '30px', height: '30px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text2)', cursor: 'pointer' },
  deleteBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', width: '30px', height: '30px', background: 'transparent', border: '1px solid var(--border)', borderRadius: '6px', color: '#dc2626', cursor: 'pointer' },
  btnSave: { display: 'flex', alignItems: 'center', justifyContent: 'center', width: '30px', height: '30px', background: '#16a34a', border: 'none', borderRadius: '6px', color: '#fff', cursor: 'pointer' },
  btnCancelEdit: { display: 'flex', alignItems: 'center', justifyContent: 'center', width: '30px', height: '30px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text2)', cursor: 'pointer' }
}