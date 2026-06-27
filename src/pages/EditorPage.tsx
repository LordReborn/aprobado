import { useEffect, useMemo } from 'react';
import { NavLink, Navigate, Route, Routes, useLocation, useMatch, useNavigate } from 'react-router-dom';
import { copyTextToClipboardAsync } from '../utils/copyToClipboard';
import type { Materia } from '../domain/types';
import { useMaterias } from '../state/MateriasContext';
import { EditorSubjectForm } from '../components/EditorSubjectForm';
import { ImportMateriasPanel } from '../components/ImportMateriasPanel';
import { EditorSettingsPanel } from '../components/EditorSettingsPanel';
import { EditorTabsNav } from '../components/EditorTabsNav';
import { getEditorSection, paths } from '../routes/paths';
import type { DemoPlanId } from '../data/demoPlans/catalog';

function editorTabClass(isActive: boolean): string {
  return isActive ? 'editor-tab-button editor-tab-button-active' : 'editor-tab-button';
}

export function EditorPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const editMatch = useMatch({ path: `${paths.editor}/editar/:materiaId`, end: true });
  const materiaId = editMatch?.params.materiaId;
  const {
    materias,
    gruposEleccion,
    lastError,
    setError,
    replaceAllMaterias,
    importFromJson,
    resetToDemo,
    resetEstadosIniciales,
    clearAllMaterias,
  } = useMaterias();

  const section = getEditorSection(location.pathname);
  const editing = useMemo(
    () => (materiaId ? (materias.find((m) => m.id === materiaId) ?? null) : null),
    [materiaId, materias],
  );

  const orderedMaterias = useMemo(
    () =>
      [...materias].sort((a, b) => {
        if (a.anio !== b.anio) return a.anio - b.anio;
        return a.nombre.localeCompare(b.nombre);
      }),
    [materias],
  );

  useEffect(() => {
    if (section === 'editar' && materiaId && !editing) {
      navigate(paths.editorList, { replace: true });
    }
  }, [section, materiaId, editing, navigate]);

  const openEditMateria = (materia: Materia) => {
    navigate(paths.editorEdit(materia.id));
  };

  const handleDelete = (materia: Materia) => {
    const confirmed = window.confirm(
      `¿Seguro que deseas eliminar la materia "${materia.nombre}"? También se quitará de las correlativas de otras materias.`,
    );
    if (!confirmed) return;

    const next = materias
      .filter((m) => m.id !== materia.id)
      .map((m) => ({
        ...m,
        cursadas: m.cursadas.filter((id) => id !== materia.id),
        aprobadas: m.aprobadas.filter((id) => id !== materia.id),
      }));

    if (editing?.id === materia.id) {
      navigate(paths.editorList);
    }

    replaceAllMaterias(next);
  };

  const handleSave = (materia: Materia) => {
    const exists = materias.some((m) => m.id === materia.id);

    const next = exists
      ? materias.map((m) => (m.id === materia.id ? { ...m, ...materia } : m))
      : [...materias, materia];

    replaceAllMaterias(next);
    navigate(paths.editorList);
  };

  const handleCancelForm = () => {
    navigate(paths.editorList);
  };

  const handleExport = async () => {
    const plan = { materias, gruposEleccion };
    const json = JSON.stringify(plan, null, 2);
    const result = await copyTextToClipboardAsync(json);

    if (result === 'copied') {
      alert('JSON copiado al portapapeles.');
      return;
    }

    if (result === 'shared') {
      return;
    }

    try {
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'materias.json';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('No se pudo copiar el JSON. Intenta nuevamente.');
    }
  };

  const handleLoadDemo = (planId: DemoPlanId) => {
    resetToDemo(planId);
    navigate(paths.map);
  };

  const handleResetEstados = () => {
    resetEstadosIniciales();
    navigate(paths.editorList);
  };

  const handleClearAll = () => {
    clearAllMaterias();
    navigate(paths.editorList);
  };

  const handleImport = (json: string) => {
    importFromJson(json);
    navigate(paths.editorList);
  };

  const handleClearError = () => setError(null);

  const formTitle = section === 'editar' ? 'Editar materia' : 'Nueva materia';

  return (
    <div className="page editor-page">
      <div className="editor-main">

        {lastError && (
          <div className="alert alert-error">
            <strong>Error:</strong> {lastError}{' '}
            <button type="button" className="link-button" onClick={handleClearError}>
              Cerrar
            </button>
          </div>
        )}

        <EditorTabsNav>
          <NavLink to={paths.editorList} end className={({ isActive }) => editorTabClass(isActive)}>
            Listado
          </NavLink>
          <NavLink
            to={paths.editorNew}
            aria-label={formTitle}
            className={({ isActive }) => editorTabClass(isActive || section === 'editar')}
          >
            <span className="editor-tab-label-full">{formTitle}</span>
            <span className="editor-tab-label-short">{section === 'editar' ? 'Editar' : 'Nueva'}</span>
          </NavLink>
          <NavLink
            to={paths.editorImport}
            aria-label="Importar JSON"
            className={({ isActive }) => editorTabClass(isActive)}
          >
            <span className="editor-tab-label-full">Importar JSON</span>
            <span className="editor-tab-label-short">Importar</span>
          </NavLink>
          <NavLink
            to={paths.editorSettings}
            aria-label="Configuración"
            className={({ isActive }) => editorTabClass(isActive)}
          >
            <span className="editor-tab-label-full">Configuración</span>
            <span className="editor-tab-label-short">Config</span>
          </NavLink>
        </EditorTabsNav>

        <div className="editor-content">
          <Routes>
            <Route index element={<Navigate to="listado" replace />} />
            <Route
              path="listado"
              element={
                <div className="editor-table-wrapper">
                  <table className="editor-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Nombre</th>
                        <th>Tipo</th>
                        <th>Año o cuatrimestre</th>
                        <th>Regularizar</th>
                        <th>Aprobar</th>
                        <th className="editor-table-actions">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orderedMaterias.map((m) => (
                        <tr key={m.id} className={editing?.id === m.id ? 'is-editing' : undefined}>
                          <td>{m.id}</td>
                          <td>{m.nombre}</td>
                          <td>{m.tipo === 'optativa' ? 'Optativa' : 'Obligatoria'}</td>
                          <td>{m.anio}</td>
                          <td>{m.cursadas.join(', ') || '-'}</td>
                          <td>{m.aprobadas.join(', ') || '-'}</td>
                          <td className="editor-table-actions">
                            <div className="table-action-group">
                              <button
                                type="button"
                                className="icon-button"
                                title="Editar materia"
                                aria-label={`Editar ${m.nombre}`}
                                onClick={() => openEditMateria(m)}
                              >
                                <svg
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  aria-hidden="true"
                                >
                                  <path d="M12 20h9" strokeLinecap="round" />
                                  <path
                                    d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              </button>
                              <button
                                type="button"
                                className="icon-button icon-button-danger"
                                title="Eliminar materia"
                                aria-label={`Eliminar ${m.nombre}`}
                                onClick={() => handleDelete(m)}
                              >
                                <svg
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  aria-hidden="true"
                                >
                                  <path d="M3 6h18" strokeLinecap="round" />
                                  <path d="M8 6V4h8v2" strokeLinejoin="round" />
                                  <path
                                    d="M19 6v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6"
                                    strokeLinejoin="round"
                                  />
                                  <path d="M10 11v6M14 11v6" strokeLinecap="round" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              }
            />
            <Route
              path="nueva"
              element={
                <div className="editor-form-wrapper">
                  <EditorSubjectForm
                    materias={materias}
                    onCancel={handleCancelForm}
                    onSave={handleSave}
                  />
                </div>
              }
            />
            <Route
              path="editar/:materiaId"
              element={
                editing ? (
                  <div className="editor-form-wrapper">
                    <EditorSubjectForm
                      key={editing.id}
                      materias={materias}
                      initial={editing}
                      onCancel={handleCancelForm}
                      onSave={handleSave}
                    />
                  </div>
                ) : null
              }
            />
            <Route
              path="importar"
              element={
                <ImportMateriasPanel
                  onClose={() => navigate(paths.editorList)}
                  onImport={handleImport}
                  onLoadDemo={handleLoadDemo}
                />
              }
            />
            <Route
              path="configuracion"
              element={
                <EditorSettingsPanel
                  materiaCount={materias.length}
                  onExport={handleExport}
                  onResetEstados={handleResetEstados}
                  onClearAll={handleClearAll}
                />
              }
            />
            <Route path="*" element={<Navigate to="listado" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}
