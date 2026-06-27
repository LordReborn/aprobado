export const paths = {
  map: "/",
  editor: "/editor",
  editorList: "/editor/listado",
  editorNew: "/editor/nueva",
  editorEdit: (id: string) => `/editor/editar/${encodeURIComponent(id)}`,
  editorImport: "/editor/importar",
  editorSettings: "/editor/configuracion",
  privacy: '/privacidad',
  terms: '/terminos',
  about: '/acerca',
} as const;

export type EditorSection =
  | "listado"
  | "nueva"
  | "editar"
  | "importar"
  | "configuracion";

export function getEditorSection(pathname: string): EditorSection {
  if (pathname.includes("/importar")) return "importar";
  if (pathname.includes("/configuracion")) return "configuracion";
  if (pathname.includes("/nueva")) return "nueva";
  if (pathname.includes("/editar/")) return "editar";
  return "listado";
}
