import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { GoogleOAuthProvider, useGoogleLogin } from '@react-oauth/google';
import { GOOGLE_DRIVE_SCOPE, getGoogleClientId, isGoogleDriveConfigured } from '../config/google';
import type { PlanDataset } from '../domain/types';
import {
  GoogleDriveError,
  loadPlanFromDrive,
  loadStoredDriveFileId,
  savePlanToDrive,
} from '../storage/googleDriveRepository';
import { useMaterias } from './MateriasContext';

const SYNC_DEBOUNCE_MS = 1500;

interface GoogleSyncContextValue {
  isConfigured: boolean;
  isConnected: boolean;
  isSyncing: boolean;
  lastSyncedAt: Date | null;
  syncError: string | null;
  connect: () => void;
  disconnect: () => void;
  syncNow: () => Promise<void>;
  loadFromCloud: () => Promise<void>;
}

const disabledGoogleSyncValue: GoogleSyncContextValue = {
  isConfigured: false,
  isConnected: false,
  isSyncing: false,
  lastSyncedAt: null,
  syncError: null,
  connect: () => {},
  disconnect: () => {},
  syncNow: async () => {},
  loadFromCloud: async () => {},
};

const GoogleSyncContext = createContext<GoogleSyncContextValue>(disabledGoogleSyncValue);

function formatSyncError(error: unknown): string {
  if (error instanceof GoogleDriveError) {
    if (error.status === 401) {
      return 'La sesión con Google expiró. Volvé a conectar tu cuenta.';
    }

    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'No se pudo sincronizar con Google Drive.';
}

function GoogleSyncProviderConnected({ children }: { children: ReactNode }) {
  const { materias, gruposEleccion, replacePlan } = useMaterias();
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [driveFileId, setDriveFileId] = useState<string | null>(() => loadStoredDriveFileId());
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const syncTimeoutRef = useRef<number | null>(null);
  const skipNextAutoSyncRef = useRef(false);
  const hasCompletedInitialSyncRef = useRef(false);
  const isConnected = accessToken !== null;

  const plan = useMemo<PlanDataset>(
    () => ({ materias, gruposEleccion }),
    [gruposEleccion, materias],
  );

  const persistPlan = useCallback(
    async (token: string, nextPlan: PlanDataset, fileId: string | null) => {
      const savedFileId = await savePlanToDrive(token, nextPlan, fileId);
      setDriveFileId(savedFileId);
      setLastSyncedAt(new Date());
      setSyncError(null);
    },
    [],
  );

  const runWithSyncState = useCallback(async (task: () => Promise<void>) => {
    setIsSyncing(true);
    setSyncError(null);

    try {
      await task();
    } catch (error) {
      setSyncError(formatSyncError(error));
      if (error instanceof GoogleDriveError && error.status === 401) {
        setAccessToken(null);
      }
    } finally {
      setIsSyncing(false);
    }
  }, []);

  const login = useGoogleLogin({
    scope: GOOGLE_DRIVE_SCOPE,
    onSuccess: (response) => {
      setAccessToken(response.access_token);
      setSyncError(null);
    },
    onError: () => {
      setSyncError('No se pudo conectar con Google.');
    },
  });

  const connect = useCallback(() => {
    login();
  }, [login]);

  const disconnect = useCallback(() => {
    setAccessToken(null);
    setSyncError(null);
    hasCompletedInitialSyncRef.current = false;
  }, []);

  const syncNow = useCallback(async () => {
    if (!accessToken) {
      setSyncError('Conectá tu cuenta de Google para sincronizar.');
      return;
    }

    await runWithSyncState(async () => {
      await persistPlan(accessToken, plan, driveFileId);
    });
  }, [accessToken, driveFileId, persistPlan, plan, runWithSyncState]);

  const loadFromCloud = useCallback(async () => {
    if (!accessToken) {
      setSyncError('Conectá tu cuenta de Google para cargar desde la nube.');
      return;
    }

    await runWithSyncState(async () => {
      const cloudPlan = await loadPlanFromDrive(accessToken);
      if (!cloudPlan) {
        setSyncError('No hay un plan guardado en tu cuenta de Google.');
        return;
      }

      skipNextAutoSyncRef.current = true;
      replacePlan(cloudPlan);
      const fileId = loadStoredDriveFileId();
      setDriveFileId(fileId);
      setLastSyncedAt(new Date());
    });
  }, [accessToken, replacePlan, runWithSyncState]);

  useEffect(() => {
    if (!accessToken) {
      hasCompletedInitialSyncRef.current = false;
      return;
    }

    let cancelled = false;

    void runWithSyncState(async () => {
      const cloudPlan = await loadPlanFromDrive(accessToken);

      if (cancelled) {
        return;
      }

      if (cloudPlan) {
        skipNextAutoSyncRef.current = true;
        replacePlan(cloudPlan);
        setDriveFileId(loadStoredDriveFileId());
      } else {
        await persistPlan(accessToken, plan, driveFileId);
      }

      hasCompletedInitialSyncRef.current = true;
      setLastSyncedAt(new Date());
    });

    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken || !hasCompletedInitialSyncRef.current) {
      return;
    }

    if (skipNextAutoSyncRef.current) {
      skipNextAutoSyncRef.current = false;
      return;
    }

    if (syncTimeoutRef.current !== null) {
      window.clearTimeout(syncTimeoutRef.current);
    }

    syncTimeoutRef.current = window.setTimeout(() => {
      void runWithSyncState(async () => {
        await persistPlan(accessToken, plan, driveFileId);
      });
    }, SYNC_DEBOUNCE_MS);

    return () => {
      if (syncTimeoutRef.current !== null) {
        window.clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [accessToken, driveFileId, persistPlan, plan, runWithSyncState]);

  const value = useMemo<GoogleSyncContextValue>(
    () => ({
      isConfigured: true,
      isConnected,
      isSyncing,
      lastSyncedAt,
      syncError,
      connect,
      disconnect,
      syncNow,
      loadFromCloud,
    }),
    [
      connect,
      disconnect,
      isConnected,
      isSyncing,
      lastSyncedAt,
      loadFromCloud,
      syncError,
      syncNow,
    ],
  );

  return <GoogleSyncContext.Provider value={value}>{children}</GoogleSyncContext.Provider>;
}

export function GoogleSyncProvider({ children }: { children: ReactNode }) {
  const clientId = getGoogleClientId();

  if (!isGoogleDriveConfigured() || !clientId) {
    return (
      <GoogleSyncContext.Provider value={disabledGoogleSyncValue}>
        {children}
      </GoogleSyncContext.Provider>
    );
  }

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <GoogleSyncProviderConnected>{children}</GoogleSyncProviderConnected>
    </GoogleOAuthProvider>
  );
}

export function useGoogleSync(): GoogleSyncContextValue {
  return useContext(GoogleSyncContext);
}
