import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import ReactFlow, {
  Background,
  Controls,
  type Edge,
  type Node,
  ReactFlowProvider,
  Position,
  getNodesBounds,
  useReactFlow,
} from "reactflow";
import "reactflow/dist/style.css";
import type { Materia } from "../domain/types";
import { isMateriaActiva, isOptativa } from "../domain/materia";
import { getAllPrereqIds, getVisibleState } from "../domain/rules";
import { useMaterias } from "../state/MateriasContext";
import { SubjectDetailsPanel } from "../components/SubjectDetailsPanel";
import { paths } from "../routes/paths";

type MateriaNodeData = {
  materia: Materia;
  label: string;
};

const COLUMN_WIDTH = 260;
const ROW_HEIGHT = 110;
const NODE_WIDTH = 224;
const NODE_HEIGHT = 72;
const MAP_BOUNDS_PADDING = 200;

function getLayoutAnio(materia: Materia, maxObligatoriaAnio: number): number {
  if (isOptativa(materia)) {
    return maxObligatoriaAnio + 1;
  }

  return materia.anio;
}

function getTranslateExtent(
  nodes: Node[],
): [[number, number], [number, number]] {
  if (nodes.length === 0) {
    return [
      [0, 0],
      [COLUMN_WIDTH * 5, ROW_HEIGHT * 8],
    ];
  }

  const bounds = getNodesBounds(nodes);
  return [
    [bounds.x - MAP_BOUNDS_PADDING, bounds.y - MAP_BOUNDS_PADDING],
    [
      bounds.x + bounds.width + MAP_BOUNDS_PADDING,
      bounds.y + bounds.height + MAP_BOUNDS_PADDING,
    ],
  ];
}

function orderMateriasWithinYear(list: Materia[]): Materia[] {
  const ids = new Set(list.map((m) => m.id));

  const inDegree = new Map<string, number>();
  const adjacency = new Map<string, string[]>();

  list.forEach((m) => {
    inDegree.set(m.id, 0);
    adjacency.set(m.id, []);
  });

  list.forEach((m) => {
    getAllPrereqIds(m).forEach((prereqId) => {
      if (!ids.has(prereqId)) return;
      const targets = adjacency.get(prereqId);
      if (!targets) return;
      targets.push(m.id);
      inDegree.set(m.id, (inDegree.get(m.id) ?? 0) + 1);
    });
  });

  const queue: string[] = [];

  inDegree.forEach((degree, id) => {
    if (degree === 0) {
      queue.push(id);
    }
  });

  const numericCompare = (a: string, b: string) => {
    const aId = Number(a);
    const bId = Number(b);

    if (!Number.isNaN(aId) && !Number.isNaN(bId) && aId !== bId) {
      return aId - bId;
    }

    return a.localeCompare(b);
  };

  queue.sort(numericCompare);

  const orderedIds: string[] = [];

  while (queue.length > 0) {
    const current = queue.shift()!;
    orderedIds.push(current);

    const neighbors = adjacency.get(current) ?? [];
    neighbors.forEach((nextId) => {
      const nextDegree = (inDegree.get(nextId) ?? 0) - 1;
      inDegree.set(nextId, nextDegree);
      if (nextDegree === 0) {
        queue.push(nextId);
        queue.sort(numericCompare);
      }
    });
  }

  if (orderedIds.length === list.length) {
    return orderedIds
      .map((id) => list.find((m) => m.id === id))
      .filter((m): m is Materia => Boolean(m));
  }

  return [...list].sort((a, b) => {
    const aId = Number(a.id);
    const bId = Number(b.id);

    if (!Number.isNaN(aId) && !Number.isNaN(bId) && aId !== bId) {
      return aId - bId;
    }

    return a.nombre.localeCompare(b.nombre);
  });
}

function getFocusedMateriaIds(
  materias: Materia[],
  selectedId: string,
): Set<string> {
  const ids = new Set<string>([selectedId]);
  const selected = materias.find((m) => m.id === selectedId);
  if (!selected) return ids;

  for (const id of [...selected.cursadas, ...selected.aprobadas]) {
    ids.add(id);
  }

  for (const m of materias) {
    if (m.cursadas.includes(selectedId) || m.aprobadas.includes(selectedId)) {
      ids.add(m.id);
    }
  }

  return ids;
}

