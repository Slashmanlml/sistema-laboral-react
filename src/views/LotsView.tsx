import React, { useState } from 'react';
import { useGrow } from '../context/GrowContext';
import { calculateDaysElapsed } from '../utils/calculations';
import type { Lot } from '../types/grow';
import { Search, Plus, Archive, ArchiveRestore, Edit3, Sprout, Hash, Calendar, Layers, FileText, Calculator, Beaker, TrendingUp, LayoutGrid, Kanban, ArrowRight } from 'lucide-react';
import { VEG_SCHEDULE, FLOWER_SCHEDULE } from '../utils/schedules';

export const LotsView = () => {
  const { lots, strains, addLot, editLot, archiveLot, unarchiveLot, addLog } = useGrow();

  // Filtros y Vistas
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'archived'>('active');
  const [viewType, setViewType] = useState<'pipeline' | 'grid'>('pipeline');

  // Modal de Creación / Edición estándar
  const [showModal, setShowModal] = useState(false);
  const [editingLot, setEditingLot] = useState<Lot | null>(null);

  // Modal de Trasplante / Rotación
  const [showTransplantModal, setShowTransplantModal] = useState(false);
  const [transplantLot, setTransplantLot] = useState<Lot | null>(null);
  const [targetStage, setTargetStage] = useState<Lot['stage']>('Vegetativo');
  const [newPotSize, setNewPotSize] = useState('3 Litros');
  const [plantHeight, setPlantHeight] = useState('');
  const [transplantNotes, setTransplantNotes] = useState('');

  // Modal de Cronograma
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedScheduleLot, setSelectedScheduleLot] = useState<Lot | null>(null);
  
  // Semana seleccionada en el visualizador del cronograma
  const [activeScheduleWeek, setActiveScheduleWeek] = useState<number>(1);
  
  // Litros para la calculadora de dosis
  const [tankLiters, setTankLiters] = useState<number>(20);

  // Formulario estándar
  const [name, setName] = useState('');
  const [strain, setStrain] = useState('');
  const [plantCount, setPlantCount] = useState('');
  const [stage, setStage] = useState<Lot['stage']>('Vegetativo');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  // Columnas estándar de la planta
  const PIPELINE_COLUMNS: { stage: Lot['stage']; label: string; desc: string }[] = [
    { stage: 'Germinación', label: 'Germinación', desc: 'Plántulas / Clones' },
    { stage: 'Vegetativo', label: 'Vegetativo', desc: 'Crecimiento de hojas' },
    { stage: 'Floración', label: 'Floración', desc: 'Producción de flores' },
    { stage: 'Secado', label: 'Secado', desc: 'Cosechas secando' },
    { stage: 'Curado', label: 'Curado', desc: 'Maduración final' }
  ];

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

  const handleOpenTransplantModal = (lot: Lot) => {
    setTransplantLot(lot);
    
    let nextStage: Lot['stage'] = 'Vegetativo';
    let pot = 'Misma maceta';
    if (lot.stage === 'Germinación') {
      nextStage = 'Vegetativo';
      pot = '3 Litros';
    } else if (lot.stage === 'Vegetativo') {
      nextStage = 'Floración';
      pot = '10 Litros';
    } else if (lot.stage === 'Floración') {
      nextStage = 'Secado';
      pot = 'Colgado';
    } else if (lot.stage === 'Secado') {
      nextStage = 'Curado';
      pot = 'Frascos';
    }
    
    setTargetStage(nextStage);
    setNewPotSize(pot);
    setPlantHeight('');
    setTransplantNotes('');
    setShowTransplantModal(true);
  };

  const handleOpenScheduleModal = (lot: Lot) => {
    setSelectedScheduleLot(lot);
    
    // Auto-detectar la semana actual del cultivo
    const days = calculateDaysElapsed(lot.start_date);
    const currentWeek = Math.floor(days / 7);
    const schedule = lot.stage === 'Floración' ? FLOWER_SCHEDULE : VEG_SCHEDULE;
    
    const initialWeek = Math.max(
      schedule[0].week, 
      Math.min(currentWeek, schedule[schedule.length - 1].week)
    );
    
    setActiveScheduleWeek(initialWeek);
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

  const handleConfirmTransplant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transplantLot) return;

    const todayStr = new Date().toISOString().split('T')[0];

    const updatedLot: Lot = {
      ...transplantLot,
      stage: targetStage,
      start_date: todayStr,
      notes: `Trasplantado a: ${newPotSize}. ${transplantNotes ? `Notas: ${transplantNotes}` : ''}`
    };

    await editLot(updatedLot);

    await addLog({
      lot_id: transplantLot.id,
      temp: 24.5,
      humidity: 55,
      notes: `TRASPLANTE: Movido a la etapa de ${targetStage}. Nueva Maceta: ${newPotSize}.${plantHeight ? ` Altura: ${plantHeight} cm.` : ''} ${transplantNotes ? ` Detalle: ${transplantNotes}` : ''}`
    });

    setShowTransplantModal(false);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto select-none text-slate-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Lotes de Cultivo</h2>
          <p className="text-slate-500 mt-1 font-medium">Monitorea tus diferentes salas, plantas y fases del ciclo.</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex bg-slate-100 border border-slate-200 rounded-xl p-1 shadow-sm">
            <button
              onClick={() => setViewType('pipeline')}
              className={`p-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                viewType === 'pipeline' ? 'bg-white text-emerald-600 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Vista de Pipeline"
            >
              <Kanban size={14} />
              Pipeline
            </button>
            <button
              onClick={() => setViewType('grid')}
              className={`p-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                viewType === 'grid' ? 'bg-white text-emerald-600 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Vista de Lotes"
            >
              <LayoutGrid size={14} />
              Lista Simple
            </button>
          </div>

          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition duration-150 shadow-sm text-sm"
          >
            <Plus size={18} />
            Nuevo Lote
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col md:flex-row gap-4 bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-4 top-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar lote o genética..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-emerald-500 text-sm shadow-sm"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-emerald-500 text-sm shadow-sm"
        >
          <option value="active">Mostrar Activos</option>
          <option value="archived">Mostrar Archivados</option>
          <option value="all">Mostrar Todos</option>
        </select>
      </div>

      {/* RENDERIZADO DE VISTAS */}
      {viewType === 'pipeline' ? (
        <div className="overflow-x-auto pb-4 scrollbar-thin">
          <div className="flex gap-4 min-w-[1200px] h-[75vh]">
            {PIPELINE_COLUMNS.map(col => {
              const colLots = filteredLots.filter(l => l.stage === col.stage);

              return (
                <div key={col.stage} className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col min-w-[220px]">
                  {/* Cabecera de Columna */}
                  <div className="mb-3">
                    <h4 className="font-extrabold text-slate-900 text-sm truncate">{col.label}</h4>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1 font-semibold">
                      <span>{col.desc}</span>
                    </div>
                    <div className="w-full bg-slate-200 h-0.5 mt-2 rounded" />
                  </div>

                  {/* Lista de Tarjetas */}
                  <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin">
                    {colLots.length > 0 ? (
                      colLots.map(lot => {
                        const days = calculateDaysElapsed(lot.start_date);
                        const isWaterable = lot.stage === 'Vegetativo' || lot.stage === 'Floración';
                        return (
                          <div key={lot.id} className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm hover:border-slate-350 transition duration-150 space-y-3">
                            <div>
                              <div className="flex justify-between items-start">
                                <h5 className="font-extrabold text-slate-900 text-sm truncate">{lot.name}</h5>
                                <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                                  {lot.plant_count}p
                                </span>
                              </div>
                              <span className="text-[11px] text-emerald-650 font-bold block truncate mt-1">
                                {lot.strain}
                              </span>
                            </div>

                            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 pt-2 border-t border-slate-100">
                              <span>En esta etapa:</span>
                              <span className="text-slate-800">{days} días</span>
                            </div>

                            {/* Botonera de Acción rápida */}
                            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                              {isWaterable ? (
                                <button
                                  onClick={() => handleOpenScheduleModal(lot)}
                                  className="py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-lg text-[10px] font-bold transition flex items-center justify-center gap-1"
                                >
                                  <Calculator size={10} />
                                  Sales
                                </button>
                              ) : (
                                <div className="text-[9px] text-slate-400 italic flex items-center justify-center font-semibold">
                                  Sin sales
                                </div>
                              )}
                              <button
                                onClick={() => handleOpenTransplantModal(lot)}
                                className="py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-100 rounded-lg text-[10px] font-bold transition flex items-center justify-center gap-1"
                                title="Trasplantar / Cambiar Etapa"
                              >
                                <span>Trasplante</span>
                                <ArrowRight size={10} />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="h-32 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-400 p-4 text-center">
                        <span className="text-xs font-semibold">Vacía</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* VISTA DE GRID TRADICIONAL */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLots.length > 0 ? (
            filteredLots.map(lot => {
              const days = calculateDaysElapsed(lot.start_date);
              const progress = Math.min(Math.round((days / 90) * 100), 100);
              const isWaterable = lot.stage === 'Vegetativo' || lot.stage === 'Floración';

              return (
                <div key={lot.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:border-slate-300 transition duration-150 flex flex-col justify-between shadow-sm">
                  <div className="p-6 space-y-5">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900 tracking-tight">{lot.name}</h3>
                        <span className="text-xs text-emerald-600 font-bold flex items-center gap-1.5 mt-1.5">
                          <Sprout size={14} />
                          {lot.strain}
                        </span>
                      </div>
                      <span className="text-xs font-bold px-2.5 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full">
                        {lot.stage}
                      </span>
                    </div>

                    <div className="space-y-3 pt-3 border-t border-slate-100">
                      <div className="flex items-center gap-2.5 text-sm text-slate-500 font-medium">
                        <Hash size={16} className="text-slate-400" />
                        <span>Plantas / Macetas:</span>
                        <span className="ml-auto text-slate-800 font-bold">{lot.plant_count}</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-sm text-slate-500 font-medium">
                        <Calendar size={16} className="text-slate-400" />
                        <span>Fecha de inicio:</span>
                        <span className="ml-auto text-slate-800 font-bold">{lot.start_date}</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-sm text-slate-500 font-medium">
                        <Layers size={16} className="text-slate-400" />
                        <span>Días transcurridos:</span>
                        <span className="ml-auto text-slate-800 font-bold">{days} días</span>
                      </div>
                    </div>

                    {lot.notes && (
                      <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                        <span className="text-[10px] font-bold text-slate-400 block uppercase mb-1 flex items-center gap-1">
                          <FileText size={10} /> Notas
                        </span>
                        <p className="text-xs text-slate-650 leading-relaxed font-medium truncate">{lot.notes}</p>
                      </div>
                    )}

                    {/* Progreso estimado */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-slate-400 font-bold">
                        <span>Progreso estimado del lote</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5">
                        <div className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                      </div>
                    </div>

                    {/* Botonera de acciones específicas */}
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <button
                        onClick={() => handleOpenTransplantModal(lot)}
                        className="py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 text-emerald-600 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition"
                      >
                        <ArrowRight size={13} />
                        Trasplantar / Rotar
                      </button>
                      {isWaterable ? (
                        <button
                          onClick={() => handleOpenScheduleModal(lot)}
                          className="py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-655 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition"
                        >
                          <Calculator size={13} />
                          Ver Dosificación
                        </button>
                      ) : (
                        <div className="text-xs text-slate-400 italic text-center py-2 font-semibold">
                          Sin dosificación
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footer del card */}
                  <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex justify-between gap-3">
                    <button
                      onClick={() => handleOpenEditModal(lot)}
                      className="flex-1 py-2 bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-800 font-bold text-xs rounded-lg border border-slate-200 flex items-center justify-center gap-1.5 transition duration-150 shadow-sm"
                    >
                      <Edit3 size={14} />
                      Editar
                    </button>
                    {lot.is_archived ? (
                      <button
                        onClick={() => unarchiveLot(lot.id)}
                        className="flex-1 py-2 bg-white hover:bg-emerald-50 text-emerald-600 font-bold text-xs rounded-lg border border-slate-200 flex items-center justify-center gap-1.5 transition duration-150 shadow-sm"
                      >
                        <ArchiveRestore size={14} />
                        Reactivar
                      </button>
                    ) : (
                      <button
                        onClick={() => archiveLot(lot.id)}
                        className="flex-1 py-2 bg-white hover:bg-red-50 text-red-650 font-bold text-xs rounded-lg border border-slate-200 flex items-center justify-center gap-1.5 transition duration-150 shadow-sm"
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
            <div className="col-span-full bg-white border border-slate-200 rounded-2xl p-16 text-center text-slate-400 shadow-sm">
              <Sprout size={48} className="mx-auto text-emerald-500/20 mb-4" />
              <p className="text-base font-bold">No hay lotes que coincidan con la búsqueda.</p>
            </div>
          )}
        </div>
      )}

      {/* Modal para Crear/Editar Estándar */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-900">
                {editingLot ? 'Editar Lote de Cultivo' : 'Crear Nuevo Lote'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-650 transition text-lg font-bold">
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-650 mb-1">Nombre del Lote / Sala *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-emerald-500 shadow-sm"
                  placeholder="Ej: Cama 1 - Clones"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-650 mb-1">Genética / Variedad *</label>
                  <input
                    type="text"
                    list="strains-datalist"
                    value={strain}
                    onChange={(e) => setStrain(e.target.value)}
                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-emerald-500 text-sm shadow-sm"
                    placeholder="Ej: Moby Dick"
                    required
                  />
                  <datalist id="strains-datalist">
                    {strains.map(s => (
                      <option key={s.id} value={s.name} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-655 mb-1">Cantidad de Plantas *</label>
                  <input
                    type="number"
                    value={plantCount}
                    onChange={(e) => setPlantCount(e.target.value)}
                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-emerald-500 shadow-sm"
                    placeholder="Ej: 5"
                    min="1"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-655 mb-1">Etapa de Cultivo</label>
                  <select
                    value={stage}
                    onChange={(e) => setStage(e.target.value as Lot['stage'])}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-emerald-500 text-sm shadow-sm"
                  >
                    {['Germinación', 'Vegetativo', 'Floración', 'Secado', 'Curado'].map(st => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-655 mb-1">Fecha de Inicio *</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-emerald-500 text-sm shadow-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-655 mb-1">Notas del Lote</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-emerald-500 shadow-sm"
                  rows={3}
                  placeholder="Ej: Sustrato coco-perlita, macetas geotextiles."
                ></textarea>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl border border-slate-200 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition shadow-sm"
                >
                  {editingLot ? 'Guardar Cambios' : 'Crear Lote'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Trasplante / Rotación */}
      {showTransplantModal && transplantLot && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <ArrowRight className="text-emerald-600" size={20} />
                  Trasplantar / Cambiar Etapa
                </h3>
                <p className="text-xs text-slate-500 mt-1 font-semibold">Lote: {transplantLot.name} ({transplantLot.plant_count} plantas)</p>
              </div>
              <button onClick={() => setShowTransplantModal(false)} className="text-slate-400 hover:text-slate-650 transition text-lg font-bold">
                ✕
              </button>
            </div>
            <form onSubmit={handleConfirmTransplant} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1">Nueva Etapa *</label>
                <select
                  value={targetStage}
                  onChange={(e) => {
                    const stageSelected = e.target.value as Lot['stage'];
                    setTargetStage(stageSelected);
                    if (stageSelected === 'Vegetativo') setNewPotSize('3 Litros');
                    else if (stageSelected === 'Floración') setNewPotSize('10 Litros');
                    else if (stageSelected === 'Secado') setNewPotSize('Colgado');
                    else if (stageSelected === 'Curado') setNewPotSize('Frascos');
                  }}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-emerald-500 text-sm shadow-sm"
                  required
                >
                  {['Germinación', 'Vegetativo', 'Floración', 'Secado', 'Curado'].map(st => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-1">Volumen Maceta / Envase</label>
                  <input
                    type="text"
                    value={newPotSize}
                    onChange={(e) => setNewPotSize(e.target.value)}
                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-emerald-500 text-sm shadow-sm"
                    placeholder="Ej: 10 Litros"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-1">Altura Planta (cm)</label>
                  <input
                    type="number"
                    value={plantHeight}
                    onChange={(e) => setPlantHeight(e.target.value)}
                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-emerald-500 text-sm shadow-sm"
                    placeholder="Ej: 75"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1">Notas del Trasplante</label>
                <textarea
                  value={transplantNotes}
                  onChange={(e) => setTransplantNotes(e.target.value)}
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-emerald-500 text-xs shadow-sm"
                  rows={2}
                  placeholder="Detalles sobre sustrato, aditivos, etc."
                ></textarea>
              </div>

              <p className="text-[11px] text-slate-500 leading-normal bg-emerald-500/5 p-3 rounded-lg border border-emerald-500/10">
                💡 Al confirmar, se actualizará la etapa del lote, se reiniciará su contador de días para esta fase y se generará un reporte automático de trasplante en tu bitácora diaria.
              </p>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowTransplantModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl border border-slate-200 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition shadow-sm"
                >
                  Confirmar Trasplante
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Cronograma (Tablero Interactivo Ryanodine) */}
      {showScheduleModal && selectedScheduleLot && (() => {
        const days = calculateDaysElapsed(selectedScheduleLot.start_date);
        const currentWeekIndex = Math.floor(days / 7);
        const schedule = selectedScheduleLot.stage === 'Floración' ? FLOWER_SCHEDULE : VEG_SCHEDULE;

        const activeWeekData = schedule.find(s => s.week === activeScheduleWeek) || schedule[0];
        
        const calculatedA = (tankLiters * activeWeekData.makroA).toFixed(1);
        const calculatedB = (tankLiters * activeWeekData.mikroB).toFixed(1);

        return (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-150 select-none">
            <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
              {/* Header */}
              <div className="p-6 border-b border-slate-150 flex justify-between items-center bg-slate-50/50">
                <div>
                  <h3 className="text-xl font-extrabold text-slate-900 flex items-center gap-2.5">
                    <Beaker className="text-emerald-600" size={24} />
                    Dosificación: {selectedScheduleLot.name}
                  </h3>
                  <p className="text-xs text-slate-500 font-bold mt-1">
                    Etapa: {selectedScheduleLot.stage} • Variedad: {selectedScheduleLot.strain} • Día {days} en esta etapa
                  </p>
                </div>
                <button onClick={() => setShowScheduleModal(false)} className="text-slate-400 hover:text-slate-650 transition text-lg font-bold">
                  ✕
                </button>
              </div>

              {/* Body */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/30">
                {/* 1. Selector de Semanas Stepper Horizontal */}
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-slate-450 block uppercase tracking-wider">Semanas del Cronograma Ryanodine</span>
                  <div className="flex items-center justify-between gap-2 overflow-x-auto py-3 px-2 bg-white border border-slate-200 rounded-2xl shadow-sm scrollbar-thin">
                    {schedule.map(s => {
                      const isCurrent = s.week === currentWeekIndex;
                      const isActive = s.week === activeScheduleWeek;

                      return (
                        <button
                          key={s.week}
                          onClick={() => setActiveScheduleWeek(s.week)}
                          className={`flex flex-col items-center gap-1.5 px-3 py-2 rounded-xl transition duration-150 min-w-[70px] ${
                            isActive
                              ? 'bg-emerald-600 text-white font-bold shadow-sm'
                              : isCurrent
                                ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 font-bold'
                                : 'bg-slate-50 hover:bg-slate-100 text-slate-500 border border-slate-200'
                          }`}
                        >
                          <span className="text-[10px] uppercase font-extrabold tracking-wider">Sem</span>
                          <span className="text-lg font-black leading-none">{s.week}</span>
                          {isCurrent && (
                            <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-white' : 'bg-emerald-600'} animate-pulse`} />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Grid de Información y Calculadora */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Panel de Dosificación */}
                  <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] bg-emerald-50 border border-emerald-100 text-emerald-600 font-bold px-2 py-0.5 rounded-full uppercase">
                          Semana {activeScheduleWeek} Seleccionada
                        </span>
                        <h4 className="text-base font-extrabold text-slate-900 mt-2">{activeWeekData.title}</h4>
                      </div>
                      {activeScheduleWeek === currentWeekIndex && (
                        <span className="text-[9px] uppercase font-black px-2.5 py-0.5 bg-emerald-600 text-white rounded-full animate-pulse shadow-sm">
                          Semana en Curso
                        </span>
                      )}
                    </div>

                    {/* Objetivos Climáticos y Nutrición */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-center">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">pH Objetivo</span>
                        <span className="text-xl font-black text-slate-900 mt-1 block">{activeWeekData.ph.toFixed(1)}</span>
                      </div>
                      <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-center">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">EC Recomendada</span>
                        <span className="text-xl font-black text-slate-900 mt-1 block">{activeWeekData.ec.toFixed(2)} mS/cm</span>
                      </div>
                    </div>

                    {/* Calculadora Interactiva de Mezcla */}
                    <div className="p-4 bg-emerald-500/5 border border-emerald-600/15 rounded-2xl space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <Calculator size={14} className="text-emerald-600" />
                          Calculadora de Dosis Ryanodine
                        </span>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={tankLiters}
                            onChange={(e) => setTankLiters(Math.max(1, parseInt(e.target.value) || 0))}
                            className="w-16 px-2 py-1 bg-white border border-slate-200 rounded-lg text-slate-950 font-bold text-center text-xs shadow-sm focus:outline-none focus:border-emerald-500"
                          />
                          <span className="text-xs font-bold text-slate-600">Litros</span>
                        </div>
                      </div>

                      <div className="space-y-2 pt-1 border-t border-emerald-600/10">
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-slate-600">Makro A (Base Crecimiento/Flora)</span>
                          <span className="text-slate-900 font-extrabold text-sm">{calculatedA} ml</span>
                        </div>
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-slate-600">Mikro B + Calcis C (Dosis Unificada B)</span>
                          <span className="text-slate-900 font-extrabold text-sm">{calculatedB} ml</span>
                        </div>
                      </div>

                      <p className="text-[10px] text-slate-500 leading-relaxed italic bg-white/60 p-2.5 rounded-lg border border-emerald-500/10">
                        <strong>Nota de unificación:</strong> En la versión nueva de Ryanodine, Mikro B y Calcis C se unifican en la botella B. Usa la dosis indicada de B para tu preparación.
                      </p>
                    </div>

                    <p className="text-xs text-slate-500 leading-relaxed font-semibold italic bg-slate-50 p-3 rounded-xl border border-slate-100">
                      {activeWeekData.notes}
                    </p>
                  </div>

                  {/* Panel Lateral: Curva de EC de Cultivo */}
                  <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5 mb-1.5">
                        <TrendingUp size={16} className="text-emerald-600" />
                        Curva de EC
                      </h4>
                      <p className="text-[10px] text-slate-400 font-semibold uppercase leading-snug">Progresión nutricional del ciclo</p>
                    </div>

                    <div className="flex items-end justify-between gap-1.5 h-36 pt-6 border-b border-slate-100 pb-2 px-1">
                      {schedule.map(s => {
                        const isThisWeek = s.week === activeScheduleWeek;
                        const isCropCurrent = s.week === currentWeekIndex;
                        const barHeight = Math.min((s.ec / 2.0) * 100, 100);

                        return (
                          <div key={s.week} className="flex-1 flex flex-col items-center gap-1">
                            <span className={`text-[8px] font-bold ${isThisWeek ? 'text-emerald-600 font-extrabold' : 'text-slate-400'}`}>
                              {s.ec.toFixed(1)}
                            </span>
                            <div className="w-full bg-slate-100 rounded-t h-24 flex items-end">
                              <div 
                                className={`w-full rounded-t transition-all duration-300 ${
                                  isThisWeek 
                                    ? 'bg-emerald-500 shadow shadow-emerald-500/30' 
                                    : isCropCurrent
                                      ? 'bg-emerald-400/60'
                                      : 'bg-slate-300'
                                }`}
                                style={{ height: `${barHeight}%` }}
                              />
                            </div>
                            <span className={`text-[8px] font-bold mt-1 ${isThisWeek ? 'text-emerald-600 font-black' : 'text-slate-400'}`}>
                              S{s.week}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    <div className="text-[10px] text-slate-450 leading-relaxed font-medium pt-3 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 bg-emerald-500 rounded" />
                        <span>Semana seleccionada para dosificación</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 bg-slate-300 rounded" />
                        <span>Semana de ciclo general</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-slate-150 bg-slate-50/50 text-right">
                <button
                  onClick={() => setShowScheduleModal(false)}
                  className="px-5 py-2.5 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-xl border border-slate-200 transition shadow-sm text-sm"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
