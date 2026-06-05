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
  fecha TEXT NOT NULL DEFAULT (datetime('now')),
  notas TEXT,
  FOREIGN KEY (unidad_id) REFERENCES unidades(id) ON DELETE CASCADE
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