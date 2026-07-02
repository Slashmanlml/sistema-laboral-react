import React, { useState } from 'react';
import { useGrow } from '../context/GrowContext';
import { Trash2, Plus, Calendar, CheckCircle2, Sprout, Filter, ChevronLeft, ChevronRight, List } from 'lucide-react';
import type { Task } from '../types/grow';

export const TasksView = () => {
  const { tasks, lots, addTask, toggleTask, deleteTask } = useGrow();

  // Modo de vista: lista o calendario
  const [viewMode, setViewMode] = useState<'lista' | 'calendario'>('calendario');

  // Filtro de lista
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('pending');

  // Fecha del calendario actual
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Día seleccionado en el calendario (YYYY-MM-DD)
  const [selectedDate, setSelectedDate] = useState<string | null>(
    new Date().toISOString().split('T')[0]
  );

  // Formulario
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [lotId, setLotId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [type, setType] = useState<Task['type']>('riego');
  const [notes, setNotes] = useState('');

  const activeLots = lots.filter(l => !l.is_archived);

  const filteredTasks = tasks.filter(t => {
    if (filter === 'pending') return !t.is_completed;
    if (filter === 'completed') return t.is_completed;
    return true;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !lotId || !date) return;

    addTask({
      title,
      lot_id: lotId,
      date,
      type,
      notes: notes || undefined
    });

    setTitle('');
    setLotId('');
    setDate(new Date().toISOString().split('T')[0]);
    setType('riego');
    setNotes('');
    setShowForm(false);
  };

  // Navegación del Calendario
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // Lógica de cuadrícula de calendario
  const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y: number, m: number) => new Date(y, m, 1).getDay();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const startingEmptyCells = firstDay === 0 ? 6 : firstDay - 1; // Alinear Lunes primero

  const daysGrid: (Date | null)[] = [];
  for (let i = 0; i < startingEmptyCells; i++) {
    daysGrid.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    daysGrid.push(new Date(year, month, d));
  }

  // Tareas del día seleccionado
  const selectedDateTasks = tasks.filter(t => t.date === selectedDate);

  const monthName = currentDate.toLocaleString('es-AR', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-8 max-w-7xl mx-auto select-none">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Tareas y Agenda</h2>
          <p className="text-gray-400 mt-1">Organiza las labores diarias y mantén tus plantas cuidadas.</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Toggle de vista */}
          <div className="flex bg-gray-900 border border-gray-800 rounded-xl p-1">
            <button
              onClick={() => setViewMode('calendario')}
              className={`p-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                viewMode === 'calendario' ? 'bg-emerald-500 text-gray-950 shadow' : 'text-gray-400 hover:text-white'
              }`}
              title="Vista de Calendario"
            >
              <Calendar size={14} />
              Calendario
            </button>
            <button
              onClick={() => setViewMode('lista')}
              className={`p-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                viewMode === 'lista' ? 'bg-emerald-500 text-gray-950 shadow' : 'text-gray-400 hover:text-white'
              }`}
              title="Vista de Lista"
            >
              <List size={14} />
              Lista
            </button>
          </div>

          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-gray-950 font-semibold rounded-xl transition duration-200 ml-auto md:ml-0 text-sm"
          >
            <Plus size={18} />
            Nueva Tarea
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Formulario de Tarea (colapsable) */}
        {showForm && (
          <div className="lg:col-span-4">
            <div className="bg-gray-950 border border-gray-800 rounded-2xl p-6 shadow-xl">
              <h3 className="text-lg font-bold text-white mb-5">Crear Nueva Tarea</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Título *</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                    placeholder="Ej: Riego con Fertilizante Veg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Lote *</label>
                  <select
                    value={lotId}
                    onChange={(e) => setLotId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-white focus:outline-none focus:border-emerald-500 text-sm"
                    required
                  >
                    <option value="">Selecciona un lote...</option>
                    {activeLots.map(l => (
                      <option key={l.id} value={l.id}>{l.name}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Fecha *</label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full px-4 py-2 bg-gray-900 border border-gray-800 rounded-xl text-white focus:outline-none focus:border-emerald-500 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Tipo</label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value as Task['type'])}
                      className="w-full px-4 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-white focus:outline-none focus:border-emerald-500 text-sm"
                    >
                      <option value="riego">Riego</option>
                      <option value="fertilizante">Nutrientes</option>
                      <option value="poda">Poda / Trasplante</option>
                      <option value="preventivo">Pesticida / Preventivo</option>
                      <option value="otro">Otro</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Instrucciones</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                    rows={2}
                    placeholder="Ej: Diluir 2ml/L de sales base."
                  ></textarea>
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 py-2.5 bg-gray-900 hover:bg-gray-800 text-gray-300 font-semibold rounded-xl border border-gray-800 transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-gray-950 font-semibold rounded-xl transition"
                  >
                    Agregar Tarea
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Contenido Principal (Calendario o Lista) */}
        <div className={showForm ? 'lg:col-span-8' : 'lg:col-span-12'}>
          {viewMode === 'calendario' ? (
            /* Vista del Calendario Mensual */
            <div className="space-y-6">
              <div className="bg-gray-950 border border-gray-800 rounded-2xl p-6 shadow-md flex flex-col">
                {/* Cabecera del Mes */}
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-white capitalize">{monthName}</h3>
                  <div className="flex items-center gap-2 bg-gray-900 border border-gray-800 rounded-xl p-1">
                    <button
                      onClick={prevMonth}
                      className="p-1.5 hover:bg-gray-800 text-gray-400 hover:text-white rounded-lg transition"
                      title="Mes Anterior"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <button
                      onClick={() => setCurrentDate(new Date())}
                      className="px-3 py-1.5 hover:bg-gray-800 text-xs font-bold text-gray-300 rounded-lg transition"
                    >
                      Hoy
                    </button>
                    <button
                      onClick={nextMonth}
                      className="p-1.5 hover:bg-gray-800 text-gray-400 hover:text-white rounded-lg transition"
                      title="Siguiente Mes"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>

                {/* Cuadrícula del Calendario */}
                <div className="overflow-x-auto">
                  <div className="grid grid-cols-7 gap-2 min-w-[600px] border-b border-gray-900 pb-2">
                    {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => (
                      <div key={day} className="text-center text-xs font-bold text-gray-500 uppercase tracking-wider py-1.5">
                        {day}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-2 min-w-[600px] pt-2">
                    {daysGrid.map((day, idx) => {
                      if (!day) {
                        return <div key={`empty-${idx}`} className="bg-gray-900/10 border border-gray-900/30 rounded-xl min-h-[90px] opacity-25" />;
                      }

                      const dateStr = day.toISOString().split('T')[0];
                      const dayTasks = tasks.filter(t => t.date === dateStr);
                      const isToday = new Date().toISOString().split('T')[0] === dateStr;
                      const isSelected = selectedDate === dateStr;

                      return (
                        <div
                          key={dateStr}
                          onClick={() => setSelectedDate(dateStr)}
                          className={`bg-gray-900/40 border rounded-xl p-2 min-h-[90px] flex flex-col justify-between cursor-pointer transition duration-150 ${
                            isSelected
                              ? 'border-emerald-500 bg-emerald-500/5 ring-1 ring-emerald-500/20'
                              : isToday
                                ? 'border-gray-700 bg-gray-800/40'
                                : 'border-gray-900 hover:border-gray-800'
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <span className={`text-xs font-bold ${
                              isSelected ? 'text-emerald-400' : isToday ? 'text-white' : 'text-gray-500'
                            }`}>
                              {day.getDate()}
                            </span>
                            {dayTasks.length > 0 && (
                              <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                                isSelected ? 'bg-emerald-500 text-gray-950' : 'bg-gray-900 text-gray-400 border border-gray-800'
                              }`}>
                                {dayTasks.length}
                              </span>
                            )}
                          </div>

                          {/* Tareas en miniatura */}
                          <div className="space-y-1 mt-1.5 flex-1 overflow-y-auto max-h-[50px] pr-0.5 scrollbar-thin">
                            {dayTasks.slice(0, 2).map(task => {
                              const badgeStyle = 
                                task.type === 'riego' ? 'bg-blue-500/10 text-blue-400 border-blue-500/10' :
                                task.type === 'fertilizante' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/10' :
                                task.type === 'poda' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/10' :
                                task.type === 'preventivo' ? 'bg-red-500/10 text-red-400 border-red-500/10' :
                                'bg-gray-500/10 text-gray-400 border-gray-500/10';

                              return (
                                <div
                                  key={task.id}
                                  className={`text-[9px] truncate px-1 rounded border leading-snug font-semibold ${badgeStyle}`}
                                  title={task.title}
                                >
                                  {task.title}
                                </div>
                              );
                            })}
                            {dayTasks.length > 2 && (
                              <div className="text-[8px] text-gray-500 text-center font-bold">
                                +{dayTasks.length - 2}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Detalle del Día Seleccionado */}
              <div className="bg-gray-950 border border-gray-800 rounded-2xl p-6 shadow-md">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <CheckCircle2 className="text-emerald-400" size={18} />
                  Tareas para el día: <span className="text-emerald-400 font-semibold">{selectedDate ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' }) : '-'}</span>
                </h3>

                <div className="divide-y divide-gray-900">
                  {selectedDateTasks.length > 0 ? (
                    selectedDateTasks.map(task => {
                      const lot = lots.find(l => l.id === task.lot_id);
                      const lotName = lot ? lot.name : 'Lote Desconocido';

                      return (
                        <div key={task.id} className={`py-4 first:pt-0 last:pb-0 flex items-start gap-4 ${task.is_completed ? 'opacity-50' : ''}`}>
                          <input
                            type="checkbox"
                            checked={task.is_completed}
                            onChange={() => toggleTask(task.id)}
                            className="mt-1.5 rounded-md border-gray-700 bg-gray-800 text-emerald-500 focus:ring-emerald-500/50"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className={`text-sm font-semibold ${task.is_completed ? 'line-through text-gray-500' : 'text-white'}`}>
                              {task.title}
                            </h4>
                            {task.notes && (
                              <p className="text-xs text-gray-400 mt-1.5">{task.notes}</p>
                            )}
                            <div className="flex flex-wrap items-center gap-3 mt-2">
                              <span className="flex items-center gap-1 text-[11px] text-gray-500">
                                <Sprout size={12} className="text-emerald-400" />
                                {lotName}
                              </span>
                              <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                                task.type === 'riego' ? 'bg-blue-500/10 text-blue-400' :
                                task.type === 'fertilizante' ? 'bg-emerald-500/10 text-emerald-400' :
                                task.type === 'poda' ? 'bg-yellow-500/10 text-yellow-400' :
                                task.type === 'preventivo' ? 'bg-red-500/10 text-red-400' :
                                'bg-gray-500/10 text-gray-400'
                              }`}>{task.type}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => deleteTask(task.id)}
                            className="p-1.5 hover:bg-red-500/10 text-gray-500 hover:text-red-400 rounded-lg border border-transparent hover:border-red-500/10 transition"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-8 text-center text-gray-500 text-sm">
                      No hay tareas programadas para esta fecha.
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Vista de Lista Tradicional */
            <div className="bg-gray-950 border border-gray-800 rounded-2xl overflow-hidden shadow-md">
              <div className="p-6 border-b border-gray-900 flex items-center justify-between">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <CheckCircle2 size={20} className="text-emerald-400" />
                  Lista de Tareas
                </h3>
                <div className="flex items-center gap-2">
                  <Filter size={16} className="text-gray-500" />
                  <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value as typeof filter)}
                    className="px-3 py-1.5 bg-gray-900 border border-gray-800 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500"
                  >
                    <option value="pending">Pendientes</option>
                    <option value="completed">Completadas</option>
                    <option value="all">Todas</option>
                  </select>
                </div>
              </div>

              <div className="divide-y divide-gray-900">
                {filteredTasks.length > 0 ? (
                  filteredTasks.map(task => {
                    const lot = lots.find(l => l.id === task.lot_id);
                    const lotName = lot ? lot.name : 'Lote Desconocido';
                    const taskDate = new Date(task.date + 'T00:00:00');
                    const formattedDate = taskDate.toLocaleDateString('es-AR', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short'
                    });

                    return (
                      <div key={task.id} className={`p-5 hover:bg-gray-900/30 transition ${task.is_completed ? 'opacity-60' : ''}`}>
                        <div className="flex items-start gap-4">
                          <input
                            type="checkbox"
                            checked={task.is_completed}
                            onChange={() => toggleTask(task.id)}
                            className="mt-1.5 rounded-md border-gray-700 bg-gray-800 text-emerald-500 focus:ring-emerald-500/50"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className={`text-sm font-semibold ${task.is_completed ? 'line-through text-gray-500' : 'text-white'}`}>
                              {task.title}
                            </h4>
                            {task.notes && (
                              <p className="text-xs text-gray-400 mt-1.5">{task.notes}</p>
                            )}
                            <div className="flex flex-wrap items-center gap-3 mt-2.5">
                              <span className="flex items-center gap-1 text-[11px] text-gray-500">
                                <Calendar size={12} />
                                {formattedDate}
                              </span>
                              <span className="flex items-center gap-1 text-[11px] text-gray-500">
                                <Sprout size={12} className="text-emerald-400" />
                                {lotName}
                              </span>
                              <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                                task.type === 'riego' ? 'bg-blue-500/10 text-blue-400' :
                                task.type === 'fertilizante' ? 'bg-emerald-500/10 text-emerald-400' :
                                task.type === 'poda' ? 'bg-yellow-500/10 text-yellow-400' :
                                task.type === 'preventivo' ? 'bg-red-500/10 text-red-400' :
                                'bg-gray-500/10 text-gray-400'
                              }`}>{task.type}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => deleteTask(task.id)}
                            className="p-1.5 hover:bg-red-500/10 text-gray-500 hover:text-red-400 rounded-lg border border-transparent hover:border-red-500/10 transition"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-16 text-center text-gray-500">
                    <CheckCircle2 size={36} className="mx-auto text-emerald-500/20 mb-3" />
                    <p>No tienes tareas en esta sección.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
