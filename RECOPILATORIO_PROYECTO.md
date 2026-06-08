# RECOPILATORIO COMPLETO DEL PROYECTO

## 📋 Información General
- Nombre del proyecto: PWACuartel / Bomberos Checklist
- Propósito: Gestión de inspecciones de unidades de bomberos para la Central 80, con autenticación, registro de inspecciones, historial y rutinas de herramientas.
- Tecnologías: React, Vite, Node.js, Express, SQLite, JWT, PWA.
- Comandos de inicio:
  - Frontend: `npm run dev`
  - Backend: `npm start`

## 📁 Estructura de Carpetas
```
frontend/
├── index.html
├── package.json
├── vite.config.js
├── public/
│   ├── manifest.json
│   └── sw.js
└── src/
    ├── App.jsx
    ├── main.jsx
    ├── styles.css
    ├── context/
    │   └── AuthContext.jsx
    ├── pages/
    │   ├── Historial.css
    │   ├── Historial.jsx
    │   ├── Inspeccion.jsx
    │   ├── Login.jsx
    │   ├── PrimerLogin.jsx
    │   ├── Resumen.jsx
    │   └── Unidades.jsx
    └── services/
        └── api.js

backend/
├── .env
├── app.js
├── init-db.js
├── package.json
├── db/
│   ├── bomberos.db
│   ├── index.js
│   └── schema.sql
├── middleware/
│   └── auth.js
├── routes/
│   ├── auth.js
│   ├── inspecciones.js
│   ├── rutina.js
│   └── unidades.js
└── controllers/
    ├── inspeccionesController.js
    ├── rutinaController.js
    └── unidadesController.js
```

## 📦 package.json

### Frontend
```json
{
  "name": "bomberos-checklist-frontend",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.1",
    "vite": "^5.4.1"
  }
}
```

### Backend
```json
{
  "name": "bomberos-checklist-backend",
  "version": "1.0.0",
  "description": "Backend para gestión de revisión de unidades de bomberos",
  "main": "app.js",
  "scripts": {
    "start": "node app.js",
    "dev": "nodemon app.js",
    "init-db": "node init-db.js"
  },
  "dependencies": {
    "bcryptjs": "^3.0.3",
    "cors": "^2.8.5",
    "dotenv": "^17.4.2",
    "express": "^4.18.2",
    "jsonwebtoken": "^9.0.3",
    "sqlite3": "^5.1.6"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}
```

## 🔐 Variables de Ambiente

### Backend (.env)
```text
PORT=4000
SQLITE_FILE=./db/bomberos.db
# Cambia esto por una clave fuerte y secreta en producción
JWT_SECRET=change_this_to_a_strong_random_secret_please
# Duración del token JWT (ej: 7d, 12h, 3600s)
JWT_EXPIRES_IN=7d
```

### Frontend (.env)
```text
NO EXISTE
```

