const express = require('express');
const router = express.Router();
const {
  createInspeccion,
  getInspecciones,
} = require('../controllers/inspeccionesController');

router.post('/', createInspeccion);
router.get('/', getInspecciones);

module.exports = router;
