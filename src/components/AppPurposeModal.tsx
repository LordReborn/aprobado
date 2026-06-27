import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { APP_DESCRIPTION, APP_NAME, APP_TAGLINE } from '../content/site';
import { paths } from '../routes/paths';

const DISMISS_STORAGE_KEY = 'aprobado_purpose_modal_dismissed';

function isDismissed(): boolean {
  if (typeof window === 'undefined') {
    return true;
  }

  try {
    return window.localStorage.getItem(DISMISS_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

function persistDismissed(): void {
  try {
    window.localStorage.setItem(DISMISS_STORAGE_KEY, '1');
  } catch {
    // Ignorar errores de persistencia
  }
}

interface AppPurposeModalProps {
  open: boolean;
  onClose: () => void;
}

export function AppPurposeModal({ open, onClose }: AppPurposeModalProps) {
  if (!open) {
    return null;
  }

  const handleClose = () => {
    persistDismissed();
    onClose();
  };

  return (
    <div className="modal-overlay" role="presentation" onClick={handleClose}>
      <div
        className="modal-dialog purpose-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="purpose-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h3 id="purpose-modal-title" className="modal-title">
          {APP_NAME}
        </h3>
        <p className="purpose-modal-tagline">{APP_TAGLINE}</p>
        <p className="modal-message">{APP_DESCRIPTION}</p>
        <ul className="purpose-modal-list">
          <li>Mapa interactivo de materias y correlativas.</li>
          <li>Seguimiento de avance académico.</li>
          <li>Importación, edición y respaldo opcional en Google Drive.</li>
        </ul>
        <p className="purpose-modal-more">
          <Link to={paths.about} onClick={handleClose}>
            Más información sobre la app
          </Link>
        </p>
        <div className="modal-actions purpose-modal-actions">
          <button type="button" className="primary-button" onClick={handleClose}>
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}

export function AppPurposeModalGate() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(!isDismissed());
  }, []);

  return <AppPurposeModal open={open} onClose={() => setOpen(false)} />;
}

export function reopenPurposeModal(): void {
  try {
    window.localStorage.removeItem(DISMISS_STORAGE_KEY);
  } catch {
    // Ignorar errores de persistencia
  }
}
