export type EstadoUsuario = 'EN_CURSO' | 'REGULARIZADA' | 'FINALIZADA' | null;

export type EstadoCalculado = 'BLOQUEADA' | 'DESBLOQUEADA';

export type EstadoVisible =
  | 'BLOQUEADA'
  | 'DESBLOQUEADA'
  | 'EN_CURSO'
  | 'REGULARIZADA'
  | 'FINALIZADA';

/** obligatoria: materia del plan que todos cursan. optativa: del pool electivo. */
export type TipoMateria = 'obligatoria' | 'optativa';

/**
 * Grupo de elección flexible para cualquier facultad:
 * - uno_de: alternativas excluyentes (ej. Tesis ó Trabajo Profesional)
 * - minimo: elegir al menos N materias del pool (ej. 2 optativas de 8)
 * - creditos: acumular N créditos aprobados del pool (ej. 24 créditos electivos)
 */
export type ModoGrupoEleccion = 'uno_de' | 'minimo' | 'creditos';

export interface GrupoEleccion {
  id: string;
  nombre: string;
  modo: ModoGrupoEleccion;
  materiaIds: string[];
  /** Para modo minimo. Default 1. */
  minimo?: number;
  /** Para modo creditos. */
  creditosMinimos?: number;
}

export interface RequisitoGrupo {
  grupoId: string;
  /** Override del mínimo del grupo para este requisito. */
  minimo?: number;
  creditosMinimos?: number;
}

export interface Materia {
  id: string;
  nombre: string;
  anio: number;
  /** Para regularizar: requieren REGULARIZADA o FINALIZADA. */
  cursadas: string[];
  /** Para aprobar: requieren estar FINALIZADA. */
  aprobadas: string[];
  estadoUsuario: EstadoUsuario;
  estadoCalculado: EstadoCalculado;
  /** Default: obligatoria. */
  tipo?: TipoMateria;
  /** Optativas: si está en el plan del estudiante. Obligatorias: siempre activas. */
  activa?: boolean;
  /** Créditos de la materia (planes por créditos, UBA, etc.). */
  creditos?: number;
  /** Miembro de un grupo uno_de (ej. Tesis / TPI). */
  alternativaGrupoId?: string;
  /** Requisitos de grupos (pool, créditos electivos, etc.). */
  requiereGrupos?: RequisitoGrupo[];
  /** Créditos totales aprobados necesarios para cursar/aprobar. */
  requiereCreditosAprobados?: number;
}

export interface PlanDataset {
  materias: Materia[];
  gruposEleccion?: GrupoEleccion[];
}
