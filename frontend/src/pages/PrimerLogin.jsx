import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export default function PrimerLogin({ usuario, onSuccess }) {
  const { setPassword, error } = useContext(AuthContext);
  const [contrasena, setContrasena] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [cargando, setCargando] = useState(false);
  const [errorLocal, setErrorLocal] = useState('');
  const [mostrarRequisitos, setMostrarRequisitos] = useState(false);

  const requisitos = {
    longitud: contrasena.length >= 6,
    mayuscula: /[A-Z]/.test(contrasena),
    numero: /[0-9]/.test(contrasena),
    coinciden: contrasena && contrasena === confirmar
  };

  const requisitosCompletos = Object.values(requisitos).every(v => v);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCargando(true);
    setErrorLocal('');

    try {
      if (!requisitosCompletos) {
        setErrorLocal('Por favor complete todos los requisitos');
        setCargando(false);
        return;
      }

      await setPassword(usuario.usuario_id, contrasena, confirmar);
      onSuccess();
    } catch (err) {
      setErrorLocal(err.message || 'Error al definir contraseña');
    } finally {
      setCargando(false);
    }
  };

  return (
    <main className="primer-login-page">
      <div className="primer-login-container">
        <div className="login-header">
          <h1>🚒 Bienvenido, {usuario.nombre}</h1>
          <p>Primera vez en el sistema</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="alert alert-info">
            <strong>Aviso:</strong> Por seguridad, debes crear una contraseña 
            antes de continuar. Esta será tu contraseña para todos los accesos futuros.
          </div>

          <div className="form-group">
            <label htmlFor="contrasena">Contraseña</label>
            <input
              id="contrasena"
              type="password"
              placeholder="Crea una contraseña segura"
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              onFocus={() => setMostrarRequisitos(true)}
              onBlur={() => setMostrarRequisitos(false)}
              required
              aria-label="Nueva contraseña"
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmar">Confirmar Contraseña</label>
            <input
              id="confirmar"
              type="password"
              placeholder="Confirma tu contraseña"
              value={confirmar}
              onChange={(e) => setConfirmar(e.target.value)}
              required
              aria-label="Confirmar contraseña"
            />
          </div>

          {mostrarRequisitos && (
            <div className="requisitos-box">
              <p><strong>Requisitos de contraseña:</strong></p>
              <div className={`requisito ${requisitos.longitud ? 'ok' : ''}`}>
                {requisitos.longitud ? '✅' : '❌'} 
                Al menos 6 caracteres
              </div>
              <div className={`requisito ${requisitos.mayuscula ? 'ok' : ''}`}>
                {requisitos.mayuscula ? '✅' : '❌'} 
                Al menos una letra mayúscula
              </div>
              <div className={`requisito ${requisitos.numero ? 'ok' : ''}`}>
                {requisitos.numero ? '✅' : '❌'} 
                Al menos un número
              </div>
              <div className={`requisito ${requisitos.coinciden ? 'ok' : ''}`}>
                {requisitos.coinciden ? '✅' : '❌'} 
                Las contraseñas coinciden
              </div>
            </div>
          )}

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
            disabled={cargando || !requisitosCompletos}
            aria-label="Definir contraseña"
          >
            {cargando ? 'Guardando...' : 'Definir Contraseña'}
          </button>
        </form>

        <div className="login-footer">
          <p className="text-small">
            Tu legajo: <strong>{usuario.legajo}</strong>
          </p>
        </div>
      </div>
    </main>
  );
}