function buildNodesAndEdges(
  materias: Materia[],
  selectedId: string | null,
  focusMode: boolean,
  showInactiveOptativas: boolean,
): { nodes: Node<MateriaNodeData>[]; edges: Edge[] } {
  const baseMaterias = showInactiveOptativas
    ? materias
    : materias.filter((m) => isMateriaActiva(m));

  const focusedIds =
    focusMode && selectedId
      ? getFocusedMateriaIds(baseMaterias, selectedId)
      : null;
  const visibleMaterias = focusedIds
    ? baseMaterias.filter((m) => focusedIds.has(m.id))
    : baseMaterias;

  const maxObligatoriaAnio = Math.max(
    1,
    ...baseMaterias.filter((m) => !isOptativa(m)).map((m) => m.anio),
  );

  const materiasPorAnio = new Map<number, Materia[]>();
  const selectedMateria = selectedId
    ? (materias.find((m) => m.id === selectedId) ?? null)
    : null;

  visibleMaterias.forEach((m) => {
    const layoutAnio = getLayoutAnio(m, maxObligatoriaAnio);
    const list = materiasPorAnio.get(layoutAnio) ?? [];
    list.push(m);
    materiasPorAnio.set(layoutAnio, list);
  });

  const visibleIds = new Set(visibleMaterias.map((m) => m.id));
  const nodes: Node<MateriaNodeData>[] = [];
  const edges: Edge[] = [];

  Array.from(materiasPorAnio.entries())
    .sort(([a], [b]) => a - b)
    .forEach(([anio, list]) => {
      const orderedForYear = orderMateriasWithinYear(list);

      orderedForYear.forEach((materia, index) => {
        const x = (anio - 1) * COLUMN_WIDTH;
        const y = index * ROW_HEIGHT;
        const activa = isMateriaActiva(materia);
        const visible = getVisibleState(materia);

        let background = "#f3f4f6";
        if (!activa) background = "#f9fafb";
        else if (visible === "BLOQUEADA") background = "#d1d5db";
        else if (visible === "EN_CURSO") background = "#BFDBFE";
        else if (visible === "REGULARIZADA") background = "#DDD6FE";
        else if (visible === "FINALIZADA") background = "#BBF7D0";

        if (selectedId) {
          if (materia.id === selectedId) {
            background = "#fdba74";
          } else if (activa && visible !== "FINALIZADA") {
            const isCursadaOfSelected =
              selectedMateria?.cursadas.includes(materia.id) ?? false;
            const isAprobadaOfSelected =
              selectedMateria?.aprobadas.includes(materia.id) ?? false;
            const isDependentOfSelected =
              materia.cursadas.includes(selectedId) ||
              materia.aprobadas.includes(selectedId);
            if (isCursadaOfSelected || isAprobadaOfSelected)
              background = "#fef08a";
            else if (isDependentOfSelected) background = "#fecaca";
          }
        }

        const label = isOptativa(materia)
          ? `⦿ ${materia.nombre}`
          : materia.nombre;

        nodes.push({
          id: materia.id,
          position: { x, y },
          width: NODE_WIDTH,
          height: NODE_HEIGHT,
          data: { materia, label },
          type: "default",
          draggable: false,
          selectable: true,
          style: {
            padding: 12,
            borderRadius: 8,
            border: isOptativa(materia)
              ? "2px dashed #9ca3af"
              : "1px solid #9ca3af",
            background,
            fontSize: 12,
            minWidth: 200,
            opacity: activa ? 1 : 0.55,
          },
          sourcePosition: Position.Right,
          targetPosition: Position.Left,
        });
      });
    });

  visibleMaterias.forEach((materia) => {
    const addEdge = (prereqId: string, tipo: "cursada" | "aprobada") => {
      if (!visibleIds.has(prereqId)) return;

      edges.push({
        id: `${prereqId}->${materia.id}:${tipo}`,
        source: prereqId,
        target: materia.id,
        animated: false,
        interactionWidth: 0,
        style: {
          stroke: "#9ca3af",
          strokeWidth: 1.5,
          strokeDasharray: tipo === "cursada" ? "6 3" : undefined,
        },
      });
    };

    materia.cursadas.forEach((id) => addEdge(id, "cursada"));
    materia.aprobadas.forEach((id) => addEdge(id, "aprobada"));
  });

  const highlightedEdges: Edge[] = edges.map((edge) => {
    if (!selectedId) {
      return edge;
    }

    if (edge.target === selectedId) {
      return {
        ...edge,
        style: {
          ...edge.style,
          stroke: "#facc15",
          strokeWidth: 3,
        },
      };
    }

    if (edge.source === selectedId) {
      return {
        ...edge,
        style: {
          ...edge.style,
          stroke: "#ef4444",
          strokeWidth: 3,
        },
      };
    }

    return edge;
  });

  return { nodes, edges: highlightedEdges };
}

