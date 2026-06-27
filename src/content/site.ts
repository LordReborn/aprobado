export const APP_NAME = "Aprobado";
export const APP_TAGLINE = "Plan de cursada universitario";
export const APP_SHORT_NAME = "aprobado";
export const DEVELOPER_NAME = "Jonas Aguilar";
export const DEVELOPER_URL = "https://www.jonasaguilar.com.ar";
export const SITE_URL = "https://www.aprobado.com.ar";
export const LEGAL_LAST_UPDATED = "26 de junio de 2026";

export const APP_DESCRIPTION =
  'Aprobado es una aplicación web gratuita para estudiantes universitarios. Te permite cargar tu plan de materias, visualizar correlativas en un mapa interactivo, marcar tu avance académico y, opcionalmente, respaldar tu plan en Google Drive.';

/** Una línea visible en la home; suficiente para describir el propósito sin ocupar la pantalla. */
export const APP_HOME_SUMMARY =
  'Visualizá correlativas, marcá tu avance y respaldá tu plan en Google Drive.';

export function getSiteOrigin(): string {
  if (typeof window !== "undefined" && window.location.origin) {
    return window.location.origin;
  }

  return SITE_URL;
}