## 🗄️ Base de Datos - Schema
```sql
PRAGMA foreign_keys = ON;

-- =========================
-- TABLAS
-- =========================
CREATE TABLE IF NOT EXISTS usuarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  legajo TEXT UNIQUE NOT NULL,
  nombre TEXT NOT NULL,
  contrasena TEXT,
  primer_login INTEGER DEFAULT 1,
  activo INTEGER DEFAULT 1,
  fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
  fecha_ultimo_login DATETIME
);

-- Tabla de auditoría de logins
CREATE TABLE IF NOT EXISTS auditorias_login (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario_id INTEGER NOT NULL,
  legajo TEXT NOT NULL,
  fecha_login DATETIME DEFAULT CURRENT_TIMESTAMP,
  ip TEXT,
  estado TEXT,
  FOREIGN KEY(usuario_id) REFERENCES usuarios(id)
);

-- Crear usuarios iniciales (bomberios de central 80)
-- Reemplaza XXX con los legajos reales
INSERT OR IGNORE INTO usuarios (legajo, nombre, primer_login) VALUES
('80/001', 'Bombero 001', 1),
('80/002', 'Bombero 002', 1),
('80/003', 'Bombero 003', 1),
('80/004', 'Bombero 004', 1),
('80/005', 'Bombero 005', 1);

UPDATE usuarios
SET primer_login = 1, contrasena = NULL
WHERE legajo = '80/001';


CREATE TABLE IF NOT EXISTS unidades (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  placa TEXT
);

CREATE TABLE IF NOT EXISTS herramientas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS rutina_unidad (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  unidad_id INTEGER NOT NULL,
  herramienta_id INTEGER NOT NULL,
  orden INTEGER NOT NULL,
  UNIQUE (unidad_id, herramienta_id),
  FOREIGN KEY (unidad_id) REFERENCES unidades(id) ON DELETE CASCADE,
  FOREIGN KEY (herramienta_id) REFERENCES herramientas(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS inspecciones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  unidad_id INTEGER NOT NULL,
  user_id INTEGER,
  fecha TEXT NOT NULL DEFAULT (datetime('now')),
  notas TEXT,
  FOREIGN KEY (unidad_id) REFERENCES unidades(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS inspeccion_detalle (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  inspeccion_id INTEGER NOT NULL,
  herramienta_id INTEGER NOT NULL,
  estado TEXT NOT NULL CHECK (estado IN ('ok', 'no_esta', 'sin_acondicionar')),
  observacion TEXT,
  FOREIGN KEY (inspeccion_id) REFERENCES inspecciones(id) ON DELETE CASCADE,
  FOREIGN KEY (herramienta_id) REFERENCES herramientas(id)
);

-- =========================
-- LIMPIEZA OPCIONAL
-- =========================
DELETE FROM inspeccion_detalle;
DELETE FROM inspecciones;
DELETE FROM rutina_unidad;
DELETE FROM herramientas;
DELETE FROM unidades;

-- Reiniciar autoincrement (opcional en SQLite)
DELETE FROM sqlite_sequence WHERE name IN (
  'unidades',
  'herramientas',
  'rutina_unidad',
  'inspecciones',
  'inspeccion_detalle'
);

-- =========================
-- UNIDADES / SECTORES
-- (tomados del XLS)
-- =========================
INSERT INTO unidades (nombre, placa) VALUES
  ('Unidad 15', '15'),
  ('Unidad 43', '43'),
  ('Unidad 30', '30'),
  ('Unidad 33', '33'),
  ('Unidad 35', '35'),
  ('Unidad 37', '37'),
  ('Unidad 38', '38'),
  ('Unidad 39', '39'),
  ('Unidad 40', '40'),
  ('Unidad 42', '42'),
  ('Escalera', 'ESCALERA'),
  ('Pasillo', 'PASILLO'),
  ('Sector 4', 'SECTOR 4'),
  ('Depto', 'DEPTO');

-- =========================
-- HERRAMIENTAS / MATERIALES
-- (base cargada a partir del XLS)
-- =========================
INSERT INTO herramientas (nombre) VALUES
  ('ABRELATAS HOLMATRO'),
  ('ACEITE PARA CADENA'),
  ('ADAPTADOR DE 25'''' A 38'''' S-S'),
  ('ADAPTADOR DE 38'''' A 38'''' S-W'),
  ('ADAPTADOR DE 38'''' A 45'''' S-S'),
  ('ADAPTADOR DE 38'''' A 45'''' S-W HEMBRA'),
  ('ADAPTADOR DE 38'''' A 45'''' S-W MACHO'),
  ('ADAPTADOR DE 38'''' A 63'''' S-S'),
  ('ADAPTADOR DE 38'''' A 63'''' S-W HEMBRA'),
  ('ADAPTADOR DE 45'''' A 45'''' S-W'),
  ('ADAPTADOR DE 45'''' A 45'''' W-W'),
  ('ADAPTADOR DE 45'''' A 63'''' S-S'),
  ('ADAPTADOR DE 45'''' A 63'''' S-W HEMBRA'),
  ('ADAPTADOR DE 45'''' A 63'''' S-W MACHO'),
  ('ADAPTADOR DE 63'''' A 25'''' S-S'),
  ('ADAPTADOR DE 63'''' A 45'''' S-W HEMBRA'),
  ('ADAPTADOR DE 63'''' A 45'''' W-W'),
  ('ADAPTADOR DE 63'''' A 63'''' S-RAPIDO'),
  ('ADAPTADOR DE 63'''' A 63'''' S-W'),
  ('ADAPTADOR DE MOTOBOMBA ACOP RAPIDO'),
  ('ADAPTADOR DE MOTOBOMBA DE 63 A 63'),
  ('ALARGUE NEGRO 222/12V'),
  ('APAREJO'),
  ('ARIETE'),
  ('ARNES DE RESCATE 5 PUNTOS'),
  ('AZADA CUADRADA'),
  ('AZADA TRIANGULAR'),
  ('BANDERIN TRIAGE AMARILLO'),
  ('BANDERIN TRIAGE NEGRO'),
  ('BANDERIN TRIAGE ROJO'),
  ('BANDERIN TRIAGE VERDE'),
  ('BARRETA'),
  ('BARRETA PATA DE CABRA'),
  ('BATEFUEGO'),
  ('BIDON CON MEZCLA'),
  ('BIDON DE ESPUMA 20L'),
  ('BIDON DE NAFTA'),
  ('BOLSA DE OBITO'),
  ('BOTIQUIN DE PRIMEROS AUXILIOS (APH)'),
  ('CAJA DE ELECTRICISTA'),
  ('CAJA DE GUANTES DE LATEX'),
  ('CAMARA TERMICA MSA'),
  ('CAMILLA CANASTO RESCATE'),
  ('CARGADORES'),
  ('CARRETEL ALARGUE'),
  ('CASCO CON PROTECCION AUDITIVA'),
  ('CASCO DE RESCATE'),
  ('CEPILLO'),
  ('CHALECO EXTRICACION ADULTO'),
  ('CHALECO EXTRICACION PEDIATRICO'),
  ('CHALECOS REFLECTIVOS'),
  ('CHICOTE'),
  ('CILINDRO DRAGUER'),
  ('CINTA DE AMARRE'),
  ('CINTA DE PELIGRO'),
  ('CINTA DE TRIAGE AMARILLA'),
  ('CINTA DE TRIAGE NEGRA'),
  ('CINTA DE TRIAGE ROJA'),
  ('CINTA DE TRIAGE VERDE'),
  ('CINTA PARA TRAKA'),
  ('CIZALLA HIDRAULICA HOLMATRO'),
  ('COLLAR CERVICAL PHILADELPHIA'),
  ('COLLAR CERVICAL PHILLY'),
  ('CONO BALIZAR CHICO'),
  ('CONO BALIZAR GRANDE'),
  ('CORTA CANDADO'),
  ('CORTA FIERRO PUNTA ANCHA'),
  ('CORTA FIERRO PUNTA REDONDA'),
  ('CORTA PEDAL HOLMATRO'),
  ('CORTA PEDAL MANUAL HIDRAULICO'),
  ('CRIKET'),
  ('CUERDA DINAMICA'),
  ('CUERDA ESTATICA'),
  ('CUNA DE CARGA BACIGALUPPI'),
  ('CUNA DE CARGA LION'),
  ('CUNA DE CARGA ROTULIA'),
  ('CUÑA CAUCHO CHICA'),
  ('CUÑA CAUCHO GRANDE'),
  ('CUÑAS DE MADERA'),
  ('DESFRIBILADOR EXTERNO AUTOMATICO'),
  ('DEVANADERA'),
  ('DIVERGENTE'),
  ('EMBUDO'),
  ('EQUIPO FORESTAL'),
  ('ERA DRAGUER'),
  ('ERA MSA'),
  ('ERA SCOTT'),
  ('ESCALERA 2 TRAMOS 8 MTS'),
  ('ESCALERA DE ALUMINIO 12 MTS'),
  ('ESCALERA DE MADERA'),
  ('EXPANSOR RAM HOLMATRO'),
  ('EXTINTOR ABC 10KG'),
  ('EXTINTOR ABC 5KG'),
  ('FAJAS PARA EQUINO'),
  ('FERULAS DE MADERA'),
  ('FERULAS INFLABLES'),
  ('FIELTROS'),
  ('FIJADORES AZUL'),
  ('FRAZADA'),
  ('FUENTE DE PODER HOLMATRO'),
  ('GANCHO BICHERO'),
  ('GANCHO DE ESCOMBRAMIENTO'),
  ('GANCHO PESCADOR'),
  ('GATO CRICKET Y HEAS VEHICULOS'),
  ('GATO DE TORNILLO'),
  ('GENERADOR BIGG STRATTON'),
  ('GENERADOR KAWASAKI'),
  ('GENERADOR LOGUS GG3300'),
  ('GENERADOR NIWA'),
  ('GENERADOR PHOENIX'),
  ('GRILLETES 10 TONELADAS'),
  ('GUANTES DE OBRA'),
  ('GUANTES DIELECTRICOS'),
  ('GUANTES NARANJAS'),
  ('GUANTES VERDES'),
  ('GUIA DE RESPUESTA ANTE EMERGENCIAS'),
  ('HACHA CHICA'),
  ('HACHA GRANDE'),
  ('HALLIGAN'),
  ('HANDY YAESU'),
  ('HORQUILLA'),
  ('INFLADOR'),
  ('INMOBILIZADOR LATERAL PARA TABLA'),
  ('KIT DE AIRBAG'),
  ('KIT DE AIRBAG HOLMATRO'),
  ('LANZA CAUDAL FIJO 38'''''),
  ('LANZA CAUDAL REGULABLE 25'''''),
  ('LANZA CAUDAL REGULABLE 38'''''),
  ('LANZA CAUDAL REGULABLE 45'''''),
  ('LANZA CORTINA DE AGUA 45'''''),
  ('LANZA DE ESPUMA'),
  ('LANZA FORESTAL DE 25'''''),
  ('LANZA FORESTAL DE 38'''''),
  ('LANZA FORESTAL DE 45'''''),
  ('LAPIZ DETECTOR DE TENSION'),
  ('LINTERNA BLACK DECKER'),
  ('LINTERNA DEFIANT'),
  ('LINTERNA VULCAN'),
  ('LLAVE DE ASCENSOR'),
  ('LLAVE DE TREN'),
  ('LLAVE DE VALBULA'),
  ('LLAVE FRANCESA'),
  ('LLAVE STILSON'),
  ('LLAVE UNION'),
  ('LONA AMARILLA'),
  ('LONA ANARANJADA'),
  ('LONA NEGRA'),
  ('LONA ROJA'),
  ('LONA VERDE'),
  ('MACHETE'),
  ('MANGA 25,4'''''),
  ('MANGA 38'''''),
  ('MANGA 45'''''),
  ('MANGA 63'''''),
  ('MANGO DE CEPILLO'),
  ('MANGUERA ANARANJA SIST. CORE'),
  ('MANGUERA AZUL SIST. CORE'),
  ('MANGUERA ROJA'),
  ('MANGUEROTE 114'''''),
  ('MANGUEROTE 63'''''),
  ('MANTA IMANTADA CHICA'),
  ('MANTA IMANTADA GRANDE'),
  ('MANTA IMANTADA MEDIANA'),
  ('MASA CHICA'),
  ('MASA GRANDE'),
  ('MASCARA CON FILTRO'),
  ('MASCARA DE EMERGENCIA'),
  ('MASCARA DRAGUER'),
  ('MASCARA FACIAL AMBU'),
  ('MASCARA MSA'),
  ('MASCARA RCP'),
  ('MASCARA SCOTT'),
  ('MOCHILA 25,4'''' ACOPLE RAPIDO'),
  ('MOCHILA FORESTAL'),
  ('MOTOBOMBA HONDA'),
  ('MOTOBOMBA ROBIN'),
  ('MOTOCOMPRESOR DE ERA'),
  ('MOTOSIERRA CS 510'),
  ('OXIMETRO'),
  ('PALA ANCHA'),
  ('PALA DE PLASTICO'),
  ('PALA PUNTA'),
  ('PALA PUNTA REDONDA'),
  ('PICO'),
  ('PINZA ALICATE'),
  ('PINZA DE PUNTA'),
  ('PINZA UNIVERSAL'),
  ('PLACA CAUCHO CHICA'),
  ('PLACA CAUCHO GRANDE'),
  ('PLACA CAUCHO MEDIANA'),
  ('PLATAFORMA DE RESCATE'),
  ('PLATAFORMA PROTECTORA MANGA'),
  ('PROTECTOR DE VIDRIOS'),
  ('PROTECTOR VISUAL'),
  ('PUNTAL HOLMATRO V-STRUT'),
  ('RASTRILLO FORESTAL'),
  ('RASTRILLO FORESTAL COMBINADO'),
  ('REFLECTOR 220 V'),
  ('SACABUJIAS'),
  ('SEPARADOR HIDRAULICO HOLMATRO'),
  ('SERRUCHO DE CARPINTERO'),
  ('SIERRA CLAS-MASTER'),
  ('SIERRA MANUAL'),
  ('SLINGA 3 TONELADAS'),
  ('SOGA'),
  ('SOPORTE PARA RAM HOLMATRO'),
  ('TABLA ESPINAL LARGA DE MADERA'),
  ('TABLA ESPINAL LARGA PLASTICO'),
  ('TABLA MEDIA ESPINAL MADERA'),
  ('TABLONES DE 3M'),
  ('TACHO DE ESPUMA 200L'),
  ('TACO DE VEHICULO'),
  ('TACOS DE MADERA'),
  ('TACOS ESCALONADOS DE CAUCHO'),
  ('TACOS ESCALONADOS DE MADERA'),
  ('TENSIOMETRO'),
  ('TIJERA'),
  ('TIJERA CORTA'),
  ('TRAJE TIPO C DESCARTABLE'),
  ('TRINCHETA'),
  ('TRIPODE DE ILUMINACION'),
  ('TRIPODE DE RESCATE'),
  ('TRINEO PARA ESPUMA'),
  ('TRIVERGENTE'),
  ('TUBO O2 AL 50%');

-- =========================
-- RUTINA POR UNIDAD
-- =========================
-- IMPORTANTE:
-- Como el schema actual NO guarda cantidades, acá solo se da de alta
-- la presencia de la herramienta en la unidad/sector cuando en el XLS
-- la cantidad es mayor a 0.

-- Ejemplo de carga inicial usando datos reales del XLS:
-- Unidad 15

INSERT INTO rutina_unidad (unidad_id, herramienta_id, orden)
SELECT u.id, h.id, 1
FROM unidades u, herramientas h
WHERE u.nombre = 'Unidad 15' AND h.nombre = 'ABRELATAS HOLMATRO';

INSERT INTO rutina_unidad (unidad_id, herramienta_id, orden)
SELECT u.id, h.id, 2
FROM unidades u, herramientas h
WHERE u.nombre = 'Unidad 15' AND h.nombre = 'ACEITE PARA CADENA';

INSERT INTO rutina_unidad (unidad_id, herramienta_id, orden)
SELECT u.id, h.id, 3
FROM unidades u, herramientas h
WHERE u.nombre = 'Unidad 15' AND h.nombre = 'ADAPTADOR DE 25'''' A 38'''' S-S';

INSERT INTO rutina_unidad (unidad_id, herramienta_id, orden)
SELECT u.id, h.id, 4
FROM unidades u, herramientas h
WHERE u.nombre = 'Unidad 15' AND h.nombre = 'ADAPTADOR DE 38'''' A 38'''' S-W';

INSERT INTO rutina_unidad (unidad_id, herramienta_id, orden)
SELECT u.id, h.id, 5
FROM unidades u, herramientas h
WHERE u.nombre = 'Unidad 15' AND h.nombre = 'ADAPTADOR DE 38'''' A 45'''' S-S';

INSERT INTO rutina_unidad (unidad_id, herramienta_id, orden)
SELECT u.id, h.id, 6
FROM unidades u, herramientas h
WHERE u.nombre = 'Unidad 15' AND h.nombre = 'ADAPTADOR DE 38'''' A 63'''' S-S';

INSERT INTO rutina_unidad (unidad_id, herramienta_id, orden)
SELECT u.id, h.id, 7
FROM unidades u, herramientas h
WHERE u.nombre = 'Unidad 15' AND h.nombre = 'ALARGUE NEGRO 222/12V';

INSERT INTO rutina_unidad (unidad_id, herramienta_id, orden)
SELECT u.id, h.id, 8
FROM unidades u, herramientas h
WHERE u.nombre = 'Unidad 15' AND h.nombre = 'ARIETE';

INSERT INTO rutina_unidad (unidad_id, herramienta_id, orden)
SELECT u.id, h.id, 9
FROM unidades u, herramientas h
WHERE u.nombre = 'Unidad 15' AND h.nombre = 'ARNES DE RESCATE 5 PUNTOS';

INSERT INTO rutina_unidad (unidad_id, herramienta_id, orden)
SELECT u.id, h.id, 10
FROM unidades u, herramientas h
WHERE u.nombre = 'Unidad 15' AND h.nombre = 'BARRETA';

INSERT INTO rutina_unidad (unidad_id, herramienta_id, orden)
SELECT u.id, h.id, 11
FROM unidades u, herramientas h
WHERE u.nombre = 'Unidad 15' AND h.nombre = 'BARRETA PATA DE CABRA';

INSERT INTO rutina_unidad (unidad_id, herramienta_id, orden)
SELECT u.id, h.id, 12
FROM unidades u, herramientas h
WHERE u.nombre = 'Unidad 15' AND h.nombre = 'BOTIQUIN DE PRIMEROS AUXILIOS (APH)';

INSERT INTO rutina_unidad (unidad_id, herramienta_id, orden)
SELECT u.id, h.id, 13
FROM unidades u, herramientas h
WHERE u.nombre = 'Unidad 15' AND h.nombre = 'CAJA DE ELECTRICISTA';

INSERT INTO rutina_unidad (unidad_id, herramienta_id, orden)
SELECT u.id, h.id, 14
FROM unidades u, herramientas h
WHERE u.nombre = 'Unidad 15' AND h.nombre = 'CAJA DE GUANTES DE LATEX';

INSERT INTO rutina_unidad (unidad_id, herramienta_id, orden)
SELECT u.id, h.id, 15
FROM unidades u, herramientas h
WHERE u.nombre = 'Unidad 15' AND h.nombre = 'CAMARA TERMICA MSA';

INSERT INTO rutina_unidad (unidad_id, herramienta_id, orden)
SELECT u.id, h.id, 16
FROM unidades u, herramientas h
WHERE u.nombre = 'Unidad 15' AND h.nombre = 'CAMILLA CANASTO RESCATE';

INSERT INTO rutina_unidad (unidad_id, herramienta_id, orden)
SELECT u.id, h.id, 17
FROM unidades u, herramientas h
WHERE u.nombre = 'Unidad 15' AND h.nombre = 'CARGADORES';

INSERT INTO rutina_unidad (unidad_id, herramienta_id, orden)
SELECT u.id, h.id, 18
FROM unidades u, herramientas h
WHERE u.nombre = 'Unidad 15' AND h.nombre = 'CASCO DE RESCATE';

INSERT INTO rutina_unidad (unidad_id, herramienta_id, orden)
SELECT u.id, h.id, 19
FROM unidades u, herramientas h
WHERE u.nombre = 'Unidad 15' AND h.nombre = 'CHALECO EXTRICACION ADULTO';

INSERT INTO rutina_unidad (unidad_id, herramienta_id, orden)
SELECT u.id, h.id, 20
FROM unidades u, herramientas h
WHERE u.nombre = 'Unidad 15' AND h.nombre = 'CHALECO EXTRICACION PEDIATRICO';

INSERT INTO rutina_unidad (unidad_id, herramienta_id, orden)
SELECT u.id, h.id, 21
FROM unidades u, herramientas h
WHERE u.nombre = 'Unidad 15' AND h.nombre = 'CHICOTE';

INSERT INTO rutina_unidad (unidad_id, herramienta_id, orden)
SELECT u.id, h.id, 22
FROM unidades u, herramientas h
WHERE u.nombre = 'Unidad 15' AND h.nombre = 'CILINDRO DRAGUER';

INSERT INTO rutina_unidad (unidad_id, herramienta_id, orden)
SELECT u.id, h.id, 23
FROM unidades u, herramientas h
WHERE u.nombre = 'Unidad 15' AND h.nombre = 'CINTA DE PELIGRO';

INSERT INTO rutina_unidad (unidad_id, herramienta_id, orden)
SELECT u.id, h.id, 24
FROM unidades u, herramientas h
WHERE u.nombre = 'Unidad 15' AND h.nombre = 'CINTA PARA TRAKA';

INSERT INTO rutina_unidad (unidad_id, herramienta_id, orden)
SELECT u.id, h.id, 25
FROM unidades u, herramientas h
WHERE u.nombre = 'Unidad 15' AND h.nombre = 'CIZALLA HIDRAULICA HOLMATRO';

INSERT INTO rutina_unidad (unidad_id, herramienta_id, orden)
SELECT u.id, h.id, 26
FROM unidades u, herramientas h
WHERE u.nombre = 'Unidad 15' AND h.nombre = 'CONO BALIZAR GRANDE';

INSERT INTO rutina_unidad (unidad_id, herramienta_id, orden)
SELECT u.id, h.id, 27
FROM unidades u, herramientas h
WHERE u.nombre = 'Unidad 15' AND h.nombre = 'CRIKET';

INSERT INTO rutina_unidad (unidad_id, herramienta_id, orden)
SELECT u.id, h.id, 28
FROM unidades u, herramientas h
WHERE u.nombre = 'Unidad 15' AND h.nombre = 'CUERDA DINAMICA';

INSERT INTO rutina_unidad (unidad_id, herramienta_id, orden)
SELECT u.id, h.id, 29
FROM unidades u, herramientas h
WHERE u.nombre = 'Unidad 15' AND h.nombre = 'ERA DRAGUER';

INSERT INTO rutina_unidad (unidad_id, herramienta_id, orden)
SELECT u.id, h.id, 30
FROM unidades u, herramientas h
WHERE u.nombre = 'Unidad 15' AND h.nombre = 'EXPANSOR RAM HOLMATRO';

-- Unidad 43 (muestras)
INSERT INTO rutina_unidad (unidad_id, herramienta_id, orden)
SELECT u.id, h.id, 1
FROM unidades u, herramientas h
WHERE u.nombre = 'Unidad 43' AND h.nombre = 'ADAPTADOR DE 25'''' A 38'''' S-S';

INSERT INTO rutina_unidad (unidad_id, herramienta_id, orden)
SELECT u.id, h.id, 2
FROM unidades u, herramientas h
WHERE u.nombre = 'Unidad 43' AND h.nombre = 'ADAPTADOR DE 38'''' A 63'''' S-W HEMBRA';

INSERT INTO rutina_unidad (unidad_id, herramienta_id, orden)
SELECT u.id, h.id, 3
FROM unidades u, herramientas h
WHERE u.nombre = 'Unidad 43' AND h.nombre = 'ALARGUE NEGRO 222/12V';

INSERT INTO rutina_unidad (unidad_id, herramienta_id, orden)
SELECT u.id, h.id, 4
FROM unidades u, herramientas h
WHERE u.nombre = 'Unidad 43' AND h.nombre = 'BARRETA PATA DE CABRA';

INSERT INTO rutina_unidad (unidad_id, herramienta_id, orden)
SELECT u.id, h.id, 5
FROM unidades u, herramientas h
WHERE u.nombre = 'Unidad 43' AND h.nombre = 'BIDON DE NAFTA';

INSERT INTO rutina_unidad (unidad_id, herramienta_id, orden)
SELECT u.id, h.id, 6
FROM unidades u, herramientas h
WHERE u.nombre = 'Unidad 43' AND h.nombre = 'CHALECOS REFLECTIVOS';

INSERT INTO rutina_unidad (unidad_id, herramienta_id, orden)
SELECT u.id, h.id, 7
FROM unidades u, herramientas h
WHERE u.nombre = 'Unidad 43' AND h.nombre = 'COLLAR CERVICAL PHILADELPHIA';

INSERT INTO rutina_unidad (unidad_id, herramienta_id, orden)
SELECT u.id, h.id, 8
FROM unidades u, herramientas h
WHERE u.nombre = 'Unidad 43' AND h.nombre = 'CUÑAS DE MADERA';

INSERT INTO rutina_unidad (unidad_id, herramienta_id, orden)
SELECT u.id, h.id, 9
FROM unidades u, herramientas h
WHERE u.nombre = 'Unidad 43' AND h.nombre = 'DEVANADERA';

INSERT INTO rutina_unidad (unidad_id, herramienta_id, orden)
SELECT u.id, h.id, 10
FROM unidades u, herramientas h
WHERE u.nombre = 'Unidad 43' AND h.nombre = 'ERA MSA';

-- Unidad 30 (muestras)
INSERT INTO rutina_unidad (unidad_id, herramienta_id, orden)
SELECT u.id, h.id, 1
FROM unidades u, herramientas h
WHERE u.nombre = 'Unidad 30' AND h.nombre = 'ADAPTADOR DE 38'''' A 45'''' S-S';

INSERT INTO rutina_unidad (unidad_id, herramienta_id, orden)
SELECT u.id, h.id, 2
FROM unidades u, herramientas h
WHERE u.nombre = 'Unidad 30' AND h.nombre = 'BIDON DE ESPUMA 20L';

INSERT INTO rutina_unidad (unidad_id, herramienta_id, orden)
SELECT u.id, h.id, 3
FROM unidades u, herramientas h
WHERE u.nombre = 'Unidad 30' AND h.nombre = 'CINTA DE PELIGRO';

INSERT INTO rutina_unidad (unidad_id, herramienta_id, orden)
SELECT u.id, h.id, 4
FROM unidades u, herramientas h
WHERE u.nombre = 'Unidad 30' AND h.nombre = 'ERA SCOTT';

INSERT INTO rutina_unidad (unidad_id, herramienta_id, orden)
SELECT u.id, h.id, 5
FROM unidades u, herramientas h
WHERE u.nombre = 'Unidad 30' AND h.nombre = 'ESCALERA 2 TRAMOS 8 MTS';

-- Sector / Depto / Escalera (muestras)
INSERT INTO rutina_unidad (unidad_id, herramienta_id, orden)
SELECT u.id, h.id, 1
FROM unidades u, herramientas h
WHERE u.nombre = 'Escalera' AND h.nombre = 'ESCALERA DE ALUMINIO 12 MTS';

INSERT INTO rutina_unidad (unidad_id, herramienta_id, orden)
SELECT u.id, h.id, 2
FROM unidades u, herramientas h
WHERE u.nombre = 'Escalera' AND h.nombre = 'ESCALERA DE MADERA';

INSERT INTO rutina_unidad (unidad_id, herramienta_id, orden)
SELECT u.id, h.id, 1
FROM unidades u, herramientas h
WHERE u.nombre = 'Depto' AND h.nombre = 'BOLSA DE OBITO';

INSERT INTO rutina_unidad (unidad_id, herramienta_id, orden)
SELECT u.id, h.id, 2
FROM unidades u, herramientas h
WHERE u.nombre = 'Depto' AND h.nombre = 'TRAJE TIPO C DESCARTABLE';

INSERT INTO rutina_unidad (unidad_id, herramienta_id, orden)
SELECT u.id, h.id, 1
FROM unidades u, herramientas h
WHERE u.nombre = 'Pasillo' AND h.nombre = 'CONO BALIZAR GRANDE';

INSERT INTO rutina_unidad (unidad_id, herramienta_id, orden)
SELECT u.id, h.id, 2
FROM unidades u, herramientas h
WHERE u.nombre = 'Sector 4' AND h.nombre = 'CINTA DE PELIGRO';
```

