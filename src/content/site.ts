export const APP_NAME = "Plan de cursada";
export const APP_SHORT_NAME = "aprobado";
export const DEVELOPER_NAME = "Jonas Aguilar";
export const DEVELOPER_URL = "https://www.jonasaguilar.com.ar";
export const LEGAL_LAST_UPDATED = "26 de junio de 2026";

export function getSiteOrigin(): string {
  if (typeof window !== "undefined" && window.location.origin) {
    return window.location.origin;
  }

  return "https://aprobado.vercel.app";
}
