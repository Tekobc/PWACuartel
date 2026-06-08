import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const CENTRAL_PREFIX = '80/';

export default function Login({ onLoginSuccess, onPrimerLogin }) {
  const { login, error } = useContext(AuthContext);
  const [legajo, setLegajo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [cargando, setCargando] = useState(false);
  const [errorLocal, setErrorLocal] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCargando(true);
    setErrorLocal('');

    try {
      const resultado = await login(legajo, contrasena);

      // Si es primer login
      if (resultado.primer_login) {
        onPrimerLogin(resultado);
        return;
      }

      // Login exitoso
      onLoginSuccess();
    } catch (err) {
      setErrorLocal(err.message || 'Error en login');
    } finally {
      setCargando(false);
    }
  };

  return (
    <main className="login-page">
      <div className="login-container">
        <div className="login-header">
          <h1>🚒 Central 80</h1>
          <p>Sistema de Inspecciones</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="legajo">Legajo</label>
            <div className="legajo-input-group">
              <span className="legajo-prefix">80/</span>
              <input
                id="legajo"
                type="text"
                placeholder="001"
                maxLength="3"
                pattern="[0-9]{3}"
                value={legajo}
                onChange={(e) => {
                  // Solo permite números
                  const valor = e.target.value.replace(/[^0-9]/g, '');
                  // Máximo 3 dígitos
                  setLegajo(valor.slice(0, 3));
                }}
                required
                aria-label="Últimos 3 dígitos del legajo"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="contrasena">Contraseña</label>
            <input
              id="contrasena"
              type="password"
              placeholder="Ingrese su contraseña"
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              required
              aria-label="Contraseña"
            />
          </div>

          {errorLocal && (
            <div className="alert alert-error">
              {errorLocal}
            </div>
          )}

          {error && (
            <div className="alert alert-error">
              {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={cargando}
            aria-label="Ingresar al sistema"
          >
            {cargando ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        <div className="login-footer">
          <p className="text-small">
            © 2025 Central 80 - Sistema de Inspecciones
          </p>
        </div>
      </div>
    </main>
  );
}