import os
import hashlib
from datetime import datetime, timedelta
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from dotenv import load_dotenv
import aiosqlite
from database import DB_PATH

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "restaurantos_clave_secreta_2024")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 8

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

def verificar_password(plain, hashed):
    return hashlib.sha256(plain.encode()).hexdigest() == hashed

def hashear_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

def crear_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token inválido o expirado",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        rol: str = payload.get("rol", "camarero")
        if username is None:
            raise credentials_exception
        return {"username": username, "rol": rol}
    except JWTError:
        raise credentials_exception

async def require_admin(user=Depends(get_current_user)):
    if user["rol"] != "admin":
        raise HTTPException(status_code=403, detail="Acceso denegado. Se requiere rol admin.")
    return user

async def require_admin_or_camarero(user=Depends(get_current_user)):
    if user["rol"] not in ["admin", "camarero"]:
        raise HTTPException(status_code=403, detail="Acceso denegado.")
    return user