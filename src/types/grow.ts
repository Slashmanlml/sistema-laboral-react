// =============================================================================
// Tipos de dominio de GrowManager.
// Las uniones literales viven acá para no repetirlas por toda la app.
// =============================================================================

// ─── Catálogos ────────────────────────────────────────────────────────────────

export const STRAIN_TYPES = ['Híbrido', 'Índica', 'Sativa', 'CBD'] as const;
export type StrainType = (typeof STRAIN_TYPES)[number];

export const LOT_STAGES = [
  'Germinación',
  'Vegetativo',
  'Floración',
  'Secado',
  'Curado',
] as const;
export type LotStage = (typeof LOT_STAGES)[number];

export const TASK_TYPES = [
  'riego',
  'fertilizante',
  'poda',
  'preventivo',
  'otro',
] as const;
export type TaskType = (typeof TASK_TYPES)[number];

/** Etapas en las que se aplica cronograma de sales y análisis de escorrentía. */
export const WATERABLE_STAGES: readonly LotStage[] = ['Vegetativo', 'Floración'];

export const isWaterableStage = (stage: LotStage): boolean =>
  WATERABLE_STAGES.includes(stage);

// ─── Configuración del cultivo ────────────────────────────────────────────────

export const NUTRIENT_LINES = ['ryanodine', 'athena_pro', 'athena_blended'] as const;
export type NutrientLine = (typeof NUTRIENT_LINES)[number];

export const IRRIGATION_METHODS = ['manual', 'automated'] as const;
export type IrrigationMethod = (typeof IRRIGATION_METHODS)[number];

export const isNutrientLine = (value: unknown): value is NutrientLine =>
  typeof value === 'string' && (NUTRIENT_LINES as readonly string[]).includes(value);

export const isIrrigationMethod = (value: unknown): value is IrrigationMethod =>
  typeof value === 'string' && (IRRIGATION_METHODS as readonly string[]).includes(value);

// ─── Entidades ────────────────────────────────────────────────────────────────

export interface Strain {
  id: string;
  user_id?: string;
  name: string;
  type: StrainType;
}

export interface Lot {
  id: string;
  user_id?: string;
  name: string;
  strain: string;
  plant_count: number;
  stage: LotStage;
  /** Fecha local en formato YYYY-MM-DD. */
  start_date: string;
  notes?: string;
  is_archived: boolean;
}

export interface Log {
  id: string;
  user_id?: string;
  lot_id: string;
  /** Timestamp ISO completo. */
  date: string;
  temp: number;
  humidity: number;
  vpd: number;
  ph?: number;
  ec?: number;
  ph_runoff?: number;
  ec_runoff?: number;
  water_amount?: number;
  watered_by?: string;
  notes?: string;
  image_url?: string;
}

export interface Task {
  id: string;
  user_id?: string;
  lot_id: string;
  title: string;
  /** Fecha local en formato YYYY-MM-DD. */
  date: string;
  type: TaskType;
  notes?: string;
  is_completed: boolean;
}

export interface Helper {
  id: string;
  user_id?: string;
  name: string;
}

// ─── Diagnóstico ──────────────────────────────────────────────────────────────

export type DbStatus =
  | 'connected'
  | 'disconnected'
  | 'auth_error'
  | 'config_error'
  | 'loading';

export interface AppError {
  id: string;
  timestamp: string;
  context: string;
  message: string;
  stack?: string;
}

// ─── Respaldo / importación ───────────────────────────────────────────────────

export interface BackupFile {
  exportedAt?: string;
  appVersion?: string;
  strains: Strain[];
  lots: Lot[];
  logs: Log[];
  tasks: Task[];
  helpers?: Helper[];
}
