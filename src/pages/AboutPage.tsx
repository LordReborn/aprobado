import { LegalDocumentLayout } from '../components/LegalDocumentLayout';
import { APP_DESCRIPTION, APP_NAME, DEVELOPER_NAME } from '../content/site';

export function AboutPage() {
  return (
    <LegalDocumentLayout title={`Acerca de ${APP_NAME}`}>
      <p>{APP_DESCRIPTION}</p>

      <h2>¿Para qué sirve?</h2>
      <p>
        La aplicación ayuda a estudiantes universitarios a organizar su carrera: cargar materias y
        correlativas, ver qué está bloqueado o disponible, registrar el avance (en curso,
        regularizada o aprobada) y exportar o sincronizar el plan entre dispositivos.
      </p>

      <h2>Funciones principales</h2>
      <ul>
        <li>Mapa interactivo de materias y correlativas.</li>
        <li>Panel de detalle con requisitos y materias que desbloquea cada materia.</li>
        <li>Editor para crear, editar e importar planes desde JSON.</li>
        <li>Respaldo local en el navegador y sincronización opcional con Google Drive.</li>
      </ul>

      <h2>Responsable</h2>
      <p>
        {APP_NAME} es desarrollado y mantenido por {DEVELOPER_NAME} como herramienta gratuita, sin
        fines de lucro.
      </p>
    </LegalDocumentLayout>
  );
}
