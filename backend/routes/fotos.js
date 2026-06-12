// backend/routes/fotos.js

const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadConfig.js');
const fotosController = require('../controllers/fotosController.js');
const { verificarToken } = require('../middleware/auth.js');

// POST - Subir foto
router.post('/', verificarToken, upload.single('foto'), fotosController.subirFoto);

// GET - Obtener fotos de una inspección
router.get('/:inspeccion_id', verificarToken, fotosController.obtenerFotosPorInspeccion);

// DELETE - Eliminar foto
router.delete('/:foto_id', verificarToken, fotosController.eliminarFoto);

// GET - Estadísticas
router.get('/estadisticas/usuario', verificarToken, fotosController.obtenerEstadisticas);

module.exports = router;