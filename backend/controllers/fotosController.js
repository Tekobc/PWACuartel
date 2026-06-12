// backend/controllers/fotosController.js

const db = require('../db/index.js');
const fs = require('fs');
const path = require('path');

// Subir foto
exports.subirFoto = (req, res) => {
  try {
    // Validaciones
    if (!req.file) {
      return res.status(400).json({ message: 'No se recibió archivo' });
    }

    const { inspeccion_id, herramienta_id } = req.body;
    const user_id = req.user.id;

    if (!inspeccion_id || !herramienta_id) {
      // Eliminar archivo si falta datos
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'Faltan inspeccion_id o herramienta_id' });
    }

    // Verificar que la inspección existe
    db.get(
      'SELECT id FROM inspecciones WHERE id = ? AND user_id = ?',
      [inspeccion_id, user_id],
      (err, inspeccion) => {
        if (err) {
          fs.unlinkSync(req.file.path);
          return res.status(500).json({ message: 'Error en servidor' });
        }

        if (!inspeccion) {
          fs.unlinkSync(req.file.path);
          return res.status(403).json({ message: 'Inspección no encontrada o no autorizado' });
        }

        // Guardar referencia en BD
        db.run(
          `INSERT INTO fotos_inspeccion (inspeccion_id, herramienta_id, user_id, filename, ruta_servidor, tamaño)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            inspeccion_id,
            herramienta_id,
            user_id,
            req.file.filename,
            `/uploads/fotos_inspecciones/${req.file.filename}`,
            req.file.size,
          ],
          function (err) {
            if (err) {
              fs.unlinkSync(req.file.path);
              return res.status(500).json({ message: 'Error guardando referencia en BD', error: err.message });
            }

            res.status(201).json({
              success: true,
              foto_id: this.lastID,
              url: `/uploads/fotos_inspecciones/${req.file.filename}`,
              filename: req.file.filename,
            });
          }
        );
      }
    );
  } catch (error) {
    // Limpiar archivo si hubo error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: 'Error al subir foto', error: error.message });
  }
};

// Obtener fotos de una inspección
exports.obtenerFotosPorInspeccion = (req, res) => {
  const { inspeccion_id } = req.params;
  const user_id = req.user.id;

  // Verificar que la inspección pertenece al usuario
  db.get(
    'SELECT id FROM inspecciones WHERE id = ? AND user_id = ?',
    [inspeccion_id, user_id],
    (err, inspeccion) => {
      if (err) {
        return res.status(500).json({ message: 'Error en servidor' });
      }

      if (!inspeccion) {
        return res.status(403).json({ message: 'No autorizado' });
      }

      // Obtener fotos
      db.all(
        `SELECT id, herramienta_id, filename, ruta_servidor, tamaño, fecha_carga
         FROM fotos_inspeccion
         WHERE inspeccion_id = ?
         ORDER BY fecha_carga DESC`,
        [inspeccion_id],
        (err, fotos) => {
          if (err) {
            return res.status(500).json({ message: 'Error obteniendo fotos', error: err.message });
          }

          res.json({
            fotos: fotos || [],
            total: (fotos || []).length,
          });
        }
      );
    }
  );
};

// Eliminar foto
exports.eliminarFoto = (req, res) => {
  const { foto_id } = req.params;
  const user_id = req.user.id;

  // Obtener foto para verificar pertenencia
  db.get(
    `SELECT f.id, f.ruta_servidor, i.user_id
     FROM fotos_inspeccion f
     JOIN inspecciones i ON f.inspeccion_id = i.id
     WHERE f.id = ?`,
    [foto_id],
    (err, foto) => {
      if (err) {
        return res.status(500).json({ message: 'Error en servidor' });
      }

      if (!foto) {
        return res.status(404).json({ message: 'Foto no encontrada' });
      }

      if (foto.user_id !== user_id) {
        return res.status(403).json({ message: 'No autorizado' });
      }

      // Eliminar archivo
      const rutaArchivo = path.join(__dirname, '../', foto.ruta_servidor);
      if (fs.existsSync(rutaArchivo)) {
        fs.unlinkSync(rutaArchivo);
      }

      // Eliminar registro de BD
      db.run(
        'DELETE FROM fotos_inspeccion WHERE id = ?',
        [foto_id],
        (err) => {
          if (err) {
            return res.status(500).json({ message: 'Error eliminando foto', error: err.message });
          }

          res.status(204).send();
        }
      );
    }
  );
};

// Obtener estadísticas de fotos
exports.obtenerEstadisticas = (req, res) => {
  const user_id = req.user.id;

  db.get(
    `SELECT COUNT(*) as total, SUM(tamaño) as tamaño_total
     FROM fotos_inspeccion
     WHERE user_id = ?`,
    [user_id],
    (err, stats) => {
      if (err) {
        return res.status(500).json({ message: 'Error obteniendo estadísticas' });
      }

      res.json({
        total_fotos: stats?.total || 0,
        tamaño_total_bytes: stats?.tamaño_total || 0,
        tamaño_total_mb: ((stats?.tamaño_total || 0) / (1024 * 1024)).toFixed(2),
      });
    }
  );
};