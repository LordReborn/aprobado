import { useMemo, useState } from 'react';
import type { Materia, TipoMateria } from '../domain/types';

interface EditorSubjectFormProps {
  materias: Materia[];
  initial?: Materia | null;
  onCancel: () => void;
  onSave: (materia: Materia) => void;
}

export function EditorSubjectForm({ materias, initial, onCancel, onSave }: EditorSubjectFormProps) {
  const [nombre, setNombre] = useState(initial?.nombre ?? '');
  const [anio, setAnio] = useState<number>(initial?.anio ?? 1);
  const [tipo, setTipo] = useState<TipoMateria>(initial?.tipo ?? 'obligatoria');
  const [activa, setActiva] = useState(initial?.activa ?? (initial?.tipo === 'optativa' ? false : true));
  const [creditos, setCreditos] = useState<string>(
    initial?.creditos !== undefined ? String(initial.creditos) : '',
  );
  const [requiereCreditosAprobados, setRequiereCreditosAprobados] = useState<string>(
    initial?.requiereCreditosAprobados !== undefined ? String(initial.requiereCreditosAprobados) : '',
  );
  const [alternativaGrupoId, setAlternativaGrupoId] = useState(initial?.alternativaGrupoId ?? '');
  const [cursadas, setCursadas] = useState<string[]>(initial?.cursadas ?? []);
  const [aprobadas, setAprobadas] = useState<string[]>(initial?.aprobadas ?? []);

  const isEditing = Boolean(initial);

  const selectableMaterias = useMemo(
    () => materias.filter((m) => (initial ? m.id !== initial.id : true)),
    [initial, materias],
  );

  const handleTipoChange = (nextTipo: TipoMateria) => {
    setTipo(nextTipo);
    if (nextTipo === 'optativa') {
      setActiva(false);
    } else {
      setActiva(true);
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    const trimmedNombre = nombre.trim();
    if (!trimmedNombre) return;

    const base: Materia =
      initial ??
      ({
        id: crypto.randomUUID ? crypto.randomUUID() : `materia-${Date.now().toString(36)}`,
        nombre: trimmedNombre,
        anio,
        cursadas: [],
        aprobadas: [],
        estadoUsuario: null,
        estadoCalculado: 'BLOQUEADA',
      } satisfies Materia);

    onSave({
      ...base,
      nombre: trimmedNombre,
      anio,
      tipo,
      activa: tipo === 'optativa' ? activa : true,
      creditos: creditos.trim() ? Number(creditos) : undefined,
      requiereCreditosAprobados: requiereCreditosAprobados.trim()
        ? Number(requiereCreditosAprobados)
        : undefined,
      alternativaGrupoId: alternativaGrupoId.trim() || undefined,
      cursadas,
      aprobadas,
      requiereGrupos: base.requiereGrupos,
    });
  };

  const handleMultiSelectChange =
    (setter: (ids: string[]) => void) => (event: React.ChangeEvent<HTMLSelectElement>) => {
      const options = Array.from(event.target.selectedOptions);
      setter(options.map((opt) => opt.value));
    };

  return (
    <form className="editor-form" onSubmit={handleSubmit}>
      <h3>{isEditing ? 'Editar materia' : 'Nueva materia'}</h3>

      <label className="form-field">
        <span>Nombre</span>
        <input
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
          placeholder="Nombre de la materia"
        />
      </label>

      <label className="form-field">
        <span>Tipo</span>
        <select value={tipo} onChange={(e) => handleTipoChange(e.target.value as TipoMateria)}>
          <option value="obligatoria">Obligatoria</option>
          <option value="optativa">Optativa / electiva</option>
        </select>
      </label>

      {tipo === 'optativa' && (
        <label className="form-field form-field-inline">
          <input
            type="checkbox"
            checked={activa}
            onChange={(e) => setActiva(e.target.checked)}
          />
          <span>Incluir en el plan por defecto</span>
        </label>
      )}

      <label className="form-field">
        <span>Año o cuatrimestre</span>
        <input
          type="number"
          min={1}
          value={anio}
          onChange={(e) => setAnio(Number(e.target.value) || 1)}
          required
        />
      </label>

      <label className="form-field">
        <span>Créditos (opcional)</span>
        <input
          type="number"
          min={0}
          value={creditos}
          onChange={(e) => setCreditos(e.target.value)}
          placeholder="Ej. 6"
        />
      </label>

      <label className="form-field">
        <span>Créditos aprobados requeridos (opcional)</span>
        <input
          type="number"
          min={0}
          value={requiereCreditosAprobados}
          onChange={(e) => setRequiereCreditosAprobados(e.target.value)}
          placeholder="Ej. 140"
        />
        <small>Para requisitos del plan tipo &quot;140 créditos&quot;.</small>
      </label>

      <label className="form-field">
        <span>Grupo alternativo (opcional)</span>
        <input
          type="text"
          value={alternativaGrupoId}
          onChange={(e) => setAlternativaGrupoId(e.target.value)}
          placeholder="Ej. tfg (Tesis ó TPI)"
        />
        <small>ID del grupo uno_de si es alternativa excluyente.</small>
      </label>

      <label className="form-field">
        <span>Necesita regularizar</span>
        <select multiple value={cursadas} onChange={handleMultiSelectChange(setCursadas)}>
          {selectableMaterias.map((m) => (
            <option key={m.id} value={m.id}>
              {m.nombre} ({m.id})
            </option>
          ))}
        </select>
        <small>Usa Ctrl/Cmd + click para seleccionar múltiples materias.</small>
      </label>

      <label className="form-field">
        <span>Necesita aprobar</span>
        <select multiple value={aprobadas} onChange={handleMultiSelectChange(setAprobadas)}>
          {selectableMaterias.map((m) => (
            <option key={m.id} value={m.id}>
              {m.nombre} ({m.id})
            </option>
          ))}
        </select>
        <small>Usa Ctrl/Cmd + click para seleccionar múltiples materias.</small>
      </label>

      <div className="form-actions">
        <button type="submit" className="primary-button">
          {isEditing ? 'Guardar cambios' : 'Crear materia'}
        </button>
        <button type="button" className="secondary-button" onClick={onCancel}>
          Cancelar
        </button>
      </div>
    </form>
  );
}
