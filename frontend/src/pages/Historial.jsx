import { useState, useEffect } from 'react';
import { obtenerInspecciones } from '../services/api';
import jsPDF from 'jspdf';

function Historial({ token, onBack }) {
  const [inspecciones, setInspecciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [inspeccionSeleccionada, setInspeccionSeleccionada] = useState(null);
  const [detalles, setDetalles] = useState([]);

  useEffect(() => {
    cargarInspecciones();
  }, [token]);

  const cargarInspecciones = async () => {
    try {
      setCargando(true);
      setError(null);
      const datos = await obtenerInspecciones(token);
      setInspecciones(datos);
      console.log('✅ Inspecciones cargadas:', datos.length);
    } catch (err) {
      setError('Error al cargar inspecciones: ' + err.message);
      console.error('Error cargarInspecciones:', err);
    } finally {
      setCargando(false);
    }
  };

  const verDetalles = (inspeccion) => {
    setInspeccionSeleccionada(inspeccion.id);
    setDetalles(inspeccion.detalles || []);
  };

  const cerrarDetalles = () => {
    setInspeccionSeleccionada(null);
    setDetalles([]);
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return '-';
    try {
      return new Date(fecha).toLocaleDateString('es-AR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return fecha;
    }
  };

  const contarEstados = (detalles) => {
    return {
      ok: detalles.filter(d => d.estado === 'ok').length,
      no_esta: detalles.filter(d => d.estado === 'no_esta').length,
      sin_acondicionar: detalles.filter(d => d.estado === 'sin_acondicionar').length
    };
  };

  const generarPDF = (inspeccion) => {
    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let yPosition = 15;

      // ===== HEADER =====
      doc.setFontSize(20);
      doc.setFont(undefined, 'bold');
      doc.text('INSPECCIÓN DE UNIDAD', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 12;

      // ===== DATOS GENERALES =====
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');

      const datosGenerales = [
        { label: 'Unidad:', value: inspeccion.unidad_nombre || `Unidad ${inspeccion.unidad_id}` },
        { label: 'Inspector:', value: inspeccion.usuario_nombre || 'Desconocido' },
        { label: 'Legajo:', value: inspeccion.usuario_legajo || '-' },
        { label: 'Fecha:', value: new Date(inspeccion.fecha).toLocaleDateString('es-AR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }) }
      ];

      datosGenerales.forEach(dato => {
        doc.setFont(undefined, 'bold');
        doc.text(dato.label, 15, yPosition);
        doc.setFont(undefined, 'normal');
        doc.text(dato.value, 50, yPosition);
        yPosition += 8;
      });

      yPosition += 5;

      // ===== TABLA DE HERRAMIENTAS =====
      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.text('DETALLE DE HERRAMIENTAS', 15, yPosition);
      yPosition += 10;

      // Headers de tabla
      const columnX = [15, 120, 170];
      const rowHeight = 8;

      doc.setFontSize(9);
      doc.setFont(undefined, 'bold');
      doc.setFillColor(220, 220, 220);

      doc.text('Herramienta', columnX[0], yPosition);
      doc.text('Estado', columnX[1], yPosition);
      doc.text('Observación', columnX[2], yPosition);

      // Línea separadora
      yPosition += rowHeight;
      doc.line(15, yPosition - 2, 200, yPosition - 2);

      // Filas de datos
      doc.setFont(undefined, 'normal');
      doc.setFontSize(8);

      detalles.forEach((detalle) => {
        if (yPosition > pageHeight - 20) {
          doc.addPage();
          yPosition = 15;
        }

        const textHerramienta = detalle.herramienta_nombre || `ID: ${detalle.herramienta_id}`;
        doc.text(textHerramienta, columnX[0], yPosition);

        let estadoText = '';
        if (detalle.estado === 'ok') estadoText = 'OK';
        else if (detalle.estado === 'no_esta') estadoText = 'No está';
        else if (detalle.estado === 'sin_acondicionar') estadoText = 'Sin acondicionar';

        doc.text(estadoText, columnX[1], yPosition);

        const obsText = detalle.observacion ? detalle.observacion.substring(0, 20) + '...' : '-';
        doc.text(obsText, columnX[2], yPosition);

        yPosition += rowHeight;
      });

      // ===== NOTAS =====
      if (inspeccion.notas) {
        yPosition += 8;
        doc.setFont(undefined, 'bold');
        doc.setFontSize(9);
        doc.text('Notas:', 15, yPosition);
        yPosition += 6;
        doc.setFont(undefined, 'normal');
        doc.setFontSize(8);
        const notasText = doc.splitTextToSize(inspeccion.notas, 175);
        doc.text(notasText, 15, yPosition);
      }

      // ===== FOOTER =====
      doc.setFontSize(7);
      doc.setFont(undefined, 'italic');
      doc.text(
        `Generado el ${new Date().toLocaleDateString('es-AR')} a las ${new Date().toLocaleTimeString('es-AR')}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );

      const nombreArchivo = `Inspeccion_${inspeccion.unidad_nombre}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(nombreArchivo);

      console.log('✅ PDF generado:', nombreArchivo);
    } catch (err) {
      console.error('❌ Error generando PDF:', err);
      setError('Error al generar PDF: ' + err.message);
    }
  };

  return (
    <main>
      <div className="historial-header">
        <h2>📋 Historial de Inspecciones</h2>
        <button className="secondary" onClick={onBack} aria-label="Volver a unidades">
          ← Volver a unidades
        </button>
      </div>

      {error && (
        <div className="error-container">
          <div className="error">{error}</div>
          <button onClick={cargarInspecciones} className="secondary">
            Reintentar
          </button>
        </div>
      )}

      {cargando ? (
        <div className="loading">
          <p>Cargando inspecciones...</p>
        </div>
      ) : inspecciones.length === 0 ? (
        <div className="empty-state">
          <p>📭 No hay inspecciones registradas</p>
        </div>
      ) : (
        <div className="inspecciones-list">
          {inspecciones.map((inspeccion) => {
            const estados = contarEstados(inspeccion.detalles || []);
            return (
              <div
                key={inspeccion.id}
                className="inspeccion-card"
                onClick={() => verDetalles(inspeccion)}
              >
                <div className="inspeccion-header">
                  <div>
                    <h3>{inspeccion.unidad_nombre || `Unidad ${inspeccion.unidad_id}`}</h3>
                    <div className="card-meta">
                      <span className="fecha">{formatearFecha(inspeccion.fecha)}</span>
                      <span className="usuario">
                        👤 {inspeccion.usuario_nombre || 'Usuario desconocido'}
                        {inspeccion.usuario_legajo && ` (${inspeccion.usuario_legajo})`}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="inspeccion-resumen">
                  <div className="estado-badge ok">
                    <span className="label">OK</span>
                    <span className="numero">{estados.ok}</span>
                  </div>

                  <div className="estado-badge no-esta">
                    <span className="label">No está</span>
                    <span className="numero">{estados.no_esta}</span>
                  </div>

                  <div className="estado-badge sin-acondicionar">
                    <span className="label">Sin acondicionar</span>
                    <span className="numero">{estados.sin_acondicionar}</span>
                  </div>
                </div>

                {inspeccion.notas && (
                  <div className="notas">
                    <strong>Notas:</strong> {inspeccion.notas}
                  </div>
                )}

                <div className="inspeccion-footer">
                  <button className="ver-detalles">
                    Ver detalles →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {inspeccionSeleccionada && (
        <div className="modal-overlay" onClick={cerrarDetalles}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="btn-cerrar-modal" onClick={cerrarDetalles}>
              ✕
            </button>

            {(() => {
              const insp = inspecciones.find(i => i.id === inspeccionSeleccionada);
              return (
                <>
                  <h3>Detalles de Inspección #{inspeccionSeleccionada}</h3>

                  {insp && (
                    <>
                      <div className="modal-acciones">
                        <button 
                          className="btn-pdf"
                          onClick={() => generarPDF(insp)}
                        >
                          📄 Descargar PDF
                        </button>
                        <button 
                          className="btn-cerrar-modal-secondary"
                          onClick={cerrarDetalles}
                        >
                          Cerrar
                        </button>
                      </div>

                      <div className="inspector-info">
                        <p>
                          <strong>Inspector:</strong> {insp.usuario_nombre || 'Desconocido'}
                          {insp.usuario_legajo && ` (${insp.usuario_legajo})`}
                        </p>
                        <p>
                          <strong>Fecha:</strong> {formatearFecha(insp.fecha)}
                        </p>
                        {insp.notas && (
                          <p>
                            <strong>Notas:</strong> {insp.notas}
                          </p>
                        )}
                      </div>
                    </>
                  )}
                </>
              );
            })()}

            {detalles.length === 0 ? (
              <p className="empty">Sin detalles registrados</p>
            ) : (
              <div className="detalles-table">
                <table>
                  <thead>
                    <tr>
                      <th>Herramienta</th>
                      <th>Estado</th>
                      <th>Observación</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detalles.map((detalle, idx) => (
                      <tr key={idx}>
                        <td>{detalle.herramienta_nombre || detalle.herramienta_id}</td>
                        <td>
                          <span className={`badge ${detalle.estado}`}>
                            {detalle.estado === 'ok'
                              ? '✓ OK'
                              : detalle.estado === 'no_esta'
                              ? '✗ No está'
                              : '⚠ Sin acondicionar'}
                          </span>
                        </td>
                        <td>{detalle.observacion || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="modal-footer">
              <button className="secondary" onClick={cerrarDetalles}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default Historial;
