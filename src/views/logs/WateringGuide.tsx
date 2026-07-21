import { Info } from 'lucide-react';
import type { Lot, NutrientLine } from '../../types/grow';
import { isWaterableStage } from '../../types/grow';
import { getCycleWeek } from '../../utils/calculations';
import { getSchedule, findScheduleWeek } from '../../utils/schedules';

interface WateringGuideProps {
  lot: Lot;
  nutrientLine: NutrientLine;
}

/** Objetivos de pH y EC de la semana en curso, mostrados mientras se carga el riego. */
export const WateringGuide = ({ lot, nutrientLine }: WateringGuideProps) => {
  if (!isWaterableStage(lot.stage)) return null;

  const week = getCycleWeek(lot);
  const weekData = findScheduleWeek(getSchedule(lot.stage, nutrientLine), week);
  if (!weekData) return null;

  return (
    <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-2 animate-in fade-in duration-200">
      <div className="flex justify-between items-center gap-2">
        <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1">
          <Info size={14} /> Guía del Riego Actual
        </span>
        <span className="text-[10px] bg-white text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-100 font-extrabold shrink-0">
          Semana {week} ({lot.stage})
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 pt-1">
        <div className="p-2.5 bg-white border border-slate-100 rounded-lg text-center shadow-sm">
          <span className="text-[10px] text-slate-400 uppercase block font-bold">pH Ideal</span>
          <span className="text-lg font-black text-slate-900">{weekData.ph.toFixed(1)}</span>
        </div>
        <div className="p-2.5 bg-white border border-slate-100 rounded-lg text-center shadow-sm">
          <span className="text-[10px] text-slate-400 uppercase block font-bold">EC Ideal</span>
          <span className="text-lg font-black text-slate-900">
            {weekData.ec.toFixed(2)} mS/cm
          </span>
        </div>
      </div>

      <p className="text-xs text-slate-500 leading-relaxed italic pt-1 font-semibold">
        {weekData.notes}
      </p>
    </div>
  );
};
