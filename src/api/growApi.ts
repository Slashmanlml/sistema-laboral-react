// =============================================================================
// Acceso a datos de Supabase.
//
// Todas las funciones LANZAN si Supabase devuelve error. Antes cada operación
// atrapaba el error y sólo lo escribía en una consola interna, así que la UI
// mostraba "guardado" aunque el insert hubiese fallado.
// =============================================================================

import { supabase } from '../lib/supabaseClient';
import type { BackupFile, Helper, Log, Lot, Strain, Task } from '../types/grow';

/** Cantidad de registros diarios que se traen en la carga inicial. */
export const LOGS_PAGE_SIZE = 200;

/** Identificador único y ordenable por prefijo de entidad. */
export const generateId = (prefix: string): string =>
  `${prefix}_${crypto.randomUUID()}`;

/** Prefijo de las tareas generadas automáticamente por el cronograma. */
export const scheduleTaskPrefix = (lotId: string): string => `task_sched_${lotId}_`;

/** Escapa los comodines de LIKE (`%` y `_`) para que un id no se interprete como patrón. */
const escapeLikePattern = (value: string): string =>
  value.replace(/([\\%_])/g, '\\$1');

interface SupabaseResult<T> {
  data: T | null;
  error: { message: string; code?: string } | null;
}

/** Desempaqueta una respuesta de Supabase, lanzando si trae error. */
const unwrap = <T>(result: SupabaseResult<T>, context: string): T => {
  if (result.error) {
    throw new Error(`${context}: ${result.error.message}`);
  }
  return (result.data ?? []) as T;
};

// ─── Carga inicial ────────────────────────────────────────────────────────────

export interface InitialData {
  strains: Strain[];
  lots: Lot[];
  logs: Log[];
  tasks: Task[];
  helpers: Helper[];
  hasMoreLogs: boolean;
}

export const fetchInitialData = async (): Promise<InitialData> => {
  const [strainsRes, lotsRes, logsRes, tasksRes, helpersRes] = await Promise.all([
    supabase.from('strains').select('*'),
    supabase.from('lots').select('*'),
    supabase
      .from('logs')
      .select('*')
      .order('date', { ascending: false })
      .range(0, LOGS_PAGE_SIZE - 1),
    supabase.from('tasks').select('*').order('date', { ascending: true }),
    supabase.from('helpers').select('*'),
  ]);

  const logs = unwrap<Log[]>(logsRes, 'Cargando registros');

  return {
    strains: unwrap<Strain[]>(strainsRes, 'Cargando genéticas'),
    lots: unwrap<Lot[]>(lotsRes, 'Cargando lotes'),
    logs,
    tasks: unwrap<Task[]>(tasksRes, 'Cargando tareas'),
    helpers: unwrap<Helper[]>(helpersRes, 'Cargando ayudantes'),
    hasMoreLogs: logs.length === LOGS_PAGE_SIZE,
  };
};

/** Trae la siguiente página de registros diarios (paginación en el servidor). */
export const fetchLogsPage = async (
  offset: number
): Promise<{ logs: Log[]; hasMore: boolean }> => {
  const result = await supabase
    .from('logs')
    .select('*')
    .order('date', { ascending: false })
    .range(offset, offset + LOGS_PAGE_SIZE - 1);

  const logs = unwrap<Log[]>(result, 'Cargando más registros');
  return { logs, hasMore: logs.length === LOGS_PAGE_SIZE };
};

// ─── Diagnóstico ──────────────────────────────────────────────────────────────

export interface PingResult {
  latencyMs: number;
}

export const pingDatabase = async (): Promise<PingResult> => {
  const startedAt = Date.now();
  const { error } = await supabase.from('strains').select('id').limit(1);
  if (error) throw Object.assign(new Error(error.message), { code: error.code });
  return { latencyMs: Date.now() - startedAt };
};

// ─── Genéticas ────────────────────────────────────────────────────────────────

