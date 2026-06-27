import {
  NavLink,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import "./App.css";
import { GoogleSyncProvider } from "./state/GoogleSyncContext";
import { MateriasProvider } from "./state/MateriasContext";
import { MapPage } from "./pages/MapPage";
import { EditorPage } from "./pages/EditorPage";
import { PrivacyPolicyPage } from "./pages/PrivacyPolicyPage";
import { TermsOfServicePage } from "./pages/TermsOfServicePage";
import { APP_HOME_SUMMARY, APP_NAME, APP_TAGLINE } from './content/site';
import { paths } from './routes/paths';

function AppLayout() {
  const location = useLocation();
  const isEditor = location.pathname.startsWith(paths.editor);
  const isLegalPage =
    location.pathname === paths.privacy || location.pathname === paths.terms;
  const isHomePage = location.pathname === paths.map;

  return (
    <div className="app-root">
      <header className="app-header">
        <div className="app-header-title">
          {isLegalPage ? (
            <h1>Información legal</h1>
          ) : (
            <>
              <h1>{APP_NAME}</h1>
              <p className="app-header-subtitle">
                {APP_TAGLINE}
                {isHomePage && (
                  <span className="app-header-summary"> · {APP_HOME_SUMMARY}</span>
                )}
              </p>
            </>
          )}
        </div>
        {!isLegalPage && (
          <nav className="app-tabs">
            <NavLink
              to={paths.map}
              end
              className={({ isActive }) =>
                isActive ? "tab-button tab-button-active" : "tab-button"
              }
            >
              Mapa
            </NavLink>
            <NavLink
              to={paths.editorList}
              className={
                isEditor ? "tab-button tab-button-active" : "tab-button"
              }
            >
              Editor
            </NavLink>
          </nav>
        )}
      </header>

      <main className={`app-main${isLegalPage ? " app-main-legal" : ""}`}>
        <Routes>
          <Route path={paths.map} element={<MapPage />} />
          <Route path={`${paths.editor}/*`} element={<EditorPage />} />
          <Route path={paths.privacy} element={<PrivacyPolicyPage />} />
          <Route path={paths.terms} element={<TermsOfServicePage />} />
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
