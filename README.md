# Checklist Bomberos

Proyecto simple para gestión de revisión de unidades de bomberos.

## Estructura

- `/backend`: servidor Node.js con Express y PostgreSQL.
- `/frontend`: app React con Vite.
- `/backend/db/schema.sql`: script para crear tablas y datos de ejemplo.

## Backend

### Requisitos

- SQLite como base ligera.
- El archivo de datos se crea automáticamente en `backend/bomberos.db`.

### Preparar

1. Instalar dependencias:
   ```bash
   cd backend
   npm install
   ```
2. Crear o actualizar la base de datos SQLite:
   ```bash
   npm run init-db
   ```
3. Ejecutar el servidor:
   ```bash
   npm run dev
   ```

> Alternativamente puedes usar `SQLITE_FILE` para apuntar a otro archivo SQLite.

### Endpoints

- `GET /unidades`
- `GET /rutina/:unidad_id`
- `POST /inspecciones`
- `GET /inspecciones`

## Frontend

### Preparar

```bash
cd frontend
npm install
npm run dev
```

La app correrá en `http://localhost:5173`.

## Ejemplo de POST /inspecciones

```bash
curl -X POST http://localhost:4000/inspecciones \
  -H "Content-Type: application/json" \
  -d '{
    "unidad_id": 1,
    "notas": "Revisión post-servicio",
    "detalles": [
      {"herramienta_id": 1, "estado": "ok"},
      {"herramienta_id": 2, "estado": "no_esta", "observacion": "Falta el hacha"},
      {"herramienta_id": 3, "estado": "sin_acondicionar", "observacion": "Linterna con batería baja"}
    ]
  }'
```

> Si el estado es `no_esta` o `sin_acondicionar`, el campo `observacion` es obligatorio.
