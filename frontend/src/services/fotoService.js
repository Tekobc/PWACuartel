// frontend/src/services/fotoService.js

const DB_NAME = 'PWACuartel';
const DB_VERSION = 1;
const STORE_FOTOS = 'fotos_pendientes';

class FotoService {
  constructor() {
    this.db = null;
    this.listeners = [];
  }

  // ============================================
  // INICIALIZACIÓN
  // ============================================

  async initDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Crear store si no existe
        if (!db.objectStoreNames.contains(STORE_FOTOS)) {
          const store = db.createObjectStore(STORE_FOTOS, { keyPath: 'guid' });
          store.createIndex('estado', 'estado', { unique: false });
          store.createIndex('herramienta_id', 'herramienta_id', { unique: false });
          store.createIndex('inspeccion_id', 'inspeccion_id', { unique: false });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  // ============================================
  // GUARDAR FOTO LOCALMENTE
  // ============================================

  async guardarFotoLocal(blob, metadata) {
    if (!this.db) await this.initDB();

    const guid = this.generarGUID();
    const timestamp = Date.now();
    const nombre = `foto_${metadata.herramienta_id}_${timestamp}.jpg`;

    // Calcular tamaño
    const tamaño = blob.size;

    // Crear URL local para preview (mientras no se sincronice)
    const preview_url = URL.createObjectURL(blob);

    const fotoData = {
      guid,
      herramienta_id: metadata.herramienta_id,
      unidad_id: metadata.unidad_id,
      user_id: metadata.user_id,
      inspeccion_id: metadata.inspeccion_id || null,
      blob,
      timestamp,
      nombre,
      estado: 'pendiente', // pendiente | sincronizado | error
      intento_sincronizacion: 0,
      fecha_creacion: new Date().toISOString(),
      preview_url, // Para mostrar en UI
      tamaño,
      metadata: {
        dispositivo: this.detectarDispositivo(),
        ancho: metadata.ancho || null,
        alto: metadata.alto || null,
      },
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_FOTOS], 'readwrite');
      const store = transaction.objectStore(STORE_FOTOS);
      const request = store.add(fotoData);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.notificarListeners('fotoGuardada', fotoData);
        resolve(fotoData);
      };
    });
  }

  // ============================================
  // OBTENER FOTOS POR HERRAMIENTA (EN ESTA INSPECCIÓN)
  // ============================================

  async obtenerFotosPorHerramienta(herramienta_id) {
    if (!this.db) await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_FOTOS], 'readonly');
      const store = transaction.objectStore(STORE_FOTOS);
      const index = store.index('herramienta_id');
      const request = index.getAll(herramienta_id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  // ============================================
  // OBTENER FOTOS PENDIENTES (PARA SINCRONIZAR)
  // ============================================

  async obtenerFotosPendientes() {
    if (!this.db) await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_FOTOS], 'readonly');
      const store = transaction.objectStore(STORE_FOTOS);
      const index = store.index('estado');
      const request = index.getAll('pendiente');

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  // ============================================
  // OBTENER FOTOS DE UNA INSPECCIÓN
  // ============================================

  async obtenerFotosPorInspeccion(inspeccion_id) {
    if (!this.db) await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_FOTOS], 'readonly');
      const store = transaction.objectStore(STORE_FOTOS);
      const index = store.index('inspeccion_id');
      const request = index.getAll(inspeccion_id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  // ============================================
  // ELIMINAR FOTO LOCAL
  // ============================================

  async eliminarFotoLocal(guid) {
    if (!this.db) await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_FOTOS], 'readwrite');
      const store = transaction.objectStore(STORE_FOTOS);
      const request = store.delete(guid);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.notificarListeners('fotoEliminada', guid);
        resolve();
      };
    });
  }

  // ============================================
  // ACTUALIZAR ESTADO DE FOTO
  // ============================================

  async actualizarEstadoFoto(guid, nuevoEstado, datosAdicionales = {}) {
    if (!this.db) await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_FOTOS], 'readwrite');
      const store = transaction.objectStore(STORE_FOTOS);
      const request = store.get(guid);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const foto = request.result;
        if (!foto) {
          reject(new Error(`Foto ${guid} no encontrada`));
          return;
        }

        foto.estado = nuevoEstado;
        foto.intento_sincronizacion = (foto.intento_sincronizacion || 0) + 1;
        foto.ultima_actualizacion = new Date().toISOString();

        // Agregar datos adicionales (ej: foto_id del servidor)
        Object.assign(foto, datosAdicionales);

        const updateRequest = store.put(foto);
        updateRequest.onerror = () => reject(updateRequest.error);
        updateRequest.onsuccess = () => {
          this.notificarListeners('fotoActualizada', foto);
          resolve(foto);
        };
      };
    });
  }

  // ============================================
  // ACTUALIZAR inspeccion_id EN FOTOS PENDIENTES
  // ============================================

  async asignarInspeccionIdAFotos(inspeccion_id) {
    if (!this.db) await this.initDB();

    const fotos = await this.obtenerFotosPendientes();
    const fotosActualizadas = [];

    for (const foto of fotos) {
      if (!foto.inspeccion_id) {
        await this.actualizarEstadoFoto(foto.guid, 'pendiente', {
          inspeccion_id,
        });
        fotosActualizadas.push(foto.guid);
      }
    }

    return fotosActualizadas;
  }

  // ============================================
  // SINCRONIZAR UNA FOTO
  // ============================================

  async sincronizarFoto(foto, token) {
    const maxReintentos = 5;

    if (foto.intento_sincronizacion >= maxReintentos) {
      await this.actualizarEstadoFoto(foto.guid, 'error', {
        error_msg: 'Máximo número de reintentos alcanzado',
      });
      return { exito: false, error: 'Max reintentos' };
    }

    try {
      // Validar que tenga inspeccion_id antes de sincronizar
      if (!foto.inspeccion_id) {
        return { exito: false, error: 'Sin inspeccion_id aún' };
      }

      // Crear FormData
      const formData = new FormData();
      formData.append('foto', foto.blob, foto.nombre);
      formData.append('inspeccion_id', foto.inspeccion_id);
      formData.append('herramienta_id', foto.herramienta_id);
      formData.append('timestamp', foto.timestamp);

      // Enviar al servidor
      const response = await fetch('http://localhost:4000/api/fotos', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al subir foto');
      }

      const resultado = await response.json();

      // Actualizar estado a sincronizado
      await this.actualizarEstadoFoto(foto.guid, 'sincronizado', {
        foto_id: resultado.foto_id,
        servidor_url: resultado.url,
      });

      this.notificarListeners('fotoSincronizada', foto.guid);

      return { exito: true, foto_id: resultado.foto_id };
    } catch (error) {
      console.error('Error sincronizando foto:', error);

      // Intentar nuevamente en 3 segundos si es el primer intento
      if (foto.intento_sincronizacion < 2) {
        await this.actualizarEstadoFoto(foto.guid, 'pendiente', {
          ultimo_error: error.message,
        });
      } else {
        // Marcar como error después de algunos intentos
        await this.actualizarEstadoFoto(foto.guid, 'error', {
          error_msg: error.message,
        });
      }

      return { exito: false, error: error.message };
    }
  }

  // ============================================
  // SINCRONIZAR TODAS LAS PENDIENTES
  // ============================================

  async sincronizarTodas(token) {
    const fotosPendientes = await this.obtenerFotosPendientes();

    if (fotosPendientes.length === 0) {
      return { sincronizadas: 0, errores: [], total: 0 };
    }

    const resultados = [];
    const errores = [];

    for (const foto of fotosPendientes) {
      const resultado = await this.sincronizarFoto(foto, token);

      if (resultado.exito) {
        resultados.push(resultado.foto_id);
      } else {
        errores.push({
          guid: foto.guid,
          herramienta_id: foto.herramienta_id,
          error: resultado.error,
        });
      }

      // Pequeña pausa entre uploads para no sobrecargar
      await this.sleep(500);
    }

    this.notificarListeners('sincronizacionCompleta', {
      sincronizadas: resultados.length,
      errores: errores.length,
    });

    return {
      sincronizadas: resultados.length,
      errores,
      total: fotosPendientes.length,
    };
  }

  // ============================================
  // OBSERVAR CAMBIOS DE CONECTIVIDAD
  // ============================================

  observarConectividad(callback) {
    window.addEventListener('online', () => {
      console.log('📡 Conectividad restaurada - sincronizando fotos...');
      callback('online');
    });

    window.addEventListener('offline', () => {
      console.log('❌ Sin conexión - fotos se guardarán localmente');
      callback('offline');
    });
  }

  // ============================================
  // LISTENERS (Observer Pattern)
  // ============================================

  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  notificarListeners(evento, datos) {
    this.listeners.forEach((callback) => {
      callback({ evento, datos });
    });
  }

  // ============================================
  // UTILIDADES
  // ============================================

  generarGUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  detectarDispositivo() {
    const ua = navigator.userAgent;
    if (/Android/.test(ua)) return 'Android';
    if (/iPhone|iPad|iPod/.test(ua)) return 'iOS';
    if (/Windows/.test(ua)) return 'Windows';
    if (/Mac/.test(ua)) return 'macOS';
    if (/Linux/.test(ua)) return 'Linux';
    return 'Unknown';
  }

  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // ============================================
  // OBTENER ESTADÍSTICAS
  // ============================================

  async obtenerEstadisticas() {
    if (!this.db) await this.initDB();

    const fotos = await this.obtenerFotosPendientes();
    const fotosError = await new Promise((resolve) => {
      const transaction = this.db.transaction([STORE_FOTOS], 'readonly');
      const store = transaction.objectStore(STORE_FOTOS);
      const index = store.index('estado');
      const request = index.getAll('error');
      request.onsuccess = () => resolve(request.result);
    });

    return {
      pendientes: fotos.length,
      errores: fotosError.length,
      totalOcupado: fotos.reduce((sum, f) => sum + f.tamaño, 0),
    };
  }
}

export default new FotoService();