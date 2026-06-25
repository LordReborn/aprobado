import type { GrupoEleccion, Materia, PlanDataset } from '../domain/types';
import { normalizeEstadoUsuario } from './estado';
import { normalizeMateriaFields } from '../domain/materia';
import { computeCalculatedStates, getAllPrereqIds } from './rules';

export interface DatasetValidationResult {
  ok: boolean;
  message?: string;
  errors?: string[];
}

export interface ImportValidationResult {
  ok: boolean;
  errors: string[];
  materiaCount: number;
  grupoCount: number;
}

function prereqIds(materia: Materia): string[] {
  return getAllPrereqIds(materia);
}

export function normalizeMateria(materia: Materia & { correlativas?: string[] }): Materia {
  const hasNewFormat = materia.cursadas !== undefined || materia.aprobadas !== undefined;
  const legacy = Array.isArray(materia.correlativas) ? materia.correlativas.map(String) : [];

  return normalizeMateriaFields({
    ...materia,
    cursadas: hasNewFormat ? (materia.cursadas ?? []) : [],
    aprobadas: hasNewFormat ? (materia.aprobadas ?? []) : legacy,
  });
}

export function normalizePlan(plan: PlanDataset): PlanDataset {
  return {
    materias: plan.materias.map((m) => normalizeMateria(m)),
    gruposEleccion: (plan.gruposEleccion ?? []).map(normalizeGrupo),
  };
}

function normalizeGrupo(grupo: GrupoEleccion): GrupoEleccion {
  return {
    ...grupo,
    id: grupo.id.trim(),
    nombre: grupo.nombre.trim(),
    materiaIds: [...new Set(grupo.materiaIds.map((id) => String(id).trim()).filter(Boolean))],
    minimo: grupo.minimo ?? undefined,
    creditosMinimos: grupo.creditosMinimos ?? undefined,
  };
}

export function validateDataset(plan: PlanDataset): DatasetValidationResult {
  const errors = collectDatasetErrors(plan);

  if (errors.length > 0) {
    return {
      ok: false,
      message: errors[0],
      errors,
    };
  }

  return { ok: true };
}

function collectDatasetErrors(plan: PlanDataset): string[] {
  const errors: string[] = [];
  const materias = plan.materias;
  const grupos = plan.gruposEleccion ?? [];

  if (materias.length === 0) {
    errors.push('El dataset no puede estar vacío.');
    return errors;
  }

  const ids = new Set<string>();
  const grupoIds = new Set<string>();

  for (const grupo of grupos) {
    if (!grupo.id.trim()) {
      errors.push('Hay un grupo de elección con id vacío.');
      continue;
    }

    if (grupoIds.has(grupo.id)) {
      errors.push(`Hay ids de grupo duplicados: ${grupo.id}.`);
      continue;
    }

    grupoIds.add(grupo.id);

    if (!grupo.nombre.trim()) {
      errors.push(`El grupo ${grupo.id} no tiene nombre.`);
    }

    if (!['uno_de', 'minimo', 'creditos'].includes(grupo.modo)) {
      errors.push(`El grupo ${grupo.id} tiene modo inválido: ${grupo.modo}.`);
    }

    if (grupo.modo === 'creditos' && (grupo.creditosMinimos ?? 0) <= 0) {
      errors.push(`El grupo ${grupo.id} (creditos) necesita creditosMinimos > 0.`);
    }

    if (grupo.modo === 'minimo' && (grupo.minimo ?? 1) <= 0) {
      errors.push(`El grupo ${grupo.id} (minimo) necesita minimo > 0.`);
    }
  }

  for (const materia of materias) {
    if (!materia.id.trim()) {
      errors.push('Hay una materia con id vacío.');
      continue;
    }

    if (ids.has(materia.id)) {
      errors.push(`Hay ids duplicados: ${materia.id}.`);
      continue;
    }

    ids.add(materia.id);

    if (!materia.nombre.trim()) {
      errors.push(`La materia ${materia.id} tiene nombre vacío.`);
    }

    if (!Number.isInteger(materia.anio) || materia.anio <= 0) {
      errors.push(`La materia ${materia.nombre || materia.id} tiene un año inválido.`);
    }

    const tipo = materia.tipo ?? 'obligatoria';
    if (tipo !== 'obligatoria' && tipo !== 'optativa') {
      errors.push(`La materia ${materia.nombre} tiene tipo inválido: ${tipo}.`);
    }

    if (!Array.isArray(materia.cursadas)) {
      errors.push(`La materia ${materia.nombre} debe tener "cursadas" como array.`);
    }

    if (!Array.isArray(materia.aprobadas)) {
      errors.push(`La materia ${materia.nombre} debe tener "aprobadas" como array.`);
    }

    if (materia.creditos !== undefined && (!Number.isFinite(materia.creditos) || materia.creditos < 0)) {
      errors.push(`La materia ${materia.nombre} tiene créditos inválidos.`);
    }

    if (
      materia.requiereCreditosAprobados !== undefined &&
      (!Number.isFinite(materia.requiereCreditosAprobados) || materia.requiereCreditosAprobados < 0)
    ) {
      errors.push(`La materia ${materia.nombre} tiene requiereCreditosAprobados inválido.`);
    }

    if (materia.alternativaGrupoId && !grupoIds.has(materia.alternativaGrupoId)) {
      errors.push(
        `La materia ${materia.nombre} referencia alternativaGrupoId inexistente: ${materia.alternativaGrupoId}.`,
      );
    }

    for (const req of materia.requiereGrupos ?? []) {
      if (!grupoIds.has(req.grupoId)) {
        errors.push(
          `La materia ${materia.nombre} referencia requiereGrupos inexistente: ${req.grupoId}.`,
        );
      }
    }

    const cursadasSet = new Set<string>();
    for (const prereqId of materia.cursadas ?? []) {
      if (!prereqId.trim()) {
        errors.push(`La materia ${materia.nombre} tiene un id vacío en "cursadas".`);
      } else if (cursadasSet.has(prereqId)) {
        errors.push(`La materia ${materia.nombre} tiene id duplicado en "cursadas": ${prereqId}.`);
      } else {
        cursadasSet.add(prereqId);
      }
    }

    const aprobadasSet = new Set<string>();
    for (const prereqId of materia.aprobadas ?? []) {
      if (!prereqId.trim()) {
        errors.push(`La materia ${materia.nombre} tiene un id vacío en "aprobadas".`);
      } else if (aprobadasSet.has(prereqId)) {
        errors.push(`La materia ${materia.nombre} tiene id duplicado en "aprobadas": ${prereqId}.`);
      } else {
        aprobadasSet.add(prereqId);
      }
    }
  }

  for (const grupo of grupos) {
    for (const materiaId of grupo.materiaIds) {
      if (!ids.has(materiaId)) {
        errors.push(`El grupo ${grupo.nombre} referencia materia inexistente: ${materiaId}.`);
      }
    }
  }

  for (const materia of materias) {
    for (const prereqId of prereqIds(materia)) {
      if (!ids.has(prereqId)) {
        errors.push(`La materia ${materia.nombre} tiene un requisito inexistente: ${prereqId}.`);
      }
      if (prereqId === materia.id) {
        errors.push(`La materia ${materia.nombre} no puede tenerse a sí misma como requisito.`);
      }
    }
  }

  const cycle = detectFirstCycle(materias);
  if (cycle) {
    errors.push(`Se detectó un ciclo de correlativas: ${cycle.join(' -> ')}.`);
  }

  return errors;
}

