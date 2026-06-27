import { LegalDocumentLayout } from "../components/LegalDocumentLayout";
import {
  APP_NAME,
  APP_SHORT_NAME,
  DEVELOPER_NAME,
  getSiteOrigin,
} from "../content/site";

export function PrivacyPolicyPage() {
  const siteOrigin = getSiteOrigin();

  return (
    <LegalDocumentLayout title="Política de privacidad">
      <p>
        Esta política describe cómo {APP_NAME} ({APP_SHORT_NAME}), disponible en{" "}
        <a href={siteOrigin}>{siteOrigin}</a>, trata la información cuando usás
        la aplicación. El responsable del servicio es {DEVELOPER_NAME}.
      </p>

      <h2>1. Resumen</h2>
      <p>
        {APP_NAME} es una herramienta gratuita para organizar materias
        universitarias y correlativas. Por defecto, tus datos se guardan{" "}
        <strong>solo en tu navegador</strong> (almacenamiento local). Si activás
        la sincronización con Google, una copia de tu plan se guarda en tu
        propia cuenta de Google Drive, en un espacio privado de la aplicación.
      </p>
      <p>
        No vendemos tus datos, no mostramos publicidad basada en tu actividad y
        no creamos perfiles comerciales sobre vos.
      </p>

      <h2>2. Datos que podés ingresar</h2>
      <p>
        Al usar la aplicación, podés almacenar localmente o sincronizar
        información como:
      </p>
      <ul>
        <li>Nombres e identificadores de materias.</li>
        <li>
          Año o cuatrimestre, correlativas y requisitos del plan de estudios.
        </li>
        <li>
          Estado de avance (por ejemplo: en curso, regularizada o aprobada).
        </li>
        <li>
          Configuración del plan importada o creada por vos (archivos JSON).
        </li>
      </ul>
      <p>
        Esta información la cargás voluntariamente. No te pedimos nombre legal,
        DNI, dirección ni datos de contacto para usar la app.
      </p>

      <h2>3. Almacenamiento local (navegador)</h2>
      <p>
        Sin conectar Google, el plan y tu progreso se guardan en el
        almacenamiento local del navegador (<code>localStorage</code>) del
        dispositivo que uses. Esos datos no se envían automáticamente a nuestros
        servidores porque la aplicación no opera un backend propio para guardar
        planes.
      </p>
      <p>
        Si borrás datos del navegador, cambiás de dispositivo o desinstalás el
        acceso directo, podés perder la información guardada localmente. Por eso
        se ofrece exportar JSON y, opcionalmente, sincronizar con Google.
      </p>

      <h2>4. Sincronización con Google Drive (opcional)</h2>
      <p>
        Si elegís <strong>Conectar con Google</strong>, la aplicación usa la API
        de Google Drive con tu autorización para leer y escribir un archivo JSON
        con tu plan en la carpeta privada de datos de aplicación de tu cuenta (
        <code>drive.appdata</code>).
      </p>
      <ul>
        <li>
          El archivo se almacena en tu cuenta de Google, no en servidores
          administrados por nosotros.
        </li>
        <li>Solo accedemos al archivo que crea o actualiza esta aplicación.</li>
        <li>
          Podés dejar de sincronizar en cualquier momento desconectando tu
          cuenta desde Configuración.
        </li>
        <li>
          Para revocar el acceso por completo, también podés hacerlo desde la{" "}
          <a
            href="https://myaccount.google.com/permissions"
            target="_blank"
            rel="noopener noreferrer"
          >
            configuración de seguridad de tu cuenta Google
          </a>
          .
        </li>
      </ul>
      <p>
        El uso de los servicios de Google se rige además por la{" "}
        <a
          href="https://policies.google.com/privacy"
          target="_blank"
          rel="noopener noreferrer"
        >
          Política de privacidad de Google
        </a>
        .
      </p>

      <h2>5. Datos técnicos y analítica</h2>
      <p>
        La aplicación no incorpora, en su código principal, sistemas de
        analítica propios (como Google Analytics) ni seguimiento publicitario.
      </p>
      <p>
        Si la aplicación se publica en un servicio de hosting (por ejemplo
        Vercel), ese proveedor puede registrar datos técnicos mínimos de
        conexión (como dirección IP, agente de usuario y registros de acceso al
        sitio) con fines de seguridad y operación de la infraestructura.
        Consultá la política de privacidad del proveedor de hosting que
        corresponda.
      </p>

      <h2>6. Cookies y tecnologías similares</h2>
      <p>
        La aplicación no utiliza cookies propias para publicidad. Google OAuth
        puede emplear cookies o mecanismos similares durante el proceso de
        inicio de sesión, conforme a las políticas de Google.
      </p>

      <h2>7. Compartir información con terceros</h2>
      <p>
        No vendemos ni alquilamos tus datos personales. Podemos compartir
        información únicamente:
      </p>
      <ul>
        <li>
          Con Google, si activás la sincronización, para guardar tu plan en tu
          Drive.
        </li>
        <li>
          Con proveedores de infraestructura estrictamente necesarios para
          servir la aplicación web.
        </li>
        <li>Si la ley aplicable lo exige.</li>
      </ul>

      <h2>8. Conservación</h2>
      <ul>
        <li>
          <strong>Datos locales:</strong> permanecen en tu dispositivo hasta que
          los borres o restablezcas la aplicación.
        </li>
        <li>
          <strong>Datos en Google Drive:</strong> permanecen en tu cuenta hasta
          que los elimines o revoques el acceso de la aplicación.
        </li>
      </ul>

      <h2>9. Seguridad</h2>
      <p>
        Aplicamos buenas prácticas razonables en el desarrollo de la aplicación.
        Ningún sistema es completamente infalible. Te recomendamos exportar
        respaldos periódicos de tu plan y proteger el acceso a tu cuenta de
        Google si usás sincronización.
      </p>

      <h2>10. Menores de edad</h2>
      <p>
        La aplicación puede ser usada por estudiantes de cualquier edad para
        organizar su cursada. No recopilamos intencionalmente datos personales
        identificables de menores. Si sos padre, madre o tutor y creés que se
        cargó información personal de un menor de forma indebida, contactanos.
      </p>

      <h2>11. Tus derechos</h2>
      <p>Según la legislación aplicable, podés tener derecho a:</p>
      <ul>
        <li>
          Acceder a los datos que guardaste (exportando JSON o revisando tu
          Drive).
        </li>
        <li>Rectificar o eliminar tu plan desde la propia aplicación.</li>
        <li>Revocar permisos otorgados a Google.</li>
        <li>
          Solicitar información sobre el tratamiento de datos contactando al
          responsable.
        </li>
      </ul>

      <h2>12. Cambios en esta política</h2>
      <p>
        Podemos actualizar esta política para reflejar cambios en la aplicación
        o requisitos legales. La fecha de la última actualización figura al
        inicio del documento. El uso continuado del servicio después de publicar
        cambios implica la aceptación de la versión vigente.
      </p>

      <h2>13. Contacto</h2>
      <p>
        Para consultas sobre privacidad o ejercicio de derechos, podés
        comunicarte con {DEVELOPER_NAME} a través de{" "}
        <a
          href="https://www.jonasaguilar.com.ar"
          target="_blank"
          rel="noopener noreferrer"
        >
          jonasaguilar.com.ar
        </a>
        .
      </p>
    </LegalDocumentLayout>
  );
}
