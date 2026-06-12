import { useEffect, useMemo, useState } from 'react';
import { guardarInspeccion } from '../services/api';
import fotoService from '../services/fotoService.js';

function Resumen({ unidad, resultados, onBack }) {
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  const [error, setError] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const conteo = useMemo(() => {
    return resultados.reduce(
      (acc, item) => {
        acc[item.estado] = (acc[item.estado] || 0) + 1;
        return acc;
      },
      { ok: 0, no_esta: 0, sin_acondicionar: 0 }
    );
  }, [resultados]);

  const handleGuardarClick = () => {
    setMostrarConfirmacion(true);
  };

  const confirmarGuardado = async () => {
    setGuardando(true);
    setError(null);
    setMensaje(null);

    try {
      // Guardar inspección (el token se obtiene automáticamente del localStorage)
      const respuesta = await guardarInspeccion(
        resultados.map((item) => ({
          herramienta_id: item.herramienta_id,
          herramienta_nombre: item.herramienta_nombre,
          estado: item.estado,
          observacion: item.observacion || null,
        })),
        unidad.id
      );

      console.log('✅ Inspección guardada con ID:', respuesta.id);

      // Asignar inspeccion_id a las fotos pendientes
      if (respuesta.id) {
        await fotoService.asignarInspeccionIdAFotos(respuesta.id);

        // Sincronizar fotos si hay conexión
        if (navigator.onLine) {
          console.log('📡 Sincronizando fotos...');
          const token = localStorage.getItem('auth_token');
          if (token) {
            const syncResult = await fotoService.sincronizarTodas(token);
            console.log('Fotos sincronizadas:', syncResult);
          }
        }
      }

      setMensaje('¡Inspección guardada correctamente!');
      setMostrarConfirmacion(false);
      setTimeout(() => onBack(), 1200);
    } catch (err) {
      setError(err.message || 'Error al guardar inspección');
      console.error('Error:', err);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <main>
      <h2>Resumen — {unidad.nombre}</h2>

      <div className={`status-badge ${isOnline ? 'online' : 'offline'}`}>
        {isOnline ? '🟢 Con conexión' : '🔴 Sin conexión'}
      </div>

      <div className="summary-grid">
        <div className="summary-card ok">OK: {conteo.ok}</div>
        <div className="summary-card noesta">No está: {conteo.no_esta}</div>
        <div className="summary-card sinacondicionar">Sin acondicionar: {conteo.sin_acondicionar}</div>
      </div>

      <div className="results-list">
        {resultados.map((item, index) => (
          <div key={index} className="result-item">
            <div>
              <strong>{item.herramienta_nombre || item.herramienta_id}</strong> — {item.estado}
            </div>
            {item.observacion && <div className="small">{item.observacion}</div>}
          </div>
        ))}
      </div>

      {error && <div className="error">{error}</div>}
      {mensaje && <div className="success">{mensaje}</div>}

      {!mostrarConfirmacion ? (
        <div className="button-group">
          <button onClick={handleGuardarClick} disabled={guardando}>
            {guardando ? 'Guardando...' : 'Guardar inspección'}
          </button>
          <button className="secondary" onClick={onBack}>
            Volver a unidades
          </button>
        </div>
      ) : (
        <div className="confirmation-modal">
          <h3>Confirmar guardado</h3>
          <p>¿Guardar esta inspección de <strong>{unidad.nombre}</strong>?</p>
          <p style={{ fontSize: '12px', opacity: 0.8 }}>
            Resumen: {resultados.filter((r) => r.estado === 'ok').length} OK,
            {resultados.filter((r) => r.estado === 'no_esta').length} No está,
            {resultados.filter((r) => r.estado === 'sin_acondicionar').length} Sin acondicionar
          </p>

          {error && <div className="error" style={{ marginBottom: '1rem' }}>{error}</div>}

          <div className="button-group">
            <button onClick={confirmarGuardado} disabled={guardando}>
              {guardando ? 'Guardando...' : 'Sí, guardar'}
            </button>
            <button className="secondary" onClick={() => setMostrarConfirmacion(false)}>
              Volver a revisar
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

export default Resumen;