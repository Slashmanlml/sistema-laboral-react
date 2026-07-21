# GrowManager

Gestión de cultivo indoor: lotes, riegos, escorrentía (runoff), cronogramas de
nutrientes, calendario lunar y un asistente de IA opcional.

Stack: React 19 + TypeScript + Vite + Tailwind 4 + Supabase.

---

## Puesta en marcha

```bash
npm install
cp .env.example .env   # completar con los datos de tu proyecto Supabase
npm run dev
```

Si faltan las variables de entorno la app arranca igual y muestra una pantalla
explicando qué configurar, en vez de quedar en blanco.

### Base de datos

Pegá `supabase_schema.sql` en el **SQL Editor** de Supabase. El script crea las
cinco tablas, habilita Row Level Security con aislamiento por usuario y crea los
índices de consulta.

Si ya tenías una base creada con una versión anterior, ejecutá también el bloque
de migración comentado al final del archivo: corrige el `CHECK` de `lots.stage`,
que listaba etapas distintas a las de la aplicación y hacía fallar **todo**
insert de lote.

Para las fotos hace falta un bucket público llamado `grow-photos` en Supabase
Storage.

## Comandos

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Typecheck + build de producción |
| `npm run typecheck` | Sólo TypeScript |
| `npm run lint` | ESLint |
| `npm test` | Tests con Vitest |
| `npm run test:watch` | Tests en modo watch |

## Estructura

```
src/
├── api/          Acceso a Supabase (growApi) y datos de demostración
├── components/   Sidebar, chat de IA, ErrorBoundary, toasts
│   └── ui/       Primitivos: Modal, Button, Field, Card, PhotoLightbox
├── context/      GrowContext: estado y acciones del cultivo
├── lib/          Cliente de Supabase y registro de Chart.js
├── types/        Tipos de dominio y uniones literales
├── utils/        Cálculos, cronogramas, fechas, formato, respaldos, IA
└── views/        Una carpeta por pantalla, con sus subcomponentes
```

### Convenciones que conviene respetar

**Fechas.** Nunca uses `date.toISOString().split('T')[0]` para obtener "hoy":
devuelve la fecha **UTC** y en husos negativos (Argentina es UTC-3) a partir de
las 21:00 ya devuelve el día siguiente. Usá `todayStr()` y `toLocalDateStr()` de
`utils/date.ts`.

**Errores.** Las funciones de `api/growApi.ts` lanzan si Supabase falla. El
contexto las envuelve y muestra un toast: no atrapes errores en silencio.

**Cronogramas.** La receta de una etapa sale siempre de
`getSchedule(stage, nutrientLine)`. No selecciones un `SCHEDULE` a mano: así fue
como el modal de dosificación terminó mostrando recetas Ryanodine con Athena
seleccionado.

**Datos del contexto.** `useGrow()` da el estado y `useGrowActions()` las
operaciones. Las acciones tienen referencia estable, así que un componente que
sólo dispara operaciones no se re-renderiza cuando cambian los datos.

## Asistente de IA (opcional)

Soporta Google Gemini y OpenAI con tu propia clave, que se guarda **sólo en el
`localStorage` de ese dispositivo**. No se sincroniza con la cuenta: guardarla en
`user_metadata` la metía dentro del JWT de sesión.

Las acciones que propone el modelo (crear tarea, completar tarea, registrar
riego) se validan contra los datos reales —no puede inventar un lote— y **siempre
requieren confirmación manual** antes de tocar la base.

Lo ideal a futuro es que la clave no toque el navegador: una Edge Function de
Supabase que reciba el mensaje y llame al proveedor con una clave de servidor.

## Despliegue

Configurado para Vercel (`vercel.json`): reescritura de SPA y headers de
seguridad. Cargá `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en las variables
de entorno del proyecto.
