import React, { useState } from 'react';
import { useGrow } from '../context/GrowContext';
import { calculateDaysElapsed } from '../utils/calculations';
import type { Lot } from '../types/grow';
import { Search, Plus, Archive, ArchiveRestore, Edit3, Sprout, Hash, Calendar, Layers, FileText } from 'lucide-react';
import { VEG_SCHEDULE, FLOWER_SCHEDULE } from '../utils/schedules';

export const LotsView = () => {
  const { lots, strains, addLot, editLot, archiveLot, unarchiveLot } = useGrow();

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'archived'>('active');

  // Modal de Edición
  const [showModal, setShowModal] = useState(false);
  const [editingLot, setEditingLot] = useState<Lot | null>(null);

  // Modal de Cronograma
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedScheduleLot, setSelectedScheduleLot] = useState<Lot | null>(null);

  // Formulario
  const [name, setName] = useState('');
  const [strain, setStrain] = useState('');
  const [plantCount, setPlantCount] = useState('');
  const [stage, setStage] = useState<'Germinación' | 'Vegetativo' | 'Floración' | 'Secado' | 'Curado'>('Vegetativo');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  // Filtrado de Lotes
  const filteredLots = lots.filter(lot => {
    const matchesSearch = lot.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          lot.strain.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' ||
                          (statusFilter === 'active' && !lot.is_archived) ||
                          (statusFilter === 'archived' && lot.is_archived);

    return matchesSearch && matchesStatus;
  });

  const handleOpenCreateModal = () => {
    setEditingLot(null);
    setName('');
    setStrain(strains.length > 0 ? strains[0].name : '');
    setPlantCount('');
    setStage('Vegetativo');
    setStartDate(new Date().toISOString().split('T')[0]);
    setNotes('');
    setShowModal(true);
  };

  const handleOpenEditModal = (lot: Lot) => {
    setEditingLot(lot);
    setName(lot.name);
    setStrain(lot.strain);
    setPlantCount(lot.plant_count.toString());
    setStage(lot.stage);
    setStartDate(lot.start_date);
    setNotes(lot.notes || '');
    setShowModal(true);
  };

  const handleOpenScheduleModal = (lot: Lot) => {
    setSelectedScheduleLot(lot);
    setShowScheduleModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !strain || !plantCount) return;

    const lotData = {
      name,
      strain,
      plant_count: parseInt(plantCount),
      stage,
      start_date: startDate,
      notes: notes || undefined
    };

    if (editingLot) {
      editLot({
        ...editingLot,
        ...lotData
      });
    } else {
      addLot(lotData);
    }

    setShowModal(false);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto select-none">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Lotes de Cultivo</h2>
          <p className="text-gray-400 mt-1">Monitorea tus diferentes salas, plantas y fases del ciclo.</p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="flex items-center gap-2 px-5 py-2.5 bg-green-500 hover:bg-green-600 text-gray-950 font-semibold rounded-xl transition duration-200"
        >
          <Plus size={18} />
          Nuevo Lote
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-col md:flex-row gap-4 bg-gray-950 border border-gray-800 p-4 rounded-2xl">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-4 top-3.5 text-gray-500" />
          <input
            type="text"
            placeholder="Buscar lote o genética..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-white focus:outline-none focus:border-green-500 text-sm"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          className="px-4 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-white focus:outline-none focus:border-green-500 text-sm"
        >
          <option value="active">Mostrar Activos</option>
          <option value="archived">Mostrar Archivados / Cosechados</option>
          <option value="all">Mostrar Todos</option>
        </select>
      </div>

      {/* Grid de Lotes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredLots.length > 0 ? (
          filteredLots.map(lot => {
            const days = calculateDaysElapsed(lot.start_date);
            const progress = Math.min(Math.round((days / 90) * 100), 100);

            return (
              <div key={lot.id} className="bg-gray-950 border border-gray-800 rounded-2xl overflow-hidden hover:border-gray-700 transition duration-200 flex flex-col justify-between">
                <div className="p-6 space-y-5">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-bold text-white tracking-tight">{lot.name}</h3>
                      <span className="text-xs text-green-400 font-medium flex items-center gap-1.5 mt-1.5">
                        <Sprout size={14} />
                        {lot.strain}
                      </span>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded-full">
                      {lot.stage}
                    </span>
                  </div>

                  <div className="space-y-3 pt-2 border-t border-gray-900">
                    <div className="flex items-center gap-2.5 text-sm text-gray-400">
                      <Hash size={16} className="text-gray-500" />
                      <span>Macetas / Unidades:</span>
                      <span className="ml-auto text-white font-medium">{lot.plant_count}</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-sm text-gray-400">
                      <Calendar size={16} className="text-gray-500" />
                      <span>Inicio de ciclo:</span>
                      <span className="ml-auto text-white font-medium">{lot.start_date}</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-sm text-gray-400">
                      <Layers size={16} className="text-gray-500" />
                      <span>Tiempo de cultivo:</span>
                      <span className="ml-auto text-white font-medium">{days} días</span>
                    </div>
                  </div>

                  {lot.notes && (
                    <div className="p-3 bg-gray-900/50 border border-gray-900 rounded-xl">
                      <span className="text-[10px] font-bold text-gray-500 block uppercase mb-1 flex items-center gap-1">
                        <FileText size={10} /> Notas de medio
                      </span>
                      <p className="text-xs text-gray-400 leading-relaxed truncate">{lot.notes}</p>
                    </div>
                  )}

                  {/* Progreso del ciclo */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Progreso estimado (Día {days} / 90)</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="w-full bg-gray-900 rounded-full h-1.5">
                      <div className="bg-green-500 h-1.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                    </div>
                  </div>

                  {/* Botón de Cronograma de Riego */}
                  {(lot.stage === 'Vegetativo' || lot.stage === 'Floración') && (
                    <button
                      onClick={() => handleOpenScheduleModal(lot)}
                      className="w-full py-2 bg-green-500/10 hover:bg-green-500/20 text-green-400 font-semibold text-xs rounded-xl border border-green-500/25 flex items-center justify-center gap-2 transition duration-150"
                    >
                      <Calendar size={14} />
                      Ver Cronograma de Riego
                    </button>
                  )}
                </div>

                {/* Footer del card */}
                <div className="px-6 py-4 bg-gray-900/30 border-t border-gray-900 flex justify-between gap-3">
                  <button
                    onClick={() => handleOpenEditModal(lot)}
                    className="flex-1 py-2 bg-gray-900 hover:bg-gray-800 text-gray-300 hover:text-white font-semibold text-xs rounded-lg border border-gray-800 flex items-center justify-center gap-1.5 transition duration-150"
                  >
                    <Edit3 size={14} />
                    Editar
                  </button>
                  {lot.is_archived ? (
                    <button
                      onClick={() => unarchiveLot(lot.id)}
                      className="flex-1 py-2 bg-gray-900 hover:bg-gray-800 text-green-400 font-semibold text-xs rounded-lg border border-gray-800 flex items-center justify-center gap-1.5 transition duration-150"
                    >
                      <ArchiveRestore size={14} />
                      Reactivar
                    </button>
                  ) : (
                    <button
                      onClick={() => archiveLot(lot.id)}
                      className="flex-1 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-semibold text-xs rounded-lg border border-red-500/20 flex items-center justify-center gap-1.5 transition duration-150"
                    >
                      <Archive size={14} />
                      Archivar
                    </button>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full bg-gray-950 border border-gray-800 rounded-2xl p-16 text-center text-gray-500">
            <Sprout size={48} className="mx-auto text-green-500/20 mb-4" />
            <p className="text-base">No hay lotes que coincidan con la búsqueda.</p>
          </div>
        )}
      </div>

      {/* Modal para Crear/Editar */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-950 border border-gray-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-800 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">
                {editingLot ? 'Editar Lote de Cultivo' : 'Crear Nuevo Lote'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white transition">
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Nombre del Lote / Sala *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-800 rounded-xl text-white focus:outline-none focus:border-green-500"
                  placeholder="Ej: Carpa 1 - Vegetativo"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Genética / Variedad *</label>
                  <select
                    value={strain}
                    onChange={(e) => setStrain(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-white focus:outline-none focus:border-green-500 text-sm"
                    required
                  >
                    <option value="">Selecciona...</option>
                    {strains.map(s => (
                      <option key={s.id} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Cantidad de Plantas *</label>
                  <input
                    type="number"
                    value={plantCount}
                    onChange={(e) => setPlantCount(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-800 rounded-xl text-white focus:outline-none focus:border-green-500"
                    placeholder="Ej: 4"
                    min="1"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Fase de Cultivo</label>
                  <select
                    value={stage}
                    onChange={(e) => setStage(e.target.value as typeof stage)}
                    className="w-full px-4 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-white focus:outline-none focus:border-green-500 text-sm"
                  >
                    <option value="Germinación">Germinación</option>
                    <option value="Vegetativo">Vegetativo</option>
                    <option value="Floración">Floración</option>
                    <option value="Secado">Secado</option>
                    <option value="Curado">Curado</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Fecha de Inicio *</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-800 rounded-xl text-white focus:outline-none focus:border-green-500 text-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Notas del Lote</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-800 rounded-xl text-white focus:outline-none focus:border-green-500"
                  rows={3}
                  placeholder="Ej: Sustrato coco-perlita, iluminación LED 240W."
                ></textarea>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 bg-gray-900 hover:bg-gray-800 text-gray-300 font-semibold rounded-xl border border-gray-800 transition duration-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-green-500 hover:bg-green-600 text-gray-950 font-semibold rounded-xl transition duration-200"
                >
                  {editingLot ? 'Guardar Cambios' : 'Crear Lote'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Cronograma */}
      {showScheduleModal && selectedScheduleLot && (() => {
        const days = calculateDaysElapsed(selectedScheduleLot.start_date);
        const currentWeek = Math.floor(days / 7) + 1;
        const schedule = selectedScheduleLot.stage === 'Vegetativo' ? VEG_SCHEDULE : FLOWER_SCHEDULE;

        return (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-gray-950 border border-gray-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
              {/* Header */}
              <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-900/20">
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Calendar className="text-green-400" size={22} />
                    Cronograma de Riego: {selectedScheduleLot.name}
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">
                    Fase: {selectedScheduleLot.stage} • Iniciado el {selectedScheduleLot.start_date} (Día {days} de cultivo)
                  </p>
                </div>
                <button onClick={() => setShowScheduleModal(false)} className="text-gray-400 hover:text-white transition text-lg font-bold">
                  ✕
                </button>
              </div>

              {/* Body */}
              <div className="p-6 overflow-y-auto space-y-4 flex-1">
                <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl text-xs text-gray-400 leading-relaxed">
                  <strong>Nota sobre fertilización con sales:</strong> Asegúrate de calibrar correctamente tus medidores de pH y EC. Si la EC sube demasiado, realiza riegos de lixiviación o reduce la dosificación.
                </div>

                <div className="space-y-3">
                  {schedule.map(s => {
                    const isCurrent = s.week === currentWeek;
                    const isPast = s.week < currentWeek;

                    return (
                      <div 
                        key={s.week} 
                        className={`p-4 rounded-xl border transition duration-200 ${
                          isCurrent 
                            ? 'bg-green-500/10 border-green-500/40 shadow-md shadow-green-950/20' 
                            : isPast 
                              ? 'bg-gray-900/30 border-gray-900 opacity-60' 
                              : 'bg-gray-900/50 border-gray-900'
                        }`}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <span className={`text-xs font-bold uppercase tracking-wider ${isCurrent ? 'text-green-400' : 'text-gray-500'}`}>
                              Semana {s.week}
                            </span>
                            <h4 className="text-sm font-bold text-white mt-0.5">{s.title}</h4>
                          </div>
                          {isCurrent && (
                            <span className="text-[10px] uppercase font-black px-2.5 py-0.5 bg-green-500 text-gray-950 rounded-full">
                              Semana Actual
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-3">
                          <div className="p-2 bg-gray-950/80 border border-gray-800 rounded-lg text-center">
                            <span className="text-[10px] text-gray-500 uppercase block font-semibold">pH Objetivo</span>
                            <span className="text-sm font-bold text-white">{s.ph.toFixed(1)}</span>
                          </div>
                          <div className="p-2 bg-gray-950/80 border border-gray-800 rounded-lg text-center">
                            <span className="text-[10px] text-gray-500 uppercase block font-semibold">EC Objetivo</span>
                            <span className="text-sm font-bold text-white">{s.ec.toFixed(1)} mS/cm</span>
                          </div>
                        </div>

                        <p className="text-xs text-gray-400 mt-2.5 leading-relaxed font-sans">
                          {s.notes}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-gray-800 bg-gray-900/10 text-right">
                <button
                  onClick={() => setShowScheduleModal(false)}
                  className="px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-gray-300 font-semibold rounded-xl border border-gray-800 transition"
                >
                  Cerrar Cronograma
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
