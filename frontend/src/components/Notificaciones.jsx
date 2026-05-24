import { useState, useEffect, useRef } from 'react'
import { Bell, X, CheckCircle } from 'lucide-react'
import api from '../api/axios'
import { getRol } from '../api/axios'

export default function Notificaciones() {
  const [notificaciones, setNotificaciones] = useState([])
  const [abierto, setAbierto] = useState(false)
  const [noLeidas, setNoLeidas] = useState(0)
  const prevPedidosRef = useRef([])
  const rol = getRol()

  useEffect(() => {
    if (rol !== 'camarero' && rol !== 'admin') return
    cargar()
    const interval = setInterval(cargar, 20000)
    return () => clearInterval(interval)
  }, [])

  const cargar = async () => {
    try {
      const res = await api.get('/pedidos/listos')
const pedidosListos = res.data
      const prevIds = prevPedidosRef.current.map(p => p.id)

      const nuevos = pedidosListos.filter(p => !prevIds.includes(p.id) ||
        prevPedidosRef.current.find(prev => prev.id === p.id && prev.estado !== 'listo')
      )

      if (nuevos.length > 0) {
        const nuevasNot = nuevos.map(p => ({
          id: `${p.id}-${Date.now()}`,
          mensaje: `Mesa ${p.mesa_numero} — ${p.plato_nombre} listo`,
          hora: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
          leida: false
        }))
        setNotificaciones(prev => [...nuevasNot, ...prev].slice(0, 20))
        setNoLeidas(prev => prev + nuevasNot.length)
      }

      prevPedidosRef.current = res.data
    } catch (e) {}
  }

  const marcarLeidas = () => {
    setNotificaciones(prev => prev.map(n => ({ ...n, leida: true })))
    setNoLeidas(0)
  }

  const eliminar = (id) => {
    setNotificaciones(prev => prev.filter(n => n.id !== id))
  }

  const limpiar = () => {
    setNotificaciones([])
    setNoLeidas(0)
  }

  if (rol !== 'camarero' && rol !== 'admin') return null

  return (
    <div style={{ position: 'relative' }}>
      <button
        style={{ ...styles.bellBtn, ...(noLeidas > 0 ? styles.bellBtnActive : {}) }}
        onClick={() => { setAbierto(v => !v); if (!abierto) marcarLeidas() }}
        title="Notificaciones"
      >
        <Bell size={16} />
        {noLeidas > 0 && <span style={styles.badge}>{noLeidas}</span>}
      </button>

      {abierto && (
        <div style={styles.dropdown}>
          <div style={styles.dropHeader}>
            <span style={styles.dropTitle}>Notificaciones</span>
            {notificaciones.length > 0 && (
              <button style={styles.limpiarBtn} onClick={limpiar}>Limpiar todo</button>
            )}
          </div>

          {notificaciones.length === 0 ? (
            <div style={styles.empty}>Sin notificaciones nuevas</div>
          ) : (
            notificaciones.map(n => (
              <div key={n.id} style={{ ...styles.notif, background: n.leida ? 'transparent' : 'var(--bg2)' }}>
                <CheckCircle size={14} color="#16a34a" style={{ flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <p style={styles.notifMsg}>{n.mensaje}</p>
                  <p style={styles.notifHora}>{n.hora}</p>
                </div>
                <button style={styles.closeNotif} onClick={() => eliminar(n.id)}><X size={12} /></button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

const styles = {
  bellBtn: { position: 'relative', width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: '1px solid var(--border)', borderRadius: '7px', color: 'var(--text2)', cursor: 'pointer' },
  bellBtnActive: { borderColor: '#d97706', color: '#d97706' },
  badge: { position: 'absolute', top: '-6px', right: '-6px', background: '#dc2626', color: '#fff', borderRadius: '50%', width: '16px', height: '16px', fontSize: '10px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  dropdown: { position: 'absolute', right: 0, top: '42px', width: '300px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 200, overflow: 'hidden' },
  dropHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid var(--border)' },
  dropTitle: { fontSize: '13px', fontWeight: '600', color: 'var(--text)' },
  limpiarBtn: { background: 'transparent', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: '12px' },
  empty: { padding: '24px 16px', textAlign: 'center', color: 'var(--text3)', fontSize: '13px' },
  notif: { display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '12px 16px', borderBottom: '1px solid var(--border)' },
  notifMsg: { fontSize: '13px', color: 'var(--text)', marginBottom: '2px' },
  notifHora: { fontSize: '11px', color: 'var(--text3)' },
  closeNotif: { background: 'transparent', border: 'none', color: 'var(--text3)', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }
}