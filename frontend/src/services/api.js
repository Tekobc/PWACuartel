// frontend/src/services/api.js

const API_BASE = 'http://localhost:4000';

// ============================================
// UTILIDADES
// ============================================

function obtenerToken() {
  return localStorage.getItem('auth_token');
}

function generarHeaders(incluirAuth = true) {
  const headers = { 'Content-Type': 'application/json' };

  if (incluirAuth) {
    const token = obtenerToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  return headers;
}

// ============================================
// AUTENTICACIÓN
// ============================================

export async function login(legajo, contrasena) {
  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ legajo, contrasena })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error en login');
    }

    const data = await response.json();
    
    // Guardar token con clave consistente
    if (data.token) {
      localStorage.setItem('auth_token', data.token);
    }
    
    return data;
  } catch (err) {
    console.error('Error en login:', err);
    throw err;
  }
}

export async function primerLogin(legajo, contrasena) {
  try {
    const response = await fetch(`${API_BASE}/auth/primer-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ legajo, contrasena })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error en primer login');
    }

    const data = await response.json();
    
    // Guardar token
    if (data.token) {
      localStorage.setItem('auth_token', data.token);
    }
    
    return data;
  } catch (err) {
    console.error('Error en primerLogin:', err);
    throw err;
  }
}

export function logout() {
  localStorage.removeItem('auth_token');
}

export function obtenerUsuarioDelToken() {
  const token = obtenerToken();
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload;
  } catch (err) {
    console.error('Error decodificando token:', err);
    return null;
  }
}

// ============================================
// UNIDADES
// ============================================

export async function obtenerUnidades() {
  try {
    const token = obtenerToken();
    
    if (!token) {
      throw new Error('No hay sesión activa');
    }

    const response = await fetch(`${API_BASE}/unidades`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    return response.json();
  } catch (err) {
    console.error('Error obtenerUnidades:', err);
    throw err;
  }
}

// Alias para compatibilidad
export async function fetchUnidades() {
  return obtenerUnidades();
}

// ============================================
// RUTINA
// ============================================

export async function obtenerRutina(unidadId) {
  try {
    const token = obtenerToken();
    
    if (!token) {
      throw new Error('No hay sesión activa');
    }

    const response = await fetch(`${API_BASE}/rutina/${unidadId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Error: ${response.status}`);
    }

    return response.json();
  } catch (err) {
    console.error('Error obtenerRutina:', err);
    throw err;
  }
}

// Alias para compatibilidad
export async function fetchRutina(unidadId) {
  return obtenerRutina(unidadId);
}

// ============================================
// INSPECCIONES
// ============================================

export async function guardarInspeccion(respuestas, unidadId) {
  const token = obtenerToken();

  // Validar token
  if (!token) {
    throw new Error('Token requerido para guardar inspección');
  }

  const MAX_REINTENTOS = 3;

  for (let intento = 1; intento <= MAX_REINTENTOS; intento++) {
    try {
      // Preparar datos
      const datos = {
        unidad_id: unidadId,
        detalles: respuestas,
        notas: ''
      };

      console.log('📤 Enviando inspección...', { 
        token: token.substring(0, 20) + '...', 
        datos 
      });

      const response = await fetch(`${API_BASE}/inspecciones`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(datos)
      });

      const statusCode = response.status;
      const contentType = response.headers.get('content-type');
      const responseText = await response.text();

      console.log('=== RESPUESTA DEL SERVIDOR ===');
      console.log('Status:', statusCode);
      console.log('Content-Type:', contentType);
      console.log('Body:', responseText);
      console.log('==========================');

      if (!response.ok) {
        throw new Error(`Error ${statusCode}: ${responseText}`);
      }

      // SOLO PARSEAR SI ES JSON
      if (contentType?.includes('application/json')) {
        const resultado = JSON.parse(responseText);
        console.log('✅ Inspección guardada exitosamente:', resultado);
        return resultado;
      } else {
        console.warn('⚠️ Respuesta no es JSON:', contentType);
        throw new Error(`Respuesta inválida del servidor: ${contentType}`);
      }
    } catch (err) {
      if (intento === MAX_REINTENTOS) {
        console.error('❌ Error guardarInspeccion (intento final):', err);
        throw err;
      }

      // Esperar antes de reintentar (backoff exponencial: 2s, 4s, 8s)
      const espera = Math.pow(2, intento) * 1000;
      console.warn(`⏳ Reintentando guardarInspeccion en ${espera / 1000}s (intento ${intento}/${MAX_REINTENTOS})...`);
      await new Promise(resolve => setTimeout(resolve, espera));
    }
  }
}

export async function obtenerInspecciones() {
  try {
    const token = obtenerToken();
    
    if (!token) {
      throw new Error('No hay sesión activa');
    }

    const response = await fetch(`${API_BASE}/inspecciones`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    return response.json();
  } catch (err) {
    console.error('Error obtenerInspecciones:', err);
    throw err;
  }
}

// Alias para compatibilidad
export async function fetchInspecciones() {
  return obtenerInspecciones();
}

// ============================================
// HISTORIAL / AUDITORÍA
// ============================================

export async function obtenerHistorialInspecciones(unidadId = null) {
  try {
    const token = obtenerToken();
    
    if (!token) {
      throw new Error('No hay sesión activa');
    }

    let url = `${API_BASE}/inspecciones`;
    if (unidadId) {
      url += `?unidad_id=${unidadId}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    return response.json();
  } catch (err) {
    console.error('Error obtenerHistorialInspecciones:', err);
    throw err;
  }
}

// ============================================
// FOTOS
// ============================================

export async function subirFoto(formData) {
  const token = obtenerToken();

  if (!token) {
    throw new Error('Token requerido para subir foto');
  }

  try {
    console.log('📸 Subiendo foto...');

    const response = await fetch(`${API_BASE}/api/fotos`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
        // NO incluir Content-Type aquí, fetch lo hará automáticamente
      },
      body: formData
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al subir foto');
    }

    const resultado = await response.json();
    console.log('✅ Foto subida exitosamente:', resultado);
    return resultado;
  } catch (err) {
    console.error('Error subirFoto:', err);
    throw err;
  }
}

export async function obtenerFotosPorInspeccion(inspeccionId) {
  const token = obtenerToken();

  if (!token) {
    throw new Error('Token requerido');
  }

  try {
    const response = await fetch(`${API_BASE}/api/fotos/${inspeccionId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    return response.json();
  } catch (err) {
    console.error('Error obtenerFotosPorInspeccion:', err);
    throw err;
  }
}

export async function eliminarFoto(fotoId) {
  const token = obtenerToken();

  if (!token) {
    throw new Error('Token requerido');
  }

  try {
    const response = await fetch(`${API_BASE}/api/fotos/${fotoId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    return response.status === 204; // 204 No Content
  } catch (err) {
    console.error('Error eliminarFoto:', err);
    throw err;
  }
}

// ============================================
// UTILIDADES GENERALES
// ============================================

export async function verificarConexion() {
  try {
    const response = await fetch(`${API_BASE}/auth/verify`, {
      method: 'GET',
      headers: generarHeaders(true)
    });

    return response.ok;
  } catch (err) {
    return false;
  }
}

export function estaAutenticado() {
  return !!obtenerToken();
}

// Exportar API_BASE si lo necesitas
export { API_BASE };