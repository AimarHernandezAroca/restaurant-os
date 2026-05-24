import { useState, useEffect } from 'react'
import api from '../api/axios'

const estadoConfig = {
  pendiente: { color: '#d97706', bg: '#fffbeb', border: '#fde68a', label: 'Pendiente' },
  preparando: { color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', label: 'Preparando' },
  listo: { color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', label: 'Listo' }
}

export default function Cocina() {
  const [pedidos, setPedidos] = useState([])
  const [ultimaActualizacion, setUltimaActualizacion] = useState(new Date())

  useEffect(() => {
    cargar()
    const interval = setInterval(cargar, 15000)
    return () => clearInterval(interval)
  }, [])

  const cargar = async () => {
    const res = await api.get('/pedidos/todos')
    const activos = res.data.filter(p => p.estado !== 'cobrado' && p.estado !== 'listo')
    setPedidos(activos)
    setUltimaActualizacion(new Date())
  }

  const avanzar = async (pedido) => {
    const next = pedido.estado === 'pendiente' ? 'preparando' : 'listo'
    await api.put(`/pedidos/${pedido.id}`, { estado: next })
    cargar()
  }

  const porMesa = pedidos.reduce((acc, p) => {
    const key = p.mesa_numero
    if (!acc[key]) acc[key] = []
    acc[key].push(p)
    return acc
  }, {})

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.pageHeader}>
          <div>
            <h1 style={styles.pageTitle}>Vista Cocina</h1>
            <p style={styles.pageSubtitle}>
              {pedidos.length} platos pendientes · Actualizado a las {ultimaActualizacion.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <button style={styles.btnSecondary} onClick={cargar}>Actualizar ahora</button>
        </div>

        {Object.keys(porMesa).length === 0 ? (
          <div style={styles.empty}>
            <p style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text)', marginBottom: '8px' }}>Todo al día</p>
            <p style={{ fontSize: '13px', color: 'var(--text3)' }}>No hay pedidos pendientes en este momento</p>
          </div>
        ) : (
          <div style={styles.grid}>
            {Object.entries(porMesa).sort((a, b) => a[0] - b[0]).map(([mesa, items]) => (
              <div key={mesa} style={styles.mesaCard}>
                <div style={styles.mesaHeader}>
                  <span style={styles.mesaTitle}>Mesa {mesa}</span>
                  <span style={styles.mesaCount}>{items.length} platos</span>
                </div>
                <div style={styles.itemsList}>
                  {items.map(p => {
                    const cfg = estadoConfig[p.estado]
                    return (
                      <div key={p.id} style={styles.item}>
                        <div style={styles.itemInfo}>
                          <span style={styles.itemNombre}>{p.cantidad}× {p.plato_nombre}</span>
                          {p.notas && <span style={styles.itemNotas}>{p.notas}</span>}
                        </div>
                        <button
                          style={{ ...styles.estadoBtn, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}
                          onClick={() => avanzar(p)}
                        >
                          {cfg.label} →
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const styles = {
  page: { background: 'var(--bg2)', minHeight: 'calc(100vh - 56px)', padding: '32px 0' },
  container: { maxWidth: '1200px', margin: '0 auto', padding: '0 24px' },
  pageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' },
  pageTitle: { fontSize: '22px', fontWeight: '700', color: 'var(--text)', marginBottom: '4px' },
  pageSubtitle: { fontSize: '13px', color: 'var(--text3)' },
  btnSecondary: { padding: '8px 16px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text2)', cursor: 'pointer', fontSize: '13px' },
  empty: { background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '12px', padding: '80px', textAlign: 'center', boxShadow: 'var(--shadow)' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' },
  mesaCard: { background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden', boxShadow: 'var(--shadow)' },
  mesaHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', background: 'var(--bg2)', borderBottom: '1px solid var(--border)' },
  mesaTitle: { fontSize: '14px', fontWeight: '700', color: 'var(--text)' },
  mesaCount: { fontSize: '12px', color: 'var(--text3)', background: 'var(--bg3)', padding: '2px 8px', borderRadius: '20px' },
  itemsList: { padding: '8px 0' },
  item: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 18px', borderBottom: '1px solid var(--border)' },
  itemInfo: { display: 'flex', flexDirection: 'column', gap: '2px' },
  itemNombre: { fontSize: '13px', fontWeight: '500', color: 'var(--text)' },
  itemNotas: { fontSize: '11px', color: 'var(--text3)', fontStyle: 'italic' },
  estadoBtn: { padding: '5px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: '600', whiteSpace: 'nowrap' }
}