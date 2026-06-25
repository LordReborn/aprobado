import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { MATERIAS_IMPORT_PROMPT } from '../data/materiasImportPrompt';
import { validateMateriasJson } from '../domain/validation';
import { paths } from '../routes/paths';
import {
  copyFromTextarea,
  copyResultMessage,
  type CopyResult,
} from '../utils/copyToClipboard';

interface ImportMateriasPanelProps {
  onClose: () => void;
  onImport: (json: string) => void;
}

export function ImportMateriasPanel({ onClose, onImport }: ImportMateriasPanelProps) {
  const [jsonText, setJsonText] = useState('');
  const [copyStatus, setCopyStatus] = useState<'idle' | CopyResult>('idle');
  const promptRef = useRef<HTMLTextAreaElement>(null);

  const validation = useMemo(
    () => (jsonText.trim() ? validateMateriasJson(jsonText) : null),
    [jsonText],
  );

  const handleCopyPrompt = () => {
    const textarea = promptRef.current;
    if (!textarea) return;

    void copyFromTextarea(textarea).then((result) => {
      setCopyStatus(result);
      window.setTimeout(() => setCopyStatus('idle'), result === 'selected' ? 4000 : 2500);
    });
  };

  const handleSelectPrompt = (event: React.SyntheticEvent<HTMLTextAreaElement>) => {
    event.currentTarget.select();
  };

  const handleImport = () => {
    if (!validation?.ok) return;

    const confirmed = window.confirm(
      `¿Importar ${validation.materiaCount} materias? Esto reemplazará el plan actual.`,
    );
    if (!confirmed) return;

    onImport(jsonText);
    onClose();
  };

  const copyButtonLabel =
    copyStatus === 'idle' ? 'Copiar prompt para IA' : copyResultMessage(copyStatus);

  return (
    <div className="import-panel">
      <div className="alert alert-info">
        Tu plan queda guardado solo en este dispositivo. Si querés usarlo en otro celular o
        computadora,{' '}
        <Link to={paths.editorSettings} className="alert-link">
          exportalo desde Configuración
        </Link>{' '}
        y volvé a importarlo allí.
      </div>

      <section className="import-step">
        <h4>1. Generá el JSON con una IA</h4>
        <p className="import-step-desc">
          Copiá el prompt, pegalo en ChatGPT/Claude/Gemini junto con tu plan de estudios (PDF o
          tabla), y pedile que devuelva solo el array JSON.
        </p>
        <textarea
          ref={promptRef}
          className="import-textarea import-prompt-textarea"
          value={MATERIAS_IMPORT_PROMPT}
          rows={10}
          spellCheck={false}
          readOnly
          aria-label="Prompt para generar JSON con IA"
          onFocus={handleSelectPrompt}
          onClick={handleSelectPrompt}
        />
        <div className="import-prompt-actions">
          <button type="button" className="primary-button" onClick={handleCopyPrompt}>
            {copyButtonLabel}
          </button>
          {copyStatus === 'selected' && (
            <p className="import-step-desc import-prompt-hint">
              En Safari: mantené pulsado el texto de arriba y elegí Copiar.
            </p>
          )}
        </div>
      </section>

      <section className="import-step">
        <h4>2. Pegá el JSON generado</h4>
        <textarea
          className="import-textarea"
          value={jsonText}
          onChange={(e) => setJsonText(e.target.value)}
          placeholder='[{"id":"1","nombre":"...","anio":1,"cursadas":[],"aprobadas":[],...}]'
          rows={12}
          spellCheck={false}
        />
      </section>

      {validation && (
        <section className="import-step">
          <h4>3. Validación</h4>
          {validation.ok ? (
            <div className="alert alert-success">
              JSON válido: {validation.materiaCount} materias
              {validation.grupoCount > 0 ? `, ${validation.grupoCount} grupos de elección` : ''} listas para
              importar.
            </div>
          ) : (
            <div className="alert alert-error">
              <strong>Se encontraron {validation.errors.length} error(es):</strong>
              <ul className="import-error-list">
                {validation.errors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      <div className="import-panel-actions">
        <button
          type="button"
          className="primary-button"
          disabled={!validation?.ok}
          onClick={handleImport}
        >
          Importar materias
        </button>
        <button type="button" className="secondary-button" onClick={onClose}>
          Cancelar
        </button>
      </div>
    </div>
  );
}
