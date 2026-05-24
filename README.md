# 🍽️ RestaurantOS

Sistema de gestión integral para restaurantes desarrollado con **React** y **FastAPI**. Diseño profesional con modo claro/oscuro, sistema de roles y múltiples funcionalidades pensadas para uso real.

![React](https://img.shields.io/badge/React-19-blue) ![FastAPI](https://img.shields.io/badge/FastAPI-0.111-green) ![Python](https://img.shields.io/badge/Python-3.11-yellow) ![SQLite](https://img.shields.io/badge/SQLite-aiosqlite-lightgrey)

## ✨ Funcionalidades

- 🪑 **Mesas** — estado en tiempo real con auto-refresco, edición de capacidad
- 📋 **Pedidos** — estados (pendiente → preparando → listo), notas, ticket de cobro imprimible con IVA
- 📅 **Reservas** — validación de conflictos de horario (mínimo 2h), auto-liberación de mesas
- 🍽️ **Carta** — gestión de platos por categoría con buscador y filtros
- 👨‍🍳 **Cocina** — panel en tiempo real con auto-refresco cada 15 segundos
- 📊 **Dashboard** — gráficas de ventas, horas punta, categorías y top platos
- 👥 **Empleados** — alta con usuario y contraseña generada automáticamente
- 🔐 **Usuarios** — gestión completa con 3 roles diferenciados
- 🔔 **Notificaciones** — alertas en tiempo real para camareros
- 🔍 **Buscador global** — búsqueda por reservas, platos y mesas (Ctrl+K)
- 🌙 **Modo oscuro** — tema claro/oscuro persistente
- 📱 **Responsive** — adaptado para tablet y móvil

## 👥 Roles del sistema

| Rol | Acceso |
|-----|--------|
| 🛡️ Admin | Todo — mesas, pedidos, reservas, carta, empleados, usuarios, dashboard |
| 🍽️ Camarero | Mesas, pedidos y reservas |
| 👨‍🍳 Cocina | Vista de cocina únicamente |

## 🛠️ Tecnologías

**Frontend**
- React 19 + Vite
- React Router DOM 7
- Recharts (gráficas)
- Lucide React (iconos)
- Axios

**Backend**
- FastAPI (Python 3.11)
- SQLite + aiosqlite
- JWT con python-jose
- Uvicorn

## 🚀 Instalación local

### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Primer uso
1. Ve a `http://localhost:8000/docs`
2. Usa el endpoint **POST /auth/registro-admin** para crear el primer administrador
3. Accede a `http://localhost:5173` e inicia sesión

## 📁 Estructura del proyecto

```
restaurant-os/
├── backend/
│   ├── routers/
│   │   ├── mesas.py
│   │   ├── pedidos.py
│   │   ├── platos.py
│   │   ├── reservas.py
│   │   └── empleados.py
│   ├── main.py
│   ├── database.py
│   ├── models.py
│   ├── auth.py
│   └── requirements.txt
└── frontend/
    └── src/
        ├── pages/
        │   ├── Mesas.jsx
        │   ├── Pedidos.jsx
        │   ├── Carta.jsx
        │   ├── Reservas.jsx
        │   ├── Cocina.jsx
        │   ├── Dashboard.jsx
        │   ├── Empleados.jsx
        │   ├── Usuarios.jsx
        │   └── Perfil.jsx
        ├── components/
        │   ├── Navbar.jsx
        │   ├── Notificaciones.jsx
        │   ├── BuscadorGlobal.jsx
        │   ├── ModalConfirm.jsx
        │   ├── ErrorBoundary.jsx
        │   └── ErrorRed.jsx
        └── hooks/
            └── useWindowSize.js
```

## 👨‍💻 Autor

**Aimar Hernandez** — [@AimarHernandezAroca](https://github.com/AimarHernandezAroca)