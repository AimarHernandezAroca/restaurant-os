import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Login from './pages/Login'
import Mesas from './pages/Mesas'
import Pedidos from './pages/Pedidos'
import Carta from './pages/Carta'
import Dashboard from './pages/Dashboard'
import Reservas from './pages/Reservas'
import Empleados from './pages/Empleados'
import Cocina from './pages/Cocina'
import Usuarios from './pages/Usuarios'
import Perfil from './pages/Perfil'
import Navbar from './components/Navbar'
import { getUser } from './api/axios'

function PrivateRoute({ children, roles }) {
  const token = localStorage.getItem('token')
  const user = getUser()
  if (!token) return <Navigate to="/login" />
  if (roles && !roles.includes(user?.rol)) return <Navigate to="/" />
  return children
}

function Layout({ children, theme, toggleTheme }) {
  return (
    <>
      <Navbar theme={theme} toggleTheme={toggleTheme} />
      <main style={{ minHeight: 'calc(100vh - 56px)', background: 'var(--bg2)' }}>
        {children}
      </main>
    </>
  )
}

export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => setTheme(t => t === 'light' ? 'dark' : 'light')

  const wrap = (children, roles) => (
    <PrivateRoute roles={roles}>
      <Layout theme={theme} toggleTheme={toggleTheme}>{children}</Layout>
    </PrivateRoute>
  )

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={wrap(<Mesas />, ['admin', 'camarero'])} />
        <Route path="/pedidos/:mesaId" element={wrap(<Pedidos />, ['admin', 'camarero'])} />
        <Route path="/reservas" element={wrap(<Reservas />, ['admin', 'camarero'])} />
        <Route path="/cocina" element={wrap(<Cocina />, ['admin', 'cocina'])} />
        <Route path="/carta" element={wrap(<Carta />, ['admin'])} />
        <Route path="/empleados" element={wrap(<Empleados />, ['admin'])} />
        <Route path="/usuarios" element={wrap(<Usuarios />, ['admin'])} />
        <Route path="/dashboard" element={wrap(<Dashboard />, ['admin'])} />
        <Route path="/perfil" element={wrap(<Perfil />, ['admin', 'camarero', 'cocina'])} />
      </Routes>
    </BrowserRouter>
  )
}