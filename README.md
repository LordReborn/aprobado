## Plan de cursada – Mapa de correlativas

Aplicación web en **React + TypeScript + Vite** para gestionar un grafo de materias con correlativas, sin backend y con persistencia en `localStorage`.

### Stack

- **Frontend**: React + TypeScript.
- **Bundler**: Vite.
- **Estado global**: React Context + hooks (sin Redux).
- **Persistencia**: `localStorage` (clave `correlativas_app_v1`).
- **Grafo**: [React Flow](https://reactflow.dev/) para el mapa visual de materias.

### Modelo de datos

Tipo `Materia` en TypeScript:

- `id: string`
- `nombre: string`
- `anio: number`
- `correlativas: string[]` (ids de materias requeridas)
- `estadoUsuario: "EN_CURSO" | "FINALIZADA" | null`
- `estadoCalculado: "BLOQUEADA" | "DESBLOQUEADA"`

El **estado mostrado** se deriva de `estadoCalculado` + `estadoUsuario`:

- Si `estadoCalculado === "BLOQUEADA"` → se muestra **BLOQUEADA**.
- Si `estadoCalculado === "DESBLOQUEADA"` y `estadoUsuario === null` → **DESBLOQUEADA** (Disponible).
- Si `estadoCalculado === "DESBLOQUEADA"` y `estadoUsuario === "EN_CURSO"` → **EN_CURSO**.
- Si `estadoCalculado === "DESBLOQUEADA"` y `estadoUsuario === "FINALIZADA"` → **FINALIZADA**.

#### Reglas de negocio

- Una materia está **BLOQUEADA** si tiene al menos una correlativa que **no** está `FINALIZADA`.
- El usuario **no puede** marcar `EN_CURSO` o `FINALIZADA` una materia bloqueada.
- Al intentar cambiar una materia bloqueada se informa qué correlativas faltan.
- Cada vez que cambia el estado de una materia se recalculan los estados calculados del resto.
- Todos los cambios se guardan automáticamente en `localStorage`.

### Estructura de carpetas

- `src/domain`: tipos y reglas puras (`computeCalculatedStates`, `getMissingPrereqs`, `getDependents`, validaciones, etc.).
- `src/storage`: acceso a `localStorage`.
- `src/state`: `MateriasContext` (estado global + persistencia).
- `src/components`: componentes de UI reutilizables (panel de detalle, formularios, etc.).
- `src/pages`: páginas `MapPage` (mapa) y `EditorPage` (editor).
- `src/data`: dataset de ejemplo (`demoMaterias`).

### Pantallas

- **Mapa de correlativas**
  - Muestra las materias agrupadas por año en columnas.
  - Colores según estado: BLOQUEADA (gris), EN_CURSO (azul), FINALIZADA (verde), DESBLOQUEADA (neutro).
  - Al hacer click en una materia se abre un panel lateral con:
    - Nombre, año, estado.
    - Lista de correlativas y su estado.
    - Lista de materias que desbloquea.
    - Botones para marcar **En curso**, **Finalizada** o **Reiniciar estado** (deshabilitados si está bloqueada).

- **Editor**
  - Listado de materias con sus correlativas.
  - Formulario para **crear** y **editar** materias (id autogenerado al crear).
  - Eliminar materia (remueve también su id de las correlativas de otras materias).
  - Botón **“Reset a ejemplo”**: vuelve a un dataset demo.
  - **Exportar JSON**: copia el dataset al portapapeles (o descarga un archivo).
  - **Importar JSON**: permite pegar un JSON de materias.
  - Validaciones:
    - Ids únicos.
    - Correlativas deben existir.
    - No se permite una materia como correlativa de sí misma.
    - Detección de ciclos de correlativas; si hay ciclo no se guarda y se muestra un error.

### Scripts

- `npm install`: instala dependencias.
- `npm run dev`: levanta el servidor de desarrollo en Vite.
- `npm run build`: compila TypeScript y genera el build de producción.
- `npm run preview`: sirve el build de producción.

### Cómo correr el proyecto

1. Instalar dependencias:

   ```bash
   npm install
   ```

2. Levantar el servidor de desarrollo:

   ```bash
   npm run dev
   ```

3. Abrir el navegador en la URL que indique Vite (por defecto `http://localhost:5173`).

El estado de tus materias se guardará automáticamente en el navegador mediante `localStorage`. Para volver al dataset de ejemplo podés usar el botón **“Reset a ejemplo”** en la pestaña **Editor**.

