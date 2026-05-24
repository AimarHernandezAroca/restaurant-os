import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, ChevronRight, Printer, X } from 'lucide-react'
import api from '../api/axios'
import useWindowSize from '../hooks/useWindowSize'

const estadoConfig = {
  pendiente: { color: '#d97706', bg: '#fffbeb', border: '#fde68a', next: 'preparando', nextLabel: 'Marcar en preparación' },
  preparando: { color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', next: 'listo', nextLabel: 'Marcar como listo' },
  listo: { color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', next: null, nextLabel: null }
}

export default function Pedidos() {
  const { mesaId } = useParams()
  const navigate = useNavigate()
  const { width } = useWindowSize()
  const [pedidos, setPedidos] = useState([])
  const [platos, setPlatos] = useState([])
  const [platoId, setPlatoId] = useState('')
  const [cantidad, setCantidad] = useState(1)
  const [notas, setNotas] = useState('')
  const [loading, setLoading] = useState(false)
  const [mostrarTicket, setMostrarTicket] = useState(false)
  const ticketRef = useRef(null)

  useEffect(() => { cargar() }, [])

  const cargar = async () => {
    const [p, pl] = await Promise.all([
      api.get(`/pedidos/mesa/${mesaId}`),
      api.get('/platos/')
    ])
    setPedidos(p.data)
    setPlatos(pl.data)
    if (pl.data.length > 0) setPlatoId(pl.data[0].id)
  }

  const agregar = async () => {
    if (!platoId) return
    setLoading(true)
    await api.post('/pedidos/', {
      mesa_id: parseInt(mesaId),
      plato_id: parseInt(platoId),
      cantidad,
      notas
    })
    setNotas(''); setCantidad(1)
    await cargar()
    setLoading(false)
  }

  const avanzarEstado = async (pedido) => {
    const next = estadoConfig[pedido.estado]?.next
    if (!next) return
    await api.put(`/pedidos/${pedido.id}`, { estado: next })
    cargar()
  }

  const confirmarCobro = () => {
    if (pedidos.length === 0) return
    setMostrarTicket(true)
  }

  const cobrar = async () => {
    await api.delete(`/pedidos/mesa/${mesaId}/cobrar`)
    setMostrarTicket(false)
    navigate('/')
  }

  const imprimir = () => {
    const contenido = ticketRef.current.innerHTML
    const ventana = window.open('', '_blank')
    ventana.document.write(`
      <html>
        <head>
          <title>Ticket Mesa ${mesaId}</title>
          <style>
            body { font-family: 'Courier New', monospace; max-width: 300px; margin: 0 auto; padding: 20px; }
            h2 { text-align: center; font-size: 18px; margin-bottom: 4px; }
            .sub { text-align: center; font-size: 12px; color: #666; margin-bottom: 16px; }
            .sep { border-top: 1px dashed #000; margin: 10px 0; }
            .linea { display: flex; justify-content: space-between; font-size: 13px; margin: 4px 0; }
            .notas { font-size: 11px; color: #666; margin-left: 8px; }
            .total { font-weight: bold; font-size: 16px; }
            .pie { text-align: center; font-size: 11px; color: #666; margin-top: 16px; }
          </style>
        </head>
        <body>${contenido}</body>
      </html>
    `)
    ventana.document.close()
    ventana.print()
  }

  const subtotal = pedidos.reduce((acc, p) => acc + p.plato_precio * p.cantidad, 0)
  const iva = subtotal * 0.1
  const total = subtotal + iva
  const platoSeleccionado = platos.find(p => p.id === parseInt(platoId))

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <button style={styles.backBtn} onClick={() => navigate('/')}>
          <ArrowLeft size={14} /> Volver a mesas
        </button>

        <div style={styles.pageHeader}>
          <div>
            <h1 style={styles.pageTitle}>Mesa {mesaId}</h1>
            <p style={styles.pageSubtitle}>{pedidos.length} líneas · {total.toFixed(2)} € total</p>
          </div>
          {pedidos.length > 0 && (
            <button style={styles.cobrarBtn} onClick={confirmarCobro}>
              Cobrar mesa · {total.toFixed(2)} €
            </button>
          )}
        </div>

        <div style={{ ...styles.layout, gridTemplateColumns: width < 768 ? '1fr' : '320px 1fr' }}>
          <div style={styles.panel}>
            <h3 style={styles.panelTitle}>Añadir plato</h3>
            <div style={styles.field}>
              <label style={styles.label}>Plato</label>
              <select style={styles.select} value={platoId} onChange={e => setPlatoId(e.target.value)}>
                {platos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
              </select>
            </div>
            {platoSeleccionado && (
              <div style={styles.platoPreview}>
                <span style={styles.previewNombre}>{platoSeleccionado.nombre}</span>
                <span style={styles.previewPrecio}>{platoSeleccionado.precio.toFixed(2)} €/ud</span>
              </div>
            )}
            <div style={styles.field}>
              <label style={styles.label}>Cantidad</label>
              <div style={styles.cantidadRow}>
                <button style={styles.cantBtn} onClick={() => setCantidad(c => Math.max(1, c - 1))}>−</button>
                <span style={styles.cantValue}>{cantidad}</span>
                <button style={styles.cantBtn} onClick={() => setCantidad(c => c + 1)}>+</button>
              </div>
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Notas <span style={{ color: 'var(--text3)', fontWeight: '400' }}>(opcional)</span></label>
              <input style={styles.input} placeholder="Sin gluten, poco hecho..." value={notas} onChange={e => setNotas(e.target.value)} />
            </div>
            {platoSeleccionado && (
              <div style={styles.subtotalPreview}>
                Subtotal: <strong>{(platoSeleccionado.precio * cantidad).toFixed(2)} €</strong>
              </div>
            )}
            <button style={{ ...styles.btnPrimary, opacity: loading ? 0.7 : 1 }} onClick={agregar} disabled={loading}>
              <Plus size={14} /> {loading ? 'Añadiendo...' : 'Añadir al pedido'}
            </button>
          </div>

          <div style={styles.panel}>
            <h3 style={styles.panelTitle}>Pedido actual</h3>
            {pedidos.length === 0 ? (
              <div style={styles.empty}>
                <p style={{ color: 'var(--text3)', fontSize: '13px' }}>No hay líneas en este pedido.</p>
                <p style={{ color: 'var(--text3)', fontSize: '13px', marginTop: '4px' }}>Añade platos desde el panel izquierdo.</p>
              </div>
            ) : (
              <>
                {pedidos.map(p => {
                  const cfg = estadoConfig[p.estado]
                  return (
                    <div key={p.id} style={styles.lineItem}>
                      <div style={styles.lineInfo}>
                        <div style={styles.lineTop}>
                          <span style={styles.lineNombre}>{p.cantidad}× {p.plato_nombre}</span>
                          <span style={styles.linePrecio}>{(p.plato_precio * p.cantidad).toFixed(2)} €</span>
                        </div>
                        {p.notas && <p style={styles.lineNotas}>{p.notas}</p>}
                      </div>
                      <button
                        style={{ ...styles.estadoChip, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, cursor: cfg.next ? 'pointer' : 'default' }}
                        onClick={() => avanzarEstado(p)}
                        title={cfg.nextLabel || 'Estado final'}
                      >
                        {cfg.next && <ChevronRight size={11} />}
                        {p.estado.charAt(0).toUpperCase() + p.estado.slice(1)}
                      </button>
                    </div>
                  )
                })}
                <div style={styles.totalSection}>
                  <div style={styles.totalRow}>
                    <span style={{ color: 'var(--text2)' }}>Subtotal</span>
                    <span style={{ color: 'var(--text)' }}>{subtotal.toFixed(2)} €</span>
                  </div>
                  <div style={styles.totalRow}>
                    <span style={{ color: 'var(--text2)' }}>IVA (10%)</span>
                    <span style={{ color: 'var(--text)' }}>{iva.toFixed(2)} €</span>
                  </div>
                  <div style={{ ...styles.totalRow, borderTop: '1px solid var(--border)', paddingTop: '12px', marginTop: '4px' }}>
                    <span style={{ color: 'var(--text)', fontWeight: '600' }}>Total</span>
                    <span style={{ color: 'var(--text)', fontWeight: '700', fontSize: '18px' }}>{total.toFixed(2)} €</span>
                  </div>
                  <button style={styles.cobrarBtnFull} onClick={confirmarCobro}>
                    Cobrar y liberar mesa
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {mostrarTicket && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Confirmar cobro — Mesa {mesaId}</h3>
              <button style={styles.closeBtn} onClick={() => setMostrarTicket(false)}><X size={16} /></button>
            </div>

            <div ref={ticketRef} style={styles.ticket}>
              <h2 style={styles.ticketNombre}>RestaurantOS</h2>
              <p style={styles.ticketSub}>Mesa {mesaId} · {new Date().toLocaleString('es-ES')}</p>
              <div style={styles.ticketSep} />
              {pedidos.map((p, i) => (
                <div key={i}>
                  <div style={styles.ticketLinea}>
                    <span>{p.cantidad}× {p.plato_nombre}</span>
                    <span>{(p.plato_precio * p.cantidad).toFixed(2)} €</span>
                  </div>
                  {p.notas && <p style={styles.ticketNotas}>{p.notas}</p>}
                </div>
              ))}
              <div style={styles.ticketSep} />
              <div style={styles.ticketLinea}>
                <span style={{ color: 'var(--text2)' }}>Subtotal</span>
                <span style={{ color: 'var(--text2)' }}>{subtotal.toFixed(2)} €</span>
              </div>
              <div style={styles.ticketLinea}>
                <span style={{ color: 'var(--text2)' }}>IVA (10%)</span>
                <span style={{ color: 'var(--text2)' }}>{iva.toFixed(2)} €</span>
              </div>
              <div style={styles.ticketSep} />
              <div style={{ ...styles.ticketLinea, fontWeight: '700', fontSize: '16px' }}>
                <span>TOTAL</span>
                <span>{total.toFixed(2)} €</span>
              </div>
              <p style={styles.ticketPie}>¡Gracias por su visita!</p>
            </div>

            <div style={styles.modalActions}>
              <button style={styles.btnImprimir} onClick={imprimir}>
                <Printer size={14} /> Imprimir ticket
              </button>
              <button style={styles.btnCobrar} onClick={cobrar}>
                Confirmar cobro
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const styles = {
  page: { background: 'var(--bg2)', minHeight: 'calc(100vh - 56px)', padding: '32px 0' },
  container: { maxWidth: '1100px', margin: '0 auto', padding: '0 24px' },
  backBtn: { display: 'flex', alignItems: 'center', gap: '6px', background: 'transparent', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: '13px', marginBottom: '20px', padding: 0 },
  pageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' },
  pageTitle: { fontSize: '22px', fontWeight: '700', color: 'var(--text)', marginBottom: '4px' },
  pageSubtitle: { fontSize: '13px', color: 'var(--text3)' },
  cobrarBtn: { padding: '10px 20px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' },
  layout: { display: 'grid', gap: '20px' },
  panel: { background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px', boxShadow: 'var(--shadow)' },
  panelTitle: { fontSize: '12px', fontWeight: '600', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '20px' },
  field: { marginBottom: '16px' },
  label: { display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text2)', marginBottom: '6px' },
  select: { width: '100%', padding: '9px 12px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)', fontSize: '13px' },
  input: { width: '100%', padding: '9px 12px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)', fontSize: '13px' },
  platoPreview: { display: 'flex', justifyContent: 'space-between', background: 'var(--bg2)', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px' },
  previewNombre: { color: 'var(--text)', fontSize: '13px', fontWeight: '500' },
  previewPrecio: { color: 'var(--text2)', fontSize: '13px' },
  cantidadRow: { display: 'flex', alignItems: 'center', gap: '16px' },
  cantBtn: { width: '32px', height: '32px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  cantValue: { fontSize: '18px', fontWeight: '600', color: 'var(--text)', minWidth: '24px', textAlign: 'center' },
  subtotalPreview: { color: 'var(--text2)', fontSize: '13px', marginBottom: '16px' },
  btnPrimary: { width: '100%', padding: '10px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' },
  empty: { padding: '32px 0', textAlign: 'center' },
  lineItem: { display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 0', borderBottom: '1px solid var(--border)' },
  lineInfo: { flex: 1 },
  lineTop: { display: 'flex', justifyContent: 'space-between', marginBottom: '2px' },
  lineNombre: { color: 'var(--text)', fontSize: '13px', fontWeight: '500' },
  linePrecio: { color: 'var(--text2)', fontSize: '13px' },
  lineNotas: { color: 'var(--text3)', fontSize: '12px', marginTop: '3px' },
  estadoChip: { display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '6px', border: 'none', fontSize: '11px', fontWeight: '600', whiteSpace: 'nowrap' },
  totalSection: { marginTop: '16px', paddingTop: '16px' },
  totalRow: { display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '13px' },
  cobrarBtnFull: { width: '100%', padding: '12px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', marginTop: '20px' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '24px' },
  modal: { background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '420px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  modalTitle: { fontSize: '15px', fontWeight: '700', color: 'var(--text)' },
  closeBtn: { background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text3)', display: 'flex', alignItems: 'center' },
  ticket: { background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '10px', padding: '20px', marginBottom: '20px' },
  ticketNombre: { textAlign: 'center', fontSize: '16px', fontWeight: '700', color: 'var(--text)', marginBottom: '4px' },
  ticketSub: { textAlign: 'center', fontSize: '11px', color: 'var(--text3)', marginBottom: '12px' },
  ticketSep: { borderTop: '1px dashed var(--border)', margin: '10px 0' },
  ticketLinea: { display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text)', padding: '3px 0' },
  ticketNotas: { fontSize: '11px', color: 'var(--text3)', marginLeft: '8px', marginBottom: '4px' },
  ticketPie: { textAlign: 'center', fontSize: '11px', color: 'var(--text3)', marginTop: '12px' },
  modalActions: { display: 'flex', gap: '10px' },
  btnImprimir: { display: 'flex', alignItems: 'center', gap: '6px', flex: 1, padding: '11px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text2)', cursor: 'pointer', fontSize: '13px', fontWeight: '500', justifyContent: 'center' },
  btnCobrar: { flex: 1, padding: '11px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }
}