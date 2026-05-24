import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={styles.page}>
          <div style={styles.box}>
            <div style={styles.icon}>⚠️</div>
            <h2 style={styles.title}>Algo ha ido mal</h2>
            <p style={styles.desc}>Ha ocurrido un error inesperado. Intenta recargar la página.</p>
            <button style={styles.btn} onClick={() => window.location.reload()}>Recargar página</button>
            <button style={styles.btnSecondary} onClick={() => window.location.href = '/'}>Volver al inicio</button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

const styles = {
  page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', padding: '24px' },
  box: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '48px', maxWidth: '420px', width: '100%', textAlign: 'center', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' },
  icon: { fontSize: '48px', marginBottom: '16px' },
  title: { fontSize: '20px', fontWeight: '700', color: '#0f172a', marginBottom: '8px' },
  desc: { fontSize: '14px', color: '#64748b', lineHeight: '1.6', marginBottom: '24px' },
  btn: { width: '100%', padding: '11px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', marginBottom: '10px' },
  btnSecondary: { width: '100%', padding: '11px', background: 'transparent', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }
}