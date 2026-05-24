import { useState, useEffect } from 'react'
import { WifiOff } from 'lucide-react'

export default function ErrorRed() {
  const [offline, setOffline] = useState(!navigator.onLine)

  useEffect(() => {
    const onOffline = () => setOffline(true)
    const onOnline = () => setOffline(false)
    window.addEventListener('offline', onOffline)
    window.addEventListener('online', onOnline)
    return () => {
      window.removeEventListener('offline', onOffline)
      window.removeEventListener('online', onOnline)
    }
  }, [])

  if (!offline) return null

  return (
    <div style={styles.banner}>
      <WifiOff size={14} />
      Sin conexión — comprueba tu red o que el servidor está activo
    </div>
  )
}

const styles = {
  banner: { position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)', background: '#dc2626', color: '#fff', padding: '10px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px', zIndex: 9999, boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }
}