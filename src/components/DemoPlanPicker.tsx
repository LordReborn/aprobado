import { useEffect, useId, useMemo, useRef, useState } from 'react';
import {
  DEFAULT_DEMO_PLAN_ID,
  DEMO_PLAN_CATALOG,
  getDemoPlanEntry,
  isDemoPlanAvailable,
  type DemoPlanCatalogEntry,
  type DemoPlanId,
} from '../data/demoPlans/catalog';

interface DemoPlanPickerProps {
  value: DemoPlanId;
  onChange: (id: DemoPlanId) => void;
}

function normalizeSearch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

function matchesPlan(plan: DemoPlanCatalogEntry, query: string): boolean {
  if (!query.trim()) {
    return true;
  }

  const haystack = normalizeSearch(`${plan.label} ${plan.university} ${plan.career} ${plan.searchText}`);
  return normalizeSearch(query)
    .split(/\s+/)
    .filter(Boolean)
    .every((token) => haystack.includes(token));
}

export function DemoPlanPicker({ value, onChange }: DemoPlanPickerProps) {
  const listboxId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const selected = getDemoPlanEntry(value);

  const filteredPlans = useMemo(
    () => (query.trim() ? DEMO_PLAN_CATALOG.filter((plan) => matchesPlan(plan, query)) : DEMO_PLAN_CATALOG),
    [query],
  );

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  const handleSelect = (plan: DemoPlanCatalogEntry) => {
    onChange(plan.id);
    setOpen(false);
    setQuery('');
  };

  return (
    <div className="demo-plan-picker" ref={containerRef}>
      <label className="demo-plan-picker-label" htmlFor={`${listboxId}-input`}>
        Carrera de demo
      </label>
      <div className="demo-plan-picker-control">
        <input
          id={`${listboxId}-input`}
          type="search"
          className="demo-plan-picker-input"
          value={open ? query : selected.label}
          placeholder="Buscar carrera UTN…"
          autoComplete="off"
          role="combobox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-autocomplete="list"
          onFocus={() => {
            setOpen(true);
            setQuery('');
          }}
          onChange={(event) => {
            setOpen(true);
            setQuery(event.target.value);
          }}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              setOpen(false);
              setQuery('');
            }
          }}
        />
        {open && (
          <ul id={listboxId} className="demo-plan-picker-list" role="listbox">
            {filteredPlans.length === 0 ? (
              <li className="demo-plan-picker-empty">No hay carreras que coincidan.</li>
            ) : (
              filteredPlans.map((plan) => {
                const available = isDemoPlanAvailable(plan.id);
                const isSelected = plan.id === value;

                return (
                  <li key={plan.id} role="presentation">
                    <button
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      disabled={!available}
                      className={
                        isSelected
                          ? 'demo-plan-picker-option demo-plan-picker-option-selected'
                          : 'demo-plan-picker-option'
                      }
                      onClick={() => handleSelect(plan)}
                    >
                      <span className="demo-plan-picker-option-label">{plan.label}</span>
                      {!available && (
                        <span className="demo-plan-picker-option-note">Sin materias cargadas</span>
                      )}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        )}
      </div>
    </div>
  );
}

export { DEFAULT_DEMO_PLAN_ID };
