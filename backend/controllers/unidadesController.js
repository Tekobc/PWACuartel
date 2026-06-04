const db = require('../db');

async function getUnidades(req, res, next) {
  try {
    const unidades = await db.all('SELECT id, nombre, placa FROM unidades ORDER BY id');
    res.json(unidades);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getUnidades,
};
