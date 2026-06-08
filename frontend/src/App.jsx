import { useState, useContext } from 'react';
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
      <header>
        <h1>Central 80</h1>
        <div className="user-info">
          <span>Bienvenido, <strong>{user.nombre}</strong></span>
          <small>({user.legajo})</small>
          <button 
            onClick={logout}
            className="logout-btn"
            aria-label="Cerrar sesión"
          >
            Salir
          </button>
        </div>
      </header>

      {page === 'unidades' && (
        <Unidades 
          token={token}
          onIniciar={iniciarInspeccion}
          onHistorial={irHistorial}
        />
      )}
      {page === 'inspeccion' && unidad && (
        <Inspeccion 
          token={token}
          unidad={unidad} 
          rutina={rutina} 
          onFinish={irResumen} 
          onCancel={volverAUnidades} 
        />
      )}
      {page === 'resumen' && unidad && (
        <Resumen 
          token={token}
          unidad={unidad} 
          resultados={resultados} 
          onBack={volverAUnidades} 
        />
      )}
      {page === 'historial' && (
        <Historial 
          token={token}
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