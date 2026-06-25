import { useState, useEffect } from 'react';
import type { Materia, EstadoVisible, GrupoEleccion } from '../domain/types';
import type { EstadoUsuario } from '../domain/types';
import { getGrupoProgress, getMissingGrupos } from '../domain/grupos';
import { isMateriaActiva, isOptativa } from '../domain/materia';
import {
  getDependents,
  getMissingAprobadas,
  getMissingCursadas,
  getMissingCreditos,
  getVisibleState,
  getVisibleStateLabel,
} from '../domain/rules';
import { useMaterias } from '../state/MateriasContext';

interface SubjectDetailsPanelProps {
  materia: Materia;
  materias: Materia[];
  gruposEleccion: GrupoEleccion[];
  onClose: () => void;
  onChangeEstado: (estado: EstadoUsuario) => void;
}

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches,
  );

  useEffect(() => {
    const media = window.matchMedia(query);
    const onChange = () => setMatches(media.matches);
    onChange();
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}

function DetailsActions({
  isBlocked,
  onChangeEstado,
}: {
  isBlocked: boolean;
  onChangeEstado: (estado: EstadoUsuario) => void;
}) {
  return (
    <div className="details-actions">
      <button
        type="button"
        className="primary-button"
        disabled={isBlocked}
        title={
          isBlocked
            ? 'Primero debés cumplir los requisitos.'
            : 'Estás cursando la materia (no desbloquea correlativas de regularización).'
        }
        onClick={() => onChangeEstado('EN_CURSO')}
      >
        Marcar cursando
      </button>
      <button
        type="button"
        className="primary-button"
        disabled={isBlocked}
        title={
          isBlocked
            ? 'Primero debés cumplir los requisitos.'
            : 'Cumpliste asistencias y parciales; faltan los finales.'
        }
        onClick={() => onChangeEstado('REGULARIZADA')}
      >
        Marcar regularizada
      </button>
      <button
        type="button"
        className="primary-button"
        disabled={isBlocked}
        title={
          isBlocked
            ? 'Primero debés cumplir los requisitos.'
            : 'Materia aprobada con finales rendidos.'
        }
        onClick={() => onChangeEstado('FINALIZADA')}
      >
        Marcar aprobada
      </button>
      <button
        type="button"
        className="secondary-button"
        disabled={isBlocked}
        title={isBlocked ? 'No se puede cambiar el estado mientras esté bloqueada.' : 'Volver el estado a vacío.'}
        onClick={() => onChangeEstado(null)}
      >
        Reiniciar estado
      </button>
    </div>
  );
}

const MOBILE_ESTADO_CLASS: Record<EstadoVisible, string> = {
  BLOQUEADA: 'details-panel-mobile--bloqueada',
  DESBLOQUEADA: 'details-panel-mobile--desbloqueada',
  EN_CURSO: 'details-panel-mobile--en-curso',
  REGULARIZADA: 'details-panel-mobile--regularizada',
  FINALIZADA: 'details-panel-mobile--finalizada',
};

export function SubjectDetailsPanel({
  materia,
  materias,
  gruposEleccion,
  onClose,
  onChangeEstado,
}: SubjectDetailsPanelProps) {
  const { setOptativaActiva } = useMaterias();
  const isMobile = useMediaQuery('(max-width: 768px)');

  const activa = isMateriaActiva(materia);
  const missingCursadas = getMissingCursadas(materia, materias);
  const missingAprobadas = getMissingAprobadas(materia, materias);
  const missingCreditos = getMissingCreditos(materia, materias);
  const missingGrupos = getMissingGrupos(materia, materias, gruposEleccion);
  const isBlocked = !activa || materia.estadoCalculado === 'BLOQUEADA';
  const dependientes = getDependents(materia.id, materias);

  const cursadasDetalladas = materia.cursadas
    .map((id) => materias.find((m) => m.id === id))
    .filter((m): m is Materia => Boolean(m));

  const aprobadasDetalladas = materia.aprobadas
    .map((id) => materias.find((m) => m.id === id))
    .filter((m): m is Materia => Boolean(m));

  const gruposRelacionados = gruposEleccion.filter((g) => g.materiaIds.includes(materia.id));

  if (isMobile) {
    const estadoClass = MOBILE_ESTADO_CLASS[getVisibleState(materia)];

    return (
      <aside
        className={`details-panel details-panel-mobile details-panel-actions-only ${estadoClass}`}
      >
        <div className="details-mobile-header">
          <span className="details-mobile-title">{materia.nombre}</span>
          <button type="button" className="secondary-button" onClick={onClose}>
            Cerrar
          </button>
        </div>
        {isOptativa(materia) && (
          <label className="details-optativa-toggle">
            <input
              type="checkbox"
              checked={activa}
              onChange={(e) => setOptativaActiva(materia.id, e.target.checked)}
            />
            Incluir en mi plan
          </label>
        )}
        <DetailsActions isBlocked={isBlocked} onChangeEstado={onChangeEstado} />
      </aside>
    );
  }

  return (
    <aside className="details-panel">
      <div className="details-panel-header">
        <h2>{materia.nombre}</h2>
        <button type="button" className="secondary-button" onClick={onClose}>
          Cerrar
        </button>
      </div>

      <div className="details-panel-body">
        <div className="details-panel-section">
          <p className="details-subtitle">
            <strong>Año:</strong> {materia.anio}
            {isOptativa(materia) && (
              <>
                {' '}
                · <span className="pill pill-small">Optativa</span>
              </>
            )}
            {materia.creditos !== undefined && (
              <>
                {' '}
                · <strong>Créditos:</strong> {materia.creditos}
              </>
            )}
          </p>

          {isOptativa(materia) && (
            <label className="details-optativa-toggle">
              <input
                type="checkbox"
                checked={activa}
                onChange={(e) => setOptativaActiva(materia.id, e.target.checked)}
              />
              Incluir en mi plan
            </label>
          )}

          <p>
            <strong>Estado actual:</strong> {activa ? getVisibleStateLabel(getVisibleState(materia)) : 'Fuera del plan'}
          </p>

          {isBlocked && activa && (missingCursadas.length > 0 || missingAprobadas.length > 0 || missingCreditos || missingGrupos.length > 0) && (
            <div className="details-warning">
              <strong>La materia está inhabilitada.</strong>
              {missingCursadas.length > 0 && (
                <>
                  <p>Necesita regularizar:</p>
                  <ul>
                    {missingCursadas.map((id) => {
                      const found = materias.find((m) => m.id === id);
                      return (
                        <li key={id}>
                          {found ? found.nombre : id} ({id})
                        </li>
                      );
                    })}
                  </ul>
                </>
              )}
              {missingAprobadas.length > 0 && (
                <>
                  <p>Necesita aprobar:</p>
                  <ul>
                    {missingAprobadas.map((id) => {
                      const found = materias.find((m) => m.id === id);
                      return (
                        <li key={id}>
                          {found ? found.nombre : id} ({id})
                        </li>
                      );
                    })}
                  </ul>
                </>
              )}
              {missingCreditos && (
                <p>
                  Créditos aprobados insuficientes: <strong>{missingCreditos}</strong>
                </p>
              )}
              {missingGrupos.length > 0 && (
                <>
                  <p>Requisitos de elección pendientes:</p>
                  <ul>
                    {missingGrupos.map((g) => (
                      <li key={g.grupoId}>
                        {g.nombre}: {g.descripcion}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          )}
        </div>

        {gruposRelacionados.length > 0 && (
          <section>
            <h3>Grupos de elección</h3>
            <ul className="details-list">
              {gruposRelacionados.map((grupo) => {
                const progress = getGrupoProgress(grupo, materias);
                return (
                  <li key={grupo.id}>
                    <span>{grupo.nombre}</span>
                    <span className="pill pill-small">{progress.etiqueta}</span>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        <section>
          <h3>Necesita regularizar</h3>
          {cursadasDetalladas.length === 0 ? (
            <p className="details-empty">No tiene requisitos de regularización.</p>
          ) : (
            <ul className="details-list">
              {cursadasDetalladas.map((c) => (
                <li key={c.id}>
                  <span>{c.nombre}</span>
                  <span className="pill pill-small">{getVisibleState(c)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h3>Necesita aprobar</h3>
          {aprobadasDetalladas.length === 0 ? (
            <p className="details-empty">No tiene requisitos de aprobación.</p>
          ) : (
            <ul className="details-list">
              {aprobadasDetalladas.map((c) => (
                <li key={c.id}>
                  <span>{c.nombre}</span>
                  <span className="pill pill-small">{getVisibleState(c)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h3>Materias que habilita</h3>
          {dependientes.length === 0 ? (
            <p className="details-empty">No habilita materias adicionales.</p>
          ) : (
            <ul className="details-list">
              {dependientes.map((d) => (
                <li key={d.id}>
                  <span>{d.nombre}</span>
                  <span className="pill pill-small">{getVisibleState(d)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h3>Acciones</h3>
          <DetailsActions isBlocked={isBlocked} onChangeEstado={onChangeEstado} />
        </section>
      </div>
    </aside>
  );
}
