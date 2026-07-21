import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Calendar, CheckCircle2, Filter, List, Moon } from 'lucide-react';

import { useGrow, useGrowActions } from '../context/GrowContext';
import type { Task } from '../types/grow';
import { parseLocalDate, parseLocalNoon, todayStr } from '../utils/date';
import { formatLongDate } from '../utils/format';
import { getLunarInfo } from '../utils/lunar';
import { extractTargetsFromNotes, type QuickLogState } from '../utils/quickLog';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/Card';
import { TaskCalendar } from './tasks/TaskCalendar';
import { LunarDayPanel } from './tasks/LunarDayPanel';
import { TaskFormPanel } from './tasks/TaskFormPanel';
import { TaskItem } from './tasks/TaskItem';

type ViewMode = 'lista' | 'calendario';
type TaskFilter = 'all' | 'pending' | 'completed';

export const TasksView = () => {
  const { tasks, activeLots, lotsById } = useGrow();
  const { addTask, toggleTask, deleteTask } = useGrowActions();
  const navigate = useNavigate();

  const [viewMode, setViewMode] = useState<ViewMode>('calendario');
  const [filter, setFilter] = useState<TaskFilter>('pending');
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [showForm, setShowForm] = useState(false);

  // Un solo recorrido de tareas en vez de un filtro por celda del calendario.
  const tasksByDate = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const task of tasks) {
      const bucket = map.get(task.date);
      if (bucket) bucket.push(task);
      else map.set(task.date, [task]);
    }
    return map;
  }, [tasks]);

  const filteredTasks = useMemo(
    () =>
      tasks.filter(task => {
        if (filter === 'pending') return !task.is_completed;
        if (filter === 'completed') return task.is_completed;
        return true;
      }),
    [tasks, filter]
  );

  const selectedDateTasks = tasksByDate.get(selectedDate) ?? [];
  const selectedLunarDay = useMemo(
    () => getLunarInfo(parseLocalNoon(selectedDate)),
    [selectedDate]
  );

  const lotName = (lotId: string) => lotsById.get(lotId)?.name ?? 'Lote Desconocido';

  const handleQuickWatering = (task: Task) => {
    const targets = extractTargetsFromNotes(task.notes);
    const state: QuickLogState = { lotId: task.lot_id, taskId: task.id, ...targets };
    void navigate('/logs', { state });
  };

  const handleCreateTask = (task: Omit<Task, 'id' | 'is_completed'>) => {
    void addTask(task);
    setShowForm(false);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto text-slate-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Tareas y Agenda
          </h2>
          <p className="text-slate-500 mt-1 font-medium">
            Organiza las labores diarias y mantén tus plantas cuidadas.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex bg-slate-100 border border-slate-200 rounded-xl p-1 shadow-sm">
            {(
              [
                ['calendario', 'Calendario', <Calendar key="c" size={14} />],
                ['lista', 'Lista', <List key="l" size={14} />],
              ] as const
            ).map(([mode, label, icon]) => (
              <button
                key={mode}
                type="button"
                onClick={() => setViewMode(mode)}
                aria-pressed={viewMode === mode}
                className={`p-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  viewMode === mode
                    ? 'bg-white text-emerald-600 shadow-sm border border-slate-200/50'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {icon}
                {label}
              </button>
            ))}
          </div>

          <Button
            icon={<Plus size={18} />}
            onClick={() => setShowForm(true)}
            className="ml-auto md:ml-0"
          >
            Nueva Tarea
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {showForm && (
          <div className="lg:col-span-4">
            <TaskFormPanel
              activeLots={activeLots}
              initialDate={selectedDate}
              onSubmit={handleCreateTask}
              onCancel={() => setShowForm(false)}
            />
          </div>
        )}

        <div className={showForm ? 'lg:col-span-8' : 'lg:col-span-12'}>
          {viewMode === 'calendario' ? (
            <div className="space-y-6">
              <TaskCalendar
                currentDate={currentDate}
                onCurrentDateChange={setCurrentDate}
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
                tasksByDate={tasksByDate}
              />

              <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                <LunarDayPanel info={selectedLunarDay} className="md:col-span-5" />

                <div className="md:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                  <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-100 pb-3 capitalize">
                    <CheckCircle2 className="text-emerald-600" size={16} />
                    {formatLongDate(parseLocalDate(selectedDate))}
                  </h3>

                  <div className="divide-y divide-slate-100">
                    {selectedDateTasks.length > 0 ? (
                      selectedDateTasks.map(task => (
                        <TaskItem
                          key={task.id}
                          task={task}
                          lotName={lotName(task.lot_id)}
                          onToggle={id => void toggleTask(id)}
                          onDelete={id => void deleteTask(id)}
                          onQuickWatering={handleQuickWatering}
                          className="py-4 first:pt-0 last:pb-0"
                        />
                      ))
                    ) : (
                      <EmptyState
                        icon={<Moon size={28} />}
                        title="No hay tareas programadas."
                        description="Consultá la guía lunar para saber qué hacer hoy."
                        className="py-8"
                      />
                    )}
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    fullWidth
                    icon={<Plus size={13} />}
                    onClick={() => setShowForm(true)}
                    className="mt-3 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border-emerald-200"
                  >
                    Crear tarea para este día
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <CheckCircle2 size={20} className="text-emerald-600" />
                  Lista de Tareas
                </h3>
                <div className="flex items-center gap-2">
                  <Filter size={16} className="text-slate-400" />
                  <label htmlFor="task-filter" className="sr-only">
                    Filtrar tareas
                  </label>
                  <select
                    id="task-filter"
                    value={filter}
                    onChange={event => setFilter(event.target.value as TaskFilter)}
                    className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 text-sm focus:outline-none focus:border-emerald-500 shadow-sm"
                  >
                    <option value="pending">Pendientes</option>
                    <option value="completed">Completadas</option>
                    <option value="all">Todas</option>
                  </select>
                </div>
              </div>

              <div className="divide-y divide-slate-100">
                {filteredTasks.length > 0 ? (
                  filteredTasks.map(task => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      lotName={lotName(task.lot_id)}
                      onToggle={id => void toggleTask(id)}
                      onDelete={id => void deleteTask(id)}
                      onQuickWatering={handleQuickWatering}
                      showDate
                      className="p-5 hover:bg-slate-50/50 transition"
                    />
                  ))
                ) : (
                  <EmptyState
                    icon={<CheckCircle2 size={36} />}
                    title="No tienes tareas en esta sección."
                    className="p-16"
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
