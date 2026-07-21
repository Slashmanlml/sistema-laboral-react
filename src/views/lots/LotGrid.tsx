import { memo } from 'react';
import {
  Archive,
  ArchiveRestore,
  ArrowRight,
  Calculator,
  Calendar,
  Edit3,
  FileText,
  Hash,
  Layers,
  Sprout,
} from 'lucide-react';
import type { Lot } from '../../types/grow';
import { isWaterableStage } from '../../types/grow';
import { calculateDaysElapsed } from '../../utils/calculations';
import { EmptyState } from '../../components/ui/Card';
import { stageProgress } from './stageMeta';

interface LotGridProps {
  lots: Lot[];
  onOpenSchedule: (lot: Lot) => void;
  onOpenTransplant: (lot: Lot) => void;
  onEdit: (lot: Lot) => void;
  onArchive: (id: string) => void;
  onUnarchive: (id: string) => void;
}

type LotCardProps = Omit<LotGridProps, 'lots'> & { lot: Lot };

const LotCard = memo(
  ({ lot, onOpenSchedule, onOpenTransplant, onEdit, onArchive, onUnarchive }: LotCardProps) => {
    const days = calculateDaysElapsed(lot.start_date);
    const progress = stageProgress(lot.stage, days);

    return (
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:border-slate-300 transition duration-150 flex flex-col justify-between shadow-sm">
        <div className="p-6 space-y-5">
          <div className="flex justify-between items-start gap-3">
            <div>
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">{lot.name}</h3>
              <span className="text-xs text-emerald-600 font-bold flex items-center gap-1.5 mt-1.5">
                <Sprout size={14} />
                {lot.strain}
              </span>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full shrink-0">
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
              <span className="text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center gap-1">
                <FileText size={10} /> Notas
              </span>
              <p className="text-xs text-slate-600 leading-relaxed font-medium line-clamp-2">
                {lot.notes}
              </p>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex justify-between text-xs text-slate-400 font-bold">
              <span>Progreso estimado de la etapa</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5">
              <div
                className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              type="button"
              onClick={() => onOpenTransplant(lot)}
              className="py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 text-emerald-600 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition"
            >
              <ArrowRight size={13} />
              Trasplantar / Rotar
            </button>
            {isWaterableStage(lot.stage) ? (
              <button
                type="button"
                onClick={() => onOpenSchedule(lot)}
                className="py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition"
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

        <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex justify-between gap-3">
          <button
            type="button"
            onClick={() => onEdit(lot)}
            className="flex-1 py-2 bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-800 font-bold text-xs rounded-lg border border-slate-200 flex items-center justify-center gap-1.5 transition shadow-sm"
          >
            <Edit3 size={14} />
            Editar
          </button>
          {lot.is_archived ? (
            <button
              type="button"
              onClick={() => onUnarchive(lot.id)}
              className="flex-1 py-2 bg-white hover:bg-emerald-50 text-emerald-600 font-bold text-xs rounded-lg border border-slate-200 flex items-center justify-center gap-1.5 transition shadow-sm"
            >
              <ArchiveRestore size={14} />
              Reactivar
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onArchive(lot.id)}
              className="flex-1 py-2 bg-white hover:bg-red-50 text-red-600 font-bold text-xs rounded-lg border border-slate-200 flex items-center justify-center gap-1.5 transition shadow-sm"
            >
              <Archive size={14} />
              Archivar
            </button>
          )}
        </div>
      </div>
    );
  }
);
LotCard.displayName = 'LotCard';

export const LotGrid = ({ lots, ...handlers }: LotGridProps) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {lots.length > 0 ? (
      lots.map(lot => <LotCard key={lot.id} lot={lot} {...handlers} />)
    ) : (
      <div className="col-span-full bg-white border border-slate-200 rounded-2xl shadow-sm">
        <EmptyState
          icon={<Sprout size={48} />}
          title="No hay lotes que coincidan con la búsqueda."
          className="py-16"
        />
      </div>
    )}
  </div>
);
