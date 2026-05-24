import { useState, useEffect } from 'react'
import { RefreshCw } from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import api from '../api/axios'

const COLORS = ['#2563eb', '#16a34a', '#d97706', '#dc2626', '#7c3aed']

const CustomTooltip = ({ active, payload, label, prefix = '', suffix = '' }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 14px', boxShadow: 'var(--shadow-md)' }}>
        <p style={{ fontSize: '12px', color: 'var(--text3)', marginBottom: '4px' }}>{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ fontSize: '13px', fontWeight: '600', color: p.color }}>
            {prefix}{typeof p.value === 'number' ? p.value.toFixed(2) : p.value}{suffix}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [historial, setHistorial] = useState([])

  useEffect(() => { cargar() }, [])

  const cargar = async () => {
    const [d, h] = await Promise.all([
      api.get('/dashboard'),
      api.get('/pedidos/historial')
    ])
    setData(d.data)
    setHistorial(h.data)
  }

  if (!data) return <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text3)' }}>Cargando...</div>

  const hoy = new Date().toISOString().split('T')[0]
  const cobrosHoy = historial.filter(h => h.fecha.startsWith(hoy))
  const totalHoy = cobrosHoy.reduce((a, h) => a + h.total, 0)
  const totalHistorico = historial.reduce((a, h) => a + h.total, 0)

  const ventasData = data.ventas_semana.map(v => ({
    dia: v.dia.slice(5),
    total: v.total
  }))

  const horasData = data.horas_punta.map(h => ({
    hora: `${h.hora}h`,
    cobros: h.total
  }))

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.pageHeader}>
          <div>
            <h1 style={styles.pageTitle}>Dashboard</h1>
            <p style={styles.pageSubtitle}>Resumen de actividad del restaurante</p>
          </div>
          <button style={styles.btnSecondary} onClick={cargar}>
            <RefreshCw size={14} /> Actualizar
          </button>
        </div>

        <div style={styles.kpis}>
          {[
            { label: 'Ventas hoy', value: `${totalHoy.toFixed(2)} €`, sub: `${cobrosHoy.length} cobros` },
            { label: 'Mesas ocupadas', value: data.mesas_ocupadas, sub: 'en este momento' },
            { label: 'Reservas hoy', value: data.reservas_hoy, sub: 'confirmadas' },
            { label: 'Total histórico', value: `${totalHistorico.toFixed(2)} €`, sub: `${historial.length} cobros` },
          ].map((kpi, i) => (
            <div key={i} style={styles.kpi}>
              <p style={styles.kpiLabel}>{kpi.label}</p>
              <p style={styles.kpiValue}>{kpi.value}</p>
              <p style={styles.kpiSub}>{kpi.sub}</p>
            </div>
          ))}
        </div>

        <div style={styles.grid2}>
          <div style={styles.panel}>
            <h3 style={styles.panelTitle}>Ventas últimos 7 días</h3>
            {ventasData.length === 0 ? (
              <p style={styles.empty}>Sin datos todavía</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={ventasData}>
                  <defs>
                    <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="dia" tick={{ fontSize: 11, fill: 'var(--text3)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--text3)' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip suffix=" €" />} />
                  <Area type="monotone" dataKey="total" stroke="#2563eb" strokeWidth={2} fill="url(#colorVentas)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          <div style={styles.panel}>
            <h3 style={styles.panelTitle}>Horas punta</h3>
            {horasData.length === 0 ? (
              <p style={styles.empty}>Sin datos todavía</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={horasData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="hora" tick={{ fontSize: 11, fill: 'var(--text3)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--text3)' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip suffix=" cobros" />} />
                  <Bar dataKey="cobros" fill="#2563eb" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div style={styles.grid2}>
          <div style={styles.panel}>
            <h3 style={styles.panelTitle}>Ventas por categoría</h3>
            {data.ventas_categoria.length === 0 ? (
              <p style={styles.empty}>Sin datos todavía</p>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                <ResponsiveContainer width="50%" height={200}>
                  <PieChart>
                    <Pie data={data.ventas_categoria} dataKey="total" nameKey="categoria" cx="50%" cy="50%" outerRadius={80} strokeWidth={2}>
                      {data.ventas_categoria.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => `${v.toFixed(2)} €`} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ flex: 1 }}>
                  {data.ventas_categoria.map((v, i) => (
                    <div key={i} style={styles.legendRow}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: COLORS[i % COLORS.length] }} />
                        <span style={{ fontSize: '13px', color: 'var(--text)' }}>{v.categoria}</span>
                      </div>
                      <span style={{ fontSize: '13px', color: 'var(--text2)', fontWeight: '500' }}>{v.total.toFixed(2)} €</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div style={styles.panel}>
            <h3 style={styles.panelTitle}>Platos más pedidos</h3>
            {data.top_platos.length === 0 ? (
              <p style={styles.empty}>Sin datos todavía</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={data.top_platos} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--text3)' }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="nombre" tick={{ fontSize: 11, fill: 'var(--text3)' }} axisLine={false} tickLine={false} width={80} />
                  <Tooltip content={<CustomTooltip suffix=" pedidos" />} />
                  <Bar dataKey="total" fill="#16a34a" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div style={styles.panel}>
          <h3 style={styles.panelTitle}>Últimos cobros</h3>
          {historial.length === 0 ? (
            <p style={styles.empty}>Sin cobros registrados</p>
          ) : (
            <div style={styles.tabla}>
              <div style={styles.tablaHeader}>
                <span>Mesa</span>
                <span>Fecha</span>
                <span>Hora</span>
                <span style={{ textAlign: 'right' }}>Total</span>
              </div>
              {historial.slice(0, 10).map((h, i) => {
                const fecha = new Date(h.fecha)
                return (
                  <div key={i} style={styles.tablaRow}>
                    <span style={styles.rowText}>Mesa {h.mesa_numero}</span>
                    <span style={{ ...styles.rowText, color: 'var(--text3)' }}>{fecha.toLocaleDateString('es-ES')}</span>
                    <span style={{ ...styles.rowText, color: 'var(--text3)' }}>{fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
                    <span style={{ ...styles.rowText, textAlign: 'right', fontWeight: '600', color: '#16a34a' }}>{h.total.toFixed(2)} €</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
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
  btnSecondary: { display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text2)', cursor: 'pointer', fontSize: '13px' },
  kpis: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '20px' },
  kpi: { background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px', boxShadow: 'var(--shadow)' },
  kpiLabel: { fontSize: '11px', fontWeight: '600', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' },
  kpiValue: { fontSize: '26px', fontWeight: '700', color: 'var(--text)', marginBottom: '4px' },
  kpiSub: { fontSize: '12px', color: 'var(--text3)' },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' },
  panel: { background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px', boxShadow: 'var(--shadow)', marginBottom: '16px' },
  panelTitle: { fontSize: '12px', fontWeight: '600', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '16px' },
  empty: { color: 'var(--text3)', fontSize: '13px', padding: '16px 0' },
  legendRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)' },
  tabla: { borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border)' },
  tablaHeader: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', padding: '8px 16px', background: 'var(--bg2)', fontSize: '11px', fontWeight: '600', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid var(--border)' },
  tablaRow: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', padding: '11px 16px', alignItems: 'center', borderBottom: '1px solid var(--border)' },
  rowText: { color: 'var(--text)', fontSize: '13px' }
}