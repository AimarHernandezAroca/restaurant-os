import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { RefreshCw, Users, Plus, Eye } from 'lucide-react'
import api from '../api/axios'
import useWindowSize from '../hooks/useWindowSize'

export default function Mesas() {
  const [mesas, setMesas] = useState([])
  const [totales, setTotales] = useState({})
  const [editando, setEditando] = useState(null)
  const [nuevaCapacidad, setNuevaCapacidad] = useState(4)
  const [loading, setLoading] = useState(true)
  const [ultimaAct, setUltimaAct] = useState('')
  const navigate = useNavigate()
  const { width } = useWindowSize()

  const cols = width < 600
    ? 'repeat(2, 1fr)'
    : width < 900
      ? 'repeat(3, 1fr)'
      : 'repeat(auto-fill, minmax(210px, 1fr))'

  useEffect(() => {
    cargar()
    const interval = setInterval(cargar, 30000)
    return () => clearInterval(interval)
  }, [])

  const cargar = async () => {
    setLoading(true)
    const res = await api.get('/mesas/')
    setMesas(res.data)
    const tots = {}
    await Promise.all(res.data.map(async mesa => {
      if (mesa.estado === 'ocupada') {
        const p = await api.get(`/pedidos/mesa/${mesa.id}`)
        tots[mesa.id] = p.data.reduce((acc, x) => acc + x.plato_precio * x.cantidad, 0)
      }
    }))
    setTotales(tots)
    setUltimaAct(new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }))
    setLoading(false)
  }

  const actualizarCapacidad = async (mesa) => {
    await api.put(`/mesas/${mesa.id}`, { estado: mesa.estado, capacidad: nuevaCapacidad })
    setEditando(null)
    cargar()
  }

  const ocupadas = mesas.filter(m => m.estado === 'ocupada').length
  const libres = mesas.filter(m => m.estado === 'libre').length

  const estadoConfig = {
    libre: { color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', label: 'Libre' },
    ocupada: { color: '#dc2626', bg: '#fef2f2', border: '#fecaca', label: 'Ocupada' },
    reservada: { color: '#d97706', bg: '#fffbeb', border: '#fde68a', label: 'Reservada' }
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.pageHeader}>
          <div>
            <h1 style={styles.pageTitle}>Mesas</h1>
            <p style={styles.pageSubtitle}>
              {ocupadas} ocupadas · {libres} libres · {mesas.length} en total
              {ultimaAct && <span style={{ color: 'var(--primary)' }}> · actualizado {ultimaAct}</span>}
            </p>
          </div>
          <button style={styles.btnSecondary} onClick={cargar}>
            <RefreshCw size={14} /> Actualizar
          </button>
        </div>

        {loading ? (
          <div style={styles.loading}>Cargando mesas...</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: cols, gap: '14px' }}>
            {mesas.map(mesa => {
              const cfg = estadoConfig[mesa.estado]
              return (
                <div
                  key={mesa.id}
                  style={{ ...styles.card, borderColor: mesa.estado === 'ocupada' ? '#fecaca' : 'var(--border)' }}
                >
                  <div style={styles.cardHeader}>
                    <span style={styles.mesaTitle}>Mesa {mesa.numero}</span>
                    <span style={{ ...styles.badge, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                      {cfg.label}
                    </span>
                  </div>

                  <div style={styles.capacidadRow}>
                    <Users size={13} color="var(--text3)" />
                    {editando === mesa.id ? (
                      <div style={styles.editCapacidad}>
                        <input
                          style={styles.inputSmall}
                          type="number"
                          min="1"
                          max="20"
                          value={nuevaCapacidad}
                          onChange={e => setNuevaCapacidad(parseInt(e.target.value))}
                          autoFocus
                        />
                        <button style={styles.btnSave} onClick={() => actualizarCapacidad(mesa)}>Guardar</button>
                        <button style={styles.btnCancel} onClick={() => setEditando(null)}>✕</button>
                      </div>
                    ) : (
                      <span
                        style={styles.capacidadText}
                        onClick={() => { setEditando(mesa.id); setNuevaCapacidad(mesa.capacidad) }}
                        title="Haz clic para editar"
                      >
                        {mesa.capacidad} personas
                        <span style={styles.editHint}> · editar</span>
                      </span>
                    )}
                  </div>

                  {mesa.estado === 'ocupada' && totales[mesa.id] !== undefined && (
                    <div style={styles.totalBox}>
                      <span style={styles.totalLabel}>Total acumulado</span>
                      <span style={styles.totalValue}>{totales[mesa.id].toFixed(2)} €</span>
                    </div>
                  )}

                  <button
                    style={{ ...styles.cardBtn, ...(mesa.estado === 'libre' ? styles.cardBtnPrimary : styles.cardBtnSecondary) }}
                    onClick={() => navigate(`/pedidos/${mesa.id}`)}
                  >
                    {mesa.estado === 'libre'
                      ? <><Plus size={13} /> Nuevo pedido</>
                      : <><Eye size={13} /> Ver pedidos</>
                    }
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

const styles = {
  page: { background: 'var(--bg2)', minHeight: 'calc(100vh - 56px)', padding: '32px 0' },
  container: { maxWidth: '1200px', margin: '0 auto', padding: '0 24px' },
  pageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' },
  pageTitle: { fontSize: '22px', fontWeight: '700', color: 'var(--text)', marginBottom: '4px' },
  pageSubtitle: { fontSize: '13px', color: 'var(--text3)' },
  btnSecondary: { display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text2)', cursor: 'pointer', fontSize: '13px', fontWeight: '500' },
  loading: { color: 'var(--text3)', padding: '48px', textAlign: 'center' },
  card: { background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px', transition: 'box-shadow 0.15s', boxShadow: 'var(--shadow)' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' },
  mesaTitle: { fontSize: '15px', fontWeight: '600', color: 'var(--text)' },
  badge: { padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600' },
  capacidadRow: { display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '14px' },
  capacidadText: { color: 'var(--text2)', fontSize: '13px', cursor: 'pointer' },
  editHint: { color: 'var(--primary)', fontSize: '11px' },
  editCapacidad: { display: 'flex', alignItems: 'center', gap: '6px' },
  inputSmall: { width: '60px', padding: '4px 8px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text)', fontSize: '13px' },
  btnSave: { padding: '4px 10px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' },
  btnCancel: { padding: '4px 8px', background: 'transparent', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text2)', cursor: 'pointer', fontSize: '12px' },
  totalBox: { background: 'var(--bg2)', borderRadius: '8px', padding: '10px 14px', marginBottom: '14px' },
  totalLabel: { display: 'block', fontSize: '11px', color: 'var(--text3)', marginBottom: '2px' },
  totalValue: { fontSize: '20px', fontWeight: '700', color: 'var(--text)' },
  cardBtn: { width: '100%', padding: '9px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '500', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' },
  cardBtnPrimary: { background: 'var(--primary)', color: '#fff' },
  cardBtnSecondary: { background: 'var(--bg2)', color: 'var(--text2)', border: '1px solid var(--border)' }
}