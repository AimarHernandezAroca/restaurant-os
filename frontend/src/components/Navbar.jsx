import { useNavigate, useLocation } from 'react-router-dom'
import { Sun, Moon, LogOut } from 'lucide-react'
import { getUser } from '../api/axios'
import Notificaciones from './Notificaciones'
import BuscadorGlobal from './BuscadorGlobal'

export default function Navbar({ theme, toggleTheme }) {
  const navigate = useNavigate()
  const location = useLocation()
  const user = getUser()
  const rol = user?.rol

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  const allLinks = [
    { path: '/', label: 'Mesas', roles: ['admin', 'camarero'] },
    { path: '/reservas', label: 'Reservas', roles: ['admin', 'camarero'] },
    { path: '/cocina', label: 'Cocina', roles: ['admin', 'cocina'] },
    { path: '/carta', label: 'Carta', roles: ['admin'] },
    { path: '/empleados', label: 'Empleados', roles: ['admin'] },
    { path: '/usuarios', label: 'Usuarios', roles: ['admin'] },
    { path: '/dashboard', label: 'Dashboard', roles: ['admin'] },
  ]

  const links = allLinks.filter(l => l.roles.includes(rol))
  const rolColors = { admin: '#2563eb', camarero: '#16a34a', cocina: '#d97706' }
  const rolColor = rolColors[rol] || '#64748b'

  return (
    <nav style={styles.nav}>
      <div style={styles.left}>
        <span style={styles.logo}>RestaurantOS</span>
       <div style={styles.sep} />
<BuscadorGlobal />
<div style={styles.sep} />
<div style={styles.links}>
          {links.map(l => (
            <button
              key={l.path}
              style={{ ...styles.link, ...(location.pathname === l.path ? styles.active : {}) }}
              onClick={() => navigate(l.path)}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>
      <div style={styles.right}>
        <div style={styles.userInfo} onClick={() => navigate('/perfil')} title="Mi perfil">
  <span style={styles.username}>{user?.username}</span>
  <span style={{ ...styles.rolBadge, background: rolColor + '18', color: rolColor }}>{rol}</span>
</div>
        <Notificaciones />
        <button style={styles.iconBtn} onClick={toggleTheme} title="Cambiar tema">
          {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
        </button>
        <button style={styles.iconBtn} onClick={logout} title="Cerrar sesión">
          <LogOut size={16} />
        </button>
      </div>
    </nav>
  )
}

const styles = {
  nav: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', height: '56px', background: 'var(--bg)', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 100 },
  left: { display: 'flex', alignItems: 'center', gap: '20px' },
  logo: { fontSize: '15px', fontWeight: '700', color: 'var(--primary)', letterSpacing: '-0.3px' },
  sep: { width: '1px', height: '18px', background: 'var(--border)' },
  links: { display: 'flex', gap: '2px' },
  link: { padding: '6px 12px', background: 'transparent', border: 'none', borderRadius: '6px', color: 'var(--text2)', cursor: 'pointer', fontSize: '13px', fontWeight: '500' },
  active: { background: 'var(--bg3)', color: 'var(--text)' },
  right: { display: 'flex', alignItems: 'center', gap: '8px' },
  userInfo: { display: 'flex', alignItems: 'center', gap: '8px', marginRight: '4px' },
  username: { fontSize: '13px', color: 'var(--text2)', fontWeight: '500' },
  rolBadge: { padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600' },
  iconBtn: { width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: '1px solid var(--border)', borderRadius: '7px', color: 'var(--text2)', cursor: 'pointer' }
}