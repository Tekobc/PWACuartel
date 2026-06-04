const db = require('../db');

async function getRutinaPorUnidad(req, res, next) {
  const unidadId = parseInt(req.params.unidad_id, 10);
  if (Number.isNaN(unidadId)) {
    return res.status(400).json({ error: 'unidad_id inválido' });
  }

  try {
    const rutina = await db.all(
      `SELECT h.id as herramienta_id, h.nombre as herramienta_nombre, ru.orden
       FROM rutina_unidad ru
       JOIN herramientas h ON ru.herramienta_id = h.id
       WHERE ru.unidad_id = ?
       ORDER BY ru.orden`,
      [unidadId]
    );

    if (rutina.length === 0) {
      return res.status(404).json({ error: 'No se encontró rutina para esta unidad' });
    }

    res.json(rutina);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getRutinaPorUnidad,
};
