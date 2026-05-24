from fastapi import APIRouter, Depends, HTTPException
from auth import get_current_user
from pydantic import BaseModel
import aiosqlite
from database import DB_PATH
from datetime import datetime

router = APIRouter(prefix="/reservas", tags=["reservas"])

class ReservaCreate(BaseModel):
    mesa_id: int
    nombre_cliente: str
    telefono: str
    fecha: str
    hora: str
    personas: int
    notas: str = ''

class ReservaUpdate(BaseModel):
    estado: str

def hora_a_minutos(hora: str) -> int:
    h, m = hora.split(':')
    return int(h) * 60 + int(m)

async def sincronizar_estado_mesa(db, mesa_id: int):
    """
    Lógica real de restaurante:
    - Si la mesa está ocupada (tiene pedidos activos) → no tocar
    - Si hay una reserva activa ahora mismo (dentro de 2h desde su hora) → reservada
    - Si hay reservas futuras hoy → reservada
    - Si no hay nada → libre
    """
    hoy = datetime.now().strftime('%Y-%m-%d')
    ahora_min = datetime.now().hour * 60 + datetime.now().minute

    # No tocar mesas ocupadas con pedidos activos
    async with db.execute("""
        SELECT COUNT(*) as total FROM pedidos
        WHERE mesa_id = ? AND estado NOT IN ('cobrado')
    """, (mesa_id,)) as cursor:
        pedidos_activos = await cursor.fetchone()

    if pedidos_activos[0] > 0:
        return  # Mesa ocupada con pedidos, no cambiar estado

    # Obtener reservas confirmadas de hoy ordenadas por hora
    async with db.execute("""
        SELECT id, hora FROM reservas
        WHERE mesa_id = ? AND fecha = ? AND estado = 'confirmada'
        ORDER BY hora ASC
    """, (mesa_id, hoy)) as cursor:
        reservas_hoy = await cursor.fetchall()

    # Marcar como completadas las reservas que ya han pasado más de 2 horas
    for r in reservas_hoy:
        min_reserva = hora_a_minutos(r[1])
        if ahora_min > min_reserva + 120:
            await db.execute(
                "UPDATE reservas SET estado = 'completada' WHERE id = ?", (r[0],)
            )

    # Recargar reservas activas tras la limpieza
    async with db.execute("""
        SELECT id, hora FROM reservas
        WHERE mesa_id = ? AND fecha = ? AND estado = 'confirmada'
        ORDER BY hora ASC
    """, (mesa_id, hoy)) as cursor:
        reservas_activas = await cursor.fetchall()

    if reservas_activas:
        await db.execute("UPDATE mesas SET estado = 'reservada' WHERE id = ?", (mesa_id,))
    else:
        await db.execute("UPDATE mesas SET estado = 'libre' WHERE id = ?", (mesa_id,))

@router.get("/")
async def get_reservas(user=Depends(get_current_user)):
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row

        # Sincronizar estados de todas las mesas
        async with db.execute("SELECT id FROM mesas") as cursor:
            todas_mesas = await cursor.fetchall()
        for m in todas_mesas:
            await sincronizar_estado_mesa(db, m[0])
        await db.commit()

        async with db.execute("""
            SELECT r.*, m.numero as mesa_numero
            FROM reservas r
            JOIN mesas m ON r.mesa_id = m.id
            ORDER BY r.fecha ASC, r.hora ASC
        """) as cursor:
            reservas = await cursor.fetchall()
    return [dict(r) for r in reservas]

@router.get("/mesas-disponibles")
async def get_mesas_disponibles(fecha: str = None, hora: str = None, user=Depends(get_current_user)):
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row

        async with db.execute("SELECT * FROM mesas ORDER BY numero") as cursor:
            todas = await cursor.fetchall()

        mesas_bloqueadas = set()

        # Excluir mesas ocupadas con pedidos activos
        for m in todas:
            if m['estado'] == 'ocupada':
                mesas_bloqueadas.add(m['id'])

        # Si se especifica fecha y hora, excluir mesas con conflicto de horario
        if fecha and hora:
            minutos_nueva = hora_a_minutos(hora)
            async with db.execute("""
                SELECT mesa_id, hora FROM reservas
                WHERE fecha = ? AND estado = 'confirmada'
            """, (fecha,)) as cursor:
                reservas_dia = await cursor.fetchall()

            for r in reservas_dia:
                minutos_exist = hora_a_minutos(r['hora'])
                if abs(minutos_nueva - minutos_exist) < 120:
                    mesas_bloqueadas.add(r['mesa_id'])

        mesas_disponibles = [m for m in todas if m['id'] not in mesas_bloqueadas]

    return [dict(m) for m in mesas_disponibles]

@router.post("/")
async def crear_reserva(data: ReservaCreate, user=Depends(get_current_user)):
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row

        # Verificar conflictos de horario para esa mesa y fecha
        async with db.execute("""
            SELECT hora FROM reservas
            WHERE mesa_id = ? AND fecha = ? AND estado = 'confirmada'
        """, (data.mesa_id, data.fecha)) as cursor:
            existentes = await cursor.fetchall()

        minutos_nueva = hora_a_minutos(data.hora)
        for r in existentes:
            minutos_exist = hora_a_minutos(r['hora'])
            if abs(minutos_nueva - minutos_exist) < 120:
                raise HTTPException(
                    status_code=400,
                    detail=f"Ya hay una reserva a las {r['hora']}. Mínimo 2 horas entre reservas para la misma mesa."
                )

        await db.execute("""
            INSERT INTO reservas (mesa_id, nombre_cliente, telefono, fecha, hora, personas, notas)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (data.mesa_id, data.nombre_cliente, data.telefono,
              data.fecha, data.hora, data.personas, data.notas))

        await sincronizar_estado_mesa(db, data.mesa_id)
        await db.commit()

    return {"ok": True}

@router.put("/{reserva_id}")
async def actualizar_reserva(reserva_id: int, data: ReservaUpdate, user=Depends(get_current_user)):
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row

        async with db.execute("SELECT mesa_id FROM reservas WHERE id = ?", (reserva_id,)) as cursor:
            reserva = await cursor.fetchone()

        await db.execute("UPDATE reservas SET estado = ? WHERE id = ?", (data.estado, reserva_id))

        if reserva:
            await sincronizar_estado_mesa(db, reserva['mesa_id'])

        await db.commit()
    return {"ok": True}

@router.delete("/{reserva_id}")
async def eliminar_reserva(reserva_id: int, user=Depends(get_current_user)):
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row

        async with db.execute("SELECT mesa_id FROM reservas WHERE id = ?", (reserva_id,)) as cursor:
            reserva = await cursor.fetchone()

        await db.execute("DELETE FROM reservas WHERE id = ?", (reserva_id,))

        if reserva:
            await sincronizar_estado_mesa(db, reserva['mesa_id'])

        await db.commit()
    return {"ok": True}