const express = require('express');
const router = express.Router();
const { getRutinaPorUnidad } = require('../controllers/rutinaController');

router.get('/:unidad_id', getRutinaPorUnidad);

module.exports = router;
