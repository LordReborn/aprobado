import type { EstadoUsuario } from './types';

/** Cumple requisito de columna "para regularizar". */
export function cumpleRegularizar(estado: EstadoUsuario): boolean {
  return estado === 'REGULARIZADA' || estado === 'FINALIZADA';
}

/** Cumple requisito de columna "aprobadas". */
export function cumpleAprobada(estado: EstadoUsuario): boolean {
  return estado === 'FINALIZADA';
}

export function normalizeEstadoUsuario(estado: unknown): EstadoUsuario {
  if (estado === 'EN_CURSO' || estado === 'REGULARIZADA' || estado === 'FINALIZADA') {
    return estado;
  }

  return null;
}

/** Migra el significado antiguo de EN_CURSO → REGULARIZADA (una sola vez). */
export function migrateLegacyEstadoUsuario(estado: EstadoUsuario): EstadoUsuario {
  if (estado === 'EN_CURSO') {
    return 'REGULARIZADA';
  }

  return estado;
}
