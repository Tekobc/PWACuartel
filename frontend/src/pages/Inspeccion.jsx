import { useEffect, useState } from 'react';
import { guardarInspeccion } from '../services/api';
import { obtenerRutina } from '../services/api';

const estados = [
  { key: 'ok', label: '✅ Está' },
  { key: 'no_esta', label: '❌ No está' },
  { key: 'sin_acondicionar', label: '⚠️ Sin acondicionar' },
];

function Inspeccion({ unidad, rutina, onFinish, onCancel }) {
  const [index, setIndex] = useState(0);
  const [respuestas, setRespuestas] = useState([]);
  const [observacion, setObservacion] = useState('');
  const [modoObservacion, setModoObservacion] = useState(false);
  const [estadoSeleccionado, setEstadoSeleccionado] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    setIndex(0);
  }, [rutina]);

  const herramienta = rutina[index];
 const porcentaje = rutina.length > 0 ? ((index + 1) / rutina.length) * 100 : 0;
  const avanzar = () => {
    if (index + 1 >= rutina.length) {
      onFinish(respuestas);
      return;
    }
    setIndex(index + 1);
    setModoObservacion(false);
    setObservacion('');
    setEstadoSeleccionado(null);
  };

  const guardarRespuesta = (estado) => {
    if (estado === 'no_esta' || estado === 'sin_acondicionar') {
      setModoObservacion(true);
      setEstadoSeleccionado(estado);
      return;
    }

    const respuesta = {
      herramienta_id: herramienta.herramienta_id,
      herramienta_nombre: herramienta.herramienta_nombre,
      estado,
      observacion: null,
    };
    setRespuestas((prev) => [...prev, respuesta]);
    avanzar();
  };

  const guardarObservacion = () => {
    if (!observacion.trim()) {
      setError('Observación requerida');
      return;
    }

    const respuesta = {
      herramienta_id: herramienta.herramienta_id,
      herramienta_nombre: herramienta.herramienta_nombre,
      estado: estadoSeleccionado,
      observacion: observacion.trim(),
    };
    setRespuestas((prev) => [...prev, respuesta]);
    avanzar();
  };

  if (!herramienta) {
    return (
      <main>
        <h2>Inspección</h2>
        <div>No hay herramientas en la rutina.</div>
        <button onClick={onCancel}>Volver</button>
      </main>
    );
  }

  return (
    <main>
      <h2>Inspección - {unidad.nombre}</h2>
      <main>
    {/* Barra de progreso */}
    <div className="progress-container">
      <div 
        className="progress-bar" 
        style={{ width: `${porcentaje}%` }}
      />
    </div>
    <div className="progress-percentage">
      {Math.round(porcentaje)}%
    </div>
    
    {/* Resto del código existente */}
    <div className="step-box">
      <div className="step-label">
        Herramienta {index + 1} de {rutina.length}
      </div>
      {/* ... */}
    </div>
  </main>
      
      
      <div className="step-box">
        <div className="step-label">Herramienta {index + 1} de {rutina.length}</div>
        <div className="tool-name">{herramienta.herramienta_nombre}</div>
      </div>

      {error && <div className="error">{error}</div>}

      {!modoObservacion ? (
        <div className="button-group">
          {estados.map((estado) => (
  <button 
    key={estado.key} 
    onClick={() => guardarRespuesta(estado.key)}
    aria-label={
      estado.key === 'ok' 
        ? 'Marcar como OK, herramienta presente' 
        : estado.key === 'no_esta' 
        ? 'Marcar como No está presente' 
        : 'Marcar como Sin acondicionar'
    }
  >
    {estado.label}
  </button>
))}
        </div>
      ) : (
        <div className="observation-box">
          <label>
            Observación para “{estadoSeleccionado === 'no_esta' ? 'No está' : 'Sin acondicionar'}”
          </label>
  
<textarea
  id="observacion"
  value={observacion}
  onChange={(event) => {
    setObservacion(event.target.value);
    setError(null);
  }}
  placeholder="Describa el problema o falta"
  aria-label="Campo de observación para la herramienta"
/>
          <button onClick={guardarObservacion}>Continuar</button>
        </div>
      )}

      <div className="footer-actions">
        <button className="secondary" onClick={onCancel}>Cancelar</button>
      </div>
    </main>
  );
}

export default Inspeccion;