export const insertStrain = async (strain: Strain): Promise<void> => {
  const { error } = await supabase.from('strains').insert(strain);
  if (error) throw new Error(`Agregar genética: ${error.message}`);
};

export const deleteStrain = async (id: string): Promise<void> => {
  const { error } = await supabase.from('strains').delete().eq('id', id);
  if (error) throw new Error(`Borrar genética: ${error.message}`);
};

// ─── Lotes ────────────────────────────────────────────────────────────────────

export const insertLot = async (lot: Lot): Promise<void> => {
  const { error } = await supabase.from('lots').insert(lot);
  if (error) throw new Error(`Agregar lote: ${error.message}`);
};

export const updateLot = async (lot: Lot): Promise<void> => {
  const { error } = await supabase.from('lots').update(lot).eq('id', lot.id);
  if (error) throw new Error(`Editar lote: ${error.message}`);
};

export const setLotArchived = async (id: string, isArchived: boolean): Promise<void> => {
  const { error } = await supabase
    .from('lots')
    .update({ is_archived: isArchived })
    .eq('id', id);
  if (error) {
    throw new Error(`${isArchived ? 'Archivar' : 'Reactivar'} lote: ${error.message}`);
  }
};

// ─── Registros diarios ────────────────────────────────────────────────────────

export const insertLog = async (log: Log): Promise<void> => {
  const { error } = await supabase.from('logs').insert(log);
  if (error) throw new Error(`Agregar registro diario: ${error.message}`);
};

export const deleteLog = async (id: string): Promise<void> => {
  const { error } = await supabase.from('logs').delete().eq('id', id);
  if (error) throw new Error(`Borrar registro diario: ${error.message}`);
};

// ─── Tareas ───────────────────────────────────────────────────────────────────

export const insertTask = async (task: Task): Promise<void> => {
  const { error } = await supabase.from('tasks').insert(task);
  if (error) throw new Error(`Agregar tarea: ${error.message}`);
};

export const setTaskCompleted = async (id: string, isCompleted: boolean): Promise<void> => {
  const { error } = await supabase
    .from('tasks')
    .update({ is_completed: isCompleted })
    .eq('id', id);
  if (error) throw new Error(`Actualizar tarea: ${error.message}`);
};

export const deleteTask = async (id: string): Promise<void> => {
  const { error } = await supabase.from('tasks').delete().eq('id', id);
  if (error) throw new Error(`Borrar tarea: ${error.message}`);
};

/** Devuelve las semanas ya completadas de las tareas autogeneradas de un lote. */
export const fetchCompletedScheduleWeeks = async (lotId: string): Promise<Set<string>> => {
  const { data, error } = await supabase
    .from('tasks')
    .select('id, is_completed')
    .like('id', `${escapeLikePattern(scheduleTaskPrefix(lotId))}%`);

  if (error) throw new Error(`Leer cronograma previo: ${error.message}`);

  const completed = new Set<string>();
  for (const task of data ?? []) {
    if (!task.is_completed) continue;
    const match = /_w(\d+)_/.exec(task.id);
    if (match) completed.add(match[1]);
  }
  return completed;
};

/** Reemplaza las tareas autogeneradas de un lote por el conjunto nuevo. */
export const replaceScheduleTasks = async (
  lotId: string,
  tasks: Task[]
): Promise<void> => {
  const { error: deleteError } = await supabase
    .from('tasks')
    .delete()
    .like('id', `${escapeLikePattern(scheduleTaskPrefix(lotId))}%`);
  if (deleteError) throw new Error(`Limpiar cronograma: ${deleteError.message}`);

  if (tasks.length === 0) return;

  const { error: insertError } = await supabase.from('tasks').insert(tasks);
  if (insertError) throw new Error(`Generar cronograma: ${insertError.message}`);
};

// ─── Ayudantes ────────────────────────────────────────────────────────────────

