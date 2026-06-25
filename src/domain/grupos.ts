import { isMateriaActiva } from './materia';
import type { GrupoEleccion, Materia, RequisitoGrupo } from './types';

function materiasDelGrupo(grupo: GrupoEleccion, materias: Materia[]): Materia[] {
  const ids = new Set(grupo.materiaIds);
  return materias.filter((m) => ids.has(m.id) && isMateriaActiva(m));
}

export function getCreditosAprobados(materias: Materia[], ids?: string[]): number {
  const pool = ids ? new Set(ids) : null;

  return materias
    .filter(
      (m) =>
        m.estadoUsuario === 'FINALIZADA' &&
        isMateriaActiva(m) &&
        (!pool || pool.has(m.id)),
    )
    .reduce((sum, m) => sum + (m.creditos ?? 0), 0);
}

export function getCreditosAprobadosTotales(materias: Materia[]): number {
  return getCreditosAprobados(materias);
}

function countConEstado(
  grupoMaterias: Materia[],
  estados: Array<Materia['estadoUsuario']>,
): number {
  return grupoMaterias.filter((m) => estados.includes(m.estadoUsuario)).length;
}

function getMinimo(grupo: GrupoEleccion, requisito?: RequisitoGrupo): number {
  return requisito?.minimo ?? grupo.minimo ?? 1;
}

function getCreditosMinimos(grupo: GrupoEleccion, requisito?: RequisitoGrupo): number {
  return requisito?.creditosMinimos ?? grupo.creditosMinimos ?? 0;
}

/** Cumplido para habilitar cursada (REGULARIZADA o FINALIZADA cuenta). */
export function isGrupoSatisfiedForCursada(
  grupo: GrupoEleccion,
  materias: Materia[],
  requisito?: RequisitoGrupo,
): boolean {
  const members = materiasDelGrupo(grupo, materias);

  switch (grupo.modo) {
    case 'uno_de':
      return countConEstado(members, ['REGULARIZADA', 'FINALIZADA']) >= 1;
    case 'minimo':
      return countConEstado(members, ['REGULARIZADA', 'FINALIZADA']) >= getMinimo(grupo, requisito);
    case 'creditos':
      return getCreditosAprobados(materias, grupo.materiaIds) >= getCreditosMinimos(grupo, requisito);
    default:
      return true;
  }
}

/** Cumplido para considerar requisito de aprobación (solo FINALIZADA). */
export function isGrupoSatisfiedForAprobada(
  grupo: GrupoEleccion,
  materias: Materia[],
  requisito?: RequisitoGrupo,
): boolean {
  const members = materiasDelGrupo(grupo, materias);

  switch (grupo.modo) {
    case 'uno_de':
      return countConEstado(members, ['FINALIZADA']) >= 1;
    case 'minimo':
      return countConEstado(members, ['FINALIZADA']) >= getMinimo(grupo, requisito);
    case 'creditos':
      return getCreditosAprobados(materias, grupo.materiaIds) >= getCreditosMinimos(grupo, requisito);
    default:
      return true;
  }
}

export interface GrupoPendiente {
  grupoId: string;
  nombre: string;
  descripcion: string;
}

export function getMissingGrupos(
  materia: Materia,
  materias: Materia[],
  grupos: GrupoEleccion[],
): GrupoPendiente[] {
  if (!materia.requiereGrupos?.length) {
    return [];
  }

  const byId = new Map(grupos.map((g) => [g.id, g] as const));
  const missing: GrupoPendiente[] = [];

  for (const requisito of materia.requiereGrupos) {
    const grupo = byId.get(requisito.grupoId);
    if (!grupo) {
      missing.push({
        grupoId: requisito.grupoId,
        nombre: requisito.grupoId,
        descripcion: `Grupo de elección inexistente: ${requisito.grupoId}`,
      });
      continue;
    }

    if (!isGrupoSatisfiedForAprobada(grupo, materias, requisito)) {
      missing.push({
        grupoId: grupo.id,
        nombre: grupo.nombre,
        descripcion: describeGrupoPendiente(grupo, materias, requisito),
      });
    }
  }

  return missing;
}

function describeGrupoPendiente(
  grupo: GrupoEleccion,
  materias: Materia[],
  requisito?: RequisitoGrupo,
): string {
  const members = materiasDelGrupo(grupo, materias);

  switch (grupo.modo) {
    case 'uno_de':
      return `Elegir una opción de: ${members.map((m) => m.nombre).join(' / ') || grupo.nombre}`;
    case 'minimo': {
      const minimo = getMinimo(grupo, requisito);
      const aprobadas = countConEstado(members, ['FINALIZADA']);
      return `${grupo.nombre}: ${aprobadas}/${minimo} aprobadas`;
    }
    case 'creditos': {
      const min = getCreditosMinimos(grupo, requisito);
      const actual = getCreditosAprobados(materias, grupo.materiaIds);
      return `${grupo.nombre}: ${actual}/${min} créditos`;
    }
    default:
      return grupo.nombre;
  }
}

export function getGrupoProgress(
  grupo: GrupoEleccion,
  materias: Materia[],
): { actual: number; objetivo: number; etiqueta: string } {
  const members = materiasDelGrupo(grupo, materias);

  switch (grupo.modo) {
    case 'uno_de': {
      const elegida = members.find(
        (m) =>
          m.estadoUsuario === 'REGULARIZADA' ||
          m.estadoUsuario === 'FINALIZADA' ||
          m.estadoUsuario === 'EN_CURSO',
      );
      return {
        actual: elegida ? 1 : 0,
        objetivo: 1,
        etiqueta: elegida ? elegida.nombre : 'Sin elegir',
      };
    }
    case 'minimo': {
      const minimo = grupo.minimo ?? 1;
      const aprobadas = countConEstado(members, ['FINALIZADA']);
      return { actual: aprobadas, objetivo: minimo, etiqueta: `${aprobadas}/${minimo} aprobadas` };
    }
    case 'creditos': {
      const min = grupo.creditosMinimos ?? 0;
      const actual = getCreditosAprobados(materias, grupo.materiaIds);
      return { actual, objetivo: min, etiqueta: `${actual}/${min} créditos` };
    }
    default:
      return { actual: 0, objetivo: 0, etiqueta: '' };
  }
}
