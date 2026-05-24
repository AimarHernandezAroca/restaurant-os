import aiosqlite

DB_PATH = "restaurant.db"

async def init_db():
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("""
            CREATE TABLE IF NOT EXISTS usuarios (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE,
                password TEXT,
                rol TEXT DEFAULT 'camarero'
            )
        """)
        await db.execute("""
            CREATE TABLE IF NOT EXISTS mesas (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                numero INTEGER UNIQUE,
                estado TEXT DEFAULT 'libre',
                capacidad INTEGER DEFAULT 4
            )
        """)
        await db.execute("""
            CREATE TABLE IF NOT EXISTS platos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nombre TEXT,
                precio REAL,
                categoria TEXT
            )
        """)
        await db.execute("""
            CREATE TABLE IF NOT EXISTS pedidos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                mesa_id INTEGER,
                plato_id INTEGER,
                cantidad INTEGER DEFAULT 1,
                estado TEXT DEFAULT 'pendiente',
                notas TEXT DEFAULT '',
                fecha TEXT,
                FOREIGN KEY (mesa_id) REFERENCES mesas(id),
                FOREIGN KEY (plato_id) REFERENCES platos(id)
            )
        """)
        await db.execute("""
            CREATE TABLE IF NOT EXISTS historial (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                mesa_numero INTEGER,
                total REAL,
                fecha TEXT
            )
        """)
        await db.execute("""
            CREATE TABLE IF NOT EXISTS reservas (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                mesa_id INTEGER,
                nombre_cliente TEXT,
                telefono TEXT,
                fecha TEXT,
                hora TEXT,
                personas INTEGER,
                notas TEXT DEFAULT '',
                estado TEXT DEFAULT 'confirmada',
                FOREIGN KEY (mesa_id) REFERENCES mesas(id)
            )
        """)
        await db.execute("""
            CREATE TABLE IF NOT EXISTS empleados (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nombre TEXT,
                rol TEXT,
                telefono TEXT,
                email TEXT,
                activo INTEGER DEFAULT 1
            )
        """)
        await db.execute("""
            INSERT OR IGNORE INTO mesas (numero, estado, capacidad)
            SELECT value, 'libre', 4 FROM (
                WITH RECURSIVE cnt(value) AS (
                    SELECT 1 UNION ALL SELECT value+1 FROM cnt WHERE value < 10
                ) SELECT value FROM cnt
            )
        """)
        await db.commit()