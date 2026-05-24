from fastapi import APIRouter, Depends, HTTPException
from auth import get_current_user
from models import PlatoCreate, PlatoUpdate
import aiosqlite
from database import DB_PATH

router = APIRouter(prefix="/platos", tags=["platos"])

@router.get("/")
async def get_platos(user=Depends(get_current_user)):
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute("SELECT * FROM platos ORDER BY categoria, nombre") as cursor:
            platos = await cursor.fetchall()
    return [dict(p) for p in platos]

@router.post("/")
async def crear_plato(data: PlatoCreate, user=Depends(get_current_user)):
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            "INSERT INTO platos (nombre, precio, categoria) VALUES (?, ?, ?)",
            (data.nombre, data.precio, data.categoria)
        )
        await db.commit()
    return {"ok": True}

@router.put("/{plato_id}")
async def actualizar_plato(plato_id: int, data: PlatoUpdate, user=Depends(get_current_user)):
    async with aiosqlite.connect(DB_PATH) as db:
        if data.nombre:
            await db.execute("UPDATE platos SET nombre = ? WHERE id = ?", (data.nombre, plato_id))
        if data.precio:
            await db.execute("UPDATE platos SET precio = ? WHERE id = ?", (data.precio, plato_id))
        if data.categoria:
            await db.execute("UPDATE platos SET categoria = ? WHERE id = ?", (data.categoria, plato_id))
        await db.commit()
    return {"ok": True}

@router.delete("/{plato_id}")
async def eliminar_plato(plato_id: int, user=Depends(get_current_user)):
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("DELETE FROM platos WHERE id = ?", (plato_id,))
        await db.commit()
    return {"ok": True}