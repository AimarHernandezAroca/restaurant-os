import { useState, useEffect } from 'react'
import { Plus, Trash2, XCircle } from 'lucide-react'
import api from '../api/axios'
import ModalConfirm from '../components/ModalConfirm'

export default function Reservas() {
  const [reservas, setReservas] = useState([])
  const [mesas, setMesas] = useState([])
  const [form, setForm] = useState({ mesa_id: '', nombre_cliente: '', telefono: '', fecha: '', hora: '', personas: 2, notas: '' })
  const [mostrarForm, setMostrarForm] = useState(false)
  const [error, setError] = useState('')
const [confirmar, setConfirmar] = useState(null)

  useEffect(() => { cargarReservas() }, [])
useEffect(() => {
  if (form.fecha && form.hora) cargarMesas(form.fecha, form.hora)
  else if (form.fecha) cargarMesas(form.fecha, null)
}, [form.fecha, form.hora])

const cargarReservas = async () => {
  const res = await api.get('/reservas/')
  setReservas(res.data)
}

const cargarMesas = async (fecha, hora) => {
  const params = hora ? `?fecha=${fecha}&hora=${hora}` : `?fecha=${fecha}`
  const res = await api.get(`/reservas/mesas-disponibles${params}`)
  setMesas(res.data)
  if (res.data.length > 0) setForm(f => ({ ...f, mesa_id: res.data[0].id }))
  else setForm(f => ({ ...f, mesa_id: '' }))
}

  const validarConflicto = () => {
  if (!form.fecha || !form.hora || !form.mesa_id) return null

  const [hNueva, mNueva] = form.hora.split(':').map(Number)
  const minutosNueva = hNueva * 60 + mNueva

  const conflicto = reservas.find(r => {
    if (r.mesa_id !== parseInt(form.mesa_id)) return false
    if (r.fecha !== form.fecha) return false
    if (r.estado !== 'confirmada') return false

    const [hExist, mExist] = r.hora.split(':').map(Number)
    const minutosExist = hExist * 60 + mExist
    const diff = Math.abs(minutosNueva - minutosExist)

    return diff < 120
  })

  return conflicto || null
}

  const crear = async () => {
  setError('')
  if (!form.nombre_cliente || !form.fecha || !form.hora || !form.mesa_id) {
    setError('Completa todos los campos obligatorios')
    return
  }
  try {
    await api.post('/reservas/', {
      ...form,
      mesa_id: parseInt(form.mesa_id),
      personas: parseInt(form.personas)
    })
    setMostrarForm(false)
    setForm(f => ({ ...f, nombre_cliente: '', telefono: '', fecha: '', hora: '', personas: 2, notas: '' }))
    cargarReservas()
  } catch (e) {
    setError(e.response?.data?.detail || 'Error al crear la reserva')
  }

  const conflicto = validarConflicto()
if (conflicto) {
  setError(`Mesa no disponible. Ya hay una reserva a las ${conflicto.hora} el ${form.fecha}. Debe haber al menos 2 horas entre reservas.`)
  return
}

    try {
      await api.post('/reservas/', { ...form, mesa_id: parseInt(form.mesa_id), personas: parseInt(form.personas) })
      setMostrarForm(false)
      setForm(f => ({ ...f, nombre_cliente: '', telefono: '', fecha: '', hora: '', personas: 2, notas: '' }))
cargarReservas()    } catch (e) {
      setError(e.response?.data?.detail || 'Error al crear la reserva')
    }
  }

  const cancelar = (id) => setConfirmar({ id, tipo: 'cancelar' })
const eliminar = (id) => setConfirmar({ id, tipo: 'eliminar' })

const confirmarAccion = async () => {
  if (confirmar.tipo === 'cancelar') {
    await api.put(`/reservas/${confirmar.id}`, { estado: 'cancelada' })
  } else {
    await api.delete(`/reservas/${confirmar.id}`)
  }
  setConfirmar(null)
  cargarReservas()
}

  const estadoConfig = {
    confirmada: { color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
    cancelada: { color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
    completada: { color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' }
  }

  const hoy = new Date().toISOString().split('T')[0]
  const proximas = reservas.filter(r => r.fecha >= hoy && r.estado === 'confirmada')
  const pasadas = reservas.filter(r => r.fecha < hoy || r.estado !== 'confirmada')

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.pageHeader}>
          <div>
            <h1 style={styles.pageTitle}>Reservas</h1>
            <p style={styles.pageSubtitle}>{proximas.length} reservas próximas</p>
          </div>
          <button style={styles.btnPrimary} onClick={() => { setMostrarForm(!mostrarForm); setError('') }}>
            <Plus size={14} /> Nueva reserva
          </button>
        </div>

        {mostrarForm && (
          <div style={styles.formPanel}>
            <h3 style={styles.panelTitle}>Nueva reserva</h3>
            <div style={styles.formGrid}>
              <div style={styles.field}>
                <label style={styles.label}>Cliente *</label>
                <input style={styles.input} placeholder="Nombre del cliente" value={form.nombre_cliente} onChange={e => setForm(f => ({ ...f, nombre_cliente: e.target.value }))} />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Teléfono</label>
                <input style={styles.input} placeholder="600 000 000" value={form.telefono} onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))} />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Mesa disponible *</label>
                {mesas.length === 0 ? (
                  <div style={styles.noMesas}>No hay mesas libres disponibles</div>
                ) : (
                  <select style={styles.select} value={form.mesa_id} onChange={e => setForm(f => ({ ...f, mesa_id: e.target.value }))}>
                    {mesas.map(m => <option key={m.id} value={m.id}>Mesa {m.numero} ({m.capacidad} personas)</option>)}
                  </select>
                )}
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Personas *</label>
                <input style={styles.input} type="number" min="1" value={form.personas} onChange={e => setForm(f => ({ ...f, personas: e.target.value }))} />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Fecha *</label>
                <input style={styles.input} type="date" min={hoy} value={form.fecha} onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))} />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Hora *</label>
                <input style={styles.input} type="time" value={form.hora} onChange={e => setForm(f => ({ ...f, hora: e.target.value }))} />
              </div>
              <div style={{ ...styles.field, gridColumn: '1 / -1' }}>
                <label style={styles.label}>Notas</label>
                <input style={styles.input} placeholder="Alergias, ocasión especial, preferencias..." value={form.notas} onChange={e => setForm(f => ({ ...f, notas: e.target.value }))} />
              </div>
            </div>

            {error && <div style={styles.errorBox}>{error}</div>}

            {form.fecha && form.hora && form.mesa_id && (
              <div style={styles.infoBox}>
                Reservas existentes para Mesa {mesas.find(m => m.id === parseInt(form.mesa_id))?.numero} el {form.fecha}:
                {reservas.filter(r => r.mesa_id === parseInt(form.mesa_id) && r.fecha === form.fecha && r.estado === 'confirmada').length === 0
                  ? ' ninguna'
                  : reservas.filter(r => r.mesa_id === parseInt(form.mesa_id) && r.fecha === form.fecha && r.estado === 'confirmada').map(r => ` ${r.hora}`).join(', ')
                }
              </div>
            )}

            <div style={styles.formActions}>
              <button style={styles.btnSecondary} onClick={() => { setMostrarForm(false); setError('') }}>Cancelar</button>
              <button style={styles.btnPrimary} onClick={crear} disabled={mesas.length === 0}>Confirmar reserva</button>
            </div>
          </div>
        )}

        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Próximas reservas</h3>
          {proximas.length === 0 ? (
            <div style={styles.empty}>No hay reservas próximas</div>
          ) : (
            <div style={styles.tabla}>
              <div style={styles.tablaHeader}>
                <span>Cliente</span>
                <span>Mesa</span>
                <span>Fecha y hora</span>
                <span>Personas</span>
                <span>Estado</span>
                <span></span>
              </div>
              {proximas.map(r => {
                const cfg = estadoConfig[r.estado] || estadoConfig.confirmada
                return (
                  <div key={r.id} style={styles.tablaRow}>
                    <div>
                      <p style={styles.clienteNombre}>{r.nombre_cliente}</p>
                      {r.telefono && <p style={styles.clienteTel}>{r.telefono}</p>}
                      {r.notas && <p style={styles.clienteNotas}>{r.notas}</p>}
                    </div>
                    <span style={styles.rowText}>Mesa {r.mesa_numero}</span>
                    <span style={styles.rowText}>{r.fecha} · {r.hora}</span>
                    <span style={styles.rowText}>{r.personas} personas</span>
                    <span style={{ ...styles.badge, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>{r.estado}</span>
                    <div style={styles.actions}>
                      <button style={styles.actionBtn} onClick={() => cancelar(r.id)} title="Cancelar"><XCircle size={15} color="#dc2626" /></button>
                      <button style={styles.actionBtn} onClick={() => eliminar(r.id)} title="Eliminar"><Trash2 size={15} color="var(--text3)" /></button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {pasadas.length > 0 && (
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Historial</h3>
            <div style={styles.tabla}>
              <div style={styles.tablaHeader}>
                <span>Cliente</span>
                <span>Mesa</span>
                <span>Fecha y hora</span>
                <span>Personas</span>
                <span>Estado</span>
                <span></span>
              </div>
              {pasadas.map(r => {
                const cfg = estadoConfig[r.estado] || estadoConfig.confirmada
                return (
                  <div key={r.id} style={{ ...styles.tablaRow, opacity: 0.6 }}>
                    <span style={styles.clienteNombre}>{r.nombre_cliente}</span>
                    <span style={styles.rowText}>Mesa {r.mesa_numero}</span>
                    <span style={styles.rowText}>{r.fecha} · {r.hora}</span>
                    <span style={styles.rowText}>{r.personas} personas</span>
                    <span style={{ ...styles.badge, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>{r.estado}</span>
                    <button style={styles.actionBtn} onClick={() => eliminar(r.id)}><Trash2 size={15} color="var(--text3)" /></button>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
      {confirmar && (
  <ModalConfirm
    titulo={confirmar.tipo === 'cancelar' ? 'Cancelar reserva' : 'Eliminar reserva'}
    mensaje={confirmar.tipo === 'cancelar' ? '¿Estás seguro de que quieres cancelar esta reserva?' : '¿Estás seguro de que quieres eliminar esta reserva?'}
    onConfirmar={confirmarAccion}
    onCancelar={() => setConfirmar(null)}
    colorBtn={confirmar.tipo === 'cancelar' ? '#d97706' : '#dc2626'}
    textoBtn={confirmar.tipo === 'cancelar' ? 'Cancelar reserva' : 'Eliminar reserva'}
  />
)}

    </div>
  )
}

const styles = {
  page: { background: 'var(--bg2)', minHeight: 'calc(100vh - 56px)', padding: '32px 0' },
  container: { maxWidth: '1100px', margin: '0 auto', padding: '0 24px' },
  pageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' },
  pageTitle: { fontSize: '22px', fontWeight: '700', color: 'var(--text)', marginBottom: '4px' },
  pageSubtitle: { fontSize: '13px', color: 'var(--text3)' },
  btnPrimary: { display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' },
  btnSecondary: { display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text2)', cursor: 'pointer', fontSize: '13px' },
  formPanel: { background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px', marginBottom: '28px', boxShadow: 'var(--shadow)' },
  panelTitle: { fontSize: '12px', fontWeight: '600', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '20px' },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' },
  field: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '12px', fontWeight: '600', color: 'var(--text2)' },
  input: { padding: '9px 12px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)', fontSize: '13px' },
  select: { padding: '9px 12px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)', fontSize: '13px' },
  noMesas: { padding: '9px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#dc2626', fontSize: '13px' },
  errorBox: { background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px' },
  infoBox: { background: 'var(--bg2)', border: '1px solid var(--border)', color: 'var(--text3)', padding: '10px 14px', borderRadius: '8px', fontSize: '12px', marginBottom: '16px' },
  formActions: { display: 'flex', justifyContent: 'flex-end', gap: '10px' },
  section: { marginBottom: '32px' },
  sectionTitle: { fontSize: '14px', fontWeight: '600', color: 'var(--text)', marginBottom: '12px' },
  tabla: { background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden', boxShadow: 'var(--shadow)' },
  tablaHeader: { display: 'grid', gridTemplateColumns: '2fr 1fr 1.5fr 1fr 1fr 80px', padding: '10px 20px', background: 'var(--bg2)', borderBottom: '1px solid var(--border)', fontSize: '11px', fontWeight: '600', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px' },
  tablaRow: { display: 'grid', gridTemplateColumns: '2fr 1fr 1.5fr 1fr 1fr 80px', padding: '14px 20px', alignItems: 'center', borderBottom: '1px solid var(--border)' },
  clienteNombre: { fontSize: '13px', fontWeight: '500', color: 'var(--text)' },
  clienteTel: { fontSize: '12px', color: 'var(--text3)', marginTop: '2px' },
  clienteNotas: { fontSize: '11px', color: 'var(--text3)', marginTop: '2px', fontStyle: 'italic' },
  rowText: { fontSize: '13px', color: 'var(--text2)' },
  badge: { display: 'inline-flex', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600' },
  actions: { display: 'flex', gap: '8px', justifyContent: 'flex-end' },
  actionBtn: { background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', borderRadius: '6px', display: 'flex', alignItems: 'center' },
  empty: { background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '12px', padding: '48px', textAlign: 'center', color: 'var(--text3)', fontSize: '13px' }
}