export function detectFirstCycle(materias: Materia[]): string[] | null {
  const adjacency = new Map<string, string[]>();

  for (const materia of materias) {
    adjacency.set(materia.id, prereqIds(materia));
  }

  const visited = new Set<string>();
  const stack = new Set<string>();

  function dfs(node: string, path: string[]): string[] | null {
    if (stack.has(node)) {
      const cycleStartIndex = path.indexOf(node);
      return path.slice(cycleStartIndex).concat(node);
    }

    if (visited.has(node)) {
      return null;
    }

    visited.add(node);
    stack.add(node);

    const neighbors = adjacency.get(node) ?? [];

    for (const next of neighbors) {
      const result = dfs(next, [...path, next]);
      if (result) {
        return result;
      }
    }

    stack.delete(node);
    return null;
  }

  for (const id of adjacency.keys()) {
    const result = dfs(id, [id]);
    if (result) {
      return result;
    }
  }

  return null;
}

function parsePrereqList(value: unknown): string[] {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) return [];
  return value.map((c) => String(c).trim()).filter(Boolean);
}

function parseRequiereGrupos(value: unknown): Materia['requiereGrupos'] {
  if (!Array.isArray(value)) return undefined;

  const parsed = value
    .filter((item) => item && typeof item === 'object')
    .map((item) => {
      const base = item as RequisitoGrupoJson;
      return {
        grupoId: String(base.grupoId ?? '').trim(),
        minimo: base.minimo !== undefined ? Number(base.minimo) : undefined,
        creditosMinimos:
          base.creditosMinimos !== undefined ? Number(base.creditosMinimos) : undefined,
      };
    })
    .filter((item) => item.grupoId);

  return parsed.length > 0 ? parsed : undefined;
}

interface RequisitoGrupoJson {
  grupoId?: string;
  minimo?: number;
  creditosMinimos?: number;
}

