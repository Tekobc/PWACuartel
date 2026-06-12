const express = require('express');
const router = express.Router();
const { verificarToken } = require('../middleware/auth');
const {
  createInspeccion,
  getInspecciones,
} = require('../controllers/inspeccionesController');

router.post('/', verificarToken, createInspeccion);
router.get('/', verificarToken, getInspecciones);

module.exports = router;