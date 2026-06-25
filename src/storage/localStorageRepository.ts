import type { PlanDataset } from '../domain/types';
import { migrateLegacyEstadoUsuario } from '../domain/estado';
import { normalizePlan } from '../domain/validation';

const STORAGE_KEY = 'correlativas_app_v2';
const ESTADO_MIGRATION_KEY = 'correlativas_estado_v3_migrated';

function applyEstadoMigration(plan: PlanDataset): PlanDataset {
  if (typeof window === 'undefined') {
    return plan;
  }

  if (window.localStorage.getItem(ESTADO_MIGRATION_KEY)) {
    return plan;
  }

  window.localStorage.setItem(ESTADO_MIGRATION_KEY, '1');

  return {
    ...plan,
    materias: plan.materias.map((materia) => ({
      ...materia,
      estadoUsuario: migrateLegacyEstadoUsuario(materia.estadoUsuario),
    })),
  };
}

function parseStoredPlan(raw: string): PlanDataset | null {
  const parsed = JSON.parse(raw) as unknown;

  if (Array.isArray(parsed)) {
    return normalizePlan({
      materias: parsed.map((item) => item as PlanDataset['materias'][number]),
      gruposEleccion: [],
    });
  }

  if (!parsed || typeof parsed !== 'object') {
    return null;
  }

  const base = parsed as Partial<PlanDataset>;
  if (!Array.isArray(base.materias)) {
    return null;
  }

  return normalizePlan({
    materias: base.materias as PlanDataset['materias'],
    gruposEleccion: Array.isArray(base.gruposEleccion) ? base.gruposEleccion : [],
  });
}

export function loadPlanFromStorage(): PlanDataset | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const plan = parseStoredPlan(raw);
    if (!plan) return null;

    return applyEstadoMigration(plan);
  } catch {
    return null;
  }
}

/** @deprecated Usar loadPlanFromStorage */
export function loadMateriasFromStorage(): PlanDataset['materias'] | null {
  const plan = loadPlanFromStorage();
  return plan?.materias ?? null;
}

export function savePlanToStorage(plan: PlanDataset): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const serialized = JSON.stringify(plan);
    window.localStorage.setItem(STORAGE_KEY, serialized);
  } catch {
    // Ignorar errores de persistencia
  }
}

/** @deprecated Usar savePlanToStorage */
export function saveMateriasToStorage(materias: PlanDataset['materias']): void {
  savePlanToStorage({ materias, gruposEleccion: [] });
}

export function clearMateriasFromStorage(): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignorar errores de persistencia
  }
}

export { STORAGE_KEY };
