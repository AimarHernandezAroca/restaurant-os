import { useState, useEffect, useRef } from 'react'
import { Search, X, Users, Calendar, UtensilsCrossed } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'

export default function BuscadorGlobal() {
  const [abierto, setAbierto] = useState(false)
  const [query, setQuery] = useState('')
  const [resultados, setResultados] = useState({ reservas: [], platos: [], mesas: [] })
  const [loading, setLoading] = useState(false)
  const inputRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'k' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        setAbierto(v => !v)
      }
      if (e.key === 'Escape') setAbierto(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  useEffect(() => {
    if (abierto && inputRef.current) inputRef.current.focus()
    if (!abierto) { setQuery(''); setResultados({ reservas: [], platos: [], mesas: [] }) }
  }, [abierto])

  useEffect(() => {
    if (query.length < 2) { setResultados({ reservas: [], platos: [], mesas: [] }); return }
    const timer = setTimeout(() => buscar(), 300)
    return () => clearTimeout(timer)
  }, [query])

  const buscar = async () => {
    setLoading(true)
    try {
      const [r, p, m] = await Promise.all([
        api.get('/reservas/'),
        api.get('/platos/'),
        api.get('/mesas/')
      ])
      const q = query.toLowerCase()
      setResultados({
        reservas: r.data.filter(r =>
          r.nombre_cliente.toLowerCase().includes(q) ||
          r.telefono?.includes(q) ||
          r.fecha?.includes(q)
        ).slice(0, 4),
        platos: p.data.filter(p => p.nombre.toLowerCase().includes(q)).slice(0, 4),
        mesas: m.data.filter(m => `mesa ${m.numero}`.includes(q)).slice(0, 4)
      })
    } catch (e) {}
    setLoading(false)
  }

  const irA = (ruta) => {
    navigate(ruta)
    setAbierto(false)
  }

  const hayResultados = resultados.reservas.length > 0 || resultados.platos.length > 0 || resultados.mesas.length > 0

  return (
    <>
      <button style={styles.triggerBtn} onClick={() => setAbierto(true)} title="Buscar (Ctrl+K)">
        <Search size={14} />
        <span style={styles.triggerText}>Buscar...</span>
        <span style={styles.shortcut}>Ctrl K</span>
      </button>

      {abierto && (
        <div style={styles.overlay} onClick={() => setAbierto(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.inputRow}>
              <Search size={16} color="var(--text3)" />
              <input
                ref={inputRef}
                style={styles.input}
                placeholder="Buscar reservas, platos, mesas..."
                value={query}
                onChange={e => setQuery(e.target.value)}
              />
              {query && <button style={styles.clearBtn} onClick={() => setQuery('')}><X size={14} /></button>}
              <button style={styles.escBtn} onClick={() => setAbierto(false)}>Esc</button>
            </div>

            <div style={styles.results}>
              {loading && <p style={styles.loading}>Buscando...</p>}

              {!loading && query.length >= 2 && !hayResultados && (
                <p style={styles.noResults}>No se encontraron resultados para "{query}"</p>
              )}

              {!loading && query.length < 2 && (
                <p style={styles.hint}>Escribe al menos 2 caracteres para buscar</p>
              )}

              {resultados.mesas.length > 0 && (
                <div style={styles.section}>
                  <p style={styles.sectionTitle}>Mesas</p>
                  {resultados.mesas.map(m => (
                    <div key={m.id} style={styles.result} onClick={() => irA(`/pedidos/${m.id}`)}>
                      <div style={styles.resultIcon}><UtensilsCrossed size={14} color="var(--primary)" /></div>
                      <div style={styles.resultInfo}>
                        <p style={styles.resultTitle}>Mesa {m.numero}</p>
                        <p style={styles.resultSub}>{m.capacidad} personas · {m.estado}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {resultados.reservas.length > 0 && (
                <div style={styles.section}>
                  <p style={styles.sectionTitle}>Reservas</p>
                  {resultados.reservas.map(r => (
                    <div key={r.id} style={styles.result} onClick={() => irA('/reservas')}>
                      <div style={styles.resultIcon}><Calendar size={14} color="#d97706" /></div>
                      <div style={styles.resultInfo}>
                        <p style={styles.resultTitle}>{r.nombre_cliente}</p>
                        <p style={styles.resultSub}>Mesa {r.mesa_numero} · {r.fecha} {r.hora}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {resultados.platos.length > 0 && (
                <div style={styles.section}>
                  <p style={styles.sectionTitle}>Carta</p>
                  {resultados.platos.map(p => (
                    <div key={p.id} style={styles.result} onClick={() => irA('/carta')}>
                      <div style={styles.resultIcon}><Users size={14} color="#16a34a" /></div>
                      <div style={styles.resultInfo}>
                        <p style={styles.resultTitle}>{p.nombre}</p>
                        <p style={styles.resultSub}>{p.categoria} · {p.precio.toFixed(2)} €</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

const styles = {
  triggerBtn: { display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text3)', cursor: 'pointer', fontSize: '13px' },
  triggerText: { color: 'var(--text3)' },
  shortcut: { fontSize: '11px', color: 'var(--text3)', background: 'var(--bg3)', padding: '2px 6px', borderRadius: '4px', marginLeft: '4px' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '120px', zIndex: 300 },
  modal: { background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '14px', width: '100%', maxWidth: '540px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', overflow: 'hidden' },
  inputRow: { display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 16px', borderBottom: '1px solid var(--border)' },
  input: { flex: 1, background: 'transparent', border: 'none', color: 'var(--text)', fontSize: '15px', outline: 'none' },
  clearBtn: { background: 'transparent', border: 'none', color: 'var(--text3)', cursor: 'pointer', display: 'flex', alignItems: 'center' },
  escBtn: { background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '5px', color: 'var(--text3)', cursor: 'pointer', fontSize: '11px', padding: '3px 7px' },
  results: { maxHeight: '400px', overflowY: 'auto', padding: '8px 0' },
  loading: { padding: '20px 16px', textAlign: 'center', color: 'var(--text3)', fontSize: '13px' },
  noResults: { padding: '20px 16px', textAlign: 'center', color: 'var(--text3)', fontSize: '13px' },
  hint: { padding: '20px 16px', textAlign: 'center', color: 'var(--text3)', fontSize: '13px' },
  section: { marginBottom: '8px' },
  sectionTitle: { fontSize: '11px', fontWeight: '600', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px', padding: '8px 16px 4px' },
  result: { display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 16px', cursor: 'pointer', transition: 'background 0.1s' },
  resultIcon: { width: '32px', height: '32px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  resultInfo: {},
  resultTitle: { fontSize: '13px', fontWeight: '500', color: 'var(--text)', marginBottom: '2px' },
  resultSub: { fontSize: '12px', color: 'var(--text3)' }
}