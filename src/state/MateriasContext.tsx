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
import type { EstadoUsuario, GrupoEleccion, Materia, PlanDataset } from '../domain/types';
import { isOptativa } from '../domain/materia';
import { computeCalculatedStates } from '../domain/rules';
import { parseMateriasJson, validateDataset } from '../domain/validation';
import { loadPlanFromStorage, savePlanToStorage } from '../storage/localStorageRepository';
import {
  DEFAULT_DEMO_PLAN_ID,
  getDemoPlan,
  type DemoPlanId,
} from '../data/demoPlans/catalog';

interface MateriasContextValue {
  materias: Materia[];
  gruposEleccion: GrupoEleccion[];
  lastError: string | null;
  setError: (message: string | null) => void;
  setEstadoUsuario: (id: string, estado: EstadoUsuario) => void;
  setOptativaActiva: (id: string, activa: boolean) => void;
  replaceAllMaterias: (materias: Materia[]) => void;
  replacePlan: (plan: PlanDataset) => void;
  resetToDemo: (planId?: DemoPlanId) => void;
  resetEstadosIniciales: () => void;
  clearAllMaterias: () => void;
  importFromJson: (json: string) => void;
}

const MateriasContext = createContext<MateriasContextValue | undefined>(undefined);

const SAVE_DEBOUNCE_MS = 300;

function withCalculatedStates(plan: PlanDataset): PlanDataset {
  return {
    ...plan,
    materias: computeCalculatedStates(plan.materias, plan.gruposEleccion ?? []),
  };
}

export function MateriasProvider({ children }: { children: ReactNode }) {
  const [plan, setPlan] = useState<PlanDataset>({ materias: [], gruposEleccion: [] });
  const [lastError, setLastError] = useState<string | null>(null);
  const saveTimeoutRef = useRef<number | null>(null);
  const isHydratedRef = useRef(false);

  const materias = plan.materias;
  const gruposEleccion = plan.gruposEleccion ?? [];

  useEffect(() => {
    const stored = loadPlanFromStorage();

    if (stored !== null) {
      if (stored.materias.length === 0) {
        setPlan({ materias: [], gruposEleccion: stored.gruposEleccion ?? [] });
        isHydratedRef.current = true;
        return;
      }

      const validation = validateDataset(stored);

      if (validation.ok) {
        setPlan(withCalculatedStates(stored));
        isHydratedRef.current = true;
        return;
      }

      setLastError(validation.message ?? 'Los datos guardados eran inválidos. Se reinició el plan.');
      setPlan({ materias: [], gruposEleccion: [] });
      isHydratedRef.current = true;
      return;
    }

    setPlan({ materias: [], gruposEleccion: [] });
    isHydratedRef.current = true;
  }, []);

  useEffect(() => {
    if (!isHydratedRef.current) return;

    if (saveTimeoutRef.current !== null) {
      window.clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = window.setTimeout(() => {
      savePlanToStorage(plan);
    }, SAVE_DEBOUNCE_MS);

    return () => {
      if (saveTimeoutRef.current !== null) {
        window.clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [plan]);

  const setError = useCallback((message: string | null) => {
    setLastError(message);
  }, []);

  const replacePlan = useCallback((nextPlan: PlanDataset) => {
    const validation = validateDataset(nextPlan);

    if (!validation.ok) {
      setLastError(validation.message ?? 'Dataset inválido.');
      return;
    }

    setLastError(null);
    setPlan(withCalculatedStates(nextPlan));
  }, []);

  const replaceAllMaterias = useCallback(
    (nextMaterias: Materia[]) => {
      replacePlan({ materias: nextMaterias, gruposEleccion });
    },
    [gruposEleccion, replacePlan],
  );

  const setEstadoUsuario = useCallback((id: string, estado: EstadoUsuario) => {
    setPlan((prev) => {
      const existing = prev.materias.find((m) => m.id === id);
      if (!existing) return prev;

      if (existing.estadoCalculado === 'BLOQUEADA' && estado !== null) {
        setLastError('No se puede cambiar el estado de una materia BLOQUEADA.');
        return prev;
      }

      const nextMaterias = prev.materias.map((m) =>
        m.id === id
          ? {
              ...m,
              estadoUsuario: estado,
            }
          : m,
      );

      return withCalculatedStates({ ...prev, materias: nextMaterias });
    });
  }, []);

  const setOptativaActiva = useCallback((id: string, activa: boolean) => {
    setPlan((prev) => {
      const target = prev.materias.find((m) => m.id === id);
      if (!target || !isOptativa(target)) return prev;

      const nextMaterias = prev.materias.map((m) => {
        if (m.id === id) {
          return {
            ...m,
            activa,
            estadoUsuario: activa ? m.estadoUsuario : null,
          };
        }

        if (
          activa &&
          target.alternativaGrupoId &&
          m.alternativaGrupoId === target.alternativaGrupoId
        ) {
          return { ...m, activa: false, estadoUsuario: null };
        }

        return m;
      });

      setLastError(null);
      return withCalculatedStates({ ...prev, materias: nextMaterias });
    });
  }, []);

  const resetToDemo = useCallback((planId: DemoPlanId = DEFAULT_DEMO_PLAN_ID) => {
    try {
      setLastError(null);
      setPlan(getDemoPlan(planId));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo cargar el plan de demo.';
      setLastError(message);
    }
  }, []);

  const resetEstadosIniciales = useCallback(() => {
    setPlan((prev) => {
      const nextMaterias = prev.materias.map((m) => ({
        ...m,
        estadoUsuario: null,
        activa: isOptativa(m) ? false : true,
      }));

      setLastError(null);
      return withCalculatedStates({ ...prev, materias: nextMaterias });
    });
  }, []);

  const clearAllMaterias = useCallback(() => {
    setLastError(null);
    setPlan({ materias: [], gruposEleccion: [] });
  }, []);

  const importFromJson = useCallback((json: string) => {
    try {
      const imported = parseMateriasJson(json);
      setLastError(null);
      setPlan(imported);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo importar el JSON.';
      setLastError(message);
    }
  }, []);

  const value = useMemo<MateriasContextValue>(
    () => ({
      materias,
      gruposEleccion,
      lastError,
      setError,
      setEstadoUsuario,
      setOptativaActiva,
      replaceAllMaterias,
      replacePlan,
      resetToDemo,
      resetEstadosIniciales,
      clearAllMaterias,
      importFromJson,
    }),
    [
      clearAllMaterias,
      gruposEleccion,
      importFromJson,
      lastError,
      materias,
      replaceAllMaterias,
      replacePlan,
      resetEstadosIniciales,
      resetToDemo,
      setError,
      setEstadoUsuario,
      setOptativaActiva,
    ],
  );

  return <MateriasContext.Provider value={value}>{children}</MateriasContext.Provider>;
}

export function useMaterias(): MateriasContextValue {
  const ctx = useContext(MateriasContext);
  if (!ctx) {
    throw new Error('useMaterias debe usarse dentro de MateriasProvider.');
  }
  return ctx;
}
