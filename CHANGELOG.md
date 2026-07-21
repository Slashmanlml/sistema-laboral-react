# Registro de cambios

## [1.0.0] — 2026-07-21

Revisión técnica completa del proyecto: corrección de bugs bloqueantes,
endurecimiento de seguridad, mejoras de rendimiento, modularización de las vistas
y cobertura de tests.

**Resumen:** 83 archivos tocados, +8.455 / −5.202 líneas. De 2 a 11 archivos de
test (76 tests). El proyecto pasa `typecheck` con `strict: true`, `lint` sin
advertencias y `build` de producción.

> **Acciones requeridas al actualizar** — ver [Migración](#migración) al final.

---

## 🔴 Bugs corregidos

### 1. El schema SQL impedía crear lotes en instalaciones limpias

`supabase_schema.sql` definía el `CHECK` de `lots.stage` con una lista de etapas
(`'Cama 1 y 2 (Propagación)'`, `'Cama 5 (Madres)'`, …) que no coincidía con las
que usa la aplicación (`LOT_STAGES` en `src/types/grow.ts`).

**Consecuencia:** en una base recién creada, **todo `insert` de lote fallaba**
con violación de restricción. Y como el error se tragaba en silencio (ver §10),
la interfaz mostraba el lote creado hasta que se recargaba la página.

**Corrección:** el `CHECK` ahora lista `Germinación`, `Vegetativo`, `Floración`,
`Secado` y `Curado`. Se agregó un bloque de migración para bases existentes y
cinco índices (`user_id`, `date`, `lot_id`) sobre las consultas que la app hace
en cada arranque.

### 2. Bug sistémico de zona horaria

El patrón `new Date().toISOString().split('T')[0]` aparecía unas 20 veces para
obtener "la fecha de hoy". `toISOString()` convierte a **UTC**: en Argentina
(UTC−3), entre las 21:00 y la medianoche devuelve **el día siguiente**.

**Afectaba a:**

| Lugar | Síntoma |
| --- | --- |
| Tareas de hoy (Dashboard y Sidebar) | Después de las 21:00 mostraba las de mañana |
| Celdas del calendario mensual | El día 15 podía quedar etiquetado como 14 |
| `isToday` en el calendario | El recuadro de "hoy" se corría de día |
| Calendario semanal de riego | El lunes calculado se desplazaba |
| `checkWateringStatus` | Un riego cargado de noche no marcaba el día como regado |
| Fecha por defecto al crear lote/tarea | Se guardaba con la fecha equivocada |

**Corrección:** nuevo módulo `src/utils/date.ts` con `todayStr()`,
`toLocalDateStr()`, `parseLocalDate()`, `addDaysToStr()`, `startOfWeekMonday()`,
`daysBetween()` e `isoToLocalDateStr()`, todos en hora local. Reemplazo completo
en todo el código.

> El test existente `calculations.test.ts` **confirmó el bug en vivo**: al
> ejecutarlo a las 21:44 devolvía `-1` días transcurridos para "hoy". El código
> anterior lo enmascaraba con un `Math.abs()`, que además hacía que un lote con
> fecha de inicio futura mostrara días positivos.

### 3. El modal de dosificación ignoraba la línea de nutrientes activa

`LotsView` seleccionaba siempre `VEG_SCHEDULE` / `FLOWER_SCHEDULE` (Ryanodine) y
el panel decía literalmente "Calculadora de Dosis Ryanodine", aunque el usuario
tuviera Athena Pro o Athena Blended configurado. **Mostraba dosis equivocadas.**

**Corrección:** toda la selección pasa por `getSchedule(stage, nutrientLine)`.

### 4. La calculadora de dosis daba 10× de más con Athena

Multiplicaba siempre `litros × dosis`, pero las líneas Athena expresan sus dosis
**por 10 L** (g/10L o mL/10L), no por litro.

**Corrección:** `calculateTankDose(week, line, liters)` respeta la unidad de cada
línea y devuelve filas etiquetadas con su unidad correcta. Cubierto por tests.

### 5. El gráfico de consumo de agua agrupaba todo en un único bucket

`getWeekKey()` hacía `new Date(dateStr + 'T00:00:00')`, pero `log.date` ya es un
timestamp ISO completo. El resultado era `Invalid Date` → `weekNo = NaN` → **todos
los riegos, de todas las semanas, caían en una sola barra `"SNaN"`.**

### 6. `editLot` regeneraba el cronograma siempre

Cada edición de lote borraba e insertaba todas las tareas autogeneradas, aunque
no cambiaran la etapa ni la fecha de inicio: tres viajes a Supabase innecesarios
y **pérdida de las notas editadas a mano** en esas tareas.

**Corrección:** sólo se regenera si cambió `stage` o `start_date`.

### 7. Regeneración doble de cronogramas bajo StrictMode

`setActiveNutrientLine` disparaba `Promise.all(...)` **dentro** de un
`setLots(current => …)`. React invoca los actualizadores de estado dos veces en
desarrollo, así que la regeneración corría duplicada.

**Corrección:** el estado se lee de un `useRef` espejo; el actualizador quedó puro.

### 8. El trasplante borraba las notas del lote

`handleConfirmTransplant` sobrescribía `notes` por completo.

**Corrección:** las notas previas se conservan y el registro de trasplante se
agrega en una línea nueva.

### 9. El "Riego Rápido" dejaba el formulario contaminado

El estado viajaba por `sessionStorage` y sólo se limpiaba si el riego llegaba a
completarse. Si el usuario cancelaba, el formulario de Registro Diario quedaba
precargado con esos datos **en todas las visitas siguientes**.

**Corrección:** el estado viaja por el router (`navigate('/logs', { state })`), así
que muere junto con la navegación.

### 10. Los errores de Supabase se tragaban en silencio

Cada operación CRUD hacía `catch (err) { logAppError(...) }` sin volver a lanzar.
La interfaz actualizaba el estado local igual, así que **mostraba éxito aunque el
insert hubiera fallado**. El usuario creía haber guardado y no había guardado.

**Corrección:** las funciones de `src/api/growApi.ts` lanzan; el contexto las
envuelve y notifica con un toast. También se chequean los errores de
`clearDatabase`, que antes hacía `Promise.all` de cinco `delete` sin mirar el
resultado de ninguno.

### 11. Corrupción silenciosa de lecturas de EC

La conversión de µS/cm a mS/cm se disparaba con valores `>= 10`. Pero Athena Pro
apunta hasta **7,0 mS/cm** de escorrentía y un sustrato salinizado supera
fácilmente los 10: esas lecturas legítimas se guardaban divididas por mil.

**Corrección:** el umbral pasó a 100 (`parseEC` en `src/utils/format.ts`). Una EC
de 12,5 mS/cm ahora se guarda como 12,5.

### 12. Otros

- **Tendencias sin sentido:** las flechas ▲▼ de las métricas comparaban
  `logs[0]` con `logs[1]`, que podían ser de **lotes distintos**. Ahora comparan
  contra el registro anterior del mismo lote, y el tooltip lo aclara.
- **Título mentiroso:** el gráfico decía "últimas 24 horas" pero mostraba los
  últimos 10 registros sin importar la fecha. Ahora dice "Últimas 10 mediciones".
- **Progreso inconsistente:** el Dashboard calculaba el avance sobre 90 días fijos
  y LotsView sobre la duración de cada etapa. Unificado en `stageProgress()`.
- **Borrado de genéticas sin aviso:** eliminar una genética usada por lotes
  activos no advertía nada. Ahora avisa cuántos lotes la siguen usando.
- **Sin ruta 404:** cualquier URL desconocida renderizaba una pantalla vacía.

---

## 🔐 Seguridad

### API keys de IA fuera del JWT

`SettingsView` y `AiChatWidget` sincronizaban la clave con
`supabase.auth.updateUser({ data: { grow_ai_api_key } })`, es decir dentro de
`user_metadata`. Ese es un lugar pésimo para un secreto:

- `user_metadata` **viaja dentro del JWT** en cada request;
- el propio cliente puede editarlo, así que no ofrece ninguna garantía;
- queda en logs de red, en la sesión persistida y en cualquier volcado.

**Corrección:** nuevo módulo `src/utils/aiConfig.ts`. La clave se guarda sólo en
el `localStorage` del dispositivo y `purgeLegacyCloudKey()` rescata la que haya
quedado en la nube de versiones anteriores y la borra de allá.

> **Pendiente recomendado:** que la clave no toque el navegador. Una Edge Function
> de Supabase que reciba el mensaje y llame al proveedor con una clave de servidor.

### La key de Gemini salía en la URL

Se llamaba a `…:generateContent?key=${apiKey}`. Los query strings quedan en logs
de proxies, historiales y reportes de error. Ahora va por el header
`x-goog-api-key`.

### XSS a través de la respuesta del modelo

`AiChatWidget` insertaba la salida del LLM con `dangerouslySetInnerHTML` sin
sanitizar. Como el prompt incluye las notas de lotes, registros y tareas escritas
por el usuario, alguien que controlara una nota podía inducir al modelo a
devolver HTML y ejecutarlo.

**Corrección:** nuevo componente `MarkdownText` que construye elementos de React
(negritas, código en línea, viñetas) en vez de inyectar HTML. Con tests de
regresión que verifican que `<img onerror>` y `<script>` se muestran como texto.

### Las acciones de la IA se ejecutaban solas

El bloque JSON devuelto por el modelo se parseaba y se ejecutaba directo: creaba
tareas, las completaba y escribía registros. Combinado con el punto anterior, era
un camino de inyección de prompt a escritura en base de datos.

**Corrección:**

- `validateAgentAction()` valida cada campo y **verifica los IDs contra los datos
  reales**: el modelo no puede inventar un lote ni una tarea.
- La UI muestra la acción propuesta y **exige confirmación manual** antes de tocar
  la base.
- El prompt marca explícitamente los datos del cultivo como datos, no como
  instrucciones, y sólo envía los campos necesarios.
- Se acabó el `payload: any`: hay tipos discriminados (`CreateTaskAction`,
  `CompleteTaskAction`, `AddLogAction`).

### Validación de los respaldos importados

`importDatabase(data: any)` hacía `JSON.parse` de un archivo elegido por el
usuario y lo mandaba directo a Supabase.

**Corrección:** `parseBackup()` en `src/utils/backup.ts` valida fila por fila,
descarta las que no cumplen el esquema, elimina registros y tareas cuyo lote no
viene en el respaldo (violarían la clave foránea) e informa cuántas filas se
descartaron. Además, la importación ahora pide confirmación mostrando el conteo.

### Otros

- **Escape de comodines LIKE:** los ids se interpolaban en patrones `LIKE` sin
  escapar `%` ni `_`.
- **Headers de seguridad** en `vercel.json`: `X-Content-Type-Options`,
  `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy` y HSTS.
- **Validación de fotos:** se rechazan archivos que no son imágenes o superan 8 MB.

---

## ⚡ Rendimiento

### Contexto dividido en datos y acciones

El `value` del contexto era un objeto literal nuevo en cada render, así que los
seis consumidores se re-renderizaban ante cualquier cambio.

Ahora hay dos contextos: `useGrow()` devuelve el estado y `useGrowActions()` las
operaciones, todas con `useCallback` y referencia estable. Un componente que sólo
dispara operaciones ya no se vuelve a renderizar cuando cambian los datos.

### Recálculos pesados memoizados

El Dashboard llamaba a `getWeeklyIrrigationSchedule()` y
`analyzeRunoffAndStrategy()` por cada lote regable **en cada render**, y cada una
filtra y ordena todo el historial de registros. Tipear una letra en el modal de
registro rápido re-ejecutaba todo.

Ahora cada tarjeta de alerta es un componente `memo` con sus cálculos memoizados.

### Índice de lotes

`lots.find()` dentro de bucles de tabla (Dashboard, Registro Diario, Tareas,
Reportes) daba O(n·m). Se agregó `lotsById: Map<string, Lot>` al contexto.

### Code splitting

Las seis vistas se cargan con `React.lazy`. Chart.js y Supabase quedaron en
chunks propios: **Chart.js (189 kB) ya no se descarga** si el usuario no abre
Dashboard ni Reportes.

```
dist/assets/charts-*.js      189,33 kB │ gzip: 65,83 kB   ← sólo Dashboard/Reportes
dist/assets/supabase-*.js    201,28 kB │ gzip: 51,55 kB
dist/assets/index-*.js       300,89 kB │ gzip: 95,27 kB
dist/assets/LotsView-*.js     32,61 kB │ gzip:  8,11 kB   ← bajo demanda
```

### Paginación en el servidor

`select('*')` traía **todos** los registros diarios en cada arranque y la
paginación era client-side sobre ese conjunto. Ahora la carga inicial trae 200
registros con `.range()` y hay un botón "Traer más" que pagina contra Supabase.

### Otros

- La fuente Inter se cargaba con un `@import` en el CSS, que bloquea el render.
  Pasó a `<link rel="preconnect">` en el HTML.
- `ChartJS.register(...)` estaba duplicado en dos vistas → `src/lib/chartSetup.ts`.
- Agrupamientos de un solo recorrido (`tasksByDate`, columnas del pipeline) en vez
  de un `filter` por celda.

---

## 🧩 Modularización

### Capa de datos separada

Todo el acceso a Supabase salió del contexto a `src/api/growApi.ts`, y los datos
de demostración a `src/api/seedData.ts`. El contexto pasó de ser un god-object de
25 miembros con SQL adentro a un coordinador de estado.

### Vistas divididas

Las cuatro vistas grandes (3.400 líneas) se repartieron en unos 30 componentes:

| Antes | Después |
| --- | --- |
| `LotsView.tsx` (1.050 líneas) | `views/lots/`: `LotPipeline`, `LotGrid`, `LotFormModal`, `TransplantModal`, `ScheduleModal`, `ScheduleSalesTab`, `ScheduleIrrigationTab`, `stageMeta` |
| `LogsView.tsx` (970) | `views/logs/`: `LogForm`, `LogHistory`, `AthenaAssistant`, `WateringGuide`, `useLogForm`, `logWarnings` |
| `DashboardView.tsx` (749) | `views/dashboard/`: `MetricCard`, `LunarWidget`, `IrrigationAlerts`, `ClimateChart`, `RecentWaterings`, `QuickLogModal`, `climateStatus` |
| `SettingsView.tsx` (633) | `views/settings/`: `StrainsPanel`, `HelpersPanel`, `NutrientSettingsPanel`, `AiSettingsPanel`, `BackupPanel`, `DiagnosticsPanel` |
| `TasksView.tsx` (637) | `views/tasks/`: `TaskCalendar`, `TaskItem`, `TaskFormPanel`, `LunarDayPanel`, `taskStyles` |

### Duplicación eliminada

| Lógica | Estaba en | Ahora |
| --- | --- | --- |
| Elegir cronograma por etapa y línea | 3 lugares | `getSchedule()` |
| Armar el texto de dosificación | 2 lugares | `formatDose()` |
| Calcular la semana del ciclo | 4 lugares | `getCycleWeek()` |
| Parsear EC | 3 lugares | `parseEC()` |
| Formateo de fechas `toLocaleString` | 5 lugares | `utils/format.ts` |
| Visor de fotos | 2 lugares | `<PhotoLightbox>` |
| Markup de modal | 6 lugares | `<Modal>` |

### Primitivos de UI

La misma cadena de ~12 clases de Tailwind estaba copiada unas 80 veces. Ahora hay
`Button`, `TextField`, `SelectField`, `TextAreaField`, `Card`, `SectionHeader`,
`EmptyState`, `StatTile`, `Modal`, `PhotoLightbox` y `MarkdownText` en
`src/components/ui/`.

### Código muerto eliminado

- `ToastProvider` estaba montado y **nunca se usaba**: Registro Diario
  reimplementaba sus propios toasts y Ajustes usaba `alert()`/`confirm()`. Ahora
  se usa en toda la app y no queda ningún `alert()`.
- `LoginView.onLoginSuccess`: prop que nunca se pasaba.
- El `window.dispatchEvent(new Event('storage'))` de `App.tsx`, que nadie escuchaba.
- `src/App.css` (una línea de comentario), `src/assets/react.svg`, `src/assets/vite.svg`.
- `generateSafeId()` reemplazado por `crypto.randomUUID()`.

---

## 🛡️ Tipos y robustez

- **`strict: true`** activado en TypeScript (antes ni siquiera estaba
  `strictNullChecks`, lo que explica la cantidad de `x || '-.-'` defensivos).
  También `noImplicitOverride` y `forceConsistentCasingInFileNames`.
- **Los 15 `any` eliminados.** `importDatabase(data: any)`, `scheduleWeeks: any[]`,
  `payload: any` y los `localStorage.getItem() as any` tienen tipos reales.
- **Uniones nombradas** en `src/types/grow.ts`: `NutrientLine`, `IrrigationMethod`,
  `LotStage`, `TaskType`, `StrainType`, `DbStatus`, `AppError`, `BackupFile`. Las
  listas literales (`LOT_STAGES`, `TASK_TYPES`) se derivan de una sola constante,
  en vez de estar hardcodeadas en tres JSX distintos.
- **`ErrorBoundary`** en la raíz y alrededor de las rutas: una excepción de render
  ya no deja la pantalla en blanco.
- **Pantalla de configuración faltante:** si no hay variables de entorno, la app
  explica qué hacer. Antes `createClient('')` lanzaba en tiempo de import y dejaba
  la página vacía sin ningún mensaje.
- **Actualización optimista** al marcar tareas, con reversión si Supabase falla.

---

## ♿ Accesibilidad

- **Modal accesible** (`role="dialog"`, `aria-modal`, cierre con Escape, foco
  atrapado y devuelto, bloqueo del scroll de fondo) aplicado a los seis modales.
  Ninguno tenía nada de esto.
- **Calendario navegable por teclado:** las celdas eran `<div onClick>` sin
  `tabIndex`; ahora son `<button>` con `aria-pressed` y etiqueta descriptiva.
- **Labels asociados** a todos los campos (`useId`), `aria-label` en los botones
  de sólo ícono, `role="alert"` en los mensajes de error.
- **Se quitó `select-none`** de las vistas completas: impedía copiar un valor de
  pH de una tabla.

---

## 🎨 CSS

- **20 usos de `animate-in fade-in zoom-in-95 slide-in-from-bottom`** no hacían
  nada: son utilidades de `tw-animate-css`, que no estaba instalado. Se instaló.
- **Tonos de Tailwind inexistentes** eliminados: `border-slate-350`,
  `text-slate-750`, `text-slate-650`, `border-emerald-250`, `text-emerald-850`,
  `text-rose-850`, `text-amber-850`, `text-slate-805`, `text-slate-505`. Varios
  aparecían seguidos del tono correcto (`text-emerald-850 text-emerald-800`),
  rastro de un reemplazo masivo fallido.

---

## 🧪 Tests y herramientas

### Vitest estaba mal configurado

`npm test` corría, pero `vite.config.ts` no tenía bloque `test`: sin
`environment: 'jsdom'`, sin setup file y sin `globals`, aunque
`@testing-library/react`, `jsdom` y `jest-dom` estaban instalados. **Ningún test
de componente podía funcionar.**

Además, el `defineConfig` tiene que importarse de `vitest/config` y no de `vite`:
con el de Vite la clave `test` se ignora en silencio.

### Cobertura

De **2 archivos de test** a **11 (76 tests)**:

| Archivo | Cubre |
| --- | --- |
| `utils/date.test.ts` | Fechas locales, DST, cruces de mes, inicio de semana |
| `utils/format.test.ts` | Parseo de EC, incluida la regresión del umbral |
| `utils/lunar.test.ts` | Fases, tipos de día, nodos — **no tenía ningún test** |
| `utils/schedules.test.ts` | Selección de cronograma y unidades de dosificación |
| `utils/backup.test.ts` | Validación de respaldos y filas huérfanas |
| `utils/aiAgent.test.ts` | Validación de acciones de la IA e IDs inventados |
| `utils/calculations.test.ts` | VPD, días transcurridos, semana del ciclo |
| `utils/irrigationEngine.test.ts` | Riego semanal y diagnóstico de escorrentía |
| `components/ui/Modal.test.tsx` | Escape, foco, aria, scroll de fondo |
| `components/ui/MarkdownText.test.tsx` | **Regresión de XSS** |
| `views/DashboardView.test.tsx` | Integración: contexto + vista renderizando |

### Otros

- Scripts `typecheck` y `test:watch`.
- Regla de ESLint para permitir descartes con `_` en desestructuración.
- `.env.example` documentado.
- `README.md` reescrito (era la plantilla de Vite) con estructura, comandos y las
  convenciones que conviene respetar.
- `package.json` renombrado de `sistema-laboral-react` a `growmanager`; el `<title>`
  y el `lang="es"` del HTML corregidos.

---

## Migración

Al actualizar hace falta hacer dos cosas a mano:

### 1. Corregir el `CHECK` de etapas en Supabase

Sin esto, **crear lotes sigue fallando**. En el SQL Editor:

```sql
alter table lots drop constraint if exists lots_stage_check;
alter table lots add constraint lots_stage_check
  check (stage in ('Germinación', 'Vegetativo', 'Floración', 'Secado', 'Curado'));
```

El bloque completo, con los índices recomendados, está al final de
`supabase_schema.sql`.

### 2. Recargar la API key de IA

La clave dejó de sincronizarse por la nube. La primera vez que abras la app en
cada dispositivo, se rescata automáticamente la que estaba en `user_metadata` y
se borra de allá. En los dispositivos donde nunca la hayas cargado, hay que
ingresarla de nuevo en Ajustes.

---

## Pendientes conocidos

- **Tipos generados de Supabase** (`supabase gen types typescript`): daría
  verificación en compilación de nombres de tablas y columnas. Requiere el CLI
  autenticado contra el proyecto.
- **Prettier y CI:** no se agregaron; son decisiones de equipo.
- **Proxy de IA en el servidor:** mientras la clave siga en el navegador, el
  usuario puede leerla desde su propio `localStorage`. Es aceptable en un modelo
  "traé tu propia clave", pero una Edge Function sería mejor.
- **`src/assets/hero.png`** sigue sin referencias en el código.
