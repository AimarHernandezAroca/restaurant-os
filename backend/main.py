import os
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
import aiosqlite
from database import init_db, DB_PATH
from models import UsuarioCreate, UsuarioLogin
from auth import hashear_password, verificar_password, crear_token, get_current_user, require_admin
from routers import mesas, platos, pedidos, reservas, empleados
from pydantic import BaseModel as PydanticBaseModel

app = FastAPI(title="RestaurantOS API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    await init_db()

app.include_router(mesas.router)
app.include_router(platos.router)
app.include_router(pedidos.router)
app.include_router(reservas.router)
app.include_router(empleados.router)

# ── Auth ──────────────────────────────────────────────────────────────────────

@app.get("/auth/hay-admin")
async def hay_admin():
    async with aiosqlite.connect(DB_PATH) as db:
        async with db.execute("SELECT COUNT(*) as total FROM usuarios") as cursor:
            count = await cursor.fetchone()
    return {"hay_admin": count[0] > 0}

@app.post("/auth/registro-inicial")
async def registro_inicial(data: UsuarioCreate):
    async with aiosqlite.connect(DB_PATH) as db:
        async with db.execute("SELECT COUNT(*) as total FROM usuarios") as cursor:
            count = await cursor.fetchone()
        if count[0] > 0:
            raise HTTPException(status_code=403, detail="Ya existe un administrador. Contacta con él para obtener acceso.")
        await db.execute(
            "INSERT INTO usuarios (username, password, rol) VALUES (?, ?, ?)",
            (data.username, hashear_password(data.password), "admin")
        )
        await db.commit()
    return {"ok": True, "mensaje": "Cuenta de administrador creada correctamente"}

@app.post("/auth/registro")
async def registro(data: UsuarioCreate, user=Depends(require_admin)):
    async with aiosqlite.connect(DB_PATH) as db:
        try:
            await db.execute(
                "INSERT INTO usuarios (username, password, rol) VALUES (?, ?, ?)",
                (data.username, hashear_password(data.password), data.rol)
            )
            await db.commit()
        except Exception:
            raise HTTPException(status_code=400, detail="El usuario ya existe")
    return {"ok": True}

@app.post("/auth/login")
async def login(data: UsuarioLogin):
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            "SELECT * FROM usuarios WHERE username = ?", (data.username,)
        ) as cursor:
            usuario = await cursor.fetchone()

    if not usuario or not verificar_password(data.password, usuario["password"]):
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")

    token = crear_token({"sub": data.username, "rol": usuario["rol"]})
    return {
        "access_token": token,
        "token_type": "bearer",
        "rol": usuario["rol"],
        "username": data.username
    }

@app.get("/auth/usuarios")
async def get_usuarios(user=Depends(require_admin)):
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute("SELECT id, username, rol FROM usuarios ORDER BY rol, username") as cursor:
            usuarios = await cursor.fetchall()
    return [dict(u) for u in usuarios]

@app.put("/auth/usuarios/{usuario_id}")
async def editar_usuario(usuario_id: int, data: UsuarioCreate, user=Depends(require_admin)):
    async with aiosqlite.connect(DB_PATH) as db:
        if data.password and data.password != '___keep___':
            await db.execute(
                "UPDATE usuarios SET username = ?, password = ?, rol = ? WHERE id = ?",
                (data.username, hashear_password(data.password), data.rol, usuario_id)
            )
        else:
            await db.execute(
                "UPDATE usuarios SET username = ?, rol = ? WHERE id = ?",
                (data.username, data.rol, usuario_id)
            )
        await db.commit()
    return {"ok": True}

@app.delete("/auth/usuarios/{usuario_id}")
async def eliminar_usuario(usuario_id: int, user=Depends(require_admin)):
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("DELETE FROM usuarios WHERE id = ?", (usuario_id,))
        await db.commit()
    return {"ok": True}

class CambiarPassword(PydanticBaseModel):
    password_actual: str
    password_nueva: str

@app.post("/auth/cambiar-password")
async def cambiar_password(data: CambiarPassword, user=Depends(get_current_user)):
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            "SELECT * FROM usuarios WHERE username = ?", (user["username"],)
        ) as cursor:
            usuario = await cursor.fetchone()

    if not usuario or not verificar_password(data.password_actual, usuario["password"]):
        raise HTTPException(status_code=401, detail="Contraseña actual incorrecta")

    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            "UPDATE usuarios SET password = ? WHERE username = ?",
            (hashear_password(data.password_nueva), user["username"])
        )
        await db.commit()
    return {"ok": True}

# ── Dashboard ─────────────────────────────────────────────────────────────────

@app.get("/dashboard")
async def dashboard(user=Depends(get_current_user)):
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row

        async with db.execute("""
            SELECT pl.nombre, SUM(p.cantidad) as total
            FROM pedidos p
            JOIN platos pl ON p.plato_id = pl.id
            GROUP BY pl.nombre
            ORDER BY total DESC
            LIMIT 5
        """) as cursor:
            top_platos = await cursor.fetchall()

        async with db.execute("""
            SELECT COALESCE(SUM(pl.precio * p.cantidad), 0) as total
            FROM pedidos p
            JOIN platos pl ON p.plato_id = pl.id
            WHERE DATE(p.fecha) = DATE('now')
            AND p.estado = 'cobrado'
        """) as cursor:
            ventas = await cursor.fetchone()

        async with db.execute(
            "SELECT COUNT(*) as total FROM mesas WHERE estado = 'ocupada'"
        ) as cursor:
            mesas_ocupadas = await cursor.fetchone()

        async with db.execute("""
            SELECT DATE(fecha) as dia, ROUND(SUM(total), 2) as total
            FROM historial
            GROUP BY DATE(fecha)
            ORDER BY dia ASC
            LIMIT 7
        """) as cursor:
            ventas_semana = await cursor.fetchall()

        async with db.execute("""
            SELECT strftime('%H', fecha) as hora, COUNT(*) as total
            FROM historial
            GROUP BY strftime('%H', fecha)
            ORDER BY hora ASC
        """) as cursor:
            horas_punta = await cursor.fetchall()

        async with db.execute("""
            SELECT pl.categoria, ROUND(SUM(pl.precio * p.cantidad), 2) as total
            FROM pedidos p
            JOIN platos pl ON p.plato_id = pl.id
            WHERE p.estado = 'cobrado'
            GROUP BY pl.categoria
            ORDER BY total DESC
        """) as cursor:
            ventas_categoria = await cursor.fetchall()

        async with db.execute("""
            SELECT COUNT(*) as total FROM reservas
            WHERE DATE(fecha) = DATE('now') AND estado = 'confirmada'
        """) as cursor:
            reservas_hoy = await cursor.fetchone()

    return {
        "ventas_hoy": ventas["total"],
        "mesas_ocupadas": mesas_ocupadas["total"],
        "reservas_hoy": reservas_hoy["total"],
        "top_platos": [dict(p) for p in top_platos],
        "ventas_semana": [dict(v) for v in ventas_semana],
        "horas_punta": [dict(h) for h in horas_punta],
        "ventas_categoria": [dict(v) for v in ventas_categoria]
    }