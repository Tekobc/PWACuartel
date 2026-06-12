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
const fotosRoutes = require('./routes/fotos');

// 4. CUARTO: middleware global
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// 5. QUINTO: rutas públicas (SIN autenticación)
app.use('/auth', authRoutes);

// 6. SEXTO: rutas protegidas (CON autenticación)
app.use('/unidades', verificarToken, unidadesRoutes);
app.use('/inspecciones', verificarToken, inspeccionesRoutes);
app.use('/rutina', verificarToken, rutinaRoutes);
app.use('/api/fotos', verificarToken, fotosRoutes);

// 7. SÉPTIMO: iniciar servidor
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Backend escuchando en http://localhost:${PORT}`);
});