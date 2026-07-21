import { useCallback, useMemo, useState } from 'react';
import { Search, Plus, LayoutGrid, Kanban } from 'lucide-react';

import { useGrow, useGrowActions } from '../context/GrowContext';
import type { Lot } from '../types/grow';
import { todayStr } from '../utils/date';
import { Button } from '../components/ui/Button';
import { LotPipeline } from './lots/LotPipeline';
import { LotGrid } from './lots/LotGrid';
import { LotFormModal, type LotFormData } from './lots/LotFormModal';
import { TransplantModal, type TransplantData } from './lots/TransplantModal';
import { ScheduleModal } from './lots/ScheduleModal';

type StatusFilter = 'all' | 'active' | 'archived';
type ViewType = 'pipeline' | 'grid';

export const LotsView = () => {
  const { lots, strains, logs, activeNutrientLine, irrigationMethod } = useGrow();
  const { addLot, editLot, archiveLot, unarchiveLot, addLog } = useGrowActions();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active');
  const [viewType, setViewType] = useState<ViewType>('pipeline');

  const [formOpen, setFormOpen] = useState(false);
  const [editingLot, setEditingLot] = useState<Lot | null>(null);
  const [transplantLot, setTransplantLot] = useState<Lot | null>(null);
  const [scheduleLot, setScheduleLot] = useState<Lot | null>(null);

  const filteredLots = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return lots.filter(lot => {
      const matchesSearch =
        !term ||
        lot.name.toLowerCase().includes(term) ||
        lot.strain.toLowerCase().includes(term);

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && !lot.is_archived) ||
        (statusFilter === 'archived' && lot.is_archived);

      return matchesSearch && matchesStatus;
    });
  }, [lots, searchTerm, statusFilter]);

  const openCreateModal = useCallback(() => {
    setEditingLot(null);
    setFormOpen(true);
  }, []);

  const openEditModal = useCallback((lot: Lot) => {
    setEditingLot(lot);
    setFormOpen(true);
  }, []);

  const handleSubmitLot = (data: LotFormData) => {
    if (editingLot) void editLot({ ...editingLot, ...data });
    else void addLot(data);
    setFormOpen(false);
  };

  const handleConfirmTransplant = async (data: TransplantData) => {
    const lot = transplantLot;
    if (!lot) return;
    setTransplantLot(null);

    const transplantNote = [
      `Trasplantado a ${data.potSize} el ${todayStr()}.`,
      data.notes.trim(),
    ]
      .filter(Boolean)
      .join(' ');

    // Las notas previas se conservan: antes el trasplante las sobrescribía.
    const updatedNotes = [lot.notes?.trim(), transplantNote].filter(Boolean).join('\n');

    await editLot({
      ...lot,
      stage: data.targetStage,
      start_date: todayStr(),
      notes: updatedNotes || undefined,
    });

    // Arrastrar el último clima conocido del lote para no inventar valores.
    const lastLog = logs.find(log => log.lot_id === lot.id);

    await addLog({
      lot_id: lot.id,
      temp: lastLog?.temp ?? 24,
      humidity: lastLog?.humidity ?? 50,
      notes: [
        `TRASPLANTE: movido a ${data.targetStage}. Nueva maceta: ${data.potSize}.`,
        data.plantHeight ? `Altura: ${data.plantHeight} cm.` : '',
        data.notes.trim() ? `Detalle: ${data.notes.trim()}` : '',
      ]
        .filter(Boolean)
        .join(' '),
    });
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto text-slate-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Lotes de Cultivo
          </h2>
          <p className="text-slate-500 mt-1 font-medium">
            Monitoreá tus salas, plantas y fases del ciclo.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex bg-slate-100 border border-slate-200 rounded-xl p-1 shadow-sm">
            {(
              [
                ['pipeline', 'Pipeline', <Kanban key="k" size={14} />],
                ['grid', 'Lista Simple', <LayoutGrid key="g" size={14} />],
              ] as const
            ).map(([value, label, icon]) => (
              <button
                key={value}
                type="button"
                onClick={() => setViewType(value)}
                aria-pressed={viewType === value}
                className={`p-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  viewType === value
                    ? 'bg-white text-emerald-600 shadow-sm border border-slate-200/50'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {icon}
                {label}
              </button>
            ))}
          </div>

          <Button icon={<Plus size={18} />} onClick={openCreateModal}>
            Nuevo Lote
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col md:flex-row gap-4 bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-4 top-3.5 text-slate-400" />
          <label htmlFor="lot-search" className="sr-only">
            Buscar lote o genética
          </label>
          <input
            id="lot-search"
            type="search"
            placeholder="Buscar lote o genética..."
            value={searchTerm}
            onChange={event => setSearchTerm(event.target.value)}
            className="w-full pl-12 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-emerald-500 text-sm shadow-sm"
          />
        </div>
        <label htmlFor="lot-status" className="sr-only">
          Filtrar por estado
        </label>
        <select
          id="lot-status"
          value={statusFilter}
          onChange={event => setStatusFilter(event.target.value as StatusFilter)}
          className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-emerald-500 text-sm shadow-sm"
        >
          <option value="active">Mostrar Activos</option>
          <option value="archived">Mostrar Archivados</option>
          <option value="all">Mostrar Todos</option>
        </select>
      </div>

      {viewType === 'pipeline' ? (
        <LotPipeline
          lots={filteredLots}
          onOpenSchedule={setScheduleLot}
          onOpenTransplant={setTransplantLot}
          onEdit={openEditModal}
          onArchive={id => void archiveLot(id)}
        />
      ) : (
        <LotGrid
          lots={filteredLots}
          onOpenSchedule={setScheduleLot}
          onOpenTransplant={setTransplantLot}
          onEdit={openEditModal}
          onArchive={id => void archiveLot(id)}
          onUnarchive={id => void unarchiveLot(id)}
        />
      )}

      {/* Los modales se montan sólo cuando están abiertos y llevan `key`: así el
          formulario arranca con los valores del lote sin necesitar un efecto. */}
      {formOpen && (
        <LotFormModal
          key={editingLot?.id ?? 'nuevo'}
          editingLot={editingLot}
          strains={strains}
          onClose={() => setFormOpen(false)}
          onSubmit={handleSubmitLot}
        />
      )}

      {transplantLot && (
        <TransplantModal
          key={transplantLot.id}
          lot={transplantLot}
          onClose={() => setTransplantLot(null)}
          onConfirm={data => void handleConfirmTransplant(data)}
        />
      )}

      {scheduleLot && (
        <ScheduleModal
          key={`${scheduleLot.id}-${activeNutrientLine}`}
          lot={scheduleLot}
          logs={logs}
          nutrientLine={activeNutrientLine}
          irrigationMethod={irrigationMethod}
          onClose={() => setScheduleLot(null)}
        />
      )}
    </div>
  );
};
