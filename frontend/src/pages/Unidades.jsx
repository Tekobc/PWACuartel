import { useEffect, useState } from 'react';
import { obtenerUnidades, obtenerRutina } from '../services/api';

function Unidades({ onIniciar }) {
  const [unidades, setUnidades] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUnidades()
      .then(setUnidades)
      .catch((err) => setError(err.message));
  }, []);

  const handleIniciar = async (unidad) => {
    try {
      const rutina = await fetchRutina(unidad.id);
      onIniciar(unidad, rutina);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <main>
      <h2>Unidades</h2>
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
