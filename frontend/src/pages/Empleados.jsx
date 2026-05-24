import { useState, useEffect } from 'react'
import { Plus, Trash2, User, Copy, Eye, EyeOff } from 'lucide-react'
import api from '../api/axios'
import ModalConfirm from '../components/ModalConfirm'

const ROLES = ['Camarero', 'Cocinero']

export default function Empleados() {
  const [empleados, setEmpleados] = useState([])
  const [form, setForm] = useState({ nombre: '', rol: 'Camarero', telefono: '', email: '' })
  const [credenciales, setCredenciales] = useState(null)
  const [mostrarPassword, setMostrarPassword] = useState(false)
  const [confirmar, setConfirmar] = useState(null)

  useEffect(() => { cargar() }, [])

  const cargar = async () => {
    const res = await api.get('/empleados/')
    setEmpleados(res.data)
  }

  const crearEmpleado = async () => {
    if (!form.nombre) return
    const res = await api.post('/empleados/', form)
    setCredenciales(res.data)
    setForm({ nombre: '', rol: 'Camarero', telefono: '', email: '' })
    cargar()
  }

  const confirmarEliminar = async () => {
    await api.delete(`/empleados/${confirmar.id}`)
    setConfirmar(null)
    cargar()
  }

  const copiar = (texto) => navigator.clipboard.writeText(texto)

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.pageHeader}>
          <div>
            <h1 style={styles.pageTitle}>Empleados</h1>
            <p style={styles.pageSubtitle}>{empleados.length} empleados registrados</p>
          </div>
        </div>

        {credenciales && (
          <div style={styles.credencialesBox}>
            <div style={styles.credencialesHeader}>
              <span style={styles.credencialesTitle}>✅ Empleado creado — Credenciales de acceso</span>
              <button style={styles.closeBtn} onClick={() => setCredenciales(null)}>✕</button>
            </div>
            <p style={styles.credencialesDesc}>Comparte estas credenciales con el empleado. La contraseña puede cambiarse desde Usuarios.</p>
            <div style={styles.credencialesRow}>
              <div style={styles.credencialItem}>
                <span style={styles.credencialLabel}>Usuario</span>
                <div style={styles.credencialValue}>
                  <span>{credenciales.username}</span>
                  <button style={styles.copyBtn} onClick={() => copiar(credenciales.username)}><Copy size={13} /></button>
                </div>
              </div>
              <div style={styles.credencialItem}>
                <span style={styles.credencialLabel}>Contraseña temporal</span>
                <div style={styles.credencialValue}>
                  <span>{mostrarPassword ? credenciales.password : '••••••••••'}</span>
                  <button style={styles.copyBtn} onClick={() => setMostrarPassword(v => !v)}>
                    {mostrarPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                  <button style={styles.copyBtn} onClick={() => copiar(credenciales.password)}><Copy size={13} /></button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div style={styles.formPanel}>
          <h3 style={styles.panelTitle}>Añadir empleado</h3>
          <p style={styles.panelDesc}>Al añadir un empleado se creará automáticamente su usuario de acceso al sistema.</p>
          <div style={styles.formGrid}>
            <div style={styles.field}>
              <label style={styles.label}>Nombre completo *</label>
              <input style={styles.input} placeholder="Nombre completo" value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Rol *</label>
              <select style={styles.select} value={form.rol} onChange={e => setForm(f => ({ ...f, rol: e.target.value }))}>
                {ROLES.map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Teléfono</label>
              <input style={styles.input} placeholder="600 000 000" value={form.telefono} onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))} />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Email</label>
              <input style={styles.input} placeholder="email@restaurante.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
          </div>
          <button style={styles.btnPrimary} onClick={crearEmpleado}>
            <Plus size={14} /> Añadir empleado y crear acceso
          </button>
        </div>

        {empleados.length === 0 ? (
          <div style={styles.empty}>No hay empleados registrados</div>
        ) : (
          <div style={styles.grid}>
            {empleados.map(e => (
              <div key={e.id} style={styles.card}>
                <div style={styles.cardTop}>
                  <div style={styles.avatar}><User size={20} color="var(--primary)" /></div>
                  <button style={styles.deleteBtn} onClick={() => setConfirmar({ id: e.id, nombre: e.nombre })}>
                    <Trash2 size={14} color="var(--text3)" />
                  </button>
                </div>
                <p style={styles.empNombre}>{e.nombre}</p>
                <span style={styles.rolBadge}>{e.rol}</span>
                {e.telefono && <p style={styles.empContact}>{e.telefono}</p>}
                {e.email && <p style={styles.empContact}>{e.email}</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      {confirmar && (
        <ModalConfirm
          titulo="Eliminar empleado"
          mensaje={`¿Estás seguro de que quieres eliminar a ${confirmar.nombre}? También se eliminará su acceso al sistema.`}
          onConfirmar={confirmarEliminar}
          onCancelar={() => setConfirmar(null)}
          textoBtn="Eliminar empleado"
        />
      )}
    </div>
  )
}

const styles = {
  page: { background: 'var(--bg2)', minHeight: 'calc(100vh - 56px)', padding: '32px 0' },
  container: { maxWidth: '1100px', margin: '0 auto', padding: '0 24px' },
  pageHeader: { marginBottom: '24px' },
  pageTitle: { fontSize: '22px', fontWeight: '700', color: 'var(--text)', marginBottom: '4px' },
  pageSubtitle: { fontSize: '13px', color: 'var(--text3)' },
  credencialesBox: { background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '20px', marginBottom: '24px' },
  credencialesHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' },
  credencialesTitle: { fontSize: '14px', fontWeight: '600', color: '#16a34a' },
  closeBtn: { background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: '16px' },
  credencialesDesc: { fontSize: '12px', color: '#64748b', marginBottom: '16px' },
  credencialesRow: { display: 'flex', gap: '24px', flexWrap: 'wrap' },
  credencialItem: { display: 'flex', flexDirection: 'column', gap: '4px' },
  credencialLabel: { fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' },
  credencialValue: { display: 'flex', alignItems: 'center', gap: '8px', background: '#fff', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '8px 12px', fontSize: '14px', fontWeight: '500', color: '#0f172a', fontFamily: 'monospace' },
  copyBtn: { background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center' },
  formPanel: { background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px', marginBottom: '24px', boxShadow: 'var(--shadow)' },
  panelTitle: { fontSize: '12px', fontWeight: '600', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' },
  panelDesc: { fontSize: '12px', color: 'var(--text3)', marginBottom: '16px' },
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '14px', marginBottom: '16px' },
  field: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '12px', fontWeight: '600', color: 'var(--text2)' },
  input: { padding: '9px 12px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)', fontSize: '13px' },
  select: { padding: '9px 12px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)', fontSize: '13px' },
  btnPrimary: { display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '14px' },
  card: { background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px', boxShadow: 'var(--shadow)' },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' },
  avatar: { width: '40px', height: '40px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  deleteBtn: { background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px' },
  empNombre: { fontSize: '14px', fontWeight: '600', color: 'var(--text)', marginBottom: '6px' },
  rolBadge: { display: 'inline-block', padding: '3px 10px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '20px', fontSize: '11px', color: 'var(--text2)', fontWeight: '500', marginBottom: '10px' },
  empContact: { fontSize: '12px', color: 'var(--text3)', marginTop: '4px' },
  empty: { background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '12px', padding: '48px', textAlign: 'center', color: 'var(--text3)', fontSize: '13px' }
}