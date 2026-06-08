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
// UNIDADES
// ============================================

export async function obtenerUnidades(token) {
  try {
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
export async function fetchUnidades(token) {
  return obtenerUnidades(token);
}

// ============================================
// RUTINA
// ============================================

export async function obtenerRutina(token, unidadId) {
  try {
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
export async function fetchRutina(token, unidadId) {
  return obtenerRutina(token, unidadId);
}

// ============================================
// INSPECCIONES
// ============================================

export async function guardarInspeccion(token, datos) {
  const MAX_REINTENTOS = 3;

  for (let intento = 1; intento <= MAX_REINTENTOS; intento++) {
    try {
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
      const responseText = await response.text(); // ← LEE COMO TEXTO PRIMERO

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
        return JSON.parse(responseText);
      } else {
        console.warn('⚠️ Respuesta no es JSON:', contentType);
        throw new Error(`Respuesta inválida del servidor: ${contentType}`);
      }
    } catch (err) {
      if (intento === MAX_REINTENTOS) {
        // Fallar después del 3er intento
        console.error('Error guardarInspeccion (intento final):', err);
        throw err;
      }

      // Esperar antes de reintentar (backoff exponencial: 2s, 4s, 8s)
      const espera = Math.pow(2, intento) * 1000;
      console.warn(`Reintentando guardarInspeccion en ${espera / 1000}s (intento ${intento}/${MAX_REINTENTOS})...`);
      await new Promise(resolve => setTimeout(resolve, espera));
    }
  }
}

export async function obtenerInspecciones(token) {
  try {
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
export async function fetchInspecciones(token) {
  return obtenerInspecciones(token);
}

// ============================================
// HISTORIAL / AUDITORÍA
// ============================================

export async function obtenerHistorialInspecciones(token, unidadId = null) {
  try {
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
// UTILIDADES DE API
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

// Exportar API_BASE si lo necesitas
export { API_BASE };
