import { useState } from "react";
import { ConfirmModal } from "./ConfirmModal";
import { copyTextToClipboardAsync } from "../utils/copyToClipboard";
import { useGoogleSync } from "../state/GoogleSyncContext";

const DONATION_ALIAS = "5.pesos";

function formatLastSynced(date: Date | null): string | null {
  if (!date) {
    return null;
  }

  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

type PendingAction = "demo" | "resetEstados" | "clear" | null;

interface EditorSettingsPanelProps {
  materiaCount: number;
  onExport: () => void;
  onLoadDemo: () => void;
  onResetEstados: () => void;
  onClearAll: () => void;
}

export function EditorSettingsPanel({
  materiaCount,
  onExport,
  onLoadDemo,
  onResetEstados,
  onClearAll,
}: EditorSettingsPanelProps) {
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [exportStatus, setExportStatus] = useState<"idle" | "done" | "error">(
    "idle",
  );
  const [aliasCopyStatus, setAliasCopyStatus] = useState<
    "idle" | "done" | "error"
  >("idle");
  const [cloudActionStatus, setCloudActionStatus] = useState<
    "idle" | "done" | "error"
  >("idle");
  const {
    isConfigured: isGoogleConfigured,
    isConnected: isGoogleConnected,
    isSyncing: isGoogleSyncing,
    lastSyncedAt,
    syncError: googleSyncError,
    connect: connectGoogle,
    disconnect: disconnectGoogle,
    syncNow: syncGoogleNow,
    loadFromCloud: loadGooglePlan,
  } = useGoogleSync();

  const lastSyncedLabel = formatLastSynced(lastSyncedAt);

  const handleExport = async () => {
    try {
      await onExport();
      setExportStatus("done");
      window.setTimeout(() => setExportStatus("idle"), 2000);
    } catch {
      setExportStatus("error");
      window.setTimeout(() => setExportStatus("idle"), 2500);
    }
  };

  const handleCopyAlias = async () => {
    const result = await copyTextToClipboardAsync(DONATION_ALIAS);
    setAliasCopyStatus(result === "copied" ? "done" : "error");
    window.setTimeout(() => setAliasCopyStatus("idle"), 2000);
  };

  const handleConfirm = () => {
    if (pendingAction === "demo") {
      onLoadDemo();
    } else if (pendingAction === "resetEstados") {
      onResetEstados();
    } else if (pendingAction === "clear") {
      onClearAll();
    }
    setPendingAction(null);
  };

  const runCloudAction = async (action: () => Promise<void>) => {
    try {
      await action();
      setCloudActionStatus("done");
      window.setTimeout(() => setCloudActionStatus("idle"), 2000);
    } catch {
      setCloudActionStatus("error");
      window.setTimeout(() => setCloudActionStatus("idle"), 2500);
    }
  };

  return (
    <div className="settings-panel">
      <section className="settings-section">
        <h4>Sincronización con Google</h4>
        {!isGoogleConfigured ? (
          <p className="settings-desc">
            Para guardar tu plan en Google Drive, configurá la variable{" "}
            <code className="settings-inline-code">VITE_GOOGLE_CLIENT_ID</code>{" "}
            en un archivo <code className="settings-inline-code">.env</code> con
            el Client ID de OAuth de Google Cloud.
          </p>
        ) : isGoogleConnected ? (
          <>
            <p className="settings-desc">
              Tu plan se guarda automáticamente en tu cuenta de Google (carpeta
              privada de la app).
              {lastSyncedLabel
                ? ` Última sincronización: ${lastSyncedLabel}.`
                : ""}
            </p>
            {googleSyncError && (
              <p className="settings-status settings-status-error">
                {googleSyncError}
              </p>
            )}
            {isGoogleSyncing && (
              <p className="settings-status">Sincronizando…</p>
            )}
            {cloudActionStatus === "done" && (
              <p className="settings-status settings-status-success">
                Acción completada.
              </p>
            )}
            <div className="settings-action-row">
              <button
                type="button"
                className="secondary-button"
                disabled={isGoogleSyncing}
                onClick={() => void runCloudAction(syncGoogleNow)}
              >
                Sincronizar ahora
              </button>
              <button
                type="button"
                className="secondary-button"
                disabled={isGoogleSyncing}
                onClick={() => void runCloudAction(loadGooglePlan)}
              >
                Cargar desde Google
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={disconnectGoogle}
              >
                Desconectar
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="settings-desc">
              Conectá tu cuenta de Google para respaldar el plan y usarlo en
              otro dispositivo. Si ya tenés un plan en la nube, se cargará al
              conectar; si no, se subirá el plan local.
            </p>
            {googleSyncError && (
              <p className="settings-status settings-status-error">
                {googleSyncError}
              </p>
            )}
            <button
              type="button"
              className="secondary-button"
              onClick={connectGoogle}
            >
              Conectar con Google
            </button>
          </>
        )}
      </section>

      <section className="settings-section">
        <h4>Exportar</h4>
        <p className="settings-desc">
          Copiá o descargá tu plan ({materiaCount} materias) para usarlo en otro
          dispositivo: exportalo acá e importalo en el otro.
        </p>
        <button
          type="button"
          className="secondary-button"
          onClick={handleExport}
        >
          {exportStatus === "done"
            ? "JSON exportado"
            : exportStatus === "error"
              ? "No se pudo exportar"
              : "Exportar JSON"}
        </button>
      </section>

      <section className="settings-section">
        <h4>Plan de demo</h4>
        <p className="settings-desc">
          Carga el plan de Sistemas 2023 de la UTN incluido por defecto. Se
          reemplaza tu plan actual y se perderá el progreso guardado.
        </p>
        <button
          type="button"
          className="secondary-button"
          onClick={() => setPendingAction("demo")}
        >
          Utilizar plan de demo
        </button>
      </section>

      <section className="settings-section">
        <h4>Restablecer progreso</h4>
        <p className="settings-desc">
          Deja todas las materias sin marcar (ni cursando, ni regularizada ni
          aprobada). El plan y las correlativas no se modifican.
        </p>
        <button
          type="button"
          className="secondary-button"
          onClick={() => setPendingAction("resetEstados")}
          disabled={materiaCount === 0}
        >
          Eliminar progreso de las materias
        </button>
      </section>

      <section className="settings-section settings-section-danger">
        <h4>Eliminar todo</h4>
        <p className="settings-desc">
          Borra todas las materias del plan. El mapa quedará vacío hasta que
          importes o crees materias nuevas.
        </p>
        <button
          type="button"
          className="primary-button danger-button"
          onClick={() => setPendingAction("clear")}
          disabled={materiaCount === 0}
        >
          Eliminar todas las materias
        </button>
      </section>

      {/* <section className="settings-section settings-section-muted">
        <h4>Sobre esta página</h4>
        <p className="settings-desc">
          Esta herramienta fue hecha sin ánimo de lucro. Si te resulta útil y querés colaborar, podés
          hacerlo con una donación voluntaria.
        </p>
        <div className="settings-alias-row">
          <span className="settings-desc settings-desc-inline">
            Alias: <strong className="settings-alias">{DONATION_ALIAS}</strong>
          </span>
          <button type="button" className="secondary-button" onClick={handleCopyAlias}>
            {aliasCopyStatus === 'done'
              ? 'Alias copiado'
              : aliasCopyStatus === 'error'
                ? 'No se pudo copiar'
                : 'Copiar alias'}
          </button>
        </div>
      </section> */}
      <ConfirmModal
        open={pendingAction === "demo"}
        title="¿Utilizar el plan de demo?"
        message="Se cargará el plan de Sistemas 2023 de la UTN y se reemplazará tu plan actual. Esta acción no se puede deshacer."
        confirmLabel="Utilizar demo"
        danger
        onConfirm={handleConfirm}
        onCancel={() => setPendingAction(null)}
      />

      <ConfirmModal
        open={pendingAction === "resetEstados"}
        title="¿Restablecer estados iniciales?"
        message="Se quitarán las marcas de cursando, regularizada y aprobada. Las materias y sus correlativas no cambian."
        confirmLabel="Restablecer estados"
        danger
        onConfirm={handleConfirm}
        onCancel={() => setPendingAction(null)}
      />

      <ConfirmModal
        open={pendingAction === "clear"}
        title="¿Eliminar todas las materias?"
        message="Se borrarán todas las materias y su progreso. Esta acción no se puede deshacer."
        confirmLabel="Eliminar todo"
        danger
        onConfirm={handleConfirm}
        onCancel={() => setPendingAction(null)}
      />
    </div>
  );
}
