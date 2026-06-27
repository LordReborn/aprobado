import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import {
  APP_NAME,
  DEVELOPER_NAME,
  DEVELOPER_URL,
  LEGAL_LAST_UPDATED,
} from "../content/site";
import { paths } from "../routes/paths";

interface LegalDocumentLayoutProps {
  title: string;
  children: ReactNode;
}

export function LegalDocumentLayout({
  title,
  children,
}: LegalDocumentLayoutProps) {
  return (
    <div className="page legal-page">
      <div className="legal-page-inner">
        <nav className="legal-nav">
          <Link to={paths.map} className="legal-back-link">
            ← Volver a {APP_NAME}
          </Link>
        </nav>

        <header className="legal-header">
          <h1>{title}</h1>
          <p className="legal-meta">
            Última actualización: {LEGAL_LAST_UPDATED}. Desarrollado por{" "}
            <a href={DEVELOPER_URL} target="_blank" rel="noopener noreferrer">
              {DEVELOPER_NAME}
            </a>
            .
          </p>
        </header>

        <article className="legal-content">{children}</article>

        <footer className="legal-footer">
          <Link to={paths.privacy}>Política de privacidad</Link>
          <span aria-hidden="true">·</span>
          <Link to={paths.terms}>Términos del servicio</Link>
        </footer>
      </div>
    </div>
  );
}
