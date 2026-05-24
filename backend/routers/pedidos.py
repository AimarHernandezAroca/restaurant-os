from fastapi import APIRouter, Depends
from auth import get_current_user
from models import PedidoCreate, PedidoUpdate
import aiosqlite
from database import DB_PATH
from datetime import datetime

router = APIRouter(prefix="/pedidos", tags=["pedidos"])
def hora_a_minutos(hora: str) -> int:
    h, m = hora.split(':')
    return int(h) * 60 + int(m)


@router.get("/listos")
async def get_pedidos_listos(user=Depends(get_current_user)):
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute("""
            SELECT p.id, p.estado, p.fecha,
                   m.numero as mesa_numero,
                   pl.nombre as plato_nombre
            FROM pedidos p
            JOIN mesas m ON p.mesa_id = m.id
            JOIN platos pl ON p.plato_id = pl.id
            WHERE p.estado = 'listo'
            AND DATE(p.fecha) = DATE('now')
            ORDER BY p.fecha DESC
        """) as cursor:
            pedidos = await cursor.fetchall()
    return [dict(p) for p in pedidos]


@router.get("/todos")
async def get_pedidos(user=Depends(get_current_user)):
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute("""
            SELECT p.id, p.cantidad, p.estado, p.fecha, p.notas,
                   m.numero as mesa_numero,
                   pl.nombre as plato_nombre,
                   pl.precio as plato_precio
            FROM pedidos p
            JOIN mesas m ON p.mesa_id = m.id
            JOIN platos pl ON p.plato_id = pl.id
            ORDER BY p.fecha DESC
        """) as cursor:
            pedidos = await cursor.fetchall()
    return [dict(p) for p in pedidos]

@router.get("/historial")
async def get_historial(user=Depends(get_current_user)):
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute("""
            SELECT * FROM historial ORDER BY fecha DESC LIMIT 50
        """) as cursor:
            historial = await cursor.fetchall()
    return [dict(h) for h in historial]

@router.get("/mesa/{mesa_id}")
async def get_pedidos_mesa(mesa_id: int, user=Depends(get_current_user)):
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute("""
            SELECT p.id, p.cantidad, p.estado, p.fecha, p.notas,
                   pl.nombre as plato_nombre,
                   pl.precio as plato_precio
            FROM pedidos p
            JOIN platos pl ON p.plato_id = pl.id
            WHERE p.mesa_id = ? AND p.estado != 'cobrado'
            ORDER BY p.fecha
        """, (mesa_id,)) as cursor:
            pedidos = await cursor.fetchall()
    return [dict(p) for p in pedidos]

@router.post("/")
async def crear_pedido(data: PedidoCreate, user=Depends(get_current_user)):
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            "INSERT INTO pedidos (mesa_id, plato_id, cantidad, notas, fecha) VALUES (?, ?, ?, ?, ?)",
            (data.mesa_id, data.plato_id, data.cantidad, data.notas, datetime.now().isoformat())
        )
        await db.execute("UPDATE mesas SET estado = 'ocupada' WHERE id = ?", (data.mesa_id,))
        await db.commit()
    return {"ok": True}

@router.put("/{pedido_id}")
async def actualizar_pedido(pedido_id: int, data: PedidoUpdate, user=Depends(get_current_user)):
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            "UPDATE pedidos SET estado = ? WHERE id = ?",
            (data.estado, pedido_id)
        )
        await db.commit()
    return {"ok": True}

@router.delete("/mesa/{mesa_id}/cobrar")
async def cobrar_mesa(mesa_id: int, user=Depends(get_current_user)):
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row

        async with db.execute("""
            SELECT COALESCE(SUM(pl.precio * p.cantidad), 0) as total
            FROM pedidos p
            JOIN platos pl ON p.plato_id = pl.id
            WHERE p.mesa_id = ? AND p.estado != 'cobrado'
        """, (mesa_id,)) as cursor:
            total = await cursor.fetchone()

        async with db.execute("SELECT numero FROM mesas WHERE id = ?", (mesa_id,)) as cursor:
            mesa = await cursor.fetchone()

        await db.execute(
            "INSERT INTO historial (mesa_numero, total, fecha) VALUES (?, ?, ?)",
            (mesa["numero"], total["total"], datetime.now().isoformat())
        )

        # Marcar todos los pedidos como cobrados
        await db.execute(
            "UPDATE pedidos SET estado = 'cobrado' WHERE mesa_id = ?", (mesa_id,)
        )

        # Completar la reserva activa en este momento (si existe)
        hoy = datetime.now().strftime('%Y-%m-%d')
        ahora_min = datetime.now().hour * 60 + datetime.now().minute

        async with db.execute("""
            SELECT id, hora FROM reservas
            WHERE mesa_id = ? AND fecha = ? AND estado = 'confirmada'
            ORDER BY hora ASC
        """, (mesa_id, hoy)) as cursor:
            reservas_hoy = await cursor.fetchall()

        for r in reservas_hoy:
            min_reserva = hora_a_minutos(r['hora'])
            # La reserva activa es la que empezó hace menos de 2 horas
            if min_reserva <= ahora_min <= min_reserva + 120:
                await db.execute(
                    "UPDATE reservas SET estado = 'completada' WHERE id = ?", (r['id'],)
                )
                break

        # Sincronizar estado de la mesa según reservas restantes
        async with db.execute("""
            SELECT COUNT(*) as total FROM reservas
            WHERE mesa_id = ? AND fecha = ? AND estado = 'confirmada'
        """, (mesa_id, hoy)) as cursor:
            restantes = await cursor.fetchone()

        if restantes['total'] > 0:
            await db.execute("UPDATE mesas SET estado = 'reservada' WHERE id = ?", (mesa_id,))
        else:
            await db.execute("UPDATE mesas SET estado = 'libre' WHERE id = ?", (mesa_id,))

        await db.commit()
    return {"ok": True}