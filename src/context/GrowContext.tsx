/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Lot, Log, Task, Strain, Helper } from '../types/grow';
import { calculateVPD } from '../utils/calculations';
import { supabase } from '../lib/supabaseClient';
import { 
  VEG_SCHEDULE, 
  FLOWER_SCHEDULE, 
  ATHENA_PRO_VEG_SCHEDULE, 
  ATHENA_PRO_FLOWER_SCHEDULE, 
  ATHENA_BLENDED_VEG_SCHEDULE, 
  ATHENA_BLENDED_FLOWER_SCHEDULE 
} from '../utils/schedules';

const getSeeds = () => {
  const suffix = Math.random().toString(36).substring(2, 9) + '_' + Date.now();
  const initialStrains: Strain[] = [
    { id: `strain_${suffix}_1`, name: 'Moby Dick', type: 'Sativa' },
    { id: `strain_${suffix}_2`, name: 'Gorilla Glue #4', type: 'Híbrido' },
    { id: `strain_${suffix}_3`, name: 'Gelato #33', type: 'Híbrido' }
  ];

  const today = new Date();
  const date20DaysAgo = new Date(today.getTime() - (20 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];
  const date45DaysAgo = new Date(today.getTime() - (45 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];
  const todayStr = today.toISOString().split('T')[0];
  const tomorrowStr = new Date(today.getTime() + (24 * 60 * 60 * 1000)).toISOString().split('T')[0];
  const yesterdayStr = new Date(today.getTime() - (24 * 60 * 60 * 1000)).toISOString().split('T')[0];

  const lot1Id = `lot_${suffix}_1`;
  const lot2Id = `lot_${suffix}_2`;

  const initialLots: Lot[] = [
    {
      id: lot1Id,
      name: 'Carpa Vegetativo - Cama 1',
      strain: 'Moby Dick',
      plant_count: 4,
      stage: 'Vegetativo',
      start_date: date20DaysAgo,
      notes: 'Sustrato Fibra de Coco con perlita. LED 240W.',
      is_archived: false
    },
    {
      id: lot2Id,
      name: 'Cama 1 de Flora',
      strain: 'Zaza, Straw, PK, Skittles, DK',
      plant_count: 8,
      stage: 'Floración',
      start_date: date45DaysAgo,
      notes: 'Fibra de coco pura en camas elevadas. Riego mineral por goteo.',
      is_archived: false
    }
  ];

  const initialLogs: Log[] = [];
  for (let i = 7; i >= 0; i--) {
    const logTime = new Date(today.getTime() - (i * 3 * 60 * 60 * 1000));
    const temp = parseFloat((23.5 + Math.sin(i) * 1.8).toFixed(1));
    const humidity = Math.round(55 + Math.cos(i) * 8);
    const vpd = calculateVPD(temp, humidity);
    
    initialLogs.push({
      id: `log_${suffix}_${i}`,
      lot_id: lot2Id,
      date: logTime.toISOString(),
      temp,
      humidity,
      vpd,
      ph: 5.8,
      ec: 1.4,
      water_amount: 5,
      notes: 'Riego con sales minerales.'
    });
  }

  const initialTasks: Task[] = [
    { id: `task_${suffix}_1`, lot_id: lot2Id, title: 'Riego con Nutrientes Flora', date: todayStr, type: 'fertilizante', notes: 'Dosis: A: 3.8 ml/L, B: 3.8 ml/L, C: 2.6 ml/L. pH 5.8, EC 1.44.', is_completed: false },
    { id: `task_${suffix}_2`, lot_id: lot1Id, title: 'Aplicación Preventiva foliar', date: yesterdayStr, type: 'preventivo', notes: 'Pulverizar al apagarse las luces.', is_completed: true },
    { id: `task_${suffix}_3`, lot_id: lot1Id, title: 'Defoliación de bajos y poda', date: tomorrowStr, type: 'poda', notes: 'Quitar brotes débiles de la zona baja.', is_completed: false }
  ];

  return { initialStrains, initialLots, initialLogs, initialTasks };
};

interface GrowContextType {
  strains: Strain[];
  lots: Lot[];
  logs: Log[];
  tasks: Task[];
  helpers: Helper[];
  addLot: (lot: Omit<Lot, 'id' | 'is_archived'>) => Promise<void>;
  editLot: (lot: Lot) => Promise<void>;
  archiveLot: (id: string) => Promise<void>;
  unarchiveLot: (id: string) => Promise<void>;
  addLog: (log: Omit<Log, 'id' | 'date' | 'vpd'>) => Promise<void>;
  deleteLog: (id: string) => Promise<void>;
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
  importDatabase: (data: any) => Promise<void>;
  activeNutrientLine: 'ryanodine' | 'athena_pro' | 'athena_blended';
  setActiveNutrientLine: (line: 'ryanodine' | 'athena_pro' | 'athena_blended') => Promise<void>;
  irrigationMethod: 'manual' | 'automated';
  setIrrigationMethod: (method: 'manual' | 'automated') => void;
}

const GrowContext = createContext<GrowContextType | undefined>(undefined);

export const GrowProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [strains, setStrains] = useState<Strain[]>([]);
  const [lots, setLots] = useState<Lot[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [helpers, setHelpers] = useState<Helper[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados de Configuración Athena
  const [activeNutrientLine, setActiveNutrientLineState] = useState<'ryanodine' | 'athena_pro' | 'athena_blended'>(
    (localStorage.getItem('activeNutrientLine') as any) || 'ryanodine'
  );
  const [irrigationMethod, setIrrigationMethodState] = useState<'manual' | 'automated'>(
    (localStorage.getItem('irrigationMethod') as any) || 'manual'
  );

  const loadSeedsToSupabase = async () => {
    const seeds = getSeeds();
    try {
      await supabase.from('strains').insert(seeds.initialStrains);
      await supabase.from('lots').insert(seeds.initialLots);
      await supabase.from('logs').insert(seeds.initialLogs);
      await supabase.from('tasks').insert(seeds.initialTasks);

      setStrains(seeds.initialStrains);
      setLots(seeds.initialLots);
      setLogs(seeds.initialLogs);
      setTasks(seeds.initialTasks);
    } catch (err) {
      console.error("Error al cargar semillas en Supabase:", err);
    }
  };

  // Cargar datos de Supabase al iniciar
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [strainsRes, lotsRes, logsRes, tasksRes, helpersRes] = await Promise.all([
          supabase.from('strains').select('*'),
          supabase.from('lots').select('*'),
          supabase.from('logs').select('*').order('date', { ascending: false }),
          supabase.from('tasks').select('*').order('date', { ascending: true }),
          supabase.from('helpers').select('*')
        ]);

        if (strainsRes.error) throw strainsRes.error;
        if (lotsRes.error) throw lotsRes.error;
        if (logsRes.error) throw logsRes.error;
        if (tasksRes.error) throw tasksRes.error;
        if (helpersRes.error) throw helpersRes.error;

        setStrains(strainsRes.data || []);
        setLots(lotsRes.data || []);
        setLogs(logsRes.data || []);
        setTasks(tasksRes.data || []);
        setHelpers(helpersRes.data || []);
      } catch (err) {
        console.error("Error cargando datos de Supabase:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Generador de tareas automático con preservación de estado
  const generateScheduleTasks = async (
    lotId: string, 
    stage: string, 
    startDateStr: string,
    overrideLine?: 'ryanodine' | 'athena_pro' | 'athena_blended'
  ) => {
    try {
      const currentLine = overrideLine || activeNutrientLine;

      // 1. Obtener tareas autogeneradas actuales para ver cuáles están completadas
      const { data: oldTasks } = await supabase
        .from('tasks')
        .select('id, is_completed')
        .like('id', `task_sched_${lotId}_%`);
      
      const completedWeeks = new Set<string>();
      if (oldTasks) {
        oldTasks.forEach(ot => {
          if (ot.is_completed) {
            const match = ot.id.match(/_w(\d+)_/);
            if (match) completedWeeks.add(match[1]);
          }
        });
      }

      // 2. Eliminar tareas previas autogeneradas para este lote
      const { error: deleteError } = await supabase
        .from('tasks')
        .delete()
        .like('id', `task_sched_${lotId}_%`);
      
      if (deleteError) throw deleteError;

      // 3. Elegir el conjunto de semanas del cronograma según la etapa
      let scheduleWeeks: any[] = [];
      let label = '';
      if (stage === 'Vegetativo') {
        label = 'veg';
        if (currentLine === 'athena_pro') {
          scheduleWeeks = ATHENA_PRO_VEG_SCHEDULE;
        } else if (currentLine === 'athena_blended') {
          scheduleWeeks = ATHENA_BLENDED_VEG_SCHEDULE;
        } else {
          scheduleWeeks = VEG_SCHEDULE;
        }
      } else if (stage === 'Floración') {
        label = 'flo';
        if (currentLine === 'athena_pro') {
          scheduleWeeks = ATHENA_PRO_FLOWER_SCHEDULE;
        } else if (currentLine === 'athena_blended') {
          scheduleWeeks = ATHENA_BLENDED_FLOWER_SCHEDULE;
        } else {
          scheduleWeeks = FLOWER_SCHEDULE;
        }
      } else {
        // Para Germinación, Secado, Curado, etc. no autogeneramos cronograma de fertilizantes
        setTasks(prev => prev.filter(t => !t.id.startsWith(`task_sched_${lotId}_`)));
        return;
      }

      // 4. Generar tareas (una por semana) preservando is_completed
      const start = new Date(startDateStr + 'T00:00:00');
      const tasksToInsert: Task[] = scheduleWeeks.map((s, idx) => {
        const taskDate = new Date(start.getTime() + (idx * 7 * 24 * 60 * 60 * 1000));
        const isCompleted = completedWeeks.has(s.week.toString());
        
        let dosisText = '';
        if (currentLine === 'athena_pro') {
          const isFade = s.week === 8;
          dosisText = `Pro Bloom: ${s.makroA} g/10L, ${isFade ? 'Fade' : 'Pro Core'}: ${s.mikroB} ${isFade ? 'mL' : 'g'}/10L, Cleanse: ${s.calcisC} mL/10L`;
        } else if (currentLine === 'athena_blended') {
          const suffixDose = s.title.toLowerCase().includes('veg') ? 'Grow A & B' : 'Bloom A & B';
          dosisText = `${suffixDose}: ${s.makroA} mL/10L, CaMg / PK: ${s.calcisC} mL/10L, Cleanse: 0.8 mL/L`;
        } else {
          dosisText = `A: ${s.makroA} ml/L, B: ${s.mikroB} ml/L, C: ${s.calcisC} ml/L`;
        }

        return {
          id: `task_sched_${lotId}_${label}_w${s.week}_${idx}`,
          lot_id: lotId,
          title: `${s.title}`,
          date: taskDate.toISOString().split('T')[0],
          type: 'fertilizante',
          notes: `pH: ${s.ph} | EC: ${s.ec} mS/cm. Dosis: ${dosisText}. ${s.notes}`,
          is_completed: isCompleted
        };
      });

      if (tasksToInsert.length > 0) {
        const { error: insertError } = await supabase.from('tasks').insert(tasksToInsert);
        if (insertError) throw insertError;
      }

      // Actualizar estado local
      setTasks(prev => {
        const filtered = prev.filter(t => !t.id.startsWith(`task_sched_${lotId}_`));
        return [...filtered, ...tasksToInsert];
      });
    } catch (err) {
      console.error("Error al generar cronograma de tareas:", err);
    }
  };

  const setActiveNutrientLine = async (line: 'ryanodine' | 'athena_pro' | 'athena_blended') => {
    setActiveNutrientLineState(line);
    localStorage.setItem('activeNutrientLine', line);
    // Regenerar las tareas de todos los lotes no archivados
    for (const lot of lots.filter(l => !l.is_archived)) {
      await generateScheduleTasks(lot.id, lot.stage, lot.start_date, line);
    }
  };

  const setIrrigationMethod = (method: 'manual' | 'automated') => {
    setIrrigationMethodState(method);
    localStorage.setItem('irrigationMethod', method);
  };

  const addLot = async (lot: Omit<Lot, 'id' | 'is_archived'>) => {
    const newLot: Lot = {
      ...lot,
      id: 'lot_' + Date.now(),
      is_archived: false
    };
    try {
      const { error } = await supabase.from('lots').insert(newLot);
      if (error) throw error;
      setLots(prev => [...prev, newLot]);

      // Registrar strain automáticamente si no existe en el catálogo
      const strainExists = strains.some(s => s.name.toLowerCase() === lot.strain.toLowerCase());
      if (!strainExists && lot.strain.trim()) {
        await addStrain({ name: lot.strain.trim(), type: 'Híbrido' });
      }

      // Generar tareas semanales
      await generateScheduleTasks(newLot.id, newLot.stage, newLot.start_date);
    } catch (err) {
      console.error("Error al agregar lote:", err);
    }
  };

  const editLot = async (lot: Lot) => {
    try {
      const { error } = await supabase.from('lots').update(lot).eq('id', lot.id);
      if (error) throw error;
      setLots(prev => prev.map(l => l.id === lot.id ? lot : l));

      // Registrar strain automáticamente si no existe en el catálogo
      const strainExists = strains.some(s => s.name.toLowerCase() === lot.strain.toLowerCase());
      if (!strainExists && lot.strain.trim()) {
        await addStrain({ name: lot.strain.trim(), type: 'Híbrido' });
      }

      // Regenerar tareas si cambian fecha o fase
      await generateScheduleTasks(lot.id, lot.stage, lot.start_date);
    } catch (err) {
      console.error("Error al editar lote:", err);
    }
  };

  const archiveLot = async (id: string) => {
    try {
      const { error } = await supabase.from('lots').update({ is_archived: true }).eq('id', id);
      if (error) throw error;
      setLots(prev => prev.map(l => l.id === id ? { ...l, is_archived: true } : l));
    } catch (err) {
      console.error("Error al archivar lote:", err);
    }
  };

  const unarchiveLot = async (id: string) => {
    try {
      const { error } = await supabase.from('lots').update({ is_archived: false }).eq('id', id);
      if (error) throw error;
      setLots(prev => prev.map(l => l.id === id ? { ...l, is_archived: false } : l));
    } catch (err) {
      console.error("Error al reactivar lote:", err);
    }
  };

  const addStrain = async (strain: Omit<Strain, 'id'>) => {
    const newStrain: Strain = {
      ...strain,
      id: 'strain_' + Date.now()
    };
    try {
      const { error } = await supabase.from('strains').insert(newStrain);
      if (error) throw error;
      setStrains(prev => [...prev, newStrain]);
    } catch (err) {
      console.error("Error al agregar genética:", err);
    }
  };

  const deleteStrain = async (id: string) => {
    try {
      const { error } = await supabase.from('strains').delete().eq('id', id);
      if (error) throw error;
      setStrains(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      console.error("Error al borrar genética:", err);
    }
  };

  const addLog = async (log: Omit<Log, 'id' | 'date' | 'vpd'>) => {
    const vpd = calculateVPD(log.temp, log.humidity);
    const newLog: Log = {
      ...log,
      id: 'log_' + Date.now(),
      date: new Date().toISOString(),
      vpd
    };
    try {
      const { error } = await supabase.from('logs').insert(newLog);
      if (error) throw error;
      setLogs(prev => [newLog, ...prev]);
    } catch (err) {
      console.error("Error al agregar registro:", err);
    }
  };

  const deleteLog = async (id: string) => {
    try {
      const { error } = await supabase.from('logs').delete().eq('id', id);
      if (error) throw error;
      setLogs(prev => prev.filter(l => l.id !== id));
    } catch (err) {
      console.error("Error al borrar registro:", err);
    }
  };

  const addTask = async (task: Omit<Task, 'id' | 'is_completed'>) => {
    const newTask: Task = {
      ...task,
      id: 'task_' + Date.now(),
      is_completed: false
    };
    try {
      const { error } = await supabase.from('tasks').insert(newTask);
      if (error) throw error;
      setTasks(prev => [...prev, newTask]);
    } catch (err) {
      console.error("Error al agregar tarea:", err);
    }
  };

  const toggleTask = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const updatedTask = { ...task, is_completed: !task.is_completed };
    try {
      const { error } = await supabase.from('tasks').update({ is_completed: updatedTask.is_completed }).eq('id', id);
      if (error) throw error;
      setTasks(prev => prev.map(t => t.id === id ? updatedTask : t));
    } catch (err) {
      console.error("Error al actualizar tarea:", err);
    }
  };

  const deleteTask = async (id: string) => {
    try {
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      if (error) throw error;
      setTasks(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      console.error("Error al borrar tarea:", err);
    }
  };

  const addHelper = async (name: string) => {
    const newHelper: Helper = {
      id: 'helper_' + Date.now(),
      name
    };
    try {
      const { error } = await supabase.from('helpers').insert(newHelper);
      if (error) throw error;
      setHelpers(prev => [...prev, newHelper]);
    } catch (err) {
      console.error("Error al agregar ayudante:", err);
    }
  };

  const deleteHelper = async (id: string) => {
    try {
      const { error } = await supabase.from('helpers').delete().eq('id', id);
      if (error) throw error;
      setHelpers(prev => prev.filter(h => h.id !== id));
    } catch (err) {
      console.error("Error al borrar ayudante:", err);
    }
  };

  const uploadPhoto = async (file: File): Promise<string | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no autenticado");

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const filePath = fileName;

      const { error: uploadError } = await supabase.storage
        .from('grow-photos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('grow-photos')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (err) {
      console.error("Error al subir foto a Supabase Storage:", err);
      return null;
    }
  };

  const clearDatabase = async () => {
    try {
      await Promise.all([
        supabase.from('strains').delete().neq('id', 'keep_none'),
        supabase.from('lots').delete().neq('id', 'keep_none'),
        supabase.from('logs').delete().neq('id', 'keep_none'),
        supabase.from('tasks').delete().neq('id', 'keep_none'),
        supabase.from('helpers').delete().neq('id', 'keep_none')
      ]);
      setStrains([]);
      setLots([]);
      setLogs([]);
      setTasks([]);
      setHelpers([]);
    } catch (err) {
      console.error("Error al vaciar la base de datos:", err);
    }
  };

  const loadDemoData = async () => {
    try {
      setLoading(true);
      await loadSeedsToSupabase();
    } catch (err) {
      console.error("Error al cargar demo:", err);
    } finally {
      setLoading(false);
    }
  };

  const importDatabase = async (data: any) => {
    try {
      setLoading(true);
      await clearDatabase();
      if (data.strains && data.strains.length > 0) {
        const { error } = await supabase.from('strains').insert(data.strains);
        if (error) throw error;
        setStrains(data.strains);
      }
      if (data.lots && data.lots.length > 0) {
        const { error } = await supabase.from('lots').insert(data.lots);
        if (error) throw error;
        setLots(data.lots);
      }
      if (data.logs && data.logs.length > 0) {
        const { error } = await supabase.from('logs').insert(data.logs);
        if (error) throw error;
        setLogs(data.logs);
      }
      if (data.tasks && data.tasks.length > 0) {
        const { error } = await supabase.from('tasks').insert(data.tasks);
        if (error) throw error;
        setTasks(data.tasks);
      }
      if (data.helpers && data.helpers.length > 0) {
        const { error } = await supabase.from('helpers').insert(data.helpers);
        if (error) throw error;
        setHelpers(data.helpers);
      }
    } catch (err) {
      console.error("Error al importar base de datos:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <GrowContext.Provider value={{
      strains, lots, logs, tasks, helpers,
      addLot, editLot, archiveLot, unarchiveLot,
      addLog, deleteLog, addTask, toggleTask, deleteTask,
      addStrain, deleteStrain, addHelper, deleteHelper, uploadPhoto, clearDatabase, loadDemoData,
      importDatabase,
      activeNutrientLine, setActiveNutrientLine,
      irrigationMethod, setIrrigationMethod
    }}>
      {loading ? (
        <div className="flex min-h-screen bg-slate-50 text-slate-800 items-center justify-center font-sans">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-slate-500 text-sm animate-pulse font-medium">Conectando con Supabase...</p>
          </div>
        </div>
      ) : children}
    </GrowContext.Provider>
  );
};

export const useGrow = () => {
  const context = useContext(GrowContext);
  if (!context) throw new Error('useGrow debe ser usado dentro de un GrowProvider');
  return context;
};
