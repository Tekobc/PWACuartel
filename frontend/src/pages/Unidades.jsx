import { useEffect, useState } from 'react';
import { obtenerUnidades, obtenerRutina } from '../services/api';

function Unidades({ token, onIniciar, onVerHistorial, onHistorial }) {
  const historialAction = onVerHistorial || onHistorial;
  const [unidades, setUnidades] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) {
      setError('No hay sesión activa');
      return;
    }

    obtenerUnidades(token)
      .then(setUnidades)
      .catch((err) => setError(err.message || 'Error al cargar unidades'));
  }, [token]);

  const handleIniciar = async (unidad) => {
    try {
      const rutina = await obtenerRutina(token, unidad.id);
      onIniciar(unidad, rutina);
    } catch (err) {
      setError(err.message || 'Error al cargar la rutina');
    }
  };

  return (
    <main>
      <div className="unidades-header">
        <h2>Unidades</h2>
        {historialAction && (
          <button onClick={historialAction} className="btn-historial" aria-label="Ver historial">
            📋 Ver Historial
          </button>
        )}
      </div>
      {error && <div className="error">{error}</div>}
      <div className="card-list">
        {unidades.map((unidad) => (
          <div key={unidad.id} className="card">
            <div>
              <strong>{unidad.nombre}</strong>
              <div className="small">Placa: {unidad.placa || '-'}</div>
            </div>
            <button
              onClick={() => handleIniciar(unidad)}
              aria-label={`Iniciar inspección de ${unidad.nombre}, placa ${unidad.placa}`}
            >
              Iniciar
            </button>
          </div>
        ))}
      </div>
    </main>
  );
}

export default Unidades;