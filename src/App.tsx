import { NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import './App.css';
import { GoogleSyncProvider } from './state/GoogleSyncContext';
import { MateriasProvider } from './state/MateriasContext';
import { MapPage } from './pages/MapPage';
import { EditorPage } from './pages/EditorPage';
import { paths } from './routes/paths';

function AppLayout() {
  const location = useLocation();
  const isEditor = location.pathname.startsWith(paths.editor);

  return (
    <div className="app-root">
      <header className="app-header">
        <div className="app-header-title">
          <h1>Plan de cursada</h1>
        </div>
        <nav className="app-tabs">
          <NavLink
            to={paths.map}
            end
            className={({ isActive }) => (isActive ? 'tab-button tab-button-active' : 'tab-button')}
          >
            Mapa
          </NavLink>
          <NavLink
            to={paths.editorList}
            className={isEditor ? 'tab-button tab-button-active' : 'tab-button'}
          >
            Editor
          </NavLink>
        </nav>
      </header>

      <main className="app-main">
        <Routes>
          <Route path={paths.map} element={<MapPage />} />
          <Route path={`${paths.editor}/*`} element={<EditorPage />} />
          <Route path="*" element={<Navigate to={paths.map} replace />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <MateriasProvider>
      <GoogleSyncProvider>
        <AppLayout />
      </GoogleSyncProvider>
    </MateriasProvider>
  );
}

export default App;
