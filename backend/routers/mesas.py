from fastapi import APIRouter, Depends
from auth import get_current_user
from models import MesaUpdate
import aiosqlite
from database import DB_PATH

router = APIRouter(prefix="/mesas", tags=["mesas"])

@router.get("/")
async def get_mesas(user=Depends(get_current_user)):
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute("SELECT * FROM mesas ORDER BY numero") as cursor:
            mesas = await cursor.fetchall()
    return [dict(m) for m in mesas]

@router.put("/{mesa_id}")
async def update_mesa(mesa_id: int, data: MesaUpdate, user=Depends(get_current_user)):
    async with aiosqlite.connect(DB_PATH) as db:
        if data.capacidad:
            await db.execute(
                "UPDATE mesas SET estado = ?, capacidad = ? WHERE id = ?",
                (data.estado, data.capacidad, mesa_id)
            )
        else:
            await db.execute(
                "UPDATE mesas SET estado = ? WHERE id = ?",
                (data.estado, mesa_id)
            )
        await db.commit()
    return {"ok": True}