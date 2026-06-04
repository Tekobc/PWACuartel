// 1. PRIMERO: requires globales
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./db');

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