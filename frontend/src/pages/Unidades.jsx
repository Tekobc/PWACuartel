import { useEffect, useState } from 'react';
import { obtenerUnidades, obtenerRutina } from '../services/api';

function Unidades({ onIniciar, onVerHistorial, onHistorial }) {
  const historialAction = onVerHistorial || onHistorial;
  const [unidades, setUnidades] = useState([]);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarUnidades();
  }, []);

  const cargarUnidades = async () => {
    try {
      setCargando(true);
      const datos = await obtenerUnidades();
      setUnidades(datos);
      setError(null);
    } catch (err) {
      setError(err.message || 'Error al cargar unidades');
      console.error('Error:', err);
    } finally {
      setCargando(false);
    }
  };

  const handleIniciar = async (unidad) => {
    try {
      setError(null);
      const rutina = await obtenerRutina(unidad.id);
      onIniciar(unidad, rutina);
    } catch (err) {
      setError(err.message || 'Error al cargar la rutina');
      console.error('Error:', err);
    }
  };

  const filtered = unidades.filter(u => {
    if (!search) return true;
    return (
      (u.nombre || '').toLowerCase().includes(search.toLowerCase()) ||
      (u.placa || '').toLowerCase().includes(search.toLowerCase())
    );
  });

  if (cargando) {
    return (
      <main className="units-page">
        <div className="loading">Cargando unidades...</div>
      </main>
    );
  }

  return (
    <main className="units-page">
      <div className="unidades-header">
        <h2>Unidades</h2>
        {historialAction && (
          <button onClick={historialAction} className="btn-historial" aria-label="Ver historial">
            📋 Historial
          </button>
        )}
      </div>

      {error && <div className="error">{error}</div>}

      <div className="search-bar">
        <input
          placeholder="Buscar unidad..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Buscar unidad"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="sin-datos">No hay unidades que coincidan con la búsqueda</div>
      ) : (
        <div className="units-grid">
          {filtered.map((unidad) => (
            <div
              key={unidad.id}
              className="unit-card"
              onClick={() => handleIniciar(unidad)}
              role="button"
              tabIndex={0}
              aria-label={`Iniciar inspección ${unidad.nombre}`}
              onKeyPress={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  handleIniciar(unidad);
                }
              }}
            >
              <div className="unit-number">{unidad.nombre}</div>
              <div className="unit-label">Placa: {unidad.placa || '-'}</div>
              <div className="unit-status">Última: {unidad.ultima_inspeccion || '—'}</div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

export default Unidades;