function normalizeMateriaFromJson(item: unknown, index: number): Materia {
  if (!item || typeof item !== 'object' || Array.isArray(item)) {
    throw new Error(`El elemento en la posición ${index} no es un objeto válido.`);
  }

  const base = item as Partial<Materia> & { correlativas?: string[] };

  const legacyCorrelativas = parsePrereqList(base.correlativas);
  const hasNewFormat = 'cursadas' in base || 'aprobadas' in base;
  const cursadas = hasNewFormat ? parsePrereqList(base.cursadas) : [];
  const aprobadas = hasNewFormat ? parsePrereqList(base.aprobadas) : legacyCorrelativas;

  if ('cursadas' in base && base.cursadas !== undefined && !Array.isArray(base.cursadas)) {
    throw new Error(`La materia en posición ${index} tiene "cursadas" con tipo inválido (debe ser array).`);
  }

  if ('aprobadas' in base && base.aprobadas !== undefined && !Array.isArray(base.aprobadas)) {
    throw new Error(`La materia en posición ${index} tiene "aprobadas" con tipo inválido (debe ser array).`);
  }

  const tipo = base.tipo === 'optativa' ? 'optativa' : 'obligatoria';

  return normalizeMateriaFields({
    id: String(base.id ?? '').trim(),
    nombre: String(base.nombre ?? '').trim(),
    anio: Number(base.anio ?? 1),
    cursadas,
    aprobadas,
    estadoUsuario: normalizeEstadoUsuario(base.estadoUsuario),
    estadoCalculado:
      base.estadoCalculado === 'BLOQUEADA' || base.estadoCalculado === 'DESBLOQUEADA'
        ? base.estadoCalculado
        : 'BLOQUEADA',
    tipo,
    activa: base.activa ?? (tipo === 'optativa' ? false : true),
    creditos: base.creditos !== undefined ? Number(base.creditos) : undefined,
    alternativaGrupoId: base.alternativaGrupoId ? String(base.alternativaGrupoId).trim() : undefined,
    requiereGrupos: parseRequiereGrupos(base.requiereGrupos),
    requiereCreditosAprobados:
      base.requiereCreditosAprobados !== undefined
        ? Number(base.requiereCreditosAprobados)
        : undefined,
  });
}

function normalizeGrupoFromJson(item: unknown, index: number): GrupoEleccion {
  if (!item || typeof item !== 'object' || Array.isArray(item)) {
    throw new Error(`El grupo en posición ${index} no es un objeto válido.`);
  }

  const base = item as Partial<GrupoEleccion>;
  const modo = base.modo;

  if (modo !== 'uno_de' && modo !== 'minimo' && modo !== 'creditos') {
    throw new Error(`El grupo en posición ${index} tiene modo inválido.`);
  }

  return normalizeGrupo({
    id: String(base.id ?? '').trim(),
    nombre: String(base.nombre ?? '').trim(),
    modo,
    materiaIds: parsePrereqList(base.materiaIds),
    minimo: base.minimo !== undefined ? Number(base.minimo) : undefined,
    creditosMinimos: base.creditosMinimos !== undefined ? Number(base.creditosMinimos) : undefined,
  });
}

function extractJsonValue(text: string): unknown {
  const trimmed = text.trim();

  try {
    return JSON.parse(trimmed);
  } catch {
    const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenced) {
      return JSON.parse(fenced[1].trim());
    }

    const start = trimmed.indexOf('[');
    const end = trimmed.lastIndexOf(']');
    if (start !== -1 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1));
    }

    const objStart = trimmed.indexOf('{');
    const objEnd = trimmed.lastIndexOf('}');
    if (objStart !== -1 && objEnd > objStart) {
      return JSON.parse(trimmed.slice(objStart, objEnd + 1));
    }

    throw new Error('JSON inválido. Verificá el formato del plan.');
  }
}

function parseRawPlan(raw: unknown): PlanDataset {
  if (Array.isArray(raw)) {
    return {
      materias: raw.map((item, index) => normalizeMateriaFromJson(item, index)),
      gruposEleccion: [],
    };
  }

  if (!raw || typeof raw !== 'object') {
    throw new Error('El JSON debe ser un array de materias o un objeto con materias y gruposEleccion.');
  }

  const base = raw as Partial<PlanDataset>;

  if (!Array.isArray(base.materias)) {
    throw new Error('El objeto del plan debe incluir "materias" como array.');
  }

  const materias = base.materias.map((item, index) => normalizeMateriaFromJson(item, index));
  const gruposEleccion = Array.isArray(base.gruposEleccion)
    ? base.gruposEleccion.map((item, index) => normalizeGrupoFromJson(item, index))
    : [];

  return { materias, gruposEleccion };
}

export function validateMateriasJson(json: string): ImportValidationResult {
  const errors: string[] = [];

  if (!json.trim()) {
    return { ok: false, errors: ['El JSON está vacío.'], materiaCount: 0, grupoCount: 0 };
  }

  let plan: PlanDataset;

  try {
    plan = parseRawPlan(extractJsonValue(json));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'JSON inválido.';
    return { ok: false, errors: [message], materiaCount: 0, grupoCount: 0 };
  }

  errors.push(...collectDatasetErrors(plan));

  return {
    ok: errors.length === 0,
    errors,
    materiaCount: plan.materias.length,
    grupoCount: plan.gruposEleccion?.length ?? 0,
  };
}

export function parseMateriasJson(json: string): PlanDataset {
  const preview = validateMateriasJson(json);

  if (!preview.ok) {
    throw new Error(preview.errors[0] ?? 'Dataset inválido.');
  }

  const plan = normalizePlan(parseRawPlan(extractJsonValue(json)));

  return {
    materias: computeCalculatedStates(plan.materias, plan.gruposEleccion ?? []),
    gruposEleccion: plan.gruposEleccion ?? [],
  };
}
