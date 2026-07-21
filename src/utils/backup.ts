// =============================================================================
// Serialización y validación de respaldos.
//
// El archivo lo elige el usuario, así que su contenido es un input no confiable:
// antes se hacía `JSON.parse` y se mandaba directo a Supabase tipado como `any`.
// =============================================================================

import type { BackupFile, Helper, Log, Lot, Strain, Task } from '../types/grow';
import { LOT_STAGES, STRAIN_TYPES, TASK_TYPES } from '../types/grow';
import { todayStr } from './date';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const str = (value: unknown): string | undefined =>
  typeof value === 'string' && value.trim() ? value : undefined;

const num = (value: unknown): number | undefined =>
  typeof value === 'number' && Number.isFinite(value) ? value : undefined;

const oneOf = <T extends string>(value: unknown, allowed: readonly T[]): T | undefined =>
  typeof value === 'string' && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : undefined;

/** Descarta las filas que no cumplen el esquema en vez de romper toda la importación. */
const parseRows = <T>(value: unknown, parse: (row: Record<string, unknown>) => T | null): T[] => {
  if (!Array.isArray(value)) return [];
  return value.filter(isRecord).map(parse).filter((row): row is T => row !== null);
};

const parseStrain = (row: Record<string, unknown>): Strain | null => {
  const id = str(row.id);
  const name = str(row.name);
  if (!id || !name) return null;
  return { id, name, type: oneOf(row.type, STRAIN_TYPES) ?? 'Híbrido' };
};

const parseLot = (row: Record<string, unknown>): Lot | null => {
  const id = str(row.id);
  const name = str(row.name);
  const stage = oneOf(row.stage, LOT_STAGES);
  if (!id || !name || !stage) return null;
  return {
    id,
    name,
    strain: str(row.strain) ?? 'Desconocida',
    plant_count: num(row.plant_count) ?? 0,
    stage,
    start_date: str(row.start_date) ?? todayStr(),
    notes: str(row.notes),
    is_archived: row.is_archived === true,
  };
};

const parseLog = (row: Record<string, unknown>): Log | null => {
  const id = str(row.id);
  const lotId = str(row.lot_id);
  const temp = num(row.temp);
  const humidity = num(row.humidity);
  if (!id || !lotId || temp === undefined || humidity === undefined) return null;
  return {
    id,
    lot_id: lotId,
    date: str(row.date) ?? new Date().toISOString(),
    temp,
    humidity,
    vpd: num(row.vpd) ?? 0,
    ph: num(row.ph),
    ec: num(row.ec),
    ph_runoff: num(row.ph_runoff),
    ec_runoff: num(row.ec_runoff),
    water_amount: num(row.water_amount),
    watered_by: str(row.watered_by),
    notes: str(row.notes),
    image_url: str(row.image_url),
  };
};

const parseTask = (row: Record<string, unknown>): Task | null => {
  const id = str(row.id);
  const lotId = str(row.lot_id);
  const title = str(row.title);
  if (!id || !lotId || !title) return null;
  return {
    id,
    lot_id: lotId,
    title,
    date: str(row.date) ?? todayStr(),
    type: oneOf(row.type, TASK_TYPES) ?? 'otro',
    notes: str(row.notes),
    is_completed: row.is_completed === true,
  };
};

const parseHelper = (row: Record<string, unknown>): Helper | null => {
  const id = str(row.id);
  const name = str(row.name);
  return id && name ? { id, name } : null;
};

export interface BackupParseResult {
  backup: BackupFile;
  /** Filas descartadas por no cumplir el esquema, por tabla. */
  skipped: number;
}

/** Valida un respaldo. Lanza si el archivo no tiene forma de respaldo. */
export const parseBackup = (raw: unknown): BackupParseResult => {
  if (!isRecord(raw)) {
    throw new Error('El archivo no contiene un objeto JSON válido.');
  }

  const hasAnyTable = ['strains', 'lots', 'logs', 'tasks'].some(key =>
    Array.isArray(raw[key])
  );
  if (!hasAnyTable) {
    throw new Error('El archivo no tiene el formato de respaldo de GrowManager.');
  }

  const backup: BackupFile = {
    exportedAt: str(raw.exportedAt),
    appVersion: str(raw.appVersion),
    strains: parseRows(raw.strains, parseStrain),
    lots: parseRows(raw.lots, parseLot),
    logs: parseRows(raw.logs, parseLog),
    tasks: parseRows(raw.tasks, parseTask),
    helpers: parseRows(raw.helpers, parseHelper),
  };

  const countIn = (value: unknown) => (Array.isArray(value) ? value.length : 0);
  const originalTotal =
    countIn(raw.strains) + countIn(raw.lots) + countIn(raw.logs) + countIn(raw.tasks) +
    countIn(raw.helpers);
  const parsedTotal =
    backup.strains.length + backup.lots.length + backup.logs.length + backup.tasks.length +
    (backup.helpers?.length ?? 0);

  // Un registro cuyo lote no vino en el respaldo violaría la clave foránea.
  const lotIds = new Set(backup.lots.map(l => l.id));
  const logsBefore = backup.logs.length;
  const tasksBefore = backup.tasks.length;
  backup.logs = backup.logs.filter(l => lotIds.has(l.lot_id));
  backup.tasks = backup.tasks.filter(t => lotIds.has(t.lot_id));
  const orphans = logsBefore - backup.logs.length + (tasksBefore - backup.tasks.length);

  return { backup, skipped: originalTotal - parsedTotal + orphans };
};

/** Arma el objeto que se descarga como respaldo. */
export const buildBackup = (data: Omit<BackupFile, 'exportedAt' | 'appVersion'>): BackupFile => ({
  exportedAt: new Date().toISOString(),
  appVersion: '1.0.0',
  ...data,
});

/** Dispara la descarga de un archivo generado en el navegador. */
export const downloadFile = (content: string, filename: string, mimeType: string): void => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
};
