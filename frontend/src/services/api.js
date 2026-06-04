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

export async function obtenerRutina(token) {
  try {
    const response = await fetch(`${API_BASE}/rutina`, {
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
    console.error('Error obtenerRutina:', err);
    throw err;
  }
}

// Alias para compatibilidad
export async function fetchRutina(token) {
  return obtenerRutina(token);
}

// ============================================
// INSPECCIONES
// ============================================

export async function guardarInspeccion(token, datos) {
  try {
    const response = await fetch(`${API_BASE}/inspecciones`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(datos)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `Error: ${response.status}`);
    }
    
    return response.json();
  } catch (err) {
    console.error('Error guardarInspeccion:', err);
    throw err;
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