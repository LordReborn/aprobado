import { LegalDocumentLayout } from "../components/LegalDocumentLayout";
import {
  APP_NAME,
  APP_SHORT_NAME,
  DEVELOPER_NAME,
  getSiteOrigin,
} from "../content/site";

export function TermsOfServicePage() {
  const siteOrigin = getSiteOrigin();

  return (
    <LegalDocumentLayout title="Términos del servicio">
      <p>
        Estos términos regulan el uso de {APP_NAME} ({APP_SHORT_NAME}),
        disponible en <a href={siteOrigin}>{siteOrigin}</a>. Al acceder o
        utilizar la aplicación, aceptás estos términos. Si no estás de acuerdo,
        no uses el servicio.
      </p>

      <h2>1. Descripción del servicio</h2>
      <p>
        {APP_NAME} es una herramienta web gratuita, sin fines de lucro, para
        visualizar y gestionar un plan de materias con correlativas. Incluye
        funciones como mapa de correlativas, editor de materias, exportación e
        importación de JSON y, de forma opcional, sincronización con Google
        Drive.
      </p>

      <h2>2. Naturaleza gratuita y donaciones</h2>
      <p>
        El servicio se ofrece sin cargo. Podés colaborar voluntariamente
        mediante donaciones indicadas en la aplicación. Las donaciones no
        otorgan derechos adicionales sobre el software ni garantizan soporte
        personalizado, tiempos de respuesta ni funcionalidades exclusivas.
      </p>

      <h2>3. Elegibilidad y cuenta Google</h2>
      <p>
        Podés usar la aplicación sin crear una cuenta en nuestros sistemas. Si
        usás la sincronización con Google, necesitás una cuenta de Google válida
        y aceptás cumplir también los términos y políticas de Google aplicables
        a OAuth y Google Drive.
      </p>

      <h2>4. Uso permitido</h2>
      <p>
        Te comprometés a usar la aplicación de manera lícita y razonable. En
        particular, no debés:
      </p>
      <ul>
        <li>Utilizar el servicio para actividades ilegales o fraudulentas.</li>
        <li>
          Intentar acceder sin autorización a sistemas, cuentas o datos de
          terceros.
        </li>
        <li>
          Interferir con el funcionamiento de la aplicación o sobrecargar la
          infraestructura.
        </li>
        <li>
          Realizar ingeniería inversa con fines maliciosos o redistribuir el
          servicio como propio.
        </li>
      </ul>

      <h2>5. Tu contenido y responsabilidad</h2>
      <p>
        Vos sos responsable de la exactitud del plan de estudios, correlativas y
        estados de avance que cargues. La aplicación es una ayuda organizativa;{" "}
        <strong>no reemplaza</strong> información oficial de tu facultad,
        secretaría académica, reglamentos ni asesoramiento profesional.
      </p>
      <p>
        Verificá siempre los requisitos oficiales de tu carrera antes de tomar
        decisiones académicas basadas en el mapa generado por la app.
      </p>

      <h2>6. Propiedad intelectual</h2>
      <p>
        El software, diseño e identidad de {APP_NAME} pertenecen a{" "}
        {DEVELOPER_NAME}, salvo componentes de terceros con sus propias
        licencias (por ejemplo bibliotecas open source). Se te concede una
        licencia limitada, no exclusiva y revocable para usar la aplicación
        conforme a estos términos.
      </p>
      <p>
        Los datos del plan que ingreses siguen siendo tuyos. No reclamamos
        propiedad sobre el contenido académico que cargues.
      </p>

      <h2>7. Disponibilidad y cambios</h2>
      <p>
        Procuramos mantener la aplicación disponible, pero no garantizamos
        funcionamiento ininterrumpido ni libre de errores. Podemos modificar,
        suspender o discontinuar funciones, total o parcialmente, sin previo
        aviso.
      </p>
      <p>
        También podemos actualizar estos términos. La fecha de la última versión
        se indica al inicio del documento. El uso continuado después de un
        cambio implica aceptación de los términos actualizados.
      </p>

      <h2>8. Servicios de terceros</h2>
      <p>
        La sincronización con Google Drive depende de servicios de Google fuera
        de nuestro control. No somos responsables por interrupciones, cambios de
        API, límites de cuota o políticas de Google que afecten esa
        funcionalidad.
      </p>

      <h2>9. Limitación de responsabilidad</h2>
      <p>
        En la máxima medida permitida por la ley aplicable, {DEVELOPER_NAME} no
        será responsable por daños indirectos, incidentales, especiales o
        consecuentes derivados del uso o imposibilidad de uso del servicio,
        incluyendo —sin limitarse a— pérdida de datos, reprobaciones, decisiones
        académicas incorrectas o perjuicios económicos.
      </p>
      <p>
        La aplicación se proporciona <strong>“tal cual”</strong> y{" "}
        <strong>“según disponibilidad”</strong>, sin garantías expresas o
        implícitas de idoneidad para un propósito particular.
      </p>

      <h2>10. Indemnidad</h2>
      <p>
        Aceptás mantener indemne a {DEVELOPER_NAME} frente a reclamos de
        terceros originados en un uso indebido del servicio o en el
        incumplimiento de estos términos, en la medida permitida por la ley.
      </p>

      <h2>11. Terminación</h2>
      <p>
        Podés dejar de usar la aplicación en cualquier momento. Podemos
        restringir el acceso si detectamos un uso que viole estos términos o
        ponga en riesgo la operación del servicio.
      </p>

      <h2>12. Ley aplicable</h2>
      <p>
        Estos términos se interpretan conforme a las leyes de la República
        Argentina, sin perjuicio de las normas imperativas de protección al
        consumidor o de datos que pudieran corresponder según tu jurisdicción.
      </p>

      <h2>13. Contacto</h2>
      <p>
        Para consultas sobre estos términos, contactá a {DEVELOPER_NAME} en{" "}
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
