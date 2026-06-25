import { getCreditosAprobadosTotales, getMissingGrupos } from './grupos';
import { cumpleAprobada, cumpleRegularizar } from './estado';
import { isMateriaActiva } from './materia';
import type { EstadoVisible, GrupoEleccion, Materia } from './types';

export function getAllPrereqIds(materia: Materia): string[] {
  return [...new Set([...materia.cursadas, ...materia.aprobadas])];
}

export function computeCalculatedStates(
  materias: Materia[],
  gruposEleccion: GrupoEleccion[] = [],
): Materia[] {
  const byId = new Map<string, Materia>();
  materias.forEach((m) => {
    byId.set(m.id, m);
  });

  return materias.map((materia) => {
    const missingCursadas = getMissingCursadas(materia, materias, byId);
    const missingAprobadas = getMissingAprobadas(materia, materias, byId);
    const missingCreditos = getMissingCreditos(materia, materias);
    const missingGrupos = getMissingGrupos(materia, materias, gruposEleccion);

    const estadoCalculado: Materia['estadoCalculado'] =
      missingCursadas.length > 0 ||
      missingAprobadas.length > 0 ||
      missingCreditos !== null ||
      missingGrupos.length > 0
        ? 'BLOQUEADA'
        : 'DESBLOQUEADA';

    return {
      ...materia,
      estadoCalculado,
    };
  });
}

function isPrereqRelevante(prereq: Materia | undefined): boolean {
  if (!prereq) return false;
  return isMateriaActiva(prereq);
}

export function getMissingCursadas(
  materia: Materia,
  materias: Materia[],
  byIdParam?: Map<string, Materia>,
): string[] {
  if (!isMateriaActiva(materia)) {
    return [];
  }

  const byId = byIdParam ?? new Map(materias.map((m) => [m.id, m] as const));
  const missing: string[] = [];

  for (const prereqId of materia.cursadas) {
    const prereq = byId.get(prereqId);
    if (!isPrereqRelevante(prereq)) continue;

    if (!prereq || !cumpleRegularizar(prereq.estadoUsuario)) {
      missing.push(prereqId);
    }
  }

  return missing;
}

export function getMissingAprobadas(
  materia: Materia,
  materias: Materia[],
  byIdParam?: Map<string, Materia>,
): string[] {
  if (!isMateriaActiva(materia)) {
    return [];
  }

  const byId = byIdParam ?? new Map(materias.map((m) => [m.id, m] as const));
  const missing: string[] = [];

  for (const prereqId of materia.aprobadas) {
    const prereq = byId.get(prereqId);
    if (!isPrereqRelevante(prereq)) continue;

    if (!prereq || !cumpleAprobada(prereq.estadoUsuario)) {
      missing.push(prereqId);
    }
  }

  return missing;
}

export function getMissingCreditos(materia: Materia, materias: Materia[]): string | null {
  if (!isMateriaActiva(materia) || materia.requiereCreditosAprobados === undefined) {
    return null;
  }

  const actual = getCreditosAprobadosTotales(materias);
  if (actual >= materia.requiereCreditosAprobados) {
    return null;
  }

  return `${actual}/${materia.requiereCreditosAprobados} créditos aprobados`;
}

/** @deprecated Usar getMissingCursadas / getMissingAprobadas */
export function getMissingPrereqs(
  materia: Materia,
  materias: Materia[],
  byIdParam?: Map<string, Materia>,
): string[] {
  const byId = byIdParam ?? new Map(materias.map((m) => [m.id, m] as const));
  return [...new Set([...getMissingCursadas(materia, materias, byId), ...getMissingAprobadas(materia, materias, byId)])];
}

export function getDependents(id: string, materias: Materia[]): Materia[] {
  return materias.filter(
    (m) => isMateriaActiva(m) && (m.cursadas.includes(id) || m.aprobadas.includes(id)),
  );
}

export function getVisibleState(materia: Materia): EstadoVisible {
  if (!isMateriaActiva(materia)) {
    return 'BLOQUEADA';
  }

  if (materia.estadoCalculado === 'BLOQUEADA') {
    return 'BLOQUEADA';
  }

  if (materia.estadoUsuario === 'EN_CURSO') {
    return 'EN_CURSO';
  }

  if (materia.estadoUsuario === 'FINALIZADA') {
    return 'FINALIZADA';
  }

  return 'DESBLOQUEADA';
}

export function getVisibleStateLabel(state: EstadoVisible): string {
  return {
    BLOQUEADA: 'Bloqueada',
    DESBLOQUEADA: 'Desbloqueada',
    EN_CURSO: 'Cursando',
    REGULARIZADA: 'Regularizada',
    FINALIZADA: 'Aprobada',
  }[state];
}