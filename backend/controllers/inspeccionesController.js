const db = require('../db');

const validEstados = ['ok', 'no_esta', 'sin_acondicionar'];

async function createInspeccion(req, res, next) {
  const { unidad_id, detalles, notas } = req.body;

  if (!unidad_id || !Array.isArray(detalles) || detalles.length === 0) {
    return res.status(400).json({ error: 'unidad_id y detalles son obligatorios' });
  }

  for (const detalle of detalles) {
    if (!validEstados.includes(detalle.estado)) {
      return res.status(400).json({ error: `Estado inválido: ${detalle.estado}` });
    }
    if ((detalle.estado === 'no_esta' || detalle.estado === 'sin_acondicionar') && !detalle.observacion) {
      return res.status(400).json({ error: 'Observación obligatoria para estados no_esta o sin_acondicionar' });
    }
  }

  try {
    const inspeccionId = await db.transaction(async () => {
      const insertInspeccionResult = await db.run(
        'INSERT INTO inspecciones (unidad_id, user_id, notas) VALUES (?, ?, ?)',
        [unidad_id, req.user.id, notas || null]
      );

      const newInspeccionId = insertInspeccionResult.lastID;

      for (const detalle of detalles) {
        await db.run(
          'INSERT INTO inspeccion_detalle (inspeccion_id, herramienta_id, estado, observacion) VALUES (?, ?, ?, ?)',
          [newInspeccionId, detalle.herramienta_id, detalle.estado, detalle.observacion || null]
        );
      }

      return newInspeccionId;
    });

    res.status(201).json({
      success: true,
      inspectionId: inspeccionId,
      message: 'Inspección guardada correctamente'
    });
  } catch (error) {
    next(error);
  }
}

async function getInspecciones(req, res, next) {
  try {
    const userId = req.user.id;
    const inspecciones = await db.all(
      `SELECT i.id, i.unidad_id, u.nombre as unidad_nombre, i.fecha, i.notas,
        i.user_id, us.nombre as usuario_nombre, us.legajo as usuario_legajo
       FROM inspecciones i
       JOIN unidades u ON i.unidad_id = u.id
       LEFT JOIN usuarios us ON i.user_id = us.id
       WHERE i.user_id = ?
       ORDER BY i.fecha DESC`,
      [userId]
    );

    if (inspecciones.length === 0) {
      return res.json([]);
    }

    const ids = inspecciones.map((item) => item.id);
    const placeholders = ids.map(() => '?').join(',');
    const detalles = await db.all(
      `SELECT d.inspeccion_id, h.nombre as herramienta_nombre, d.estado, d.observacion
       FROM inspeccion_detalle d
       JOIN herramientas h ON d.herramienta_id = h.id
       WHERE d.inspeccion_id IN (${placeholders})
       ORDER BY d.inspeccion_id, h.id`,
      ids
    );

    const detallesPorInspeccion = detalles.reduce((acc, detalle) => {
      const list = acc[detalle.inspeccion_id] || [];
      list.push(detalle);
      acc[detalle.inspeccion_id] = list;
      return acc;
    }, {});

    const full = inspecciones.map((inspeccion) => ({
      ...inspeccion,
      detalles: detallesPorInspeccion[inspeccion.id] || [],
    }));

    res.json(full);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createInspeccion,
  getInspecciones,
};
