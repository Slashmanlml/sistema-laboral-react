import React, { useState } from 'react';
import { useGrow } from '../context/GrowContext';
import { Trash2, Plus, Calendar, CheckCircle2, Sprout, Filter } from 'lucide-react';
import type { Task } from '../types/grow';

export const TasksView = () => {
  const { tasks, lots, addTask, toggleTask, deleteTask } = useGrow();

  // Filtro
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('pending');

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

  return (
    <div className="space-y-8 max-w-7xl mx-auto select-none">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Tareas y Agenda</h2>
          <p className="text-gray-400 mt-1">Organiza las labores diarias y mantén tus plantas cuidadas.</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-green-500 hover:bg-green-600 text-gray-950 font-semibold rounded-xl transition duration-200"
        >
          <Plus size={18} />
          Nueva Tarea
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Formulario de Tarea (colapsable) */}
        {showForm && (
          <div className="lg:col-span-4">
            <div className="bg-gray-950 border border-gray-800 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white mb-5">Crear Nueva Tarea</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Título *</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-800 rounded-xl text-white focus:outline-none focus:border-green-500"
                    placeholder="Ej: Riego con Fertilizante Veg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Lote *</label>
                  <select
                    value={lotId}
                    onChange={(e) => setLotId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-white focus:outline-none focus:border-green-500 text-sm"
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
                      className="w-full px-4 py-2 bg-gray-900 border border-gray-800 rounded-xl text-white focus:outline-none focus:border-green-500 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Tipo</label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value as Task['type'])}
                      className="w-full px-4 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-white focus:outline-none focus:border-green-500 text-sm"
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
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-800 rounded-xl text-white focus:outline-none focus:border-green-500"
                    rows={2}
                    placeholder="Ej: Diluir 2ml/L de BioGrow en agua desclorada."
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
                    className="flex-1 py-2.5 bg-green-500 hover:bg-green-600 text-gray-950 font-semibold rounded-xl transition"
                  >
                    Agregar Tarea
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Lista de Tareas */}
        <div className={showForm ? 'lg:col-span-8' : 'lg:col-span-12'}>
          <div className="bg-gray-950 border border-gray-800 rounded-2xl overflow-hidden">
            {/* Encabezado con filtro */}
            <div className="p-6 border-b border-gray-900 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <CheckCircle2 size={20} className="text-green-400" />
                Lista de Tareas
              </h3>
              <div className="flex items-center gap-2">
                <Filter size={16} className="text-gray-500" />
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as typeof filter)}
                  className="px-3 py-1.5 bg-gray-900 border border-gray-800 rounded-lg text-white text-sm focus:outline-none focus:border-green-500"
                >
                  <option value="pending">Pendientes</option>
                  <option value="completed">Completadas</option>
                  <option value="all">Todas</option>
                </select>
              </div>
            </div>

            {/* Body de la lista */}
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
                          className="mt-1.5 rounded-md border-gray-700 bg-gray-800 text-green-500 focus:ring-green-500/50"
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
                              <Sprout size={12} className="text-green-400" />
                              {lotName}
                            </span>
                            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                              task.type === 'riego' ? 'bg-blue-500/10 text-blue-400' :
                              task.type === 'fertilizante' ? 'bg-green-500/10 text-green-400' :
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
                  <CheckCircle2 size={36} className="mx-auto text-green-500/20 mb-3" />
                  <p>No tienes tareas en esta sección.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