export const insertHelper = async (helper: Helper): Promise<void> => {
  const { error } = await supabase.from('helpers').insert(helper);
  if (error) throw new Error(`Agregar ayudante: ${error.message}`);
};

export const deleteHelper = async (id: string): Promise<void> => {
  const { error } = await supabase.from('helpers').delete().eq('id', id);
  if (error) throw new Error(`Borrar ayudante: ${error.message}`);
};

// ─── Fotos ────────────────────────────────────────────────────────────────────

export const uploadPhoto = async (file: File): Promise<string> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuario no autenticado');

  const extension = file.name.split('.').pop() ?? 'jpg';
  const path = `${user.id}/${Date.now()}.${extension}`;

  const { error } = await supabase.storage.from('grow-photos').upload(path, file);
  if (error) throw new Error(`Subir foto: ${error.message}`);

  const {
    data: { publicUrl },
  } = supabase.storage.from('grow-photos').getPublicUrl(path);
  return publicUrl;
};

// ─── Mantenimiento ────────────────────────────────────────────────────────────

/**
 * Vacía todas las tablas del usuario actual (RLS limita el alcance a sus filas).
 * El orden importa: primero las tablas hijas, después los lotes.
 */
export const clearAllData = async (): Promise<void> => {
  const childTables = ['logs', 'tasks'] as const;
  for (const table of childTables) {
    const { error } = await supabase.from(table).delete().not('id', 'is', null);
    if (error) throw new Error(`Vaciar ${table}: ${error.message}`);
  }

  const parentTables = ['lots', 'strains', 'helpers'] as const;
  for (const table of parentTables) {
    const { error } = await supabase.from(table).delete().not('id', 'is', null);
    if (error) throw new Error(`Vaciar ${table}: ${error.message}`);
  }
};

export interface OrphanCleanupResult {
  orphanedLogsCount: number;
  orphanedTasksCount: number;
}

export const deleteOrphans = async (
  orphanedLogIds: string[],
  orphanedTaskIds: string[]
): Promise<OrphanCleanupResult> => {
  if (orphanedLogIds.length > 0) {
    const { error } = await supabase.from('logs').delete().in('id', orphanedLogIds);
    if (error) throw new Error(`Limpiar registros huérfanos: ${error.message}`);
  }
  if (orphanedTaskIds.length > 0) {
    const { error } = await supabase.from('tasks').delete().in('id', orphanedTaskIds);
    if (error) throw new Error(`Limpiar tareas huérfanas: ${error.message}`);
  }
  return {
    orphanedLogsCount: orphanedLogIds.length,
    orphanedTasksCount: orphanedTaskIds.length,
  };
};

/** Reasigna las filas importadas al usuario actual y las inserta. */
export const importBackup = async (backup: BackupFile): Promise<BackupFile> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user?.id;

  const reassign = <T extends { user_id?: string }>(rows: T[]): T[] =>
    rows.map(({ user_id: _ignored, ...rest }) => ({
      ...(rest as T),
      ...(userId ? { user_id: userId } : {}),
    }));

  await clearAllData();

  // El orden respeta las claves foráneas: lotes antes que logs y tareas.
  const strains = reassign(backup.strains ?? []);
  const lots = reassign(backup.lots ?? []);
  const logs = reassign(backup.logs ?? []);
  const tasks = reassign(backup.tasks ?? []);
  const helpers = reassign(backup.helpers ?? []);

  const inserts: [string, unknown[]][] = [
    ['strains', strains],
    ['lots', lots],
    ['helpers', helpers],
    ['logs', logs],
    ['tasks', tasks],
  ];

  for (const [table, rows] of inserts) {
    if (rows.length === 0) continue;
    const { error } = await supabase.from(table).insert(rows);
    if (error) throw new Error(`Importar ${table}: ${error.message}`);
  }

  return { strains, lots, logs, tasks, helpers };
};
