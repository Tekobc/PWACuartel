const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../db');

// POST /auth/login - Primer intento de login
const CENTRAL_PREFIX = '80/';

router.post('/login', async (req, res) => {
  try {
    let { legajo, contrasena } = req.body;
    
    if (!legajo) {
      return res.status(400).json({ 
        error: 'Legajo requerido' 
      });
    }

    // Agregar prefijo automáticamente
    if (!legajo.includes('/')) {
      legajo = CENTRAL_PREFIX + legajo;
    }

    const usuario = await db.get('SELECT * FROM usuarios WHERE legajo = ?', [legajo]);

    if (!usuario) {
      return res.status(401).json({ 
        error: 'Legajo no encontrado' 
      });
    }

    // Si es primer login, no verifica contraseña
    // TEMPORAL SOLO PARA TESTING
    if (legajo === '80/001') {
      const token = jwt.sign(
        {
          id: usuario.id,
          legajo: usuario.legajo,
          nombre: usuario.nombre
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      await db.run('UPDATE usuarios SET fecha_ultimo_login = CURRENT_TIMESTAMP WHERE id = ?', [usuario.id]);

      return res.json({
        token,
        usuario: {
          id: usuario.id,
          legajo: usuario.legajo,
          nombre: usuario.nombre
        }
      });
    }
    
    
    
    
    
    
    if (usuario.primer_login === 1) {
      return res.status(200).json({
        mensaje: 'Primer login detectado',
        primer_login: true,
        usuario_id: usuario.id,
        legajo: usuario.legajo,
        nombre: usuario.nombre
      });
    }

    // Si no es primer login, verifica contraseña
    if (!usuario.contrasena) {
      return res.status(401).json({ 
        error: 'Usuario no tiene contraseña configurada. Contacte al administrador.' 
      });
    }

    if (!contrasena) {
      return res.status(400).json({ error: 'Contraseña requerida' });
    }

    const contrasenaValida = await bcrypt.compare(contrasena, usuario.contrasena);

    if (!contrasenaValida) {
      // Registrar intento fallido
      await db.run('INSERT INTO auditorias_login (usuario_id, legajo, estado) VALUES (?, ?, ?)', [usuario.id, legajo, 'FALLIDO']);

      return res.status(401).json({ 
        error: 'Contraseña incorrecta' 
      });
    }

    // Login exitoso
    const token = jwt.sign(
      {
        id: usuario.id,
        legajo: usuario.legajo,
        nombre: usuario.nombre
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Actualizar último login
    await db.run('UPDATE usuarios SET fecha_ultimo_login = CURRENT_TIMESTAMP WHERE id = ?', [usuario.id]);

    // Registrar login exitoso
    await db.run('INSERT INTO auditorias_login (usuario_id, legajo, estado) VALUES (?, ?, ?)', [usuario.id, legajo, 'EXITOSO']);

    res.json({
      token,
      usuario: {
        id: usuario.id,
        legajo: usuario.legajo,
        nombre: usuario.nombre
      }
    });
  } catch (err) {
    console.error('Error en login:', err);
    res.status(500).json({ error: 'Error en servidor' });
  }
});

// POST /auth/set-password - Definir contraseña (primer login)
router.post('/set-password', async (req, res) => {
  try {
    const { usuario_id, contrasena, confirmar } = req.body;

    // Validaciones
    if (!usuario_id || !contrasena) {
      return res.status(400).json({ 
        error: 'Usuario ID y contraseña requeridos' 
      });
    }

    if (contrasena !== confirmar) {
      return res.status(400).json({ 
        error: 'Las contraseñas no coinciden' 
      });
    }

    if (contrasena.length < 6) {
      return res.status(400).json({ 
        error: 'La contraseña debe tener al menos 6 caracteres' 
      });
    }

    // Buscar usuario
    const usuario = await db.get('SELECT * FROM usuarios WHERE id = ?', [usuario_id]);

    if (!usuario) {
      return res.status(404).json({ 
        error: 'Usuario no encontrado' 
      });
    }

    // Encriptar contraseña
    const salt = await bcrypt.genSalt(10);
    const contrasenaEncriptada = await bcrypt.hash(contrasena, salt);

    // Actualizar usuario
    await db.run('UPDATE usuarios SET contrasena = ?, primer_login = 0 WHERE id = ?', [contrasenaEncriptada, usuario_id]);

    // Generar token
    const token = jwt.sign(
      {
        id: usuario.id,
        legajo: usuario.legajo,
        nombre: usuario.nombre
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Registrar login
    await db.run('INSERT INTO auditorias_login (usuario_id, legajo, estado) VALUES (?, ?, ?)', [usuario.id, usuario.legajo, 'EXITOSO']);

    res.json({
      mensaje: 'Contraseña definida correctamente',
      token,
      usuario: {
        id: usuario.id,
        legajo: usuario.legajo,
        nombre: usuario.nombre
      }
    });
  } catch (err) {
    console.error('Error en set-password:', err);
    res.status(500).json({ error: 'Error en servidor' });
  }
});

// POST /auth/change-password - Cambiar contraseña (usuario autenticado)
router.post('/change-password', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token requerido' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const { contrasenaActual, contrasenaNueva, confirmar } = req.body;

    if (!contrasenaActual || !contrasenaNueva) {
      return res.status(400).json({ 
        error: 'Todos los campos son requeridos' 
      });
    }

    if (contrasenaNueva !== confirmar) {
      return res.status(400).json({ 
        error: 'Las contraseñas nuevas no coinciden' 
      });
    }

    if (contrasenaNueva.length < 6) {
      return res.status(400).json({ 
        error: 'La contraseña debe tener al menos 6 caracteres' 
      });
    }

    // Buscar usuario
    const usuario = await db.get('SELECT * FROM usuarios WHERE id = ?', [decoded.id]);

    if (!usuario) {
      return res.status(404).json({ 
        error: 'Usuario no encontrado' 
      });
    }

    // Verificar contraseña actual
    const bcrypt = require('bcryptjs');
    const contrasenaValida = bcrypt.compareSync(
      contrasenaActual, 
      usuario.contrasena
    );

    if (!contrasenaValida) {
      return res.status(401).json({ 
        error: 'Contraseña actual incorrecta' 
      });
    }

    // Encriptar nueva contraseña
    const salt = bcrypt.genSaltSync(10);
    const contrasenaNuevaEncriptada = bcrypt.hashSync(contrasenaNueva, salt);

    // Actualizar
    await db.run('UPDATE usuarios SET contrasena = ? WHERE id = ?', [contrasenaNuevaEncriptada, decoded.id]);

    res.json({ 
      mensaje: 'Contraseña actualizada correctamente' 
    });
  } catch (err) {
    console.error('Error en change-password:', err);
    res.status(500).json({ error: 'Error en servidor' });
  }
});

// GET /auth/verify - Verificar token actual
router.get('/verify', (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token requerido' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    res.json({ 
      valido: true,
      usuario: decoded 
    });
  } catch (err) {
    res.status(401).json({ 
      valido: false,
      error: 'Token inválido' 
    });
  }
});

// POST /auth/logout - Logout (opcional, por completitud)
router.post('/logout', (req, res) => {
  // En JWT, el logout es simplemente eliminar el token del cliente
  res.json({ 
    mensaje: 'Sesión cerrada correctamente' 
  });
});

module.exports = router;