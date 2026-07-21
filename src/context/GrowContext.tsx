/* eslint-disable react-refresh/only-export-components */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type {
  AppError,
  BackupFile,
  DbStatus,
  Helper,
  IrrigationMethod,
  Log,
  Lot,
  NutrientLine,
  Strain,
  Task,
} from '../types/grow';
import { isIrrigationMethod, isNutrientLine } from '../types/grow';
import { calculateVPD } from '../utils/calculations';
import { getSchedule, formatDose } from '../utils/schedules';
import { addDaysToStr } from '../utils/date';
import { isSupabaseConfigured } from '../lib/supabaseClient';
import { useToast } from '../components/ToastProvider';
import * as api from '../api/growApi';
import { buildSeedData } from '../api/seedData';

// ─── Contextos ────────────────────────────────────────────────────────────────
//
// El estado y las acciones viajan por separado a propósito: las acciones son
// referencias estables, así que un componente que sólo dispara operaciones no se
// vuelve a renderizar cuando cambia una colección.

interface GrowData {
  strains: Strain[];
  lots: Lot[];
  logs: Log[];
  tasks: Task[];
  helpers: Helper[];
  /** Índice por id para evitar `lots.find()` dentro de bucles de render. */
  lotsById: Map<string, Lot>;
  activeLots: Lot[];
  activeNutrientLine: NutrientLine;
  irrigationMethod: IrrigationMethod;
  appErrors: AppError[];
  dbStatus: DbStatus;
  dbLatency: number | null;
  hasMoreLogs: boolean;
  loadingMoreLogs: boolean;
}

interface GrowActions {
  addLot: (lot: Omit<Lot, 'id' | 'is_archived'>) => Promise<void>;
  editLot: (lot: Lot) => Promise<void>;
  archiveLot: (id: string) => Promise<void>;
  unarchiveLot: (id: string) => Promise<void>;
  addLog: (log: Omit<Log, 'id' | 'date' | 'vpd'>) => Promise<void>;
  deleteLog: (id: string) => Promise<void>;
  loadMoreLogs: () => Promise<void>;
  addTask: (task: Omit<Task, 'id' | 'is_completed'>) => Promise<void>;
  toggleTask: (id: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  addStrain: (strain: Omit<Strain, 'id'>) => Promise<void>;
  deleteStrain: (id: string) => Promise<void>;
  addHelper: (name: string) => Promise<void>;
  deleteHelper: (id: string) => Promise<void>;
  uploadPhoto: (file: File) => Promise<string | null>;
  clearDatabase: () => Promise<void>;
  loadDemoData: () => Promise<void>;
  importDatabase: (data: BackupFile) => Promise<void>;
  setActiveNutrientLine: (line: NutrientLine) => Promise<void>;
  setIrrigationMethod: (method: IrrigationMethod) => void;
  clearAppErrors: () => void;
  checkDbConnection: () => Promise<void>;
  cleanOrphanedRecords: () => Promise<api.OrphanCleanupResult>;
}

const GrowDataContext = createContext<GrowData | undefined>(undefined);
const GrowActionsContext = createContext<GrowActions | undefined>(undefined);

// ─── Preferencias locales ─────────────────────────────────────────────────────

const readNutrientLine = (): NutrientLine => {
  const stored = localStorage.getItem('activeNutrientLine');
  return isNutrientLine(stored) ? stored : 'ryanodine';
};

const readIrrigationMethod = (): IrrigationMethod => {
  const stored = localStorage.getItem('irrigationMethod');
  return isIrrigationMethod(stored) ? stored : 'manual';
};

// ─── Provider ─────────────────────────────────────────────────────────────────

export const GrowProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const toast = useToast();

  const [strains, setStrains] = useState<Strain[]>([]);
  const [lots, setLots] = useState<Lot[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [helpers, setHelpers] = useState<Helper[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMoreLogs, setHasMoreLogs] = useState(false);
  const [loadingMoreLogs, setLoadingMoreLogs] = useState(false);

  const [appErrors, setAppErrors] = useState<AppError[]>([]);
  const [dbStatus, setDbStatus] = useState<DbStatus>('loading');
  const [dbLatency, setDbLatency] = useState<number | null>(null);

  const [activeNutrientLine, setActiveNutrientLineState] =
    useState<NutrientLine>(readNutrientLine);
  const [irrigationMethod, setIrrigationMethodState] =
    useState<IrrigationMethod>(readIrrigationMethod);

  // Espejos del estado para que las acciones puedan leer valores actuales sin
  // recrearse en cada render (y sin capturar closures viejos).
  const stateRef = useRef({ lots, tasks, strains, logs, activeNutrientLine });
  useEffect(() => {
    stateRef.current = { lots, tasks, strains, logs, activeNutrientLine };
  }, [lots, tasks, strains, logs, activeNutrientLine]);

  // ─── Manejo de errores ──────────────────────────────────────────────────────

  const logAppError = useCallback((context: string, error: unknown) => {
    console.error(`[${context}]`, error);
    const message =
      error instanceof Error
        ? error.message
        : typeof error === 'object' && error !== null
          ? JSON.stringify(error)
          : String(error);

    setAppErrors(prev =>
      [
        {
          id: `err_${crypto.randomUUID()}`,
          timestamp: new Date().toISOString(),
          context,
          message,
          stack: error instanceof Error ? error.stack : undefined,
        },
        ...prev,
      ].slice(0, 50)
    );
    return message;
  }, []);

  /**
   * Ejecuta una operación contra Supabase informando el resultado al usuario.
   * Devuelve `true` si salió bien. Antes los errores se tragaban en silencio y
   * la interfaz simulaba éxito.
   */
  const run = useCallback(
    async (context: string, operation: () => Promise<void>): Promise<boolean> => {
      try {
        await operation();
        return true;
      } catch (error) {
        const message = logAppError(context, error);
        toast.error(`No se pudo completar: ${context.toLowerCase()}`, message);
        return false;
      }
    },
    [logAppError, toast]
  );

  const clearAppErrors = useCallback(() => setAppErrors([]), []);

  // ─── Carga inicial ──────────────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!isSupabaseConfigured) {
        setDbStatus('config_error');
        setLoading(false);
        return;
      }

      try {
        const data = await api.fetchInitialData();
        if (cancelled) return;
        setStrains(data.strains);
        setLots(data.lots);
        setLogs(data.logs);
        setTasks(data.tasks);
        setHelpers(data.helpers);
        setHasMoreLogs(data.hasMoreLogs);
        setDbStatus('connected');
      } catch (error) {
        if (cancelled) return;
        logAppError('Cargar datos de Supabase', error);
        const message = error instanceof Error ? error.message : '';
        setDbStatus(
          message.includes('JWT') || message.includes('auth') ? 'auth_error' : 'disconnected'
        );
        toast.error('No se pudieron cargar los datos', message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
    // Sólo debe correr al montar; `toast` y `logAppError` son estables.
  }, [logAppError, toast]);

  const checkDbConnection = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setDbStatus('config_error');
      return;
    }
    try {
      const { latencyMs } = await api.pingDatabase();
      setDbLatency(latencyMs);
      setDbStatus('connected');
    } catch (error) {
      const code = (error as { code?: string }).code;
      const message = error instanceof Error ? error.message : '';
      setDbStatus(
        code === 'PGRST111' || message.includes('JWT') || message.includes('auth')
          ? 'auth_error'
          : 'disconnected'
      );
      logAppError('Probar conexión Supabase', error);
    }
  }, [logAppError]);

  // ─── Cronogramas automáticos ────────────────────────────────────────────────

  const generateScheduleTasks = useCallback(
    async (lot: Pick<Lot, 'id' | 'stage' | 'start_date'>, line: NutrientLine) => {
      const schedule = getSchedule(lot.stage, line);
      const stageLabel = lot.stage === 'Vegetativo' ? 'veg' : 'flo';

      // Germinación, secado y curado no llevan cronograma de fertilizantes.
      if (schedule.length === 0) {
        await api.replaceScheduleTasks(lot.id, []);
        setTasks(prev =>
          prev.filter(t => !t.id.startsWith(api.scheduleTaskPrefix(lot.id)))
        );
        return;
      }

      // Preservar qué semanas ya estaban marcadas como completadas.
      const completedWeeks = await api.fetchCompletedScheduleWeeks(lot.id);

      const newTasks: Task[] = schedule.map((week, index) => ({
        id: `${api.scheduleTaskPrefix(lot.id)}${stageLabel}_w${week.week}_${index}`,
        lot_id: lot.id,
        title: week.title,
        date: addDaysToStr(lot.start_date, index * 7),
        type: 'fertilizante',
        notes: `pH: ${week.ph} | EC: ${week.ec} mS/cm. Dosis: ${formatDose(week, line)}. ${week.notes}`,
        is_completed: completedWeeks.has(String(week.week)),
      }));

      await api.replaceScheduleTasks(lot.id, newTasks);
      setTasks(prev => [
        ...prev.filter(t => !t.id.startsWith(api.scheduleTaskPrefix(lot.id))),
        ...newTasks,
      ]);
    },
    []
  );

  // ─── Genéticas ──────────────────────────────────────────────────────────────

  const addStrain = useCallback(
    async (strain: Omit<Strain, 'id'>) => {
      const newStrain: Strain = { ...strain, id: api.generateId('strain') };
      const ok = await run('Agregar genética', () => api.insertStrain(newStrain));
      if (ok) setStrains(prev => [...prev, newStrain]);
    },
    [run]
  );

  const deleteStrain = useCallback(
    async (id: string) => {
      const strain = stateRef.current.strains.find(s => s.id === id);
      const usedBy = strain
        ? stateRef.current.lots.filter(
            l => !l.is_archived && l.strain.toLowerCase() === strain.name.toLowerCase()
          )
        : [];

      const ok = await run('Borrar genética', () => api.deleteStrain(id));
      if (!ok) return;

      setStrains(prev => prev.filter(s => s.id !== id));
      if (usedBy.length > 0) {
        toast.warning(
          'Genética eliminada del catálogo',
          `${usedBy.length} lote(s) activo(s) siguen usando "${strain?.name}". El nombre queda en esos lotes pero ya no está en el catálogo.`
        );
      }
    },
    [run, toast]
  );

  /** Registra una genética nueva en el catálogo si el lote usa una desconocida. */
  const ensureStrainExists = useCallback(
    async (strainName: string) => {
      const name = strainName.trim();
      if (!name) return;
      const exists = stateRef.current.strains.some(
        s => s.name.toLowerCase() === name.toLowerCase()
      );
      if (!exists) await addStrain({ name, type: 'Híbrido' });
    },
    [addStrain]
  );

  // ─── Lotes ──────────────────────────────────────────────────────────────────

  const addLot = useCallback(
    async (lot: Omit<Lot, 'id' | 'is_archived'>) => {
      const newLot: Lot = { ...lot, id: api.generateId('lot'), is_archived: false };

      const ok = await run('Agregar lote', () => api.insertLot(newLot));
      if (!ok) return;

      setLots(prev => [...prev, newLot]);
      await ensureStrainExists(newLot.strain);
      await run('Generar cronograma', () =>
        generateScheduleTasks(newLot, stateRef.current.activeNutrientLine)
      );
      toast.success('Lote creado', newLot.name);
    },
    [run, ensureStrainExists, generateScheduleTasks, toast]
  );

  const editLot = useCallback(
    async (lot: Lot) => {
      const previous = stateRef.current.lots.find(l => l.id === lot.id);

      const ok = await run('Editar lote', () => api.updateLot(lot));
      if (!ok) return;

      setLots(prev => prev.map(l => (l.id === lot.id ? lot : l)));
      await ensureStrainExists(lot.strain);

      // Regenerar el cronograma SÓLO si cambió algo que lo afecta. Antes se
      // borraba y reinsertaba siempre, perdiendo las notas editadas a mano.
      const scheduleChanged =
        !previous ||
        previous.stage !== lot.stage ||
        previous.start_date !== lot.start_date;

      if (scheduleChanged) {
        await run('Regenerar cronograma', () =>
          generateScheduleTasks(lot, stateRef.current.activeNutrientLine)
        );
      }
      toast.success('Lote actualizado', lot.name);
    },
    [run, ensureStrainExists, generateScheduleTasks, toast]
  );

  const archiveLot = useCallback(
    async (id: string) => {
      const ok = await run('Archivar lote', () => api.setLotArchived(id, true));
      if (ok) setLots(prev => prev.map(l => (l.id === id ? { ...l, is_archived: true } : l)));
    },
    [run]
  );

  const unarchiveLot = useCallback(
    async (id: string) => {
      const ok = await run('Reactivar lote', () => api.setLotArchived(id, false));
      if (ok) setLots(prev => prev.map(l => (l.id === id ? { ...l, is_archived: false } : l)));
    },
    [run]
  );

  // ─── Registros diarios ──────────────────────────────────────────────────────

  const addLog = useCallback(
    async (log: Omit<Log, 'id' | 'date' | 'vpd'>) => {
      const newLog: Log = {
        ...log,
        id: api.generateId('log'),
        date: new Date().toISOString(),
        vpd: calculateVPD(log.temp, log.humidity),
      };
      const ok = await run('Agregar registro diario', () => api.insertLog(newLog));
      if (ok) setLogs(prev => [newLog, ...prev]);
    },
    [run]
  );

  const deleteLog = useCallback(
    async (id: string) => {
      const ok = await run('Borrar registro diario', () => api.deleteLog(id));
      if (ok) setLogs(prev => prev.filter(l => l.id !== id));
    },
    [run]
  );

  const loadMoreLogs = useCallback(async () => {
    setLoadingMoreLogs(true);
    try {
      const { logs: nextLogs, hasMore } = await api.fetchLogsPage(
        stateRef.current.logs.length
      );
      // Deduplicar por si entró un registro nuevo mientras se paginaba.
      setLogs(prev => {
        const seen = new Set(prev.map(l => l.id));
        return [...prev, ...nextLogs.filter(l => !seen.has(l.id))];
      });
      setHasMoreLogs(hasMore);
    } catch (error) {
      const message = logAppError('Cargar más registros', error);
      toast.error('No se pudieron cargar más registros', message);
    } finally {
      setLoadingMoreLogs(false);
    }
  }, [logAppError, toast]);

  // ─── Tareas ─────────────────────────────────────────────────────────────────

  const addTask = useCallback(
    async (task: Omit<Task, 'id' | 'is_completed'>) => {
      const newTask: Task = { ...task, id: api.generateId('task'), is_completed: false };
      const ok = await run('Agregar tarea', () => api.insertTask(newTask));
      if (ok) setTasks(prev => [...prev, newTask]);
    },
    [run]
  );

  const toggleTask = useCallback(
    async (id: string) => {
      const task = stateRef.current.tasks.find(t => t.id === id);
      if (!task) return;

      const nextCompleted = !task.is_completed;
      // Actualización optimista: el checkbox responde al instante.
      setTasks(prev =>
        prev.map(t => (t.id === id ? { ...t, is_completed: nextCompleted } : t))
      );

      const ok = await run('Actualizar tarea', () => api.setTaskCompleted(id, nextCompleted));
      if (!ok) {
        setTasks(prev =>
          prev.map(t => (t.id === id ? { ...t, is_completed: task.is_completed } : t))
        );
      }
    },
    [run]
  );

  const deleteTask = useCallback(
    async (id: string) => {
      const ok = await run('Borrar tarea', () => api.deleteTask(id));
      if (ok) setTasks(prev => prev.filter(t => t.id !== id));
    },
    [run]
  );

  // ─── Ayudantes ──────────────────────────────────────────────────────────────

  const addHelper = useCallback(
    async (name: string) => {
      const newHelper: Helper = { id: api.generateId('helper'), name };
      const ok = await run('Agregar ayudante', () => api.insertHelper(newHelper));
      if (ok) setHelpers(prev => [...prev, newHelper]);
    },
    [run]
  );

  const deleteHelper = useCallback(
    async (id: string) => {
      const ok = await run('Borrar ayudante', () => api.deleteHelper(id));
      if (ok) setHelpers(prev => prev.filter(h => h.id !== id));
    },
    [run]
  );

  // ─── Fotos ──────────────────────────────────────────────────────────────────

  const uploadPhoto = useCallback(
    async (file: File): Promise<string | null> => {
      try {
        return await api.uploadPhoto(file);
      } catch (error) {
        const message = logAppError('Subir foto', error);
        toast.error('No se pudo subir la foto', message);
        return null;
      }
    },
    [logAppError, toast]
  );

  // ─── Configuración ──────────────────────────────────────────────────────────

  const setActiveNutrientLine = useCallback(
    async (line: NutrientLine) => {
      setActiveNutrientLineState(line);
      localStorage.setItem('activeNutrientLine', line);
      stateRef.current.activeNutrientLine = line;

      // Regenerar los cronogramas de los lotes activos con recetas.
      // Antes esto vivía dentro de un `setLots(current => ...)`, lo que bajo
      // StrictMode disparaba la regeneración dos veces.
      const activeLots = stateRef.current.lots.filter(
        l => !l.is_archived && getSchedule(l.stage, line).length > 0
      );

      const ok = await run('Regenerar cronogramas', async () => {
        for (const lot of activeLots) {
          await generateScheduleTasks(lot, line);
        }
      });
      if (ok && activeLots.length > 0) {
        toast.success(
          'Cronogramas actualizados',
          `Se regeneraron las recetas de ${activeLots.length} lote(s).`
        );
      }
    },
    [run, generateScheduleTasks, toast]
  );

  const setIrrigationMethod = useCallback((method: IrrigationMethod) => {
    setIrrigationMethodState(method);
    localStorage.setItem('irrigationMethod', method);
  }, []);

  // ─── Mantenimiento ──────────────────────────────────────────────────────────

  const cleanOrphanedRecords = useCallback(async () => {
    const lotIds = new Set(stateRef.current.lots.map(l => l.id));
    const orphanedLogs = stateRef.current.logs.filter(l => !lotIds.has(l.lot_id));
    const orphanedTasks = stateRef.current.tasks.filter(t => !lotIds.has(t.lot_id));

    try {
      const result = await api.deleteOrphans(
        orphanedLogs.map(l => l.id),
        orphanedTasks.map(t => t.id)
      );
      setLogs(prev => prev.filter(l => lotIds.has(l.lot_id)));
      setTasks(prev => prev.filter(t => lotIds.has(t.lot_id)));
      return result;
    } catch (error) {
      const message = logAppError('Limpiar registros huérfanos', error);
      toast.error('No se pudo limpiar', message);
      throw error;
    }
  }, [logAppError, toast]);

  const clearDatabase = useCallback(async () => {
    const ok = await run('Vaciar base de datos', () => api.clearAllData());
    if (!ok) return;
    setStrains([]);
    setLots([]);
    setLogs([]);
    setTasks([]);
    setHelpers([]);
    setHasMoreLogs(false);
    toast.success('Base de datos vaciada');
  }, [run, toast]);

  const loadDemoData = useCallback(async () => {
    const seeds = buildSeedData();
    const ok = await run('Cargar datos de demostración', () =>
      api.importBackup({ ...seeds, helpers: [] }).then(() => undefined)
    );
    if (!ok) return;
    setStrains(seeds.strains);
    setLots(seeds.lots);
    setLogs(seeds.logs);
    setTasks(seeds.tasks);
    setHelpers([]);
    toast.success('Datos de demostración cargados');
  }, [run, toast]);

  const importDatabase = useCallback(
    async (data: BackupFile) => {
      setLoading(true);
      try {
        const imported = await api.importBackup(data);
        setStrains(imported.strains);
        setLots(imported.lots);
        setLogs(imported.logs);
        setTasks(imported.tasks);
        setHelpers(imported.helpers ?? []);
        setHasMoreLogs(false);
        toast.success('Importación completada');
      } catch (error) {
        const message = logAppError('Importar base de datos', error);
        toast.error('Falló la importación', message);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [logAppError, toast]
  );

  // ─── Valores de contexto ────────────────────────────────────────────────────

  const lotsById = useMemo(() => new Map(lots.map(lot => [lot.id, lot])), [lots]);
  const activeLots = useMemo(() => lots.filter(l => !l.is_archived), [lots]);

  const data = useMemo<GrowData>(
    () => ({
      strains,
      lots,
      logs,
      tasks,
      helpers,
      lotsById,
      activeLots,
      activeNutrientLine,
      irrigationMethod,
      appErrors,
      dbStatus,
      dbLatency,
      hasMoreLogs,
      loadingMoreLogs,
    }),
    [
      strains,
      lots,
      logs,
      tasks,
      helpers,
      lotsById,
      activeLots,
      activeNutrientLine,
      irrigationMethod,
      appErrors,
      dbStatus,
      dbLatency,
      hasMoreLogs,
      loadingMoreLogs,
    ]
  );

  const actions = useMemo<GrowActions>(
    () => ({
      addLot,
      editLot,
      archiveLot,
      unarchiveLot,
      addLog,
      deleteLog,
      loadMoreLogs,
      addTask,
      toggleTask,
      deleteTask,
      addStrain,
      deleteStrain,
      addHelper,
      deleteHelper,
      uploadPhoto,
      clearDatabase,
      loadDemoData,
      importDatabase,
      setActiveNutrientLine,
      setIrrigationMethod,
      clearAppErrors,
      checkDbConnection,
      cleanOrphanedRecords,
    }),
    [
      addLot,
      editLot,
      archiveLot,
      unarchiveLot,
      addLog,
      deleteLog,
      loadMoreLogs,
      addTask,
      toggleTask,
      deleteTask,
      addStrain,
      deleteStrain,
      addHelper,
      deleteHelper,
      uploadPhoto,
      clearDatabase,
      loadDemoData,
      importDatabase,
      setActiveNutrientLine,
      setIrrigationMethod,
      clearAppErrors,
      checkDbConnection,
      cleanOrphanedRecords,
    ]
  );

  return (
    <GrowActionsContext.Provider value={actions}>
      <GrowDataContext.Provider value={data}>
        {loading ? <LoadingScreen /> : children}
      </GrowDataContext.Provider>
    </GrowActionsContext.Provider>
  );
};

const LoadingScreen = () => (
  <div className="flex min-h-screen bg-slate-50 text-slate-800 items-center justify-center font-sans">
    <div className="text-center space-y-4">
      <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
      <p className="text-slate-500 text-sm animate-pulse font-medium">
        Conectando con Supabase...
      </p>
    </div>
  </div>
);

// ─── Hooks ────────────────────────────────────────────────────────────────────

/** Estado del cultivo. Se vuelve a renderizar cuando cambian los datos. */
export const useGrow = (): GrowData => {
  const context = useContext(GrowDataContext);
  if (!context) throw new Error('useGrow debe usarse dentro de un GrowProvider');
  return context;
};

/** Operaciones sobre el cultivo. Referencias estables: no provocan re-render. */
export const useGrowActions = (): GrowActions => {
  const context = useContext(GrowActionsContext);
  if (!context) throw new Error('useGrowActions debe usarse dentro de un GrowProvider');
  return context;
};