## 🔌 Backend - Punto de Entrada

### app.js
```javascript
// 1. PRIMERO: requires globales
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./db');
const CENTRAL_PREFIX = '80/';
// 2. SEGUNDO: crear la aplicación
const app = express();

// 3. TERCERO: importar rutas y middleware
const authRoutes = require('./routes/auth');
const { verificarToken } = require('./middleware/auth');
const unidadesRoutes = require('./routes/unidades');
const inspeccionesRoutes = require('./routes/inspecciones');
const rutinaRoutes = require('./routes/rutina');

// 4. CUARTO: middleware global
app.use(cors());
app.use(express.json());

// 5. QUINTO: rutas públicas (SIN autenticación)
app.use('/auth', authRoutes);

// 6. SEXTO: middleware de autenticación (protege las siguientes)
// (Aquí van las rutas protegidas)

// 7. SÉPTIMO: rutas protegidas (CON autenticación)
app.use('/unidades', verificarToken, unidadesRoutes);
app.use('/inspecciones', verificarToken, inspeccionesRoutes);
app.use('/rutina', verificarToken, rutinaRoutes);

// 8. OCTAVO: iniciar servidor
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Backend escuchando en http://localhost:${PORT}`);
});
```

## 🎨 Frontend - Punto de Entrada

### main.jsx
```javascript
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext'
import './styles.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>,
)
```

### App.jsx
```javascript
import { useState, useContext } from 'react';
import { AuthContext, AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import PrimerLogin from './pages/PrimerLogin';
import Unidades from './pages/Unidades';
import Inspeccion from './pages/Inspeccion';
import Resumen from './pages/Resumen';
import Historial from './pages/Historial';

function AppContent() {
  const { user, token, loading, logout } = useContext(AuthContext);
  const [page, setPage] = useState('unidades');
  const [unidad, setUnidad] = useState(null);
  const [rutina, setRutina] = useState([]);
  const [resultados, setResultados] = useState([]);
  const [primerLogin, setPrimerLogin] = useState(null);

  // Mientras carga la sesión
  if (loading) {
    return <main className="loading-page">Cargando...</main>;
  }

  // Si no hay usuario, mostrar login
  if (!user) {
    if (primerLogin) {
      return (
        <PrimerLogin 
          usuario={primerLogin}
          onSuccess={() => {
            setPrimerLogin(null);
            setPage('unidades');
          }}
        />
      );
    }

    return (
      <Login 
        onLoginSuccess={() => setPage('unidades')}
        onPrimerLogin={(datos) => setPrimerLogin(datos)}
      />
    );
  }

  // Funciones de navegación
  const iniciarInspeccion = (unidadSeleccionada, rutinaHerramientas) => {
    setUnidad(unidadSeleccionada);
    setRutina(rutinaHerramientas);
    setResultados([]);
    setPage('inspeccion');
  };

  const irResumen = (respuestas) => {
    setResultados(respuestas);
    setPage('resumen');
  };

  const volverAUnidades = () => {
    setUnidad(null);
    setRutina([]);
    setResultados([]);
    setPage('unidades');
  };

  const irHistorial = () => {
    setPage('historial');
  };

  // App autenticada
  return (
    <div className="app-shell">
      <header>
        <h1>Central 80</h1>
        <div className="user-info">
          <span>Bienvenido, <strong>{user.nombre}</strong></span>
          <small>({user.legajo})</small>
          <button 
            onClick={logout}
            className="logout-btn"
            aria-label="Cerrar sesión"
          >
            Salir
          </button>
        </div>
      </header>

      {page === 'unidades' && (
        <Unidades 
          token={token}
          onIniciar={iniciarInspeccion}
          onHistorial={irHistorial}
        />
      )}
      {page === 'inspeccion' && unidad && (
        <Inspeccion 
          token={token}
          unidad={unidad} 
          rutina={rutina} 
          onFinish={irResumen} 
          onCancel={volverAUnidades} 
        />
      )}
      {page === 'resumen' && unidad && (
        <Resumen 
          token={token}
          unidad={unidad} 
          resultados={resultados} 
          onBack={volverAUnidades} 
        />
      )}
      {page === 'historial' && (
        <Historial 
          token={token}
          onBack={volverAUnidades}
        />
      )}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
```

## 🔐 Autenticación

### Frontend - AuthContext.jsx
```javascript
import { createContext, useState, useEffect } from 'react';
const CENTRAL_PREFIX = '80/';
export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE = 'http://localhost:4000';

  // Cargar sesión guardada al montar
  useEffect(() => {
    const savedToken = localStorage.getItem('auth_token');
    const savedUser = localStorage.getItem('auth_user');

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }

    setLoading(false);
  }, []);

  const login = async (legajo, contrasena) => {
    setError(null);
    try {
      // Agregar prefijo automáticamente
      if (!legajo.includes('/')) {
        legajo = CENTRAL_PREFIX + legajo;
      }

      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ legajo, contrasena })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error en login');
      }

      // Si es primer login, retornar info para cambiar contraseña
      if (data.primer_login) {
        return {
          primer_login: true,
          usuario_id: data.usuario_id,
          legajo: data.legajo,
          nombre: data.nombre
        };
      }

      // Login normal
      setToken(data.token);
      setUser(data.usuario);
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('auth_user', JSON.stringify(data.usuario));

      return { exitoso: true };
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const setPassword = async (usuarioId, contrasena, confirmar) => {
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/auth/set-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usuario_id: usuarioId,
          contrasena,
          confirmar
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al definir contraseña');
      }

      // Guardar token y usuario
      setToken(data.token);
      setUser(data.usuario);
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('auth_user', JSON.stringify(data.usuario));

      return { exitoso: true };
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  };

  const changePassword = async (contrasenaActual, contrasenaNueva, confirmar) => {
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          contrasenaActual,
          contrasenaNueva,
          confirmar
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al cambiar contraseña');
      }

      return { exitoso: true };
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      error,
      login,
      setPassword,
      logout,
      changePassword
    }}>
      {children}
    </AuthContext.Provider>
  );
}
```

### Backend - Middleware (auth.js o similar)
```javascript
const jwt = require('jsonwebtoken');

