import { Link } from 'react-router-dom';
import { APP_DESCRIPTION, APP_NAME, DEVELOPER_NAME, DEVELOPER_URL } from '../content/site';
import { paths } from '../routes/paths';

export function AppSiteFooter() {
  return (
    <footer className="app-signature">
      <p className="app-signature-purpose">
        <strong>{APP_NAME}</strong> — {APP_DESCRIPTION}
      </p>
      <p className="app-signature-links">
        Desarrollado por{' '}
        <a href={DEVELOPER_URL} target="_blank" rel="noopener noreferrer">
          {DEVELOPER_NAME}
        </a>
        {' · '}
        <Link to={paths.about}>Acerca de</Link>
        {' · '}
        <Link to={paths.privacy}>Privacidad</Link>
        {' · '}
        <Link to={paths.terms}>Términos</Link>
      </p>
    </footer>
  );
}
