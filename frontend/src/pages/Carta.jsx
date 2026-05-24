import { useState, useEffect } from 'react'
import { Search, Plus, Trash2 } from 'lucide-react'
import api from '../api/axios'
import ModalConfirm from '../components/ModalConfirm'

const CATEGORIAS = ['Entrantes', 'Principales', 'Postres', 'Bebidas']

export default function Carta() {
  const [platos, setPlatos] = useState([])
  const [nombre, setNombre] = useState('')
  const [precio, setPrecio] = useState('')
  const [categoria, setCategoria] = useState('Entrantes')
  const [busqueda, setBusqueda] = useState('')
  const [categoriaFiltro, setCategoriaFiltro] = useState('Todos')
  const [confirmar, setConfirmar] = useState(null)

  useEffect(() => { cargar() }, [])

  const cargar = async () => {
    const res = await api.get('/platos/')
    setPlatos(res.data)
  }

  const crear = async () => {
    if (!nombre.trim() || !precio) return
    await api.post('/platos/', { nombre: nombre.trim(), precio: parseFloat(precio), categoria })
    setNombre(''); setPrecio('')
    cargar()
  }

  const confirmarEliminar = async () => {
    await api.delete(`/platos/${confirmar.id}`)
    setConfirmar(null)
    cargar()
  }

  const platosFiltrados = platos.filter(p => {
    const matchBusqueda = p.nombre.toLowerCase().includes(busqueda.toLowerCase())
    const matchCategoria = categoriaFiltro === 'Todos' || p.categoria === categoriaFiltro
    return matchBusqueda && matchCategoria
  })

  const categorias = ['Todos', ...CATEGORIAS]

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.pageHeader}>
          <div>
            <h1 style={styles.pageTitle}>Carta</h1>
            <p style={styles.pageSubtitle}>{platos.length} platos disponibles</p>
          </div>
        </div>

        <div style={styles.addPanel}>
          <h3 style={styles.panelTitle}>Añadir nuevo plato</h3>
          <div style={styles.addRow}>
            <input style={{ ...styles.input, flex: 1 }} placeholder="Nombre del plato" value={nombre} onChange={e => setNombre(e.target.value)} onKeyDown={e => e.key === 'Enter' && crear()} />
            <input style={{ ...styles.input, width: '130px' }} placeholder="Precio (€)" type="number" min="0" step="0.01" value={precio} onChange={e => setPrecio(e.target.value)} />
            <select style={styles.select} value={categoria} onChange={e => setCategoria(e.target.value)}>
              {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
            </select>
            <button style={styles.btnPrimary} onClick={crear}>
              <Plus size={14} /> Añadir
            </button>
          </div>
        </div>

        <div style={styles.toolbar}>
          <div style={styles.searchBox}>
            <Search size={14} color="var(--text3)" />
            <input style={styles.searchInput} placeholder="Buscar plato..." value={busqueda} onChange={e => setBusqueda(e.target.value)} />
          </div>
          <div style={styles.filtros}>
            {categorias.map(c => (
              <button key={c} style={{ ...styles.filtroBtn, ...(categoriaFiltro === c ? styles.filtroActive : {}) }} onClick={() => setCategoriaFiltro(c)}>
                {c}
              </button>
            ))}
          </div>
        </div>

        <div style={styles.tabla}>
          <div style={styles.tablaHeader}>
            <span>Plato</span>
            <span>Categoría</span>
            <span style={{ textAlign: 'right' }}>Precio</span>
            <span></span>
          </div>
          {platosFiltrados.length === 0 ? (
            <div style={styles.empty}>No se encontraron platos</div>
          ) : (
            platosFiltrados.map((p, i) => (
              <div key={p.id} style={{ ...styles.tablaRow, background: i % 2 === 0 ? 'transparent' : 'var(--bg2)' }}>
                <span style={styles.platNombre}>{p.nombre}</span>
                <span style={styles.platCat}>{p.categoria}</span>
                <span style={styles.platPrecio}>{p.precio.toFixed(2)} €</span>
                <button style={styles.deleteBtn} onClick={() => setConfirmar({ id: p.id, nombre: p.nombre })}>
                  <Trash2 size={13} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {confirmar && (
        <ModalConfirm
          titulo="Eliminar plato"
          mensaje={`¿Estás seguro de que quieres eliminar "${confirmar.nombre}" de la carta?`}
          onConfirmar={confirmarEliminar}
          onCancelar={() => setConfirmar(null)}
          textoBtn="Eliminar plato"
        />
      )}
    </div>
  )
}

const styles = {
  page: { background: 'var(--bg2)', minHeight: 'calc(100vh - 56px)', padding: '32px 0' },
  container: { maxWidth: '1000px', margin: '0 auto', padding: '0 24px' },
  pageHeader: { marginBottom: '24px' },
  pageTitle: { fontSize: '22px', fontWeight: '700', color: 'var(--text)', marginBottom: '4px' },
  pageSubtitle: { fontSize: '13px', color: 'var(--text3)' },
  addPanel: { background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px 24px', marginBottom: '20px', boxShadow: 'var(--shadow)' },
  panelTitle: { fontSize: '12px', fontWeight: '600', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '14px' },
  addRow: { display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' },
  input: { padding: '9px 12px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)', fontSize: '13px' },
  select: { padding: '9px 12px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)', fontSize: '13px' },
  btnPrimary: { display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 18px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', whiteSpace: 'nowrap' },
  toolbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' },
  searchBox: { display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px 14px', width: '260px' },
  searchInput: { background: 'transparent', border: 'none', color: 'var(--text)', fontSize: '13px', outline: 'none', width: '100%' },
  filtros: { display: 'flex', gap: '4px', flexWrap: 'wrap' },
  filtroBtn: { padding: '6px 14px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '20px', color: 'var(--text2)', cursor: 'pointer', fontSize: '12px', fontWeight: '500' },
  filtroActive: { background: 'var(--primary)', color: '#fff', border: '1px solid var(--primary)' },
  tabla: { background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden', boxShadow: 'var(--shadow)' },
  tablaHeader: { display: 'grid', gridTemplateColumns: '1fr 140px 100px 48px', padding: '10px 20px', background: 'var(--bg2)', borderBottom: '1px solid var(--border)', fontSize: '11px', fontWeight: '600', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px' },
  tablaRow: { display: 'grid', gridTemplateColumns: '1fr 140px 100px 48px', padding: '13px 20px', alignItems: 'center', borderBottom: '1px solid var(--border)' },
  platNombre: { color: 'var(--text)', fontSize: '13px', fontWeight: '500' },
  platCat: { color: 'var(--text3)', fontSize: '12px' },
  platPrecio: { color: 'var(--text)', fontSize: '13px', fontWeight: '500', textAlign: 'right' },
  deleteBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', color: 'var(--text3)', cursor: 'pointer', padding: '4px', borderRadius: '6px' },
  empty: { padding: '48px', textAlign: 'center', color: 'var(--text3)', fontSize: '13px' }
}