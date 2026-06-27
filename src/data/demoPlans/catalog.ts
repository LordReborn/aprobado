import type { PlanDataset } from '../../domain/types';
import { computeCalculatedStates } from '../../domain/rules';
import { normalizePlan, validateDataset } from '../../domain/validation';
import utnSistemasInformacion from './plans/utn-sistemas-informacion.json';
import utnQuimica from './plans/utn-quimica.json';
import utnMecanica from './plans/utn-mecanica.json';
import utnElectrica from './plans/utn-electrica.json';

export type DemoPlanId =
  | 'utn-sistemas-informacion'
  | 'utn-quimica'
  | 'utn-mecanica'
  | 'utn-electrica';

export interface DemoPlanCatalogEntry {
  id: DemoPlanId;
  university: string;
  career: string;
  label: string;
  searchText: string;
}

export const DEMO_PLAN_CATALOG: DemoPlanCatalogEntry[] = [
  {
    id: 'utn-sistemas-informacion',
    university: 'UTN',
    career: 'Ingeniería en Sistemas de Información',
    label: 'UTN — Ingeniería en Sistemas de Información',
    searchText: 'utn sistemas informacion sistema si',
  },
  {
    id: 'utn-quimica',
    university: 'UTN',
    career: 'Ingeniería Química',
    label: 'UTN — Ingeniería Química',
    searchText: 'utn quimica ingenieria quimica',
  },
  {
    id: 'utn-mecanica',
    university: 'UTN',
    career: 'Ingeniería Mecánica',
    label: 'UTN — Ingeniería Mecánica',
    searchText: 'utn mecanica ingenieria mecanica',
  },
  {
    id: 'utn-electrica',
    university: 'UTN',
    career: 'Ingeniería Eléctrica',
    label: 'UTN — Ingeniería Eléctrica',
    searchText: 'utn electrica ingenieria electrica',
  },
];

const rawDemoPlans: Record<DemoPlanId, PlanDataset> = {
  'utn-sistemas-informacion': utnSistemasInformacion as unknown as PlanDataset,
  'utn-quimica': utnQuimica as unknown as PlanDataset,
  'utn-mecanica': utnMecanica as unknown as PlanDataset,
  'utn-electrica': utnElectrica as unknown as PlanDataset,
};

function prepareDemoPlan(raw: PlanDataset): PlanDataset {
  const normalized = normalizePlan(raw);
  return {
    materias: computeCalculatedStates(normalized.materias, normalized.gruposEleccion ?? []),
    gruposEleccion: normalized.gruposEleccion ?? [],
  };
}

export function getDemoPlanEntry(id: DemoPlanId): DemoPlanCatalogEntry {
  const entry = DEMO_PLAN_CATALOG.find((plan) => plan.id === id);
  if (!entry) {
    throw new Error('Plan de demo no encontrado.');
  }
  return entry;
}

export function isDemoPlanAvailable(id: DemoPlanId): boolean {
  const raw = rawDemoPlans[id];
  return raw.materias.length > 0;
}

export function getDemoPlan(id: DemoPlanId): PlanDataset {
  const raw = rawDemoPlans[id];
  if (raw.materias.length === 0) {
    throw new Error('Este plan de demo todavía no tiene materias cargadas.');
  }

  const prepared = prepareDemoPlan(raw);
  const validation = validateDataset(prepared);
  if (!validation.ok) {
    throw new Error(validation.message ?? 'El plan de demo es inválido.');
  }

  return prepared;
}

export const DEFAULT_DEMO_PLAN_ID: DemoPlanId = 'utn-sistemas-informacion';
