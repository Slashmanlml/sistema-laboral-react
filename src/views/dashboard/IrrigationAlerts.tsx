import { memo, useMemo } from 'react';
import { Activity, AlertCircle, Clock, Droplets, Wind } from 'lucide-react';
import type { IrrigationMethod, Log, Lot, NutrientLine } from '../../types/grow';
import { isWaterableStage } from '../../types/grow';
import { todayStr } from '../../utils/date';
import {
  analyzeRunoffAndStrategy,
  getWeeklyIrrigationSchedule,
  type RunoffAnalysisResult,
} from '../../utils/irrigationEngine';

const RUNOFF_STYLES: Record<RunoffAnalysisResult['status'], string> = {
  optimal: 'bg-emerald-50/50 border-emerald-100 text-emerald-800',
  warning: 'bg-amber-50/70 border-amber-200 text-amber-800',
  critical: 'bg-rose-50/50 border-rose-100 text-rose-800',
  insufficient_data: 'bg-slate-50 border-slate-100 text-slate-700',
};

interface LotAlertCardProps {
  lot: Lot;
  logs: Log[];
  nutrientLine: NutrientLine;
  irrigationMethod: IrrigationMethod;
  today: string;
}

/**
 * Se memoriza por lote: `analyzeRunoffAndStrategy` y `getWeeklyIrrigationSchedule`
 * recorren y ordenan todo el historial de registros, y antes se recalculaban en
 * cada render del dashboard (incluso al tipear en el modal de registro rápido).
 */
const LotAlertCard = memo(
  ({ lot, logs, nutrientLine, irrigationMethod, today }: LotAlertCardProps) => {
    const todaySchedule = useMemo(() => {
      const week = getWeeklyIrrigationSchedule(
        lot,
        new Date(),
        nutrientLine,
        irrigationMethod,
        logs
      );
      return week.find(day => day.date === today);
    }, [lot, logs, nutrientLine, irrigationMethod, today]);

    const analysis = useMemo(
      () => analyzeRunoffAndStrategy(lot, logs, nutrientLine),
      [lot, logs, nutrientLine]
    );

    return (
      <div className="p-4 border border-slate-200 rounded-xl space-y-3.5 hover:border-slate-300 transition flex flex-col justify-between">
        <div className="space-y-2">
          <div className="flex justify-between items-start gap-2">
            <div>
              <h4 className="font-extrabold text-slate-900 text-sm">{lot.name}</h4>
              <span className="text-[10px] text-emerald-600 font-bold block mt-0.5">
                {lot.strain} • {lot.plant_count} plantas
              </span>
            </div>
            {todaySchedule?.isCompleted ? (
              <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-emerald-100 text-emerald-700 border border-emerald-200 rounded shrink-0">
                ✓ Regado
              </span>
            ) : (
              <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-amber-100 text-amber-700 border border-amber-200 rounded shrink-0">
                ⚠️ Pendiente
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-semibold pt-1 border-t border-slate-100">
            <div className="flex items-center gap-1.5 text-slate-500">
              <Droplets size={12} className="text-emerald-500" />
              <span>
                pH:{' '}
                <strong className="text-slate-800 font-extrabold">
                  {(todaySchedule?.phTarget ?? 5.8).toFixed(1)}
                </strong>
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-500">
              <Wind size={12} className="text-emerald-500" />
              <span>
                EC:{' '}
                <strong className="text-slate-800 font-extrabold">
                  {(todaySchedule?.ecTarget ?? 0).toFixed(2)} mS
                </strong>
              </span>
            </div>
            <div className="col-span-2 flex items-center gap-1.5 text-slate-500">
              <Clock size={12} className="text-emerald-500 shrink-0" />
              <span className="truncate">
                {todaySchedule?.frequency ?? 'Riego diario'} •{' '}
                {todaySchedule?.timeOfDay ?? 'Mañana'}
              </span>
            </div>
          </div>

          <p className="text-[10px] text-slate-500 font-bold leading-snug bg-slate-50 p-2 rounded border border-slate-100">
            Fórmula: {todaySchedule?.dosisText ?? 'Agua base'}
          </p>
        </div>

        <div
          className={`p-3 border rounded-lg text-[10.5px] font-semibold leading-relaxed mt-2 ${RUNOFF_STYLES[analysis.status]}`}
        >
          {analysis.status === 'insufficient_data' ? (
            <p className="text-slate-500 flex items-start gap-1">
              <AlertCircle size={12} className="mt-0.5 text-slate-400 shrink-0" />
              <span>Medí el drenaje hoy para calibrar la estrategia adaptativa.</span>
            </p>
          ) : (
            <div className="space-y-1">
              <span className="font-extrabold block text-slate-900">Estrategia de Runoff:</span>
              <p className="font-medium whitespace-pre-line leading-normal">
                {analysis.suggestedCorrection.replace('• ', '')}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }
);
LotAlertCard.displayName = 'LotAlertCard';

interface IrrigationAlertsProps {
  activeLots: Lot[];
  logs: Log[];
  nutrientLine: NutrientLine;
  irrigationMethod: IrrigationMethod;
}

export const IrrigationAlerts = ({
  activeLots,
  logs,
  nutrientLine,
  irrigationMethod,
}: IrrigationAlertsProps) => {
  const waterableLots = useMemo(
    () => activeLots.filter(lot => isWaterableStage(lot.stage)),
    [activeLots]
  );

  const today = todayStr();

  if (waterableLots.length === 0) return null;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
      <div className="flex items-center gap-2.5">
        <div className="p-2.5 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-600">
          <Activity size={22} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-800">
            Alertas de Riego y Escorrentía de Hoy
          </h3>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Cronograma diario y sugerencias correctivas según tus últimas mediciones de
            escorrentía.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {waterableLots.map(lot => (
          <LotAlertCard
            key={lot.id}
            lot={lot}
            logs={logs}
            nutrientLine={nutrientLine}
            irrigationMethod={irrigationMethod}
            today={today}
          />
        ))}
      </div>
    </div>
  );
};
