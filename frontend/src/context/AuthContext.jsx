import { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE = 'http://localhost:4000';

  // Cargar sesión guardada al montar
  useEffect(() => {
    const savedToken = localStorage.getItem('auth_token');
    const savedUser = localStorage.getItem('auth_user');

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }

    setLoading(false);
  }, []);

  const login = async (legajo, contrasena) => {
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ legajo, contrasena })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error en login');
      }

      // Si es primer login, retornar info para cambiar contraseña
      if (data.primer_login) {
        return {
          primer_login: true,
          usuario_id: data.usuario_id,
          legajo: data.legajo,
          nombre: data.nombre
        };
      }

      // Login normal
      setToken(data.token);
      setUser(data.usuario);
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('auth_user', JSON.stringify(data.usuario));

      return { exitoso: true };
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const setPassword = async (usuarioId, contrasena, confirmar) => {
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/auth/set-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usuario_id: usuarioId,
          contrasena,
          confirmar
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al definir contraseña');
      }

      // Guardar token y usuario
      setToken(data.token);
      setUser(data.usuario);
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('auth_user', JSON.stringify(data.usuario));

      return { exitoso: true };
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  };

  const changePassword = async (contrasenaActual, contrasenaNueva, confirmar) => {
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          contrasenaActual,
          contrasenaNueva,
          confirmar
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al cambiar contraseña');
      }

      return { exitoso: true };
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      error,
      login,
      setPassword,
      logout,
      changePassword
    }}>
      {children}
    </AuthContext.Provider>
  );
}