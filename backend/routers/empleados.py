from fastapi import APIRouter, Depends
from auth import get_current_user, hashear_password
from pydantic import BaseModel
import aiosqlite
import random
import string
from database import DB_PATH

router = APIRouter(prefix="/empleados", tags=["empleados"])

class EmpleadoCreate(BaseModel):
    nombre: str
    rol: str
    telefono: str = ''
    email: str = ''

def generar_password():
    chars = string.ascii_letters + string.digits
    return ''.join(random.choices(chars, k=10))

def rol_empleado_a_usuario(rol: str) -> str:
    return 'cocina' if rol == 'Cocinero' else 'camarero'

def nombre_a_username(nombre: str) -> str:
    return nombre.lower().replace(' ', '_')\
        .replace('á','a').replace('é','e')\
        .replace('í','i').replace('ó','o').replace('ú','u')

@router.get("/")
async def get_empleados(user=Depends(get_current_user)):
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute("SELECT * FROM empleados ORDER BY nombre") as cursor:
            empleados = await cursor.fetchall()
    return [dict(e) for e in empleados]

@router.post("/")
async def crear_empleado(data: EmpleadoCreate, user=Depends(get_current_user)):
    password = generar_password()
    username = nombre_a_username(data.nombre)
    rol_usuario = rol_empleado_a_usuario(data.rol)

    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row

        base_username = username
        contador = 1
        while True:
            async with db.execute("SELECT id FROM usuarios WHERE username = ?", (username,)) as cursor:
                existe = await cursor.fetchone()
            if not existe:
                break
            username = f"{base_username}{contador}"
            contador += 1

        await db.execute(
            "INSERT INTO empleados (nombre, rol, telefono, email) VALUES (?, ?, ?, ?)",
            (data.nombre, data.rol, data.telefono, data.email)
        )
        await db.execute(
            "INSERT INTO usuarios (username, password, rol) VALUES (?, ?, ?)",
            (username, hashear_password(password), rol_usuario)
        )
        await db.commit()

    return {"ok": True, "username": username, "password": password}

@router.delete("/{empleado_id}")
async def eliminar_empleado(empleado_id: int, user=Depends(get_current_user)):
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row

        async with db.execute("SELECT nombre FROM empleados WHERE id = ?", (empleado_id,)) as cursor:
            empleado = await cursor.fetchone()

        if empleado:
            username = nombre_a_username(empleado['nombre'])
            await db.execute("DELETE FROM usuarios WHERE username LIKE ?", (f"{username}%",))

        await db.execute("DELETE FROM empleados WHERE id = ?", (empleado_id,))
        await db.commit()
    return {"ok": True}