import { useMemo } from 'react';
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  Calendar,
  CheckCircle,
  Circle,
  Clock,
  Droplet,
  Info,
} from 'lucide-react';
import type { IrrigationMethod, Log, Lot, NutrientLine } from '../../types/grow';
import {
  analyzeRunoffAndStrategy,
  getWeeklyIrrigationSchedule,
  type RunoffAnalysisResult,
} from '../../utils/irrigationEngine';
import { StatTile } from '../../components/ui/Card';

interface ScheduleIrrigationTabProps {
  lot: Lot;
  logs: Log[];
  nutrientLine: NutrientLine;
  irrigationMethod: IrrigationMethod;
}

const STATUS_STYLES: Record<
  RunoffAnalysisResult['status'],
  { className: string; icon: React.ReactNode }
> = {
  optimal: {
    className: 'bg-emerald-50 border-emerald-100 text-emerald-800',
    icon: <CheckCircle className="text-emerald-600" size={20} />,
  },
  warning: {
    className: 'bg-amber-50 border-amber-200 text-amber-800',
    icon: <AlertCircle className="text-amber-600" size={20} />,
  },
  critical: {
    className: 'bg-rose-50 border-rose-200 text-rose-800',
    icon: <AlertTriangle className="text-rose-600" size={20} />,
  },
  insufficient_data: {
    className: 'bg-slate-50 border-slate-200 text-slate-700',
    icon: <Info className="text-slate-500" size={20} />,
  },
};

export const ScheduleIrrigationTab = ({
  lot,
  logs,
  nutrientLine,
  irrigationMethod,
}: ScheduleIrrigationTabProps) => {
  // Ambos cálculos recorren todo el historial: se memorizan para no repetirlos
  // en cada render del modal.
  const analysis = useMemo(
    () => analyzeRunoffAndStrategy(lot, logs, nutrientLine),
    [lot, logs, nutrientLine]
  );

  const weekSchedule = useMemo(
    () => getWeeklyIrrigationSchedule(lot, new Date(), nutrientLine, irrigationMethod, logs),
    [lot, nutrientLine, irrigationMethod, logs]
  );

  const status = STATUS_STYLES[analysis.status];

  return (
    <div className="space-y-6">
      {/* Diagnóstico de escorrentía */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5">
          <span className="p-2 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-600">
            <Activity size={20} />
          </span>
          <h4 className="text-base font-bold text-slate-800">
            Diagnóstico Adaptativo de Runoff
          </h4>
        </div>

        <div
          className={`p-4 border rounded-xl flex items-start gap-3 text-xs font-semibold leading-relaxed ${status.className}`}
        >
          <span className="mt-0.5 shrink-0">{status.icon}</span>
          <div>
            <strong className="text-sm font-extrabold block mb-1">{analysis.message}</strong>
            <p className="whitespace-pre-line font-medium">{analysis.suggestedCorrection}</p>
          </div>
        </div>

        {analysis.alerts.length > 0 && (
          <div className="space-y-1.5 pl-1">
            {analysis.alerts.map(alert => (
              <span key={alert} className="block text-[11px] font-extrabold text-rose-600">
                {alert}
              </span>
            ))}
          </div>
        )}

        {analysis.status !== 'insufficient_data' && (
          <div className="pt-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-2 tracking-wider">
              Promedios (últimos 3 riegos)
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatTile
                label="EC Entrada"
                value={`${analysis.averages.avgInputEC || '-.-'} mS/cm`}
              />
              <StatTile
                label="EC Escorrentía"
                value={`${analysis.averages.avgRunoffEC || '-.-'} mS/cm`}
                emphasis
              />
              <StatTile label="pH Entrada" value={analysis.averages.avgInputPH || '-.-'} />
              <StatTile
                label="pH Escorrentía"
                value={analysis.averages.avgRunoffPH || '-.-'}
                emphasis
              />
            </div>
          </div>
        )}
      </div>

      {/* Calendario semanal */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5">
          <span className="p-2 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-600">
            <Calendar size={20} />
          </span>
          <div>
            <h4 className="text-base font-bold text-slate-800">Calendario Semanal de Riego</h4>
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">
              Esquema sugerido de lunes a domingo
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {weekSchedule.map(day => (
            <div
              key={day.date}
              className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl gap-3"
            >
              <div className="flex items-start gap-3">
                <span className="mt-0.5 shrink-0">
                  {day.isCompleted ? (
                    <CheckCircle className="text-emerald-500" size={18} />
                  ) : (
                    <Circle className="text-slate-300" size={18} />
                  )}
                </span>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-slate-800">{day.dayName}</span>
                    <span className="text-[10px] text-slate-400 font-bold">{day.date}</span>
                    {day.isCompleted && (
                      <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded">
                        Regado
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1 font-semibold">{day.dosisText}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 sm:justify-end text-xs font-semibold text-slate-500">
                <span className="flex items-center gap-1.5 bg-white px-2 py-1 border border-slate-200 rounded-lg text-slate-600">
                  <Droplet size={12} className="text-emerald-500" />
                  pH: <strong className="text-slate-800">{day.phTarget.toFixed(1)}</strong> • EC:{' '}
                  <strong className="text-slate-800">{day.ecTarget.toFixed(2)} mS</strong>
                </span>
                <span className="flex items-center gap-1.5 bg-white px-2 py-1 border border-slate-200 rounded-lg text-slate-600">
                  <Clock size={12} className="text-emerald-500" />
                  {day.frequency} • {day.timeOfDay}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
