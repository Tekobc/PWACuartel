import { useState, useContext, useEffect } from 'react';
import { AuthContext, AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import PrimerLogin from './pages/PrimerLogin';
import Unidades from './pages/Unidades';
import Inspeccion from './pages/Inspeccion';
import Resumen from './pages/Resumen';
import Historial from './pages/Historial';

function AppContent() {
  const { user, token, loading, logout } = useContext(AuthContext);
  const [page, setPage] = useState('unidades');
  const [unidad, setUnidad] = useState(null);
  const [rutina, setRutina] = useState([]);
  const [resultados, setResultados] = useState([]);
  const [primerLogin, setPrimerLogin] = useState(null);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  // Track online/offline status
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

  // Mientras carga la sesión
  if (loading) {
    return <main className="loading-page">Cargando...</main>;
  }

  // Si no hay usuario, mostrar login
  if (!user) {
    if (primerLogin) {
      return (
        <PrimerLogin 
          usuario={primerLogin}
          onSuccess={() => {
            setPrimerLogin(null);
            setPage('unidades');
          }}
        />
      );
    }

    return (
      <Login 
        onLoginSuccess={() => setPage('unidades')}
        onPrimerLogin={(datos) => setPrimerLogin(datos)}
      />
    );
  }

  // Funciones de navegación
  const iniciarInspeccion = (unidadSeleccionada, rutinaHerramientas) => {
    setUnidad(unidadSeleccionada);
    setRutina(rutinaHerramientas);
    setResultados([]);
    setPage('inspeccion');
  };

  const irResumen = (respuestas) => {
    setResultados(respuestas);
    setPage('resumen');
  };

  const volverAUnidades = () => {
    setUnidad(null);
    setRutina([]);
    setResultados([]);
    setPage('unidades');
  };

  const irHistorial = () => {
    setPage('historial');
  };

  // App autenticada
  return (
    <div className="app-shell">
      <nav className="app-nav">
        <div className="nav-brand">
          <span className="brand-icon">🚒</span>
          <span className="brand-name">Central 80</span>
        </div>

        <div className="nav-status">
          <span className={`conn-dot ${navigator.onLine ? 'online' : 'offline'}`} aria-hidden />
        </div>

        <div className="nav-user">
          <span className="user-legajo">{user.legajo}</span>
          <div style={{color:'var(--text-secondary)'}}>
            <div style={{fontSize:12}}>{user.nombre}</div>
          </div>
          <button onClick={logout} className="btn-ghost" aria-label="Cerrar sesión">Salir</button>
        </div>
      </nav>
      
      {!isOnline && (
        <div className="offline-banner" role="status" aria-live="polite">
          <span>📡</span>
          <span>Sin conexión — las inspecciones se guardarán localmente</span>
        </div>
      )}

      {page === 'unidades' && (
        <Unidades 
          onIniciar={iniciarInspeccion}
          onHistorial={irHistorial}
        />
      )}
      {page === 'inspeccion' && unidad && (
        <Inspeccion 
          unidad={unidad} 
          rutina={rutina} 
          onFinish={irResumen} 
          onCancel={volverAUnidades} 
        />
      )}
      {page === 'resumen' && unidad && (
        <Resumen 
          unidad={unidad} 
          resultados={resultados} 
          onBack={volverAUnidades} 
        />
      )}
      {page === 'historial' && (
        <Historial 
          onBack={volverAUnidades}
        />
      )}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;