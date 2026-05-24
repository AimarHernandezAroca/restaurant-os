import { AlertTriangle, X } from 'lucide-react'

export default function ModalConfirm({ titulo, mensaje, onConfirmar, onCancelar, colorBtn = '#dc2626', textoBtn = 'Eliminar' }) {
  return (
    <div style={styles.overlay} onClick={onCancelar}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <div style={styles.header}>
          <div style={styles.iconBox}>
            <AlertTriangle size={20} color="#d97706" />
          </div>
          <button style={styles.closeBtn} onClick={onCancelar}><X size={16} /></button>
        </div>
        <h3 style={styles.titulo}>{titulo}</h3>
        <p style={styles.mensaje}>{mensaje}</p>
        <div style={styles.actions}>
          <button style={styles.btnCancelar} onClick={onCancelar}>Cancelar</button>
          <button style={{ ...styles.btnConfirmar, background: colorBtn }} onClick={onConfirmar}>{textoBtn}</button>
        </div>
      </div>
    </div>
  )
}

const styles = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '24px' },
  modal: { background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '14px', padding: '28px', width: '100%', maxWidth: '380px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' },
  iconBox: { width: '40px', height: '40px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  closeBtn: { background: 'transparent', border: 'none', color: 'var(--text3)', cursor: 'pointer', display: 'flex', alignItems: 'center' },
  titulo: { fontSize: '16px', fontWeight: '700', color: 'var(--text)', marginBottom: '8px' },
  mensaje: { fontSize: '13px', color: 'var(--text2)', lineHeight: '1.6', marginBottom: '24px' },
  actions: { display: 'flex', gap: '10px' },
  btnCancelar: { flex: 1, padding: '10px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text2)', cursor: 'pointer', fontSize: '13px', fontWeight: '500' },
  btnConfirmar: { flex: 1, padding: '10px', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }
}