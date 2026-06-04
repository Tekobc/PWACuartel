# PWACuartel

PWA para la revisión de unidades, herramientas y materiales de un cuartel de bomberos.

La aplicación permite iniciar sesión por legajo, seleccionar una unidad, completar una rutina de inspección y registrar el estado de cada herramienta o material.

## Características

- Aplicación web progresiva.
- Frontend desarrollado con React y Vite.
- Backend REST con Node.js y Express.
- Base de datos SQLite.
- Autenticación con JWT.
- Primer login con creación de contraseña.
- Registro de inspecciones por unidad.
- Historial de inspecciones realizadas.
- Validación de estados de herramientas y materiales.
- Observación obligatoria cuando un elemento no está o no está acondicionado.

## Estados disponibles

Cada herramienta o material puede registrarse con uno de los siguientes estados:

- `ok`: el elemento está presente y en condiciones.
- `no_esta`: el elemento no se encuentra en la unidad.
- `sin_acondicionar`: el elemento está presente, pero no está en condiciones.

Cuando el estado es `no_esta` o `sin_acondicionar`, se debe cargar una observación.

## Tecnologías utilizadas

### Frontend

- React
- Vite
- CSS
- Service Worker
- Web App Manifest

### Backend

- Node.js
- Express
- SQLite
- JWT
- bcryptjs
- CORS
- dotenv

## Estructura del proyecto

```txt
PWACuartel/
├── backend/
│   ├── app.js
│   ├── init-db.js
│   ├── controllers/
│   │   ├── inspeccionesController.js
│   │   ├── rutinaController.js
│   │   └── unidadesController.js
│   ├── db/
│   │   ├── bomberos.db
│   │   ├── index.js
│   │   └── schema.sql
│   ├── middleware/
│   │   └── auth.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── inspecciones.js
│   │   ├── rutina.js
│   │   └── unidades.js
│   └── package.json
├── frontend/
│   ├── index.html
│   ├── vite.config.js
│   ├── public/
│   │   ├── manifest.json
│   │   └── sw.js
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   ├── styles.css
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── pages/
│   │   │   ├── Inspeccion.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── PrimerLogin.jsx
│   │   │   ├── Resumen.jsx
│   │   │   └── Unidades.jsx
│   │   └── services/
│   │       └── api.js
└── README.md