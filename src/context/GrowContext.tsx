/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Lot, Log, Task, Strain } from '../types/grow';
import { calculateVPD } from '../utils/calculations';
import { supabase } from '../lib/supabaseClient';

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
      name: 'Carpa Vegetativo - Domo 1',
      strain: 'Moby Dick',
      plant_count: 4,
      stage: 'Vegetativo',
      start_date: date20DaysAgo,
      notes: 'Sustrato Light Mix, iluminación LED 240W. Entrenando en LST.',
      is_archived: false
    },
    {
      id: lot2Id,
      name: 'Sala Flora Principal',
      strain: 'Gorilla Glue #4',
      plant_count: 8,
      stage: 'Floración',
      start_date: date45DaysAgo,
      notes: 'Maceteros de tela de 15L con supersoil. Sistema Scrog.',
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
      ph: 6.3,
      ec: 1.4,
      water_amount: 5,
      notes: 'Riego rutinario.'
    });
  }

  const initialTasks: Task[] = [
    { id: `task_${suffix}_1`, lot_id: lot2Id, title: 'Riego con Nutrientes Flora', date: todayStr, type: 'fertilizante', notes: 'Diluir 2ml/L FloraBloom en agua desclorada.', is_completed: false },
    { id: `task_${suffix}_2`, lot_id: lot1Id, title: 'Aplicación Preventiva de Neem', date: yesterdayStr, type: 'preventivo', notes: 'Pulverizar foliar al apagarse las luces.', is_completed: true },
    { id: `task_${suffix}_3`, lot_id: lot1Id, title: 'Defoliación de bajos y poda', date: tomorrowStr, type: 'poda', notes: 'Quitar brotes débiles de la zona baja.', is_completed: false }
  ];

  return { initialStrains, initialLots, initialLogs, initialTasks };
};

interface GrowContextType {
  strains: Strain[];
  lots: Lot[];
  logs: Log[];
  tasks: Task[];
  addLot: (lot: Omit<Lot, 'id' | 'is_archived'>) => void;
  editLot: (lot: Lot) => void;
  archiveLot: (id: string) => void;
  unarchiveLot: (id: string) => void;
  addLog: (log: Omit<Log, 'id' | 'date' | 'vpd'>) => void;
  deleteLog: (id: string) => void;
  addTask: (task: Omit<Task, 'id' | 'is_completed'>) => void;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;
  addStrain: (strain: Omit<Strain, 'id'>) => void;
  deleteStrain: (id: string) => void;
  resetDatabase: () => void;
}

const GrowContext = createContext<GrowContextType | undefined>(undefined);

export const GrowProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [strains, setStrains] = useState<Strain[]>([]);
  const [lots, setLots] = useState<Lot[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

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
        const [strainsRes, lotsRes, logsRes, tasksRes] = await Promise.all([
          supabase.from('strains').select('*'),
          supabase.from('lots').select('*'),
          supabase.from('logs').select('*').order('date', { ascending: false }),
          supabase.from('tasks').select('*').order('date', { ascending: true })
        ]);

        if (strainsRes.error) throw strainsRes.error;
        if (lotsRes.error) throw lotsRes.error;
        if (logsRes.error) throw logsRes.error;
        if (tasksRes.error) throw tasksRes.error;

        const lotsCount = lotsRes.data?.length || 0;
        if (lotsCount === 0) {
          await loadSeedsToSupabase();
        } else {
          setStrains(strainsRes.data || []);
          setLots(lotsRes.data || []);
          setLogs(logsRes.data || []);
          setTasks(tasksRes.data || []);
        }
      } catch (err) {
        console.error("Error cargando datos de Supabase:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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
    } catch (err) {
      console.error("Error al agregar lote:", err);
    }
  };

  const editLot = async (updatedLot: Lot) => {
    try {
      const { error } = await supabase.from('lots').update({
        name: updatedLot.name,
        strain: updatedLot.strain,
        plant_count: updatedLot.plant_count,
        stage: updatedLot.stage,
        start_date: updatedLot.start_date,
        notes: updatedLot.notes
      }).eq('id', updatedLot.id);
      if (error) throw error;
      setLots(prev => prev.map(l => l.id === updatedLot.id ? updatedLot : l));
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
      console.error("Error al desarchivar lote:", err);
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
      console.error("Error al registrar log:", err);
    }
  };

  const deleteLog = async (id: string) => {
    try {
      const { error } = await supabase.from('logs').delete().eq('id', id);
      if (error) throw error;
      setLogs(prev => prev.filter(l => l.id !== id));
    } catch (err) {
      console.error("Error al borrar log:", err);
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
    const nextVal = !task.is_completed;
    try {
      const { error } = await supabase.from('tasks').update({ is_completed: nextVal }).eq('id', id);
      if (error) throw error;
      setTasks(prev => prev.map(t => t.id === id ? { ...t, is_completed: nextVal } : t));
    } catch (err) {
      console.error("Error al cambiar estado de la tarea:", err);
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

  const resetDatabase = async () => {
    try {
      await Promise.all([
        supabase.from('strains').delete().neq('id', 'keep_none'),
        supabase.from('lots').delete().neq('id', 'keep_none'),
        supabase.from('logs').delete().neq('id', 'keep_none'),
        supabase.from('tasks').delete().neq('id', 'keep_none')
      ]);
      await loadSeedsToSupabase();
    } catch (err) {
      console.error("Error al reiniciar base de datos:", err);
    }
  };

  return (
    <GrowContext.Provider value={{
      strains, lots, logs, tasks,
      addLot, editLot, archiveLot, unarchiveLot,
      addLog, deleteLog, addTask, toggleTask, deleteTask,
      addStrain, deleteStrain, resetDatabase
    }}>
      {loading ? (
        <div className="flex min-h-screen bg-gray-900 text-gray-100 items-center justify-center font-sans">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-gray-400 text-sm animate-pulse">Conectando con Supabase...</p>
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
