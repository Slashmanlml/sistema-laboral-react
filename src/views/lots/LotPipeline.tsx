import { memo } from 'react';
import { Archive, ArrowRight, Calculator, Pencil } from 'lucide-react';
import type { Lot, LotStage } from '../../types/grow';
import { LOT_STAGES, isWaterableStage } from '../../types/grow';
import { calculateDaysElapsed } from '../../utils/calculations';
import { STAGE_META } from './stageMeta';

interface LotPipelineProps {
  lots: Lot[];
  onOpenSchedule: (lot: Lot) => void;
  onOpenTransplant: (lot: Lot) => void;
  onEdit: (lot: Lot) => void;
  onArchive: (id: string) => void;
}

interface PipelineCardProps {
  lot: Lot;
  onOpenSchedule: (lot: Lot) => void;
  onOpenTransplant: (lot: Lot) => void;
  onEdit: (lot: Lot) => void;
  onArchive: (id: string) => void;
}

const PipelineCard = memo(
  ({ lot, onOpenSchedule, onOpenTransplant, onEdit, onArchive }: PipelineCardProps) => {
    const days = calculateDaysElapsed(lot.start_date);

    return (
      <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm hover:border-slate-300 transition duration-150 space-y-3">
        <div>
          <div className="flex justify-between items-start gap-2">
            <h5 className="font-extrabold text-slate-900 text-sm truncate">{lot.name}</h5>
            <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded shrink-0">
              {lot.plant_count}p
            </span>
          </div>
          <span className="text-[11px] text-emerald-600 font-bold block truncate mt-1">
            {lot.strain}
          </span>
        </div>

        <div className="flex items-center justify-between text-xs font-semibold text-slate-500 pt-2 border-t border-slate-100">
          <span>En esta etapa:</span>
          <span className="text-slate-800">{days} días</span>
        </div>

        <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
          <div className="grid grid-cols-2 gap-2">
            {isWaterableStage(lot.stage) ? (
              <button
                type="button"
                onClick={() => onOpenSchedule(lot)}
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
              type="button"
              onClick={() => onOpenTransplant(lot)}
              title="Trasplantar / Cambiar Etapa"
              className="py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-100 rounded-lg text-[10px] font-bold transition flex items-center justify-center gap-1"
            >
              <span>Trasplante</span>
              <ArrowRight size={10} />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onEdit(lot)}
              className="py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-100 rounded-lg text-[10px] font-bold transition flex items-center justify-center gap-1"
            >
              <Pencil size={10} />
              Editar
            </button>
            <button
              type="button"
              onClick={() => onArchive(lot.id)}
              className="py-1.5 bg-slate-50 hover:bg-red-50 text-slate-500 hover:text-red-600 border border-slate-200 rounded-lg text-[10px] font-bold transition flex items-center justify-center gap-1"
            >
              <Archive size={10} />
              Archivar
            </button>
          </div>
        </div>
      </div>
    );
  }
);
PipelineCard.displayName = 'PipelineCard';

export const LotPipeline = ({
  lots,
  onOpenSchedule,
  onOpenTransplant,
  onEdit,
  onArchive,
}: LotPipelineProps) => {
  // Un solo agrupamiento en lugar de un filtro por columna.
  const byStage = new Map<LotStage, Lot[]>(LOT_STAGES.map(stage => [stage, []]));
  for (const lot of lots) byStage.get(lot.stage)?.push(lot);

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-4 min-w-[1200px] h-[75vh]">
        {LOT_STAGES.map(stage => {
          const meta = STAGE_META[stage];
          const stageLots = byStage.get(stage) ?? [];

          return (
            <div
              key={stage}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col min-w-[220px]"
            >
              <div className="mb-3">
                <h4 className="font-extrabold text-slate-900 text-sm truncate">{meta.label}</h4>
                <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1 font-semibold">
                  <span>{meta.description}</span>
                  <span>{stageLots.length}</span>
                </div>
                <div className="w-full bg-slate-200 h-0.5 mt-2 rounded" />
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {stageLots.length > 0 ? (
                  stageLots.map(lot => (
                    <PipelineCard
                      key={lot.id}
                      lot={lot}
                      onOpenSchedule={onOpenSchedule}
                      onOpenTransplant={onOpenTransplant}
                      onEdit={onEdit}
                      onArchive={onArchive}
                    />
                  ))
                ) : (
                  <div className="h-32 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-slate-400 text-xs font-semibold">
                    Vacía
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
