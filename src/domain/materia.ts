import type { Materia, TipoMateria } from './types';

export function getTipoMateria(materia: Materia): TipoMateria {
  return materia.tipo ?? 'obligatoria';
}

export function isOptativa(materia: Materia): boolean {
  return getTipoMateria(materia) === 'optativa';
}

/** Si la materia participa en el plan del estudiante. */
export function isMateriaActiva(materia: Materia): boolean {
  if (isOptativa(materia)) {
    return materia.activa ?? false;
  }

  return materia.activa ?? true;
}

export function normalizeMateriaFields(materia: Materia): Materia {
  const tipo = getTipoMateria(materia);
  const activa = tipo === 'optativa' ? (materia.activa ?? false) : (materia.activa ?? true);

  return {
    ...materia,
    tipo,
    activa,
    creditos: materia.creditos ?? undefined,
    alternativaGrupoId: materia.alternativaGrupoId?.trim() || undefined,
    requiereGrupos: materia.requiereGrupos?.length ? materia.requiereGrupos : undefined,
    requiereCreditosAprobados: materia.requiereCreditosAprobados ?? undefined,
  };
}
