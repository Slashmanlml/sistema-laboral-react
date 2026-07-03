import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGrow } from '../context/GrowContext';
import { Trash2, Plus, Calendar, CheckCircle2, Sprout, Filter, ChevronLeft, ChevronRight, List, Beaker, Moon } from 'lucide-react';
import type { Task } from '../types/grow';
import { getLunarInfo, LUNAR_DAY_META, LUNAR_PHASE_META } from '../utils/lunar';

export const TasksView = () => {
  const { tasks, lots, addTask, toggleTask, deleteTask } = useGrow();
  const navigate = useNavigate();

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
  const selectedLunarDay = selectedDate ? getLunarInfo(new Date(selectedDate + 'T12:00:00')) : null;

  const monthName = currentDate.toLocaleString('es-AR', { month: 'long', year: 'numeric' });

  // Riego Rápido
  const handleQuickWatering = (task: Task) => {
    let targetPh = '';
    let targetEc = '';

    const phMatch = task.notes?.match(/pH:\s*([0-9.]+)/i);
    if (phMatch) targetPh = phMatch[1];

    const ecMatch = task.notes?.match(/EC:\s*([0-9.]+)/i);
    if (ecMatch) targetEc = ecMatch[1];

    sessionStorage.setItem('quick_log_lot_id', task.lot_id);
    sessionStorage.setItem('quick_log_ph', targetPh);
    sessionStorage.setItem('quick_log_ec', targetEc);
    sessionStorage.setItem('quick_log_task_id', task.id);

    navigate('/logs');
  };

  const taskTypeBadge = (t: Task['type']) =>
    t === 'riego'       ? 'bg-blue-50 text-blue-600 border border-blue-100'       :
    t === 'fertilizante'? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
    t === 'poda'        ? 'bg-yellow-50 text-yellow-600 border border-yellow-100'  :
    t === 'preventivo'  ? 'bg-red-50 text-red-600 border border-red-100'           :
                          'bg-slate-50 text-slate-600 border border-slate-100';

  return (
    <div className="space-y-8 max-w-7xl mx-auto select-none text-slate-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Tareas y Agenda</h2>
          <p className="text-slate-500 mt-1 font-medium font-sans">Organiza las labores diarias y mantén tus plantas cuidadas.</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Toggle de vista */}
          <div className="flex bg-slate-100 border border-slate-200 rounded-xl p-1 shadow-sm">
            <button
              onClick={() => setViewMode('calendario')}
              className={`p-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                viewMode === 'calendario' ? 'bg-white text-emerald-600 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Vista de Calendario"
            >
              <Calendar size={14} />
              Calendario
            </button>
            <button
              onClick={() => setViewMode('lista')}
              className={`p-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                viewMode === 'lista' ? 'bg-white text-emerald-600 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Vista de Lista"
            >
              <List size={14} />
              Lista
            </button>
          </div>

          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition duration-150 ml-auto md:ml-0 text-sm shadow-sm"
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
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-md animate-in slide-in-from-left duration-200">
              <h3 className="text-lg font-bold text-slate-900 mb-5">Crear Nueva Tarea</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-1">Título *</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-emerald-500 shadow-sm"
                    placeholder="Ej: Riego con Fertilizante Ryanodine"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-1">Cama de Cultivo *</label>
                  <select
                    value={lotId}
                    onChange={(e) => setLotId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-emerald-500 text-sm shadow-sm"
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
                    <label className="block text-sm font-semibold text-slate-600 mb-1">Fecha *</label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-emerald-500 text-sm shadow-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-600 mb-1">Tipo</label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value as Task['type'])}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-855 focus:outline-none focus:border-emerald-500 text-sm shadow-sm"
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
                  <label className="block text-sm font-semibold text-slate-600 mb-1">Instrucciones</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-emerald-500 shadow-sm"
                    rows={3}
                    placeholder="Ej: Diluir 3.8 ml/L de Makro A y Mikro B."
                  ></textarea>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl border border-slate-200 transition duration-150"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition duration-150 shadow-sm"
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
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col">
                {/* Cabecera del Mes */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-extrabold text-slate-900 capitalize tracking-tight">{monthName}</h3>
                    <p className="text-xs text-slate-400 font-medium mt-0.5 flex items-center gap-1">
                      <Moon size={11} />
                      Growlendario Lunar · Hemisferio Sur
                    </p>
                  </div>
                  <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl p-1 shadow-sm">
                    <button
                      onClick={prevMonth}
                      className="p-1.5 hover:bg-slate-200 text-slate-500 hover:text-slate-800 rounded-lg transition"
                      title="Mes Anterior"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <button
                      onClick={() => setCurrentDate(new Date())}
                      className="px-3 py-1.5 hover:bg-slate-200 text-xs font-bold text-slate-700 rounded-lg transition"
                    >
                      Hoy
                    </button>
                    <button
                      onClick={nextMonth}
                      className="p-1.5 hover:bg-slate-200 text-slate-500 hover:text-slate-800 rounded-lg transition"
                      title="Siguiente Mes"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>

                {/* Leyenda Growlendario */}
                <div className="flex flex-wrap gap-2 mb-5 pb-4 border-b border-slate-100">
                  {(['flor','hoja','fruto','raiz','nodo'] as const).map(t => {
                    const m = LUNAR_DAY_META[t];
                    return (
                      <span key={t} className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg border" style={{ backgroundColor: m.bgColor, borderColor: m.borderColor, color: m.textColor }}>
                        <span>{m.emoji}</span>
                        {m.label}
                      </span>
                    );
                  })}
                </div>

                {/* Cuadrícula del Calendario */}
                <div className="overflow-x-auto">
                  <div className="grid grid-cols-7 gap-1.5 min-w-[600px] border-b border-slate-100 pb-2">
                    {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => (
                      <div key={day} className="text-center text-xs font-bold text-slate-400 uppercase tracking-wider py-1.5">
                        {day}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1.5 min-w-[600px] pt-2">
                    {daysGrid.map((day, idx) => {
                      if (!day) {
                        return <div key={`empty-${idx}`} className="bg-slate-50/20 border border-slate-100 rounded-xl min-h-[90px] opacity-25" />;
                      }

                      const dateStr = day.toISOString().split('T')[0];
                      const dayTasks = tasks.filter(t => t.date === dateStr);
                      const isToday = new Date().toISOString().split('T')[0] === dateStr;
                      const isSelected = selectedDate === dateStr;
                      const lunar = getLunarInfo(day);
                      const lunarMeta = lunar ? LUNAR_DAY_META[lunar.type] : null;
                      const phaseMeta = lunar ? LUNAR_PHASE_META[lunar.phase] : null;

                      return (
                        <div
                          key={dateStr}
                          onClick={() => setSelectedDate(dateStr)}
                          className={`border rounded-xl p-2 min-h-[95px] flex flex-col justify-between cursor-pointer transition duration-150 ${
                            isSelected
                              ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm shadow-emerald-500/10'
                              : isToday
                                ? 'border-slate-400 bg-slate-100/70 font-extrabold'
                                : 'border-slate-200 hover:border-slate-350 hover:shadow-xs'
                          }`}
                          style={
                            lunarMeta
                              ? {
                                  backgroundColor: isSelected ? lunarMeta.bgColor : `${lunarMeta.bgColor}dd`,
                                  borderColor: isSelected ? lunarMeta.color : lunarMeta.borderColor,
                                }
                              : undefined
                          }
                        >
                          {/* Número del día + fase lunar */}
                          <div className="flex justify-between items-start">
                            <span className={`text-xs font-extrabold ${
                              isSelected ? 'text-slate-900' : isToday ? 'text-slate-900 font-extrabold' : 'text-slate-500'
                            }`}>
                              {day.getDate()}
                            </span>
                            <div className="flex items-center gap-0.5 bg-white/70 px-1 py-0.5 rounded shadow-xs border border-slate-100">
                              {phaseMeta && (
                                <span className="text-[10px]" title={phaseMeta.label}>{phaseMeta.emoji}</span>
                              )}
                              {lunarMeta && (
                                <span className="text-[10px]" title={lunarMeta.label}>{lunarMeta.emoji}</span>
                              )}
                            </div>
                          </div>

                          {/* Tipo de día visible directamente */}
                          {lunarMeta && (
                            <div className="mt-1 text-left">
                              <span className="text-[8px] font-extrabold uppercase px-1 py-0.5 rounded border border-white/50" style={{ backgroundColor: `${lunarMeta.color}15`, color: lunarMeta.textColor }}>
                                {lunarMeta.emoji} {lunarMeta.label.split(' ')[1]}
                              </span>
                            </div>
                          )}

                          {/* Aviso nodo */}
                          {lunar?.type === 'nodo' && (
                            <span className="text-[8px] font-extrabold text-slate-500 mt-1 uppercase tracking-wider">⚠ No tocar</span>
                          )}

                          {/* Tareas en miniatura */}
                          <div className="space-y-0.5 mt-2 overflow-y-auto max-h-[38px] pr-0.5">
                            {dayTasks.slice(0, 2).map(task => (
                              <div
                                key={task.id}
                                className={`text-[8px] truncate px-1 py-0.5 rounded font-extrabold border leading-none ${taskTypeBadge(task.type)}`}
                                title={task.title}
                              >
                                {task.title}
                              </div>
                            ))}
                            {dayTasks.length > 2 && (
                              <div className="text-[7px] text-slate-500 text-center font-bold">+{dayTasks.length - 2} tareas</div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Panel del Día Seleccionado */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5">

                {/* Guía Lunar del Día */}
                {selectedLunarDay && (
                  <div className="md:col-span-5 rounded-2xl p-5 shadow-sm border"
                    style={{
                      backgroundColor: LUNAR_DAY_META[selectedLunarDay.type].bgColor,
                      borderColor: LUNAR_DAY_META[selectedLunarDay.type].borderColor,
                    }}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-3xl">{LUNAR_DAY_META[selectedLunarDay.type].emoji}</span>
                      <div>
                        <h4 className="text-base font-extrabold" style={{ color: LUNAR_DAY_META[selectedLunarDay.type].textColor }}>
                          {LUNAR_DAY_META[selectedLunarDay.type].label}
                        </h4>
                        <span className="text-xs font-semibold opacity-70" style={{ color: LUNAR_DAY_META[selectedLunarDay.type].textColor }}>
                          {LUNAR_PHASE_META[selectedLunarDay.phase].emoji} {LUNAR_PHASE_META[selectedLunarDay.phase].label}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs mb-3 font-medium" style={{ color: LUNAR_DAY_META[selectedLunarDay.type].textColor, opacity: 0.8 }}>
                      {LUNAR_DAY_META[selectedLunarDay.type].description}
                    </p>
                    {selectedLunarDay.warning ? (
                      <div className="flex items-center gap-2 bg-slate-900/10 rounded-xl px-3 py-2.5">
                        <span className="text-base">⚠️</span>
                        <p className="text-xs font-extrabold text-slate-700">{selectedLunarDay.warning}</p>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-extrabold uppercase tracking-wider opacity-60" style={{ color: LUNAR_DAY_META[selectedLunarDay.type].textColor }}>
                          Actividades recomendadas hoy:
                        </p>
                        {selectedLunarDay.activities.map((act, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs font-semibold" style={{ color: LUNAR_DAY_META[selectedLunarDay.type].textColor }}>
                            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: LUNAR_DAY_META[selectedLunarDay.type].color }} />
                            {act}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Tareas del Día */}
                <div className={`${selectedLunarDay ? 'md:col-span-7' : 'md:col-span-12'} bg-white border border-slate-200 rounded-2xl p-5 shadow-sm`}>
                  <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
                    <CheckCircle2 className="text-emerald-600" size={16} />
                    {selectedDate
                      ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })
                      : 'Selecciona un día'}
                  </h3>

                  <div className="divide-y divide-slate-100">
                    {selectedDateTasks.length > 0 ? (
                      selectedDateTasks.map(task => {
                        const lot = lots.find(l => l.id === task.lot_id);
                        const lotName = lot ? lot.name : 'Lote Desconocido';
                        const isWateringTask = task.type === 'riego' || task.type === 'fertilizante';

                        return (
                          <div key={task.id} className={`py-4 first:pt-0 last:pb-0 flex items-start gap-4 ${task.is_completed ? 'opacity-50' : ''}`}>
                            <input
                              type="checkbox"
                              checked={task.is_completed}
                              onChange={() => toggleTask(task.id)}
                              className="mt-1.5 rounded border-slate-300 bg-white text-emerald-600 focus:ring-emerald-500/50 cursor-pointer"
                            />
                            <div className="flex-1 min-w-0">
                              <h4 className={`text-sm font-bold ${task.is_completed ? 'line-through text-slate-400 font-medium' : 'text-slate-800'}`}>
                                {task.title}
                              </h4>
                              {task.notes && (
                                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed font-medium">{task.notes}</p>
                              )}
                              <div className="flex flex-wrap items-center gap-3 mt-2">
                                <span className="flex items-center gap-1.5 text-[11px] text-slate-500 font-bold">
                                  <Sprout size={12} className="text-emerald-600" />
                                  {lotName}
                                </span>
                                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${taskTypeBadge(task.type)}`}>{task.type}</span>
                                {isWateringTask && !task.is_completed && (
                                  <button
                                    type="button"
                                    onClick={() => handleQuickWatering(task)}
                                    className="flex items-center gap-1 text-[10px] font-extrabold text-emerald-600 hover:text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-2 py-0.5 transition shadow-sm"
                                  >
                                    <Beaker size={10} />
                                    Registrar Riego
                                  </button>
                                )}
                              </div>
                            </div>
                            <button
                              onClick={() => deleteTask(task.id)}
                              className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg border border-transparent transition"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        );
                      })
                    ) : (
                      <div className="py-8 text-center text-slate-400 text-sm font-semibold">
                        <Moon size={28} className="mx-auto mb-2 opacity-20" />
                        No hay tareas programadas.<br />
                        <span className="text-xs font-medium">Consultá la guía lunar para saber qué hacer hoy.</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Vista de Lista Tradicional */
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <CheckCircle2 size={20} className="text-emerald-600" />
                  Lista de Tareas
                </h3>
                <div className="flex items-center gap-2">
                  <Filter size={16} className="text-slate-400" />
                  <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value as typeof filter)}
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
                  filteredTasks.map(task => {
                    const lot = lots.find(l => l.id === task.lot_id);
                    const lotName = lot ? lot.name : 'Lote Desconocido';
                    const taskDate = new Date(task.date + 'T00:00:00');
                    const formattedDate = taskDate.toLocaleDateString('es-AR', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short'
                    });
                    const isWateringTask = task.type === 'riego' || task.type === 'fertilizante';
                    const lunar = getLunarInfo(new Date(task.date + 'T12:00:00'));
                    const lunarMeta = lunar ? LUNAR_DAY_META[lunar.type] : null;

                    return (
                      <div key={task.id} className={`p-5 hover:bg-slate-50/50 transition ${task.is_completed ? 'opacity-60' : ''}`}>
                        <div className="flex items-start gap-4">
                          <input
                            type="checkbox"
                            checked={task.is_completed}
                            onChange={() => toggleTask(task.id)}
                            className="mt-1.5 rounded border-slate-300 bg-white text-emerald-600 focus:ring-emerald-500/50 cursor-pointer"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className={`text-sm font-bold ${task.is_completed ? 'line-through text-slate-400 font-medium' : 'text-slate-800'}`}>
                              {task.title}
                            </h4>
                            {task.notes && (
                              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed font-medium">{task.notes}</p>
                            )}
                            <div className="flex flex-wrap items-center gap-3 mt-2.5">
                              <span className="flex items-center gap-1.5 text-[11px] text-slate-500 font-bold">
                                <Calendar size={12} className="text-slate-400" />
                                {formattedDate}
                              </span>
                              <span className="flex items-center gap-1.5 text-[11px] text-slate-500 font-bold">
                                <Sprout size={12} className="text-emerald-600" />
                                {lotName}
                              </span>
                              <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${taskTypeBadge(task.type)}`}>{task.type}</span>

                              {/* Badge lunar en la lista */}
                              {lunarMeta && (
                                <span
                                  className="text-[10px] font-bold px-2 py-0.5 rounded-full border"
                                  style={{ backgroundColor: lunarMeta.bgColor, borderColor: lunarMeta.borderColor, color: lunarMeta.textColor }}
                                >
                                  {lunarMeta.emoji} {lunarMeta.label}
                                </span>
                              )}

                              {isWateringTask && !task.is_completed && (
                                <button
                                  type="button"
                                  onClick={() => handleQuickWatering(task)}
                                  className="flex items-center gap-1 text-[10px] font-extrabold text-emerald-600 hover:text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-2.5 py-1 transition shadow-sm"
                                >
                                  <Beaker size={10} />
                                  Registrar Riego
                                </button>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => deleteTask(task.id)}
                            className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg border border-transparent transition"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-16 text-center text-slate-400 font-semibold">
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