function MapPageInner() {
  const { materias, gruposEleccion, setEstadoUsuario } = useMaterias();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [focusMode, setFocusMode] = useState(false);
  const [showInactiveOptativas, setShowInactiveOptativas] = useState(false);
  const { fitView } = useReactFlow();

  const hasOptativas = materias.some((m) => isOptativa(m));

  const { nodes, edges } = useMemo(
    () =>
      buildNodesAndEdges(
        materias,
        selectedId,
        focusMode,
        showInactiveOptativas,
      ),
    [materias, selectedId, focusMode, showInactiveOptativas],
  );

  const translateExtent = useMemo(() => getTranslateExtent(nodes), [nodes]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      fitView({ padding: 0.2, duration: 200 });
    }, 50);
    return () => window.clearTimeout(timer);
  }, [nodes.length, focusMode, showInactiveOptativas, fitView]);

  const selectedMateria = selectedId
    ? (materias.find((m) => m.id === selectedId) ?? null)
    : null;

  if (materias.length === 0) {
    return (
      <div className="page map-page">
        <div className="map-empty-state">
          <h2>Todavía no hay materias en tu plan</h2>
          <p>
            Importá tu plan de estudios con IA o elegí un plan de demo UTN desde Importar.
          </p>
          <Link
            to={paths.editorImport}
            className="primary-button map-empty-state-button"
          >
            Importar materias
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page map-page">
      <div className="map-body">
        <div className="map-main">
          <div className="map-toolbar">
            <label className="map-view-switch">
              <input
                type="checkbox"
                className="map-view-switch-input"
                checked={focusMode}
                onChange={(e) => {
                  if (!e.target.checked) setSelectedId(null);
                  setFocusMode(e.target.checked);
                }}
              />
              <span className="map-view-switch-track" aria-hidden="true" />
              <span className="map-view-switch-label">
                Solo materias relacionadas
              </span>
            </label>
            {hasOptativas && (
              <label className="map-view-switch">
                <input
                  type="checkbox"
                  className="map-view-switch-input"
                  checked={showInactiveOptativas}
                  onChange={(e) => setShowInactiveOptativas(e.target.checked)}
                />
                <span className="map-view-switch-track" aria-hidden="true" />
                <span className="map-view-switch-label">
                  Mostrar optativas inactivas
                </span>
              </label>
            )}
          </div>

          <div className="map-container">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodesDraggable={false}
              nodesConnectable={false}
              edgesFocusable={false}
              elementsSelectable={false}
              panOnDrag
              zoomOnPinch
              preventScrolling
              autoPanOnNodeDrag={false}
              translateExtent={translateExtent}
              minZoom={0.55}
              maxZoom={1.75}
              onNodeClick={(_, node) => setSelectedId(node.id)}
            >
              <Background gap={24} size={1} color="#e5e7eb" />
              <Controls />
            </ReactFlow>
          </div>
        </div>

        {selectedMateria && (
          <SubjectDetailsPanel
            materia={selectedMateria}
            materias={materias}
            gruposEleccion={gruposEleccion}
            onClose={() => setSelectedId(null)}
            onChangeEstado={(estado) =>
              setEstadoUsuario(selectedMateria.id, estado)
            }
          />
        )}
      </div>
    </div>
  );
}

export function MapPage() {
  return (
    <ReactFlowProvider>
      <MapPageInner />
    </ReactFlowProvider>
  );
}
