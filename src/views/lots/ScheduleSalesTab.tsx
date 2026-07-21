import { Calculator, TrendingUp } from 'lucide-react';
import type { NutrientLine } from '../../types/grow';
import type { ScheduleWeek } from '../../utils/schedules';
import { calculateTankDose, NUTRIENT_LINE_LABELS } from '../../utils/schedules';

interface ScheduleSalesTabProps {
  schedule: ScheduleWeek[];
  nutrientLine: NutrientLine;
  activeWeek: number;
  currentWeek: number;
  onSelectWeek: (week: number) => void;
  tankLiters: number;
  onTankLitersChange: (liters: number) => void;
}

export const ScheduleSalesTab = ({
  schedule,
  nutrientLine,
  activeWeek,
  currentWeek,
  onSelectWeek,
  tankLiters,
  onTankLitersChange,
}: ScheduleSalesTabProps) => {
  const activeWeekData = schedule.find(s => s.week === activeWeek) ?? schedule[0];
  if (!activeWeekData) {
    return (
      <p className="text-sm text-slate-500 font-semibold text-center py-12">
        Esta etapa no tiene cronograma de fertilizantes.
      </p>
    );
  }

  const doseRows = calculateTankDose(activeWeekData, nutrientLine, tankLiters);
  const maxEC = Math.max(...schedule.map(s => s.ec), 2.0);

  return (
    <div className="space-y-6">
      {/* Selector de semanas */}
      <div className="space-y-2">
        <span className="text-[11px] font-bold text-slate-500 block uppercase tracking-wider">
          Semanas del cronograma {NUTRIENT_LINE_LABELS[nutrientLine]}
        </span>
        <div className="flex items-center gap-2 overflow-x-auto py-3 px-2 bg-white border border-slate-200 rounded-2xl shadow-sm">
          {schedule.map(week => {
            const isCurrent = week.week === currentWeek;
            const isActive = week.week === activeWeek;
            return (
              <button
                key={week.week}
                type="button"
                onClick={() => onSelectWeek(week.week)}
                aria-pressed={isActive}
                className={`flex flex-col items-center gap-1.5 px-3 py-2 rounded-xl transition duration-150 min-w-[70px] shrink-0 ${
                  isActive
                    ? 'bg-emerald-600 text-white font-bold shadow-sm'
                    : isCurrent
                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 font-bold'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-500 border border-slate-200'
                }`}
              >
                <span className="text-[10px] uppercase font-extrabold tracking-wider">Sem</span>
                <span className="text-lg font-black leading-none">{week.week}</span>
                {isCurrent && (
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-white' : 'bg-emerald-600'} animate-pulse`}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Dosificación */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
          <div className="flex justify-between items-start gap-3">
            <div>
              <span className="text-[10px] bg-emerald-50 border border-emerald-100 text-emerald-600 font-bold px-2 py-0.5 rounded-full uppercase">
                Semana {activeWeek} seleccionada
              </span>
              <h4 className="text-base font-extrabold text-slate-900 mt-2">
                {activeWeekData.title}
              </h4>
            </div>
            {activeWeek === currentWeek && (
              <span className="text-[9px] uppercase font-black px-2.5 py-0.5 bg-emerald-600 text-white rounded-full animate-pulse shadow-sm shrink-0">
                Semana en curso
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-center">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">
                pH Objetivo
              </span>
              <span className="text-xl font-black text-slate-900 mt-1 block">
                {activeWeekData.ph.toFixed(1)}
              </span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-center">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">
                EC Recomendada
              </span>
              <span className="text-xl font-black text-slate-900 mt-1 block">
                {activeWeekData.ec.toFixed(2)} mS/cm
              </span>
            </div>
          </div>

          {/* Calculadora de mezcla */}
          <div className="p-4 bg-emerald-500/5 border border-emerald-600/15 rounded-2xl space-y-4">
            <div className="flex justify-between items-center gap-3">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Calculator size={14} className="text-emerald-600" />
                Calculadora {NUTRIENT_LINE_LABELS[nutrientLine]}
              </span>
              <div className="flex items-center gap-2">
                <label htmlFor="tank-liters" className="sr-only">
                  Litros del tanque
                </label>
                <input
                  id="tank-liters"
                  type="number"
                  min="1"
                  value={tankLiters}
                  onChange={event =>
                    onTankLitersChange(Math.max(1, Number.parseInt(event.target.value, 10) || 1))
                  }
                  className="w-16 px-2 py-1 bg-white border border-slate-200 rounded-lg text-slate-900 font-bold text-center text-xs shadow-sm focus:outline-none focus:border-emerald-500"
                />
                <span className="text-xs font-bold text-slate-600">Litros</span>
              </div>
            </div>

            <div className="space-y-2 pt-1 border-t border-emerald-600/10">
              {doseRows.map(row => (
                <div key={row.label} className="flex justify-between text-xs font-bold gap-3">
                  <span className="text-slate-600">{row.label}</span>
                  <span className="text-slate-900 font-extrabold text-sm shrink-0">
                    {row.amount} {row.unit}
                  </span>
                </div>
              ))}
            </div>

            {nutrientLine === 'ryanodine' && (
              <p className="text-[10px] text-slate-500 leading-relaxed italic bg-white/60 p-2.5 rounded-lg border border-emerald-500/10">
                <strong>Nota de unificación:</strong> en la versión nueva de Ryanodine, Mikro B
                y Calcis C se unifican en la botella B.
              </p>
            )}
          </div>

          <p className="text-xs text-slate-500 leading-relaxed font-semibold italic bg-slate-50 p-3 rounded-xl border border-slate-100">
            {activeWeekData.notes}
          </p>
        </div>

        {/* Curva de EC */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5 mb-1.5">
              <TrendingUp size={16} className="text-emerald-600" />
              Curva de EC
            </h4>
            <p className="text-[10px] text-slate-400 font-semibold uppercase leading-snug">
              Progresión nutricional del ciclo
            </p>
          </div>

          <div className="flex items-end justify-between gap-1.5 h-36 pt-6 border-b border-slate-100 pb-2 px-1">
            {schedule.map(week => {
              const isActive = week.week === activeWeek;
              const isCurrent = week.week === currentWeek;
              const barHeight = (week.ec / maxEC) * 100;

              return (
                <div key={week.week} className="flex-1 flex flex-col items-center gap-1">
                  <span
                    className={`text-[8px] font-bold ${isActive ? 'text-emerald-600' : 'text-slate-400'}`}
                  >
                    {week.ec.toFixed(1)}
                  </span>
                  <div className="w-full bg-slate-100 rounded-t h-24 flex items-end">
                    <div
                      className={`w-full rounded-t transition-all duration-300 ${
                        isActive
                          ? 'bg-emerald-500'
                          : isCurrent
                            ? 'bg-emerald-400/60'
                            : 'bg-slate-300'
                      }`}
                      style={{ height: `${barHeight}%` }}
                    />
                  </div>
                  <span
                    className={`text-[8px] font-bold mt-1 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`}
                  >
                    S{week.week}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="text-[10px] text-slate-500 leading-relaxed font-medium pt-3 space-y-1">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded" />
              <span>Semana seleccionada para dosificación</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-emerald-400/60 rounded" />
              <span>Semana actual del cultivo</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
