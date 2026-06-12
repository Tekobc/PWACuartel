import { useEffect, useState, useRef } from 'react';
import { guardarInspeccion } from '../services/api';
import { obtenerRutina } from '../services/api';
import fotoService from '../services/fotoService.js';

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
// Estados para fotos
  const [fotos, setFotos] = useState({}); // { herramienta_id: [foto, foto, ...] }
  const [cargandoFoto, setCargandoFoto] = useState(false);
  const inputFotoRef = useRef(null);
  const [estadisticasFotos, setEstadisticasFotos] = useState({
    pendientes: 0,
    errores: 0,
  });


  useEffect(() => {
    setIndex(0);
  }, [rutina]);

  // Inicializar fotoService al montar
  useEffect(() => {
    const inicializar = async () => {
      try {
        await fotoService.initDB();

        // Suscribirse a cambios
        const unsubscribe = fotoService.subscribe(({ evento, datos }) => {
          if (evento === 'fotoGuardada') {
            cargarFotosPorHerramienta(datos.herramienta_id);
            actualizarEstadisticasFotos();
          }
          if (evento === 'fotoEliminada') {
            actualizarEstadisticasFotos();
          }
        });

        // Observar conectividad
        fotoService.observarConectividad(async (estado) => {
          if (estado === 'online') {
            console.log('🔄 Intentando sincronizar fotos...');
          }
        });

        return unsubscribe;
      } catch (error) {
        console.error('Error inicializando fotoService:', error);
      }
    };

    inicializar();
  }, []);

  const herramienta = rutina[index];
  const porcentaje = rutina.length > 0 ? ((index + 1) / rutina.length) * 100 : 0;
  
  const avanzar = async () => {
    if (index + 1 >= rutina.length) {
      // ← AGREGAR ESTO (sincronizar fotos antes de terminar):
      try {
        // Obtener token
          const token = localStorage.getItem('auth_token');
        
        // Sincronizar fotos pendientes
        if (navigator.onLine && token) {
          console.log('📡 Sincronizando fotos...');
          const syncResult = await fotoService.sincronizarTodas(token);
          console.log('Fotos sincronizadas:', syncResult);
        }
      } catch (error) {
        console.error('Error sincronizando fotos:', error);
        // Continúa igual aunque falle la sincronización
      }
      
      // Ahora sí llamar a onFinish con respuestas
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

const guardarObservacion = async () => {
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

    // Limpiar fotos de esta herramienta (se sincronizarán luego)
    setFotos((prev) => {
      const newFotos = { ...prev };
      delete newFotos[herramienta.herramienta_id];
      return newFotos;
    });

    avanzar();
  };

// ============ FUNCIONES DE FOTOS ============

  const cargarFotosPorHerramienta = async (herramientaId) => {
    const fotosCargadas = await fotoService.obtenerFotosPorHerramienta(herramientaId);
    setFotos((prev) => ({
      ...prev,
      [herramientaId]: fotosCargadas,
    }));
  };

  const handleFotoCapturada = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCargandoFoto(true);

    try {
      const blob = new Blob([await file.arrayBuffer()], { type: file.type });

      // Guardar foto localmente
      const fotoGuardada = await fotoService.guardarFotoLocal(blob, {
        herramienta_id: herramienta.herramienta_id,
        unidad_id: unidad.id,
        user_id: null, // Se obtiene del servidor cuando se sincroniza
      });

      // Actualizar UI
      await cargarFotosPorHerramienta(herramienta.herramienta_id);
      await actualizarEstadisticasFotos();

      alert('✅ Foto capturada. Se sincronizará cuando guardes la inspección.');
    } catch (error) {
      console.error('Error capturando foto:', error);
      alert('❌ Error al capturar foto');
    } finally {
      setCargandoFoto(false);
      e.target.value = '';
    }
  };

  const eliminarFoto = async (guid) => {
    if (window.confirm('¿Eliminar esta foto?')) {
      await fotoService.eliminarFotoLocal(guid);
      const herramientaId = Object.keys(fotos).find((id) =>
        fotos[id].some((f) => f.guid === guid)
      );
      if (herramientaId) {
        await cargarFotosPorHerramienta(parseInt(herramientaId));
      }
      await actualizarEstadisticasFotos();
    }
  };

  const actualizarEstadisticasFotos = async () => {
    const stats = await fotoService.obtenerEstadisticas();
    setEstadisticasFotos(stats);
  };

  // ============ FIN FUNCIONES FOTOS ============



  if (!herramienta) {
    return (
      <main>
        <h2>Inspección</h2>
        <div>No hay herramientas en la rutina.</div>
        <button className="btn-volver" onClick={onCancel}>Volver</button>
      </main>
    );
  }
  return (
    <main>
      <h2>Inspección - {unidad.nombre}</h2>

      {/* Barra de progreso */}
      <div className="progress-container">
        <div 
          className="progress-bar" 
          style={{ width: `${porcentaje}%` }}
        />
      </div>
      <div className="progress-percentage">{Math.round(porcentaje)}%</div>

      <div className="step-box">
        <div className="step-label">Herramienta {index + 1} de {rutina.length}</div>
        <div className="tool-name">{herramienta.herramienta_nombre}</div>
      </div>

      {error && <div className="error">{error}</div>}

      {!modoObservacion ? (
        <div className="button-group vertical">
          {estados.map((estado) => (
            <button
              key={estado.key}
              className={
                `btn-status ${estado.key === 'ok' ? 'btn-ok' : estado.key === 'no_esta' ? 'btn-miss' : 'btn-warn'}`
              }
              onClick={() => guardarRespuesta(estado.key)}
              aria-label={
                estado.key === 'ok'
                  ? 'Marcar como OK, herramienta presente'
                  : estado.key === 'no_esta'
                  ? 'Marcar como No está presente'
                  : 'Marcar como Sin acondicionar'
              }
            >
              {estado.label.replace('✅ ', '').replace('❌ ', '').replace('⚠️ ', '')}
            </button>
          ))}
        </div>
      ) : (
        <div className="observation-box">
          <label>
            Observación para "{estadoSeleccionado === 'no_esta' ? 'No está' : 'Sin acondicionar'}"
          </label>

          {/* ← AGREGAR ESTO: Botón de foto SOLO para "sin_acondicionar" */}
          {estadoSeleccionado === 'sin_acondicionar' && (
            <>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFotoCapturada}
                style={{ display: 'none' }}
                ref={inputFotoRef}
              />

              <button
                onClick={() => inputFotoRef.current?.click()}
                disabled={cargandoFoto}
                className="btn btn-success"
                style={{ marginBottom: '12px', width: '100%' }}
              >
                {cargandoFoto ? '⏳ Capturando...' : '📸 Tomar foto como evidencia'}
              </button>

              {/* Galería de fotos capturadas */}
              {fotos[herramienta.herramienta_id]?.length > 0 && (
                <div className="fotos-gallery" style={{ marginBottom: '12px' }}>
                  {fotos[herramienta.herramienta_id].map((foto) => (
                    <div key={foto.guid} className="foto-item">
                      <img
                        src={foto.preview_url}
                        alt="Foto capturada"
                        style={{
                          width: '80px',
                          height: '80px',
                          borderRadius: '8px',
                          objectFit: 'cover',
                          border: '2px solid #ccc',
                        }}
                      />
                      <span
                        style={{
                          position: 'absolute',
                          top: '4px',
                          right: '4px',
                          fontSize: '16px',
                        }}
                      >
                        {foto.estado === 'pendiente' ? '⏳' : foto.estado === 'sincronizado' ? '✅' : '❌'}
                      </span>
                      <button
                        onClick={() => eliminarFoto(foto.guid)}
                        style={{
                          position: 'absolute',
                          top: '-8px',
                          right: '-8px',
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: '#ff4444',
                          color: 'white',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '12px',
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          <textarea
            id="observacion"
            value={observacion}
            onChange={(event) => {
              setObservacion(event.target.value);
              setError(null);
            }}
            placeholder="Describa el problema o falta"
            aria-label="Campo de observación para la herramienta"
            className="obs-textarea"
          />
          <button className="btn-primary" onClick={guardarObservacion}>Continuar</button>
        </div>
      )}
      <div className="footer-actions">
        <button className="btn-volver" onClick={onCancel}>Cancelar</button>
      </div>
    </main>
  );
}

export default Inspeccion;
