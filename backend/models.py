from pydantic import BaseModel
from typing import Optional

class UsuarioLogin(BaseModel):
    username: str
    password: str

class UsuarioCreate(BaseModel):
    username: str
    password: str
    rol: str = 'camarero'

class MesaUpdate(BaseModel):
    estado: str
    capacidad: Optional[int] = None

class PlatoCreate(BaseModel):
    nombre: str
    precio: float
    categoria: str

class PlatoUpdate(BaseModel):
    nombre: Optional[str] = None
    precio: Optional[float] = None
    categoria: Optional[str] = None

class PedidoCreate(BaseModel):
    mesa_id: int
    plato_id: int
    cantidad: int = 1
    notas: str = ''

class PedidoUpdate(BaseModel):
    estado: str