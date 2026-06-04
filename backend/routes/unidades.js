const express = require('express');
const router = express.Router();
const { getUnidades } = require('../controllers/unidadesController');

router.get('/', getUnidades);

module.exports = router;