// Middleware para verificar token JWT
function verificarToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token requerido' });
    }

    const token = authHeader.split(' ')[1];
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirado' });
    }
    return res.status(401).json({ error: 'Token inválido' });
  }
}

// Middleware para extraer usuario sin fallar
function extraerUsuario(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
    }
    
    next();
  } catch (err) {
    // No falla si no hay token
    next();
  }
}

module.exports = { verificarToken, extraerUsuario };
```

## 📡 API

### Frontend - services/api.js
```javascript
const API_BASE = 'http://localhost:4000';

// ============================================
// UTILIDADES
// ============================================

function obtenerToken() {
  return localStorage.getItem('auth_token');
}

function generarHeaders(incluirAuth = true) {
  const headers = { 'Content-Type': 'application/json' };

  if (incluirAuth) {
    const token = obtenerToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  return headers;
}

// ============================================
// UNIDADES
// ============================================

export async function obtenerUnidades(token) {
  try {
    const response = await fetch(`${API_BASE}/unidades`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    return response.json();
  } catch (err) {
    console.error('Error obtenerUnidades:', err);
    throw err;
  }
}

// Alias para compatibilidad
export async function fetchUnidades(token) {
  return obtenerUnidades(token);
}

// ============================================
// RUTINA
// ============================================

export async function obtenerRutina(token, unidadId) {
  try {
    const response = await fetch(`${API_BASE}/rutina/${unidadId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Error: ${response.status}`);
    }

    return response.json();
  } catch (err) {
    console.error('Error obtenerRutina:', err);
    throw err;
  }
}

// Alias para compatibilidad
export async function fetchRutina(token, unidadId) {
  return obtenerRutina(token, unidadId);
}

// ============================================
// INSPECCIONES
// ============================================

export async function guardarInspeccion(token, datos) {
  const MAX_REINTENTOS = 3;

  for (let intento = 1; intento <= MAX_REINTENTOS; intento++) {
    try {
      const response = await fetch(`${API_BASE}/inspecciones`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(datos)
      });

      const statusCode = response.status;
      const contentType = response.headers.get('content-type');
      const responseText = await response.text(); // ← LEE COMO TEXTO PRIMERO

      console.log('=== RESPUESTA DEL SERVIDOR ===');
      console.log('Status:', statusCode);
      console.log('Content-Type:', contentType);
      console.log('Body:', responseText);
      console.log('==========================');

      if (!response.ok) {
        throw new Error(`Error ${statusCode}: ${responseText}`);
      }

      // SOLO PARSEAR SI ES JSON
      if (contentType?.includes('application/json')) {
        return JSON.parse(responseText);
      } else {
        console.warn('⚠️ Respuesta no es JSON:', contentType);
        throw new Error(`Respuesta inválida del servidor: ${contentType}`);
      }
    } catch (err) {
      if (intento === MAX_REINTENTOS) {
        // Fallar después del 3er intento
        console.error('Error guardarInspeccion (intento final):', err);
        throw err;
      }

      // Esperar antes de reintentar (backoff exponencial: 2s, 4s, 8s)
      const espera = Math.pow(2, intento) * 1000;
      console.warn(`Reintentando guardarInspeccion en ${espera / 1000}s (intento ${intento}/${MAX_REINTENTOS})...`);
      await new Promise(resolve => setTimeout(resolve, espera));
    }
  }
}

export async function obtenerInspecciones(token) {
  try {
    const response = await fetch(`${API_BASE}/inspecciones`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    return response.json();
  } catch (err) {
    console.error('Error obtenerInspecciones:', err);
    throw err;
  }
}

// Alias para compatibilidad
export async function fetchInspecciones(token) {
  return obtenerInspecciones(token);
}

// ============================================
// HISTORIAL / AUDITORÍA
// ============================================

export async function obtenerHistorialInspecciones(token, unidadId = null) {
  try {
    let url = `${API_BASE}/inspecciones`;
    if (unidadId) {
      url += `?unidad_id=${unidadId}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    return response.json();
  } catch (err) {
    console.error('Error obtenerHistorialInspecciones:', err);
    throw err;
  }
}

// ============================================
// UTILIDADES DE API
// ============================================

export async function verificarConexion() {
  try {
    const response = await fetch(`${API_BASE}/auth/verify`, {
      method: 'GET',
      headers: generarHeaders(true)
    });

    return response.ok;
  } catch (err) {
    return false;
  }
}

// Exportar API_BASE si lo necesitas
export { API_BASE };
```

## 🛣️ Rutas del Backend

### routes/auth.js
```javascript
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../db');

// POST /auth/login - Primer intento de login
const CENTRAL_PREFIX = '80/';

router.post('/login', async (req, res) => {
  try {
    let { legajo, contrasena } = req.body;
    
    if (!legajo) {
      return res.status(400).json({ 
        error: 'Legajo requerido' 
      });
    }

    // Agregar prefijo automáticamente
    if (!legajo.includes('/')) {
      legajo = CENTRAL_PREFIX + legajo;
    }

    const usuario = await db.get('SELECT * FROM usuarios WHERE legajo = ?', [legajo]);

    if (!usuario) {
      return res.status(401).json({ 
        error: 'Legajo no encontrado' 
      });
    }

    // Si es primer login, no verifica contraseña
    // TEMPORAL SOLO PARA TESTING
    if (legajo === '80/001') {
      const token = jwt.sign(
        {
          id: usuario.id,
          legajo: usuario.legajo,
          nombre: usuario.nombre
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      await db.run('UPDATE usuarios SET fecha_ultimo_login = CURRENT_TIMESTAMP WHERE id = ?', [usuario.id]);

      return res.json({
        token,
        usuario: {
          id: usuario.id,
          legajo: usuario.legajo,
          nombre: usuario.nombre
        }
      });
    }
    
    
    
    
    
    if (usuario.primer_login === 1) {
      return res.status(200).json({
        mensaje: 'Primer login detectado',
        primer_login: true,
        usuario_id: usuario.id,
        legajo: usuario.legajo,
        nombre: usuario.nombre
      });
    }

    // Si no es primer login, verifica contraseña
    if (!usuario.contrasena) {
      return res.status(401).json({ 
        error: 'Usuario no tiene contraseña configurada. Contacte al administrador.' 
      });
    }

    if (!contrasena) {
      return res.status(400).json({ error: 'Contraseña requerida' });
    }

    const contrasenaValida = await bcrypt.compare(contrasena, usuario.contrasena);

    if (!contrasenaValida) {
      // Registrar intento fallido
      await db.run('INSERT INTO auditorias_login (usuario_id, legajo, estado) VALUES (?, ?, ?)', [usuario.id, legajo, 'FALLIDO']);

      return res.status(401).json({ 
        error: 'Contraseña incorrecta' 
      });
    }

    // Login exitoso
    const token = jwt.sign(
      {
        id: usuario.id,
        legajo: usuario.legajo,
        nombre: usuario.nombre
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Actualizar último login
    await db.run('UPDATE usuarios SET fecha_ultimo_login = CURRENT_TIMESTAMP WHERE id = ?', [usuario.id]);

    // Registrar login exitoso
    await db.run('INSERT INTO auditorias_login (usuario_id, legajo, estado) VALUES (?, ?, ?)', [usuario.id, legajo, 'EXITOSO']);

    res.json({
      token,
      usuario: {
        id: usuario.id,
        legajo: usuario.legajo,
        nombre: usuario.nombre
      }
    });
  } catch (err) {
    console.error('Error en login:', err);
    res.status(500).json({ error: 'Error en servidor' });
  }
});

// POST /auth/set-password - Definir contraseña (primer login)
router.post('/set-password', async (req, res) => {
  try {
    const { usuario_id, contrasena, confirmar } = req.body;

    // Validaciones
    if (!usuario_id || !contrasena) {
      return res.status(400).json({ 
        error: 'Usuario ID y contraseña requeridos' 
      });
    }

    if (contrasena !== confirmar) {
      return res.status(400).json({ 
        error: 'Las contraseñas no coinciden' 
      });
    }

    if (contrasena.length < 6) {
      return res.status(400).json({ 
        error: 'La contraseña debe tener al menos 6 caracteres' 
      });
    }

    // Buscar usuario
    const usuario = await db.get('SELECT * FROM usuarios WHERE id = ?', [usuario_id]);

    if (!usuario) {
      return res.status(404).json({ 
        error: 'Usuario no encontrado' 
      });
    }

    // Encriptar contraseña
    const salt = await bcrypt.genSalt(10);
    const contrasenaEncriptada = await bcrypt.hash(contrasena, salt);

    // Actualizar usuario
    await db.run('UPDATE usuarios SET contrasena = ?, primer_login = 0 WHERE id = ?', [contrasenaEncriptada, usuario_id]);

    // Generar token
    const token = jwt.sign(
      {
        id: usuario.id,
        legajo: usuario.legajo,
        nombre: usuario.nombre
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Registrar login
    await db.run('INSERT INTO auditorias_login (usuario_id, legajo, estado) VALUES (?, ?, ?)', [usuario.id, usuario.legajo, 'EXITOSO']);

    res.json({
      mensaje: 'Contraseña definida correctamente',
      token,
      usuario: {
        id: usuario.id,
        legajo: usuario.legajo,
        nombre: usuario.nombre
      }
    });
  } catch (err) {
    console.error('Error en set-password:', err);
    res.status(500).json({ error: 'Error en servidor' });
  }
});

// POST /auth/change-password - Cambiar contraseña (usuario autenticado)
router.post('/change-password', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token requerido' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const { contrasenaActual, contrasenaNueva, confirmar } = req.body;

    if (!contrasenaActual || !contrasenaNueva) {
      return res.status(400).json({ 
        error: 'Todos los campos son requeridos' 
      });
    }

    if (contrasenaNueva !== confirmar) {
      return res.status(400).json({ 
        error: 'Las contraseñas nuevas no coinciden' 
      });
    }

    if (contrasenaNueva.length < 6) {
      return res.status(400).json({ 
        error: 'La contraseña debe tener al menos 6 caracteres' 
      });
    }

    // Buscar usuario
    const usuario = await db.get('SELECT * FROM usuarios WHERE id = ?', [decoded.id]);

    if (!usuario) {
      return res.status(404).json({ 
        error: 'Usuario no encontrado' 
      });
    }

    // Verificar contraseña actual
    const bcrypt = require('bcryptjs');
    const contrasenaValida = bcrypt.compareSync(
      contrasenaActual, 
      usuario.contrasena
    );

    if (!contrasenaValida) {
      return res.status(401).json({ 
        error: 'Contraseña actual incorrecta' 
      });
    }

    // Encriptar nueva contraseña
    const salt = bcrypt.genSaltSync(10);
    const contrasenaNuevaEncriptada = bcrypt.hashSync(contrasenaNueva, salt);

    // Actualizar
    await db.run('UPDATE usuarios SET contrasena = ? WHERE id = ?', [contrasenaNuevaEncriptada, decoded.id]);

    res.json({ 
      mensaje: 'Contraseña actualizada correctamente' 
    });
  } catch (err) {
    console.error('Error en change-password:', err);
    res.status(500).json({ error: 'Error en servidor' });
  }
});

// GET /auth/verify - Verificar token actual
router.get('/verify', (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token requerido' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    res.json({ 
      valido: true,
      usuario: decoded 
    });
  } catch (err) {
    res.status(401).json({ 
      valido: false,
      error: 'Token inválido' 
    });
  }
});

// POST /auth/logout - Logout (opcional, por completitud)
router.post('/logout', (req, res) => {
  // En JWT, el logout es simplemente eliminar el token del cliente
  res.json({ 
    mensaje: 'Sesión cerrada correctamente' 
  });
});

module.exports = router;
```

### routes/inspecciones.js
```javascript
const express = require('express');
const router = express.Router();
const {
  createInspeccion,
  getInspecciones,
} = require('../controllers/inspeccionesController');

router.post('/', createInspeccion);
router.get('/', getInspecciones);

module.exports = router;
```

### routes/unidades.js
```javascript
const express = require('express');
const router = express.Router();
const { getUnidades } = require('../controllers/unidadesController');

router.get('/', getUnidades);

module.exports = router;
```

### routes/rutina.js
```javascript
const express = require('express');
const router = express.Router();
const { getRutinaPorUnidad } = require('../controllers/rutinaController');

router.get('/:unidad_id', getRutinaPorUnidad);

module.exports = router;
```

### [CUALQUIER OTRA RUTA QUE EXISTA]
```javascript
NO EXISTE
```

## 🎮 Controladores del Backend

### controllers/authController.js
```javascript
NO EXISTE
```

### controllers/inspeccionesController.js
```javascript
const db = require('../db');

const validEstados = ['ok', 'no_esta', 'sin_acondicionar'];

async function createInspeccion(req, res, next) {
  const { unidad_id, detalles, notas } = req.body;

  if (!unidad_id || !Array.isArray(detalles) || detalles.length === 0) {
    return res.status(400).json({ error: 'unidad_id y detalles son obligatorios' });
  }

  for (const detalle of detalles) {
    if (!validEstados.includes(detalle.estado)) {
      return res.status(400).json({ error: `Estado inválido: ${detalle.estado}` });
    }
    if ((detalle.estado === 'no_esta' || detalle.estado === 'sin_acondicionar') && !detalle.observacion) {
      return res.status(400).json({ error: 'Observación obligatoria para estados no_esta o sin_acondicionar' });
    }
  }

  try {
    const inspeccionId = await db.transaction(async () => {
      const insertInspeccionResult = await db.run(
        'INSERT INTO inspecciones (unidad_id, user_id, notas) VALUES (?, ?, ?)',
        [unidad_id, req.user.id, notas || null]
      );

      const newInspeccionId = insertInspeccionResult.lastID;

      for (const detalle of detalles) {
        await db.run(
          'INSERT INTO inspeccion_detalle (inspeccion_id, herramienta_id, estado, observacion) VALUES (?, ?, ?, ?)',
          [newInspeccionId, detalle.herramienta_id, detalle.estado, detalle.observacion || null]
        );
      }

      return newInspeccionId;
    });

    res.status(201).json({
      success: true,
      inspectionId: inspeccionId,
      message: 'Inspección guardada correctamente'
    });
  } catch (error) {
    next(error);
  }
}

async function getInspecciones(req, res, next) {
  try {
    const userId = req.user.id;
    const inspecciones = await db.all(
      `SELECT i.id, i.unidad_id, u.nombre as unidad_nombre, i.fecha, i.notas,
        i.user_id, us.nombre as usuario_nombre, us.legajo as usuario_legajo
       FROM inspecciones i
       JOIN unidades u ON i.unidad_id = u.id
       LEFT JOIN usuarios us ON i.user_id = us.id
       WHERE i.user_id = ?
       ORDER BY i.fecha DESC`,
      [userId]
    );

    if (inspecciones.length === 0) {
      return res.json([]);
    }

    const ids = inspecciones.map((item) => item.id);
    const placeholders = ids.map(() => '?').join(',');
    const detalles = await db.all(
      `SELECT d.inspeccion_id, h.nombre as herramienta_nombre, d.estado, d.observacion
       FROM inspeccion_detalle d
       JOIN herramientas h ON d.herramienta_id = h.id
       WHERE d.inspeccion_id IN (${placeholders})
       ORDER BY d.inspeccion_id, h.id`,
      ids
    );

    const detallesPorInspeccion = detalles.reduce((acc, detalle) => {
      const list = acc[detalle.inspeccion_id] || [];
      list.push(detalle);
      acc[detalle.inspeccion_id] = list;
      return acc;
    }, {});

    const full = inspecciones.map((inspeccion) => ({
      ...inspeccion,
      detalles: detallesPorInspeccion[inspeccion.id] || [],
    }));

    res.json(full);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createInspeccion,
  getInspecciones,
};
```

### controllers/unidadesController.js
```javascript
const db = require('../db');

async function getUnidades(req, res, next) {
  try {
    const unidades = await db.all('SELECT id, nombre, placa FROM unidades ORDER BY id');
    res.json(unidades);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getUnidades,
};
```

### controllers/rutinaController.js
```javascript
const db = require('../db');

async function getRutinaPorUnidad(req, res, next) {
  const unidadId = parseInt(req.params.unidad_id, 10);
  if (Number.isNaN(unidadId)) {
    return res.status(400).json({ error: 'unidad_id inválido' });
  }

  try {
    const rutina = await db.all(
      `SELECT h.id as herramienta_id, h.nombre as herramienta_nombre, ru.orden
       FROM rutina_unidad ru
       JOIN herramientas h ON ru.herramienta_id = h.id
       WHERE ru.unidad_id = ?
       ORDER BY ru.orden`,
      [unidadId]
    );

    if (rutina.length === 0) {
      return res.status(404).json({ error: 'No se encontró rutina para esta unidad' });
    }

    res.json(rutina);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getRutinaPorUnidad,
};
```

### [CUALQUIER OTRO CONTROLLER QUE EXISTA]
```javascript
NO EXISTE
```

## 🗂️ Base de Datos - Conexión

### db/index.js
```javascript
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbFile = process.env.SQLITE_FILE || path.join(__dirname, 'bomberos.db');

const db = new sqlite3.Database(
  dbFile,
  sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE,
  (err) => {
    if (err) {
      console.error('Error opening SQLite database:', err.message);
      throw err;
    }
  }
);

db.exec('PRAGMA foreign_keys = ON;');

const all = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });

const get = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });

const run = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve(this);
    });
  });

const exec = (sql) =>
  new Promise((resolve, reject) => {
    db.exec(sql, (err) => {
      if (err) return reject(err);
      resolve();
    });
  });

const prepare = (sql) => db.prepare(sql);

const transaction = async (fn) => {
  await exec('BEGIN TRANSACTION');
  try {
    const result = await fn();
    await exec('COMMIT');
    return result;
  } catch (error) {
    await exec('ROLLBACK');
    throw error;
  }
};

module.exports = {
  db,
  all,
  get,
  run,
  exec,
  prepare,
  transaction,
};
```

### db/init-db.js
```javascript
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const dbFile = process.env.SQLITE_FILE || path.join(__dirname, 'db', 'bomberos.db');

const schemaPath = path.join(__dirname, 'db', 'schema.sql');

const db = new sqlite3.Database(dbFile, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
  if (err) {
    console.error('Error al abrir la base de datos:', err.message);
    process.exit(1);
  }
});

db.serialize(() => {
  db.run('PRAGMA foreign_keys = ON');

  try {
    const schema = fs.readFileSync(schemaPath, 'utf8');
    db.exec(schema, (err) => {
      if (err) {
        console.error('Error al inicializar la base de datos:', err.message);
        process.exit(1);
      }
      db.close();
      console.log(`Base de datos creada o actualizada en: ${dbFile}`);
    });
  } catch (error) {
    console.error('Error al leer el esquema de la base de datos:', error.message);
    process.exit(1);
  }
});
```

## 📄 Páginas del Frontend

### pages/Login.jsx
```javascript
import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const CENTRAL_PREFIX = '80/';

export default function Login({ onLoginSuccess, onPrimerLogin }) {
  const { login, error } = useContext(AuthContext);
  const [legajo, setLegajo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [cargando, setCargando] = useState(false);
  const [errorLocal, setErrorLocal] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCargando(true);
    setErrorLocal('');

    try {
      const resultado = await login(legajo, contrasena);

      // Si es primer login
      if (resultado.primer_login) {
        onPrimerLogin(resultado);
        return;
      }

      // Login exitoso
      onLoginSuccess();
    } catch (err) {
      setErrorLocal(err.message || 'Error en login');
    } finally {
      setCargando(false);
    }
  };

  return (
    <main className="login-page">
      <div className="login-container">
        <div className="login-header">
          <h1>🚒 Central 80</h1>
          <p>Sistema de Inspecciones</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="legajo">Legajo</label>
            <div className="legajo-input-group">
              <span className="legajo-prefix">80/</span>
              <input
                id="legajo"
                type="text"
                placeholder="001"
                maxLength="3"
                pattern="[0-9]{3}"
                value={legajo}
                onChange={(e) => {
                  // Solo permite números
                  const valor = e.target.value.replace(/[^0-9]/g, '');
                  // Máximo 3 dígitos
                  setLegajo(valor.slice(0, 3));
                }}
                required
                aria-label="Últimos 3 dígitos del legajo"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="contrasena">Contraseña</label>
            <input
              id="contrasena"
              type="password"
              placeholder="Ingrese su contraseña"
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              required
              aria-label="Contraseña"
            />
          </div>

          {errorLocal && (
            <div className="alert alert-error">
              {errorLocal}
            </div>
          )}

          {error && (
            <div className="alert alert-error">
              {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={cargando}
            aria-label="Ingresar al sistema"
          >
            {cargando ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        <div className="login-footer">
          <p className="text-small">
            © 2025 Central 80 - Sistema de Inspecciones
          </p>
        </div>
      </div>
    </main>
  );
}
```

### pages/PrimerLogin.jsx
```javascript
import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export default function PrimerLogin({ usuario, onSuccess }) {
  const { setPassword, error } = useContext(AuthContext);
  const [contrasena, setContrasena] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [cargando, setCargando] = useState(false);
  const [errorLocal, setErrorLocal] = useState('');
  const [mostrarRequisitos, setMostrarRequisitos] = useState(false);

  const requisitos = {
    longitud: contrasena.length >= 6,
    mayuscula: /[A-Z]/.test(contrasena),
    numero: /[0-9]/.test(contrasena),
    coinciden: contrasena && contrasena === confirmar
  };

  const requisitosCompletos = Object.values(requisitos).every(v => v);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCargando(true);
    setErrorLocal('');

    try {
      if (!requisitosCompletos) {
        setErrorLocal('Por favor complete todos los requisitos');
        setCargando(false);
        return;
      }

      await setPassword(usuario.usuario_id, contrasena, confirmar);
      onSuccess();
    } catch (err) {
      setErrorLocal(err.message || 'Error al definir contraseña');
    } finally {
      setCargando(false);
    }
  };

  return (
    <main className="primer-login-page">
      <div className="primer-login-container">
        <div className="login-header">
          <h1>🚒 Bienvenido, {usuario.nombre}</h1>
          <p>Primera vez en el sistema</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="alert alert-info">
            <strong>Aviso:</strong> Por seguridad, debes crear una contraseña 
            antes de continuar. Esta será tu contraseña para todos los accesos futuros.
          </div>

          <div className="form-group">
            <label htmlFor="contrasena">Contraseña</label>
            <input
              id="contrasena"
              type="password"
              placeholder="Crea una contraseña segura"
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              onFocus={() => setMostrarRequisitos(true)}
              onBlur={() => setMostrarRequisitos(false)}
              required
              aria-label="Nueva contraseña"
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmar">Confirmar Contraseña</label>
            <input
              id="confirmar"
              type="password"
              placeholder="Confirma tu contraseña"
              value={confirmar}
              onChange={(e) => setConfirmar(e.target.value)}
              required
              aria-label="Confirmar contraseña"
            />
          </div>

          {mostrarRequisitos && (
            <div className="requisitos-box">
              <p><strong>Requisitos de contraseña:</strong></p>
              <div className={`requisito ${requisitos.longitud ? 'ok' : ''}`}>
                {requisitos.longitud ? '✅' : '❌'} 
                Al menos 6 caracteres
              </div>
              <div className={`requisito ${requisitos.mayuscula ? 'ok' : ''}`}>
                {requisitos.mayuscula ? '✅' : '❌'} 
                Al menos una letra mayúscula
              </div>
              <div className={`requisito ${requisitos.numero ? 'ok' : ''}`}>
                {requisitos.numero ? '✅' : '❌'} 
                Al menos un número
              </div>
              <div className={`requisito ${requisitos.coinciden ? 'ok' : ''}`}>
                {requisitos.coinciden ? '✅' : '❌'} 
                Las contraseñas coinciden
              </div>
            </div>
          )}

          {errorLocal && (
            <div className="alert alert-error">
              {errorLocal}
            </div>
          )}

          {error && (
            <div className="alert alert-error">
              {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={cargando || !requisitosCompletos}
            aria-label="Definir contraseña"
          >
            {cargando ? 'Guardando...' : 'Definir Contraseña'}
          </button>
        </form>

        <div className="login-footer">
          <p className="text-small">
            Tu legajo: <strong>{usuario.legajo}</strong>
          </p>
        </div>
      </div>
    </main>
  );
}
```

### pages/Unidades.jsx
```javascript
import { useEffect, useState } from 'react';
import { obtenerUnidades, obtenerRutina } from '../services/api';

function Unidades({ token, onIniciar, onVerHistorial, onHistorial }) {
  const historialAction = onVerHistorial || onHistorial;
  const [unidades, setUnidades] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) {
      setError('No hay sesión activa');
      return;
    }

    obtenerUnidades(token)
      .then(setUnidades)
      .catch((err) => setError(err.message || 'Error al cargar unidades'));
  }, [token]);

  const handleIniciar = async (unidad) => {
    try {
      const rutina = await obtenerRutina(token, unidad.id);
      onIniciar(unidad, rutina);
    } catch (err) {
      setError(err.message || 'Error al cargar la rutina');
    }
  };

  return (
    <main>
      <div className="unidades-header">
        <h2>Unidades</h2>
        {historialAction && (
          <button onClick={historialAction} className="btn-historial" aria-label="Ver historial">
            📋 Ver Historial
          </button>
        )}
      </div>
      {error && <div className="error">{error}</div>}
      <div className="card-list">
        {unidades.map((unidad) => (
          <div key={unidad.id} className="card">
            <div>
              <strong>{unidad.nombre}</strong>
              <div className="small">Placa: {unidad.placa || '-'}</div>
            </div>
            <button
              onClick={() => handleIniciar(unidad)}
              aria-label={`Iniciar inspección de ${unidad.nombre}, placa ${unidad.placa}`}
            >
              Iniciar
            </button>
          </div>
        ))}
      </div>
    </main>
  );
}

export default Unidades;
```

### pages/Inspeccion.jsx
```javascript
import { useEffect, useState } from 'react';
import { guardarInspeccion } from '../services/api';
import { obtenerRutina } from '../services/api';

const estados = [
  { key: 'ok', label: '✅ Está' },
  { key: 'no_esta', label: '❌ No está' },
  { key: 'sin_acondicionar', label: '⚠️ Sin acondicionar' },
];

function Inspeccion({ unidad, rutina, onFinish, onCancel }) {
  const [index, setIndex] = useState(0);
  const [respuestas, setRespuestas] = useState([]);
  const [observacion, setObservacion] = useState('');
  const [modoObservacion, setModoObservacion] = useState(false);
  const [estadoSeleccionado, setEstadoSeleccionado] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    setIndex(0);
  }, [rutina]);

  const herramienta = rutina[index];
 const porcentaje = rutina.length > 0 ? ((index + 1) / rutina.length) * 100 : 0;
  const avanzar = () => {
    if (index + 1 >= rutina.length) {
      onFinish(respuestas);
      return;
    }
    setIndex(index + 1);
    setModoObservacion(false);
    setObservacion('');
    setEstadoSeleccionado(null);
  };

  const guardarRespuesta = (estado) => {
    if (estado === 'no_esta' || estado === 'sin_acondicionar') {
      setModoObservacion(true);
      setEstadoSeleccionado(estado);
      return;
    }

    const respuesta = {
      herramienta_id: herramienta.herramienta_id,
      herramienta_nombre: herramienta.herramienta_nombre,
      estado,
      observacion: null,
    };
    setRespuestas((prev) => [...prev, respuesta]);
    avanzar();
  };

  const guardarObservacion = () => {
    if (!observacion.trim()) {
      setError('Observación requerida');
      return;
    }

    const respuesta = {
      herramienta_id: herramienta.herramienta_id,
      herramienta_nombre: herramienta.herramienta_nombre,
      estado: estadoSeleccionado,
      observacion: observacion.trim(),
    };
    setRespuestas((prev) => [...prev, respuesta]);
    avanzar();
  };

  if (!herramienta) {
    return (
      <main>
        <h2>Inspección</h2>
        <div>No hay herramientas en la rutina.</div>
        <button onClick={onCancel}>Volver</button>
      </main>
    );
  }

  return (
    <main>
      <h2>Inspección - {unidad.nombre}</h2>
      <main>
    {/* Barra de progreso */}
    <div className="progress-container">
      <div 
        className="progress-bar" 
        style={{ width: `${porcentaje}%` }}
      />
    </div>
    <div className="progress-percentage">
      {Math.round(porcentaje)}%
    </div>
    
    {/* Resto del código existente */}
    <div className="step-box">
      <div className="step-label">
        Herramienta {index + 1} de {rutina.length}
      </div>
      {/* ... */}
    </div>
  </main>
      
      
      <div className="step-box">
        <div className="step-label">Herramienta {index + 1} de {rutina.length}</div>
        <div className="tool-name">{herramienta.herramienta_nombre}</div>
      </div>

      {error && <div className="error">{error}</div>}

      {!modoObservacion ? (
        <div className="button-group">
          {estados.map((estado) => (
  <button 
    key={estado.key} 
    onClick={() => guardarRespuesta(estado.key)}
    aria-label={
      estado.key === 'ok' 
        ? 'Marcar como OK, herramienta presente' 
        : estado.key === 'no_esta' 
        ? 'Marcar como No está presente' 
        : 'Marcar como Sin acondicionar'
    }
  >
    {estado.label}
  </button>
))}
        </div>
      ) : (
        <div className="observation-box">
          <label>
            Observación para “{estadoSeleccionado === 'no_esta' ? 'No está' : 'Sin acondicionar'}”
          </label>
  
<textarea
  id="observacion"
  value={observacion}
  onChange={(event) => {
    setObservacion(event.target.value);
    setError(null);
  }}
  placeholder="Describa el problema o falta"
  aria-label="Campo de observación para la herramienta"
/>
          <button onClick={guardarObservacion}>Continuar</button>
        </div>
      )}

      <div className="footer-actions">
        <button className="secondary" onClick={onCancel}>Cancelar</button>
      </div>
    </main>
  );
}

export default Inspeccion;
```

### pages/Resumen.jsx
```javascript
import { useEffect, useMemo, useState } from 'react';
import { guardarInspeccion } from '../services/api';

function Resumen({ token, unidad, resultados, onBack }) {
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  const [error, setError] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const conteo = useMemo(() => {
    return resultados.reduce(
      (acc, item) => {
        acc[item.estado] = (acc[item.estado] || 0) + 1;
        return acc;
      },
      { ok: 0, no_esta: 0, sin_acondicionar: 0 }
    );
  }, [resultados]);

  const handleGuardarClick = () => {
    setMostrarConfirmacion(true);
  };

  const confirmarGuardado = async () => {
    // Validar token ANTES de intentar guardar
    if (!token) {
      setError('Sesión expirada. Por favor, inicia sesión de nuevo.');
      return;
    }

    // Validar formato JWT (debe tener 3 partes separadas por puntos)
    if (token.split('.').length !== 3) {
      setError('Token inválido. Por favor, inicia sesión de nuevo.');
      return;
    }

    setGuardando(true);
    setError(null);
    setMensaje(null);

    try {
      const respuesta = await guardarInspeccion(token, {
        unidad_id: unidad.id,
        detalles: resultados.map((item) => ({
          herramienta_id: item.herramienta_id,
          estado: item.estado,
          observacion: item.observacion || null,
        })),
        notas: '',
      });

      // Log del ID para debugging
      console.log('✅ Inspección guardada con ID:', respuesta.inspectionId);

      setMensaje('¡Inspección guardada correctamente!');
      setMostrarConfirmacion(false);
      setTimeout(() => onBack(), 1200);
    } catch (err) {
      setError(err.message || 'Error al guardar inspección');
      // El modal permanece abierto para permitir reintentar
    } finally {
      setGuardando(false);
    }
  };

  return (
    <main>
      <h2>Resumen — {unidad.nombre}</h2>

      <div className={`status-badge ${isOnline ? 'online' : 'offline'}`}>
        {isOnline ? '🟢 Con conexión' : '🔴 Sin conexión'}
      </div>

      <div className="summary-grid">
        <div className="summary-card ok">OK: {conteo.ok}</div>
        <div className="summary-card noesta">No está: {conteo.no_esta}</div>
        <div className="summary-card sinac">Sin acondicionar: {conteo.sin_acondicionar}</div>
      </div>

      <div className="results-list">
        {resultados.map((item, index) => (
          <div key={index} className="result-item">
            <div>
              <strong>{item.herramienta_nombre || item.herramienta_id}</strong> — {item.estado}
            </div>
            {item.observacion && <div className="small">{item.observacion}</div>}
          </div>
        ))}
      </div>

      {error && <div className="error">{error}</div>}
      {mensaje && <div className="success">{mensaje}</div>}

      {!mostrarConfirmacion ? (
        <div className="button-group">
          <button onClick={handleGuardarClick} disabled={guardando}>
            {guardando ? 'Guardando...' : 'Guardar inspección'}
          </button>
          <button className="secondary" onClick={onBack}>
            Volver a unidades
          </button>
        </div>
      ) : (
        <div className="confirmation-modal">
          <h3>Confirmar guardado</h3>
          <p>¿Guardar esta inspección de <strong>{unidad.nombre}</strong>?</p>
          <p style={{ fontSize: '12px', opacity: 0.8 }}>
            Resumen: {resultados.filter((r) => r.estado === 'ok').length} OK,
            {resultados.filter((r) => r.estado === 'no_esta').length} No está,
            {resultados.filter((r) => r.estado === 'sin_acondicionar').length} Sin acondicionar
          </p>

          {error && <div className="error" style={{ marginBottom: '1rem' }}>{error}</div>}

          <div className="button-group">
            <button onClick={confirmarGuardado} disabled={guardando}>
              {guardando ? 'Guardando...' : 'Sí, guardar'}
            </button>
            <button className="secondary" onClick={() => setMostrarConfirmacion(false)}>
              Volver a revisar
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

export default Resumen;
```

### pages/Historial.jsx
```javascript
import { useState, useEffect } from 'react';
import { obtenerInspecciones } from '../services/api';

function Historial({ token, onBack }) {
  const [inspecciones, setInspecciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [inspeccionSeleccionada, setInspeccionSeleccionada] = useState(null);
  const [detalles, setDetalles] = useState([]);

  useEffect(() => {
    cargarInspecciones();
  }, [token]);

  const cargarInspecciones = async () => {
    try {
      setCargando(true);
      setError(null);
      const datos = await obtenerInspecciones(token);
      setInspecciones(datos);
      console.log('✅ Inspecciones cargadas:', datos.length);
    } catch (err) {
      setError('Error al cargar inspecciones: ' + err.message);
      console.error('Error cargarInspecciones:', err);
    } finally {
      setCargando(false);
    }
  };

  const verDetalles = (inspeccion) => {
    setInspeccionSeleccionada(inspeccion.id);
    setDetalles(inspeccion.detalles || []);
  };

  const cerrarDetalles = () => {
    setInspeccionSeleccionada(null);
    setDetalles([]);
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return '-';
    try {
      return new Date(fecha).toLocaleDateString('es-AR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return fecha;
    }
  };

  const contarEstados = (detalles) => {
    return {
      ok: detalles.filter(d => d.estado === 'ok').length,
      no_esta: detalles.filter(d => d.estado === 'no_esta').length,
      sin_acondicionar: detalles.filter(d => d.estado === 'sin_acondicionar').length
    };
  };

  return (
    <main>
      <div className="historial-header">
        <h2>📋 Historial de Inspecciones</h2>
        <button className="secondary" onClick={onBack} aria-label="Volver a unidades">
          ← Volver a unidades
        </button>
      </div>

      {error && (
        <div className="error-container">
          <div className="error">{error}</div>
          <button onClick={cargarInspecciones} className="secondary">
            Reintentar
          </button>
        </div>
      )}

      {cargando ? (
        <div className="loading">
          <p>Cargando inspecciones...</p>
        </div>
      ) : inspecciones.length === 0 ? (
        <div className="empty-state">
          <p>📭 No hay inspecciones registradas</p>
        </div>
      ) : (
        <div className="inspecciones-list">
          {inspecciones.map((inspeccion) => {
            const estados = contarEstados(inspeccion.detalles || []);
            return (
              <div
                key={inspeccion.id}
                className="inspeccion-card"
                onClick={() => verDetalles(inspeccion)}
              >
                <div className="inspeccion-header">
                  <div>
                    <h3>{inspeccion.unidad_nombre || `Unidad ${inspeccion.unidad_id}`}</h3>
                    <div className="card-meta">
                      <span className="fecha">{formatearFecha(inspeccion.fecha)}</span>
                      <span className="usuario">
                        👤 {inspeccion.usuario_nombre || 'Usuario desconocido'}
                        {inspeccion.usuario_legajo && ` (${inspeccion.usuario_legajo})`}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="inspeccion-resumen">
                  <div className="estado-badge ok">
                    <span className="label">OK</span>
                    <span className="numero">{estados.ok}</span>
                  </div>

                  <div className="estado-badge no-esta">
                    <span className="label">No está</span>
                    <span className="numero">{estados.no_esta}</span>
                  </div>

                  <div className="estado-badge sin-acondicionar">
                    <span className="label">Sin acondicionar</span>
                    <span className="numero">{estados.sin_acondicionar}</span>
                  </div>
                </div>

                {inspeccion.notas && (
                  <div className="notas">
                    <strong>Notas:</strong> {inspeccion.notas}
                  </div>
                )}

                <div className="inspeccion-footer">
                  <button className="ver-detalles">
                    Ver detalles →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {inspeccionSeleccionada && (
        <div className="modal-overlay" onClick={cerrarDetalles}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="btn-cerrar-modal" onClick={cerrarDetalles}>
              ✕
            </button>

            {(() => {
              const insp = inspecciones.find(i => i.id === inspeccionSeleccionada);
              return (
                <>
                  <h3>Detalles de Inspección #{inspeccionSeleccionada}</h3>
                   
                  {insp && (
                    <div className="inspector-info">
                      <p>
                        <strong>Inspector:</strong> {insp.usuario_nombre || 'Desconocido'}
                        {insp.usuario_legajo && ` (${insp.usuario_legajo})`}
                      </p>
                      <p>
                        <strong>Fecha:</strong> {formatearFecha(insp.fecha)}
                      </p>
                      {insp.notas && (
                        <p>
                          <strong>Notas:</strong> {insp.notas}
                        </p>
                      )}
                    </div>
                  )}
                </>
              );
            })()}

            {detalles.length === 0 ? (
              <p className="empty">Sin detalles registrados</p>
            ) : (
              <div className="detalles-table">
                <table>
                  <thead>
                    <tr>
                      <th>Herramienta</th>
                      <th>Estado</th>
                      <th>Observación</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detalles.map((detalle, idx) => (
                      <tr key={idx}>
                        <td>{detalle.herramienta_nombre || detalle.herramienta_id}</td>
                        <td>
                          <span className={`badge ${detalle.estado}`}>
                            {detalle.estado === 'ok'
                              ? '✓ OK'
                              : detalle.estado === 'no_esta'
                              ? '✗ No está'
                              : '⚠ Sin acondicionar'}
                          </span>
                        </td>
                        <td>{detalle.observacion || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="modal-footer">
              <button className="secondary" onClick={cerrarDetalles}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default Historial;
```

## 🎨 Estilos

### styles.css
```css
/* ============================================
   PWACuartel - Sistema de Estilos Unificado
   Versión: 1.1 (Consolidado)
   Autor: Fase 1 - Mejora 1.1
   ============================================ */

/* 1. VARIABLES DE DISEÑO */
:root {
  /* Font */
  font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
  
  /* Colores Primarios */
  --color-primary: #2563eb;
  --color-primary-dark: #1e40af;
  --color-primary-light: #dbeafe;
  
  /* Colores de Estado */
  --color-success: #10b981;
  --color-success-light: #d1fae5;
  --color-success-dark: #064e3b;
  
  --color-error: #ef4444;
  --color-error-light: #fee2e2;
  --color-error-dark: #991b1b;
  
  --color-warning: #f59e0b;
  --color-warning-light: #fef3c7;
  --color-warning-dark: #92400e;
  
  --color-info: #3b82f6;
  --color-info-light: #dbeafe;
  --color-info-dark: #1e3a8a;
  
  /* Colores Neutros */
  --color-text-primary: #1f2937;
  --color-text-secondary: #4b5563;
  --color-text-light: #6b7280;
  
  --color-bg-primary: #ffffff;
  --color-bg-secondary: #f8fafc;
  --color-bg-tertiary: #eff6ff;
  
  --color-border: #e2e8f0;
  --color-border-dark: #cbd5e1;
  
  /* Espaciado */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
  
  /* Tipografía */
  --font-size-xs: 12px;
  --font-size-sm: 14px;
  --font-size-base: 16px;
  --font-size-md: 18px;
  --font-size-lg: 22px;
  --font-size-xl: 28px;
  
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
  
  /* Border Radius */
  --radius-sm: 8px;
  --radius-md: 10px;
  --radius-lg: 12px;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 12px rgba(15, 23, 42, 0.08);
  --shadow-lg: 0 10px 25px rgba(15, 23, 42, 0.1);
  
  /* Color de texto general (importante para WCAG) */
  color: var(--color-text-primary);
  background: var(--color-bg-secondary);
}

/* ============================================
   2. RESET Y ESTILOS BASE
   ============================================ */

* {
  box-sizing: border-box;
}

html, body {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
}

body {
  min-height: 100vh;
  background: var(--color-bg-secondary);
  color: var(--color-text-primary);
}

/* ============================================
   3. LAYOUT PRINCIPAL
   ============================================ */

.app-shell {
  max-width: 760px;
  margin: 0 auto;
  padding: var(--spacing-md);
  min-height: 100vh;
}

header {
  margin-bottom: var(--spacing-lg);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

header h1 {
  margin: 0;
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
}

header .user-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  font-size: var(--font-size-sm);
}

main {
  background: var(--color-bg-primary);
  padding: var(--spacing-lg);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  margin-bottom: var(--spacing-lg);
}

/* ============================================
   4. COMPONENTES - BOTONES
   ============================================ */

button {
  cursor: pointer;
  border: none;
  border-radius: var(--radius-md);
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-primary);
  color: white;
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-sm);
  transition: all 0.2s ease;
}

button:hover {
  background: var(--color-primary-dark);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

button:active {
  transform: translateY(0);
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

button.secondary {
  background: var(--color-text-secondary);
}

button.secondary:hover {
  background: var(--color-text-primary);
}

button.danger {
  background: var(--color-error);
}

button.danger:hover {
  background: var(--color-error-dark);
}

button.success {
  background: var(--color-success);
}

button.success:hover {
  background: var(--color-success-dark);
}

button.warning {
  background: var(--color-warning);
}

button.warning:hover {
  background: var(--color-warning-dark);
}

/* ============================================
   5. GRUPOS DE BOTONES
   ============================================ */

.button-group {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: var(--spacing-md);
  margin-top: var(--spacing-lg);
}

.button-group.vertical {
  grid-template-columns: 1fr;
}

/* ============================================
   6. CARDS Y LISTAS
   ============================================ */

.card-list {
  display: grid;
  gap: var(--spacing-md);
}

.card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg-primary);
  transition: all 0.2s ease;
}

.card:hover {
  box-shadow: var(--shadow-md);
  border-color: var(--color-primary);
}

.card-content {
  flex: 1;
}

.card-content strong {
  display: block;
  font-size: var(--font-size-base);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-xs);
}

.card-content .small {
  font-size: var(--font-size-sm);
  color: var(--color-text-light);
}

/* ============================================
   7. INSPECCIÓN - PASO A PASO
   ============================================ */

.step-box {
  padding: var(--spacing-md);
  border: 1px solid var(--color-border-dark);
  border-radius: var(--radius-lg);
  background: var(--color-bg-tertiary);
  margin-top: var(--spacing-md);
}

.step-label {
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  margin-bottom: var(--spacing-sm);
}

.tool-name {
  margin-top: var(--spacing-sm);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
}

/* ============================================
   8. BARRA DE PROGRESO
   ============================================ */

.progress-container {
  height: 4px;
  background: var(--color-border);
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: var(--spacing-lg);
}

.progress-bar {
  height: 100%;
  background: var(--color-primary);
  transition: width 0.3s ease;
}

.progress-percentage {
  font-size: var(--font-size-xs);
  color: var(--color-text-light);
  margin-top: var(--spacing-xs);
  text-align: right;
}

/* ============================================
   9. FORMULARIOS
   ============================================ */

input,
textarea,
select {
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1px solid var(--color-border-dark);
  border-radius: var(--radius-md);
  font-size: var(--font-size-base);
  font-family: inherit;
  transition: all 0.2s ease;
}

input:focus,
textarea:focus,
select:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-light);
}

label {
  display: block;
  margin-bottom: var(--spacing-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
}

textarea {
  min-height: 120px;
  resize: vertical;
}

.form-group {
  margin-bottom: var(--spacing-md);
}

.form-group:last-child {
  margin-bottom: 0;
}

/* ============================================
   10. MENSAJES Y ALERTS
   ============================================ */

.error,
.alert-error {
  background: var(--color-error-light);
  color: var(--color-error-dark);
  padding: var(--spacing-md);
  border-radius: var(--radius-md);
  border-left: 4px solid var(--color-error);
  margin: var(--spacing-md) 0;
}

.success,
.alert-success {
  background: var(--color-success-light);
  color: var(--color-success-dark);
  padding: var(--spacing-md);
  border-radius: var(--radius-md);
  border-left: 4px solid var(--color-success);
  margin: var(--spacing-md) 0;
}

.warning,
.alert-warning {
  background: var(--color-warning-light);
  color: var(--color-warning-dark);
  padding: var(--spacing-md);
  border-radius: var(--radius-md);
  border-left: 4px solid var(--color-warning);
  margin: var(--spacing-md) 0;
}

.info,
.alert-info {
  background: var(--color-info-light);
  color: var(--color-info-dark);
  padding: var(--spacing-md);
  border-radius: var(--radius-md);
  border-left: 4px solid var(--color-info);
  margin: var(--spacing-md) 0;
}

/* ============================================
   11. RESUMEN Y GRILLAS
   ============================================ */

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: var(--spacing-md);
  margin-top: var(--spacing-md);
}

.summary-card {
  padding: var(--spacing-md);
  background: var(--color-bg-tertiary);
  border-radius: var(--radius-lg);
  text-align: center;
  font-weight: var(--font-weight-bold);
  border-left: 4px solid var(--color-primary);
}

.summary-card.ok {
  border-left-color: var(--color-success);
  background: var(--color-success-light);
}

.summary-card.noesta {
  border-left-color: var(--color-error);
  background: var(--color-error-light);
}

.summary-card.sinacondicionar {
  border-left-color: var(--color-warning);
  background: var(--color-warning-light);
}

.summary-card strong {
  display: block;
  font-size: var(--font-size-lg);
  margin-bottom: var(--spacing-xs);
}

.summary-card .label {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-normal);
  opacity: 0.8;
}

/* ============================================
   12. RESULTADOS Y LISTAS
   ============================================ */

.results-list,
.observation-box {
  margin-top: var(--spacing-md);
}

.result-item {
  border-top: 1px solid var(--color-border);
  padding: var(--spacing-md) 0;
}

.result-item:first-child {
  border-top: none;
  padding-top: 0;
}

.result-item strong {
  color: var(--color-text-primary);
}

.result-item .small {
  color: var(--color-text-light);
  font-size: var(--font-size-sm);
  margin-top: var(--spacing-xs);
}

/* ============================================
   13. MODAL DE CONFIRMACIÓN
   ============================================ */

.confirmation-modal {
  background: var(--color-primary);
  color: white;
  padding: var(--spacing-lg);
  border-radius: var(--radius-lg);
  margin: var(--spacing-md) 0;
  box-shadow: var(--shadow-lg);
}

.confirmation-modal h3 {
  margin: 0 0 var(--spacing-md) 0;
  font-size: var(--font-size-lg);
}

.confirmation-modal p {
  margin: 0 0 var(--spacing-md) 0;
  font-size: var(--font-size-base);
  opacity: 0.95;
}

.confirmation-modal button {
  background: white;
  color: var(--color-primary);
}

.confirmation-modal button:hover {
  background: var(--color-border);
}

.confirmation-modal button.secondary {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

.confirmation-modal button.secondary:hover {
  background: rgba(255, 255, 255, 0.3);
}
```

### pages/Historial.css
```css
/* ============================================
   HEADER Y LAYOUT
   ============================================ */

.historial-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.historial-header h2 {
  margin: 0;
  font-size: 28px;
  color: #333;
  flex: 1;
  min-width: 200px;
}

.btn-volver {
  padding: 10px 20px;
  background: #f0f0f0;
  border: 1px solid #ddd;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
  color: #333;
  transition: all 0.3s ease;
}

.btn-volver:hover {
  background: #e0e0e0;
  border-color: #999;
}

/* ============================================
   LOADING Y MENSAJES
   ============================================ */

.loading {
  text-align: center;
  padding: 60px 20px;
  color: #999;
  font-size: 16px;
}

.sin-datos {
  text-align: center;
  padding: 60px 20px;
  color: #999;
  font-size: 18px;
}

.error {
  background: #fee;
  border: 1px solid #fcc;
  border-radius: 5px;
  padding: 15px;
  margin-bottom: 20px;
  color: #c33;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}

.retry-link {
  background: none;
  border: none;
  color: #c33;
  text-decoration: underline;
  cursor: pointer;
  font-size: 14px;
  padding: 5px 10px;
}

.retry-link:hover {
  color: #922;
}

/* ============================================
   GRID DE TARJETAS
   ============================================ */

.inspecciones-container {
  width: 100%;
}

.inspecciones-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

@media (max-width: 768px) {
  .inspecciones-grid {
    grid-template-columns: 1fr;
  }
}

/* ============================================
   TARJETAS DE INSPECCIÓN
   ============================================ */

.inspeccion-card {
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
  background: white;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
}

.inspeccion-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
  border-color: #999;
}

.card-header {
  background: #f8f8f8;
  padding: 15px;
  border-bottom: 1px solid #eee;
}

.card-header h3 {
  margin: 0 0 10px 0;
  font-size: 16px;
  color: #333;
  word-break: break-word;
}

.card-meta {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.card-header .fecha {
  font-size: 12px;
  color: #999;
}

.card-header .usuario {
  font-size: 12px;
  color: #666;
  background: #f0f0f0;
  padding: 4px 8px;
  border-radius: 3px;
  display: inline-block;
  width: fit-content;
}

/* ============================================
   ESTADÍSTICAS
   ============================================ */

.card-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  padding: 15px;
  background: #fafafa;
  border-bottom: 1px solid #eee;
}

.stat {
  text-align: center;
  padding: 10px;
  border-radius: 4px;
  font-size: 12px;
}

.stat .label {
  display: block;
  color: #666;
  margin-bottom: 5px;
}

.stat .number {
  display: block;
  font-size: 20px;
  font-weight: bold;
}

.stat.ok {
  background: #d4edda;
  color: #155724;
}

.stat.no-esta {
  background: #f8d7da;
  color: #721c24;
}

.stat.sin-acondicionar {
  background: #fff3cd;
  color: #856404;
}

/* ============================================
   NOTAS
   ============================================ */

.card-notas {
  padding: 12px 15px;
  background: #fffef5;
  border-bottom: 1px solid #eee;
  font-size: 13px;
  color: #666;
  line-height: 1.4;
}

.card-notas strong {
  color: #333;
}

/* ============================================
   PIE DE TARJETA
   ============================================ */

.card-footer {
  padding: 12px 15px;
  margin-top: auto;
}

.btn-detalles {
  width: 100%;
  padding: 10px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.btn-detalles:hover {
  background: #45a049;
  transform: scale(1.01);
}

.btn-detalles:active {
  transform: scale(0.99);
}

/* ============================================
   MODAL
   ============================================ */

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: white;
  border-radius: 8px;
  padding: 30px;
  max-width: 700px;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
  position: relative;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.modal-content h3 {
  margin: 0 0 20px 0;
  font-size: 20px;
  color: #333;
  padding-right: 30px;
}

.inspector-info {
  background: #f9f9f9;
  border: 1px solid #eee;
  border-radius: 5px;
  padding: 15px;
  margin-bottom: 20px;
  font-size: 14px;
}

.inspector-info p {
  margin: 8px 0;
  color: #666;
}

.inspector-info strong {
  color: #333;
  display: inline-block;
  min-width: 100px;
}

@media (max-width: 600px) {
  .card-meta {
    gap: 4px;
  }
  
  .card-header .usuario {
    font-size: 11px;
    padding: 3px 6px;
  }
}

.btn-cerrar-modal {
  position: absolute;
  top: 15px;
  right: 15px;
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #999;
  padding: 5px;
  transition: color 0.3s ease;
}

.btn-cerrar-modal:hover {
  color: #333;
}

.sin-detalles {
  text-align: center;
  padding: 40px 20px;
  color: #999;
}

/* ============================================
   TABLA DE DETALLES
   ============================================ */

.detalles-tabla {
  overflow-x: auto;
  margin-top: 20px;
}

.detalles-tabla table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.detalles-tabla th {
  background: #f0f0f0;
  padding: 12px;
  text-align: left;
  border-bottom: 2px solid #ddd;
  font-weight: 600;
  color: #333;
  position: sticky;
  top: 0;
}

.detalles-tabla td {
  padding: 12px;
  border-bottom: 1px solid #eee;
  color: #666;
}

.detalles-tabla tbody tr:hover {
  background: #f9f9f9;
}

.detalles-tabla tbody tr:last-child td {
  border-bottom: none;
}

/* ============================================
   ESTADOS (badges)
   ============================================ */

.estado {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}

.estado-ok {
  background: #d4edda;
  color: #155724;
  border: 1px solid #b1dfbb;
}

.estado-no_esta {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.estado-sin_acondicionar {
  background: #fff3cd;
  color: #856404;
  border: 1px solid #ffc107;
}

/* ============================================
   RESPONSIVE
   ============================================ */

@media (max-width: 600px) {
  .historial-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .historial-header h2 {
    font-size: 22px;
  }

  .btn-volver {
    width: 100%;
  }

  .inspecciones-grid {
    grid-template-columns: 1fr;
    gap: 15px;
  }

  .modal-content {
    padding: 20px;
  }

  .card-stats {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .detalles-tabla table {
    font-size: 12px;
  }

  .detalles-tabla th,
  .detalles-tabla td {
    padding: 8px;
  }
}
```

### [CUALQUIER OTRO .css IMPORTANTE]
```css
NO EXISTE
```

## 📝 Información de Tablas de BD
- **usuarios**: id, legajo, nombre, contrasena, primer_login, activo, fecha_creacion, fecha_ultimo_login
- **auditorias_login**: id, usuario_id, legajo, fecha_login, ip, estado
- **unidades**: id, nombre, placa
- **herramientas**: id, nombre
- **rutina_unidad**: id, unidad_id, herramienta_id, orden
- **inspecciones**: id, unidad_id, user_id, fecha, notas
- **inspeccion_detalle**: id, inspeccion_id, herramienta_id, estado, observacion

## 🔄 Flujo de la Aplicación
1. El usuario entra a la app y se presenta la pantalla de login.
2. Si el usuario necesita primer login, se redirige a `PrimerLogin.jsx` para definir contraseña.
3. Tras autenticarse, el usuario ve `Unidades.jsx` con la lista de unidades.
4. Al seleccionar una unidad, se obtiene la rutina desde `/rutina/:unidad_id`.
5. En `Inspeccion.jsx` el usuario recorre herramientas y marca estado + observación cuando corresponde.
6. Se muestra un resumen en `Resumen.jsx` antes de enviar la inspección.
7. La inspección se guarda via `POST /inspecciones` y el backend registra `user_id`.
8. En `Historial.jsx`, el usuario ve solo sus inspecciones y puede abrir un modal con detalles.

## ⚠️ Notas Importantes
- `GET /inspecciones` ya está filtrado por el usuario actual (`WHERE i.user_id = ?`).
- La autenticación se maneja con JWT y el middleware `verificarToken` en `backend/middleware/auth.js`.
- `backend/.env` contiene la configuración de SQLite y JWT, y debe cambiarse en producción.
- `frontend` no tiene `.env`; las URL del backend están hardcodeadas en `AuthContext.jsx` y `api.js` como `http://localhost:4000`.
- El service worker `frontend/public/sw.js` implementa caching y subida offline de inspecciones.
- `schema.sql` incluye carga inicial de unidades, herramientas y rutinas de muestra.
- `Inspeccion.jsx` contiene una estructura con un segundo `<main>` interno, lo cual es una curiosidad semántica.

## 📌 Últimos Cambios
- Se agregó en el backend `usuario_nombre` y `usuario_legajo` en la consulta de inspecciones.
- Se incorporó `WHERE i.user_id = ?` para que cada usuario vea solo sus inspecciones.
- `Historial.jsx` se actualizó para mostrar nombre y legajo del inspector en tarjetas y modal.
- Se agregaron estilos en `frontend/src/pages/Historial.css` para la info del usuario.
- `Unidades.jsx` ahora recibe `onVerHistorial` y muestra un botón para ir al historial.
- Se agregó `btn-historial` al estilo general en `frontend/src/styles.css`.
