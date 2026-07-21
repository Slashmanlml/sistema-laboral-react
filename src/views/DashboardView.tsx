import { useMemo, useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  Dna,
  Droplets,
  Plus,
  Sprout,
  Thermometer,
  Wind,
} from 'lucide-react';

import { useGrow, useGrowActions } from '../context/GrowContext';
import { calculateDaysElapsed, getAthenaClimateTargets, getCycleWeek, getVPDInfo } from '../utils/calculations';
import { todayStr } from '../utils/date';
import { formatHeaderDate } from '../utils/format';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/Card';
import { PhotoLightbox } from '../components/ui/PhotoLightbox';
import { MetricCard } from './dashboard/MetricCard';
import { LunarWidget } from './dashboard/LunarWidget';
import { IrrigationAlerts } from './dashboard/IrrigationAlerts';
import { ClimateChart } from './dashboard/ClimateChart';
import { RecentWaterings } from './dashboard/RecentWaterings';
import { QuickLogModal } from './dashboard/QuickLogModal';
import { climateSubtext, climateTargetsFor, getTrend } from './dashboard/climateStatus';
import { stageProgress } from './lots/stageMeta';

export const DashboardView = () => {
  const {
    logs,
    tasks,
    helpers,
    activeLots,
    lotsById,
    activeNutrientLine,
    irrigationMethod,
  } = useGrow();
  const { addLog, toggleTask } = useGrowActions();

  const [showQuickLog, setShowQuickLog] = useState(false);
  const [activePhotoUrl, setActivePhotoUrl] = useState<string | null>(null);

  const today = todayStr();
  const todayTasks = useMemo(() => tasks.filter(t => t.date === today), [tasks, today]);
  const pendingTasksCount = todayTasks.filter(t => !t.is_completed).length;

  const recentWaterings = useMemo(
    () => logs.filter(l => typeof l.water_amount === 'number' && l.water_amount > 0).slice(0, 5),
    [logs]
  );

  const lastLog = logs[0];

  // La tendencia compara contra el registro anterior DEL MISMO LOTE.
  const previousLogSameLot = useMemo(
    () => (lastLog ? logs.slice(1).find(l => l.lot_id === lastLog.lot_id) : undefined),
    [logs, lastLog]
  );

  const vpdInfo = lastLog ? getVPDInfo(lastLog.vpd) : null;

  // Objetivos Athena según el lote del último registro.
  const athenaClimate = useMemo(() => {
    if (!lastLog) return null;
    if (activeNutrientLine !== 'athena_pro' && activeNutrientLine !== 'athena_blended') {
      return null;
    }
    const lot = lotsById.get(lastLog.lot_id);
    return lot ? getAthenaClimateTargets(lot.stage, getCycleWeek(lot)) : null;
  }, [lastLog, lotsById, activeNutrientLine]);

  const trendLabel = previousLogSameLot
    ? 'Comparado con la medición anterior del mismo lote'
    : undefined;

  return (
    <div className="space-y-8 max-w-7xl mx-auto text-slate-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Dashboard</h2>
          <p className="text-slate-500 mt-1 font-medium">
            Resumen general del estado de tus salas de cultivo.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-600 font-semibold shadow-sm">
            <Calendar size={16} className="text-emerald-500" />
            <span className="capitalize">{formatHeaderDate(new Date())}</span>
          </div>
          <Button icon={<Plus size={18} />} onClick={() => setShowQuickLog(true)}>
            Nuevo Registro
          </Button>
        </div>
      </div>

      <LunarWidget />

      <IrrigationAlerts
        activeLots={activeLots}
        logs={logs}
        nutrientLine={activeNutrientLine}
        irrigationMethod={irrigationMethod}
      />

      {/* Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard
          icon={<Thermometer size={24} />}
          title="Última Temperatura"
          value={lastLog ? `${lastLog.temp.toFixed(1)} °C` : '--.- °C'}
          subtext={climateSubtext(
            lastLog?.temp,
            climateTargetsFor(athenaClimate, 'temp'),
            { low: 18, high: 28, labels: ['Frío', 'Ideal', 'Caluroso'] },
            '°C'
          )}
          trend={getTrend(lastLog?.temp, previousLogSameLot?.temp)}
          trendLabel={trendLabel}
          theme="blue"
        />
        <MetricCard
          icon={<Droplets size={24} />}
          title="Última Humedad"
          value={lastLog ? `${lastLog.humidity}%` : '--%'}
          subtext={climateSubtext(
            lastLog?.humidity,
            climateTargetsFor(athenaClimate, 'humidity'),
            { low: 40, high: 75, labels: ['Seco', 'Adecuado', 'Húmedo'] },
            '%'
          )}
          trend={getTrend(lastLog?.humidity, previousLogSameLot?.humidity, 1)}
          trendLabel={trendLabel}
          theme="green"
        />
        <MetricCard
          icon={<Wind size={24} />}
          title="Último VPD"
          value={lastLog ? `${lastLog.vpd.toFixed(2)} kPa` : '-.-- kPa'}
          subtext={
            athenaClimate
              ? climateSubtext(
                  lastLog?.vpd,
                  climateTargetsFor(athenaClimate, 'vpd'),
                  { low: 0.4, high: 1.6, labels: ['Bajo', 'Ideal', 'Alto'] },
                  ' kPa'
                )
              : (vpdInfo?.label ?? 'Sin datos')
          }
          badgeClass={vpdInfo?.statusClass}
          trend={getTrend(lastLog?.vpd, previousLogSameLot?.vpd, 0.05)}
          trendLabel={trendLabel}
          theme="amber"
        />
        <MetricCard
          icon={<Sprout size={24} />}
          title="Lotes Activos"
          value={String(activeLots.length)}
          subtext={`${activeLots.reduce((total, lot) => total + lot.plant_count, 0)} plantas en curso`}
          theme="emerald"
        />
      </div>

      {/* Gráfico y tareas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ClimateChart logs={logs} />

        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4 gap-3">
            <h3 className="text-lg font-bold text-slate-800">Tareas de Hoy</h3>
            <span className="text-xs font-bold px-2.5 py-1 bg-yellow-500/10 text-yellow-600 border border-yellow-500/20 rounded-full shrink-0">
              {pendingTasksCount} pendientes
            </span>
          </div>
          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {todayTasks.length > 0 ? (
              todayTasks.map(task => (
                <div
                  key={task.id}
                  className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <input
                    type="checkbox"
                    id={`dash-task-${task.id}`}
                    checked={task.is_completed}
                    onChange={() => void toggleTask(task.id)}
                    className="mt-1 rounded border-slate-300 bg-white text-emerald-600 focus:ring-emerald-500/50"
                  />
                  <div className="flex-1 min-w-0">
                    <label
                      htmlFor={`dash-task-${task.id}`}
                      className={`text-sm font-bold cursor-pointer ${
                        task.is_completed ? 'line-through text-slate-400' : 'text-slate-800'
                      }`}
                    >
                      {task.title}
                    </label>
                    {task.notes && (
                      <p className="text-xs text-slate-500 mt-1">{task.notes}</p>
                    )}
                    <span className="inline-block text-[9px] uppercase font-extrabold text-emerald-600 mt-2">
                      {task.type}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState
                icon={<CheckCircle2 size={36} />}
                title="¡Todo al día por hoy!"
                className="py-16"
              />
            )}
          </div>
        </div>
      </div>

      <RecentWaterings
        waterings={recentWaterings}
        lotsById={lotsById}
        onViewPhoto={setActivePhotoUrl}
      />

      {/* Lotes en curso */}
      <div className="space-y-4">
        <h3 className="text-xl font-extrabold text-slate-900">Lotes en Curso</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {activeLots.length > 0 ? (
            activeLots.map(lot => {
              const days = calculateDaysElapsed(lot.start_date);
              const progress = stageProgress(lot.stage, days);

              return (
                <div
                  key={lot.id}
                  className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:border-slate-300 transition duration-150"
                >
                  <div className="flex justify-between items-start gap-3">
                    <div>
                      <h4 className="text-lg font-bold text-slate-900">{lot.name}</h4>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold mt-1">
                        <Dna size={12} className="text-emerald-500" />
                        <span>{lot.strain}</span>
                      </div>
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 rounded-full shrink-0">
                      {lot.stage}
                    </span>
                  </div>

                  <div className="mt-6 space-y-4 pt-3 border-t border-slate-100">
                    <div className="flex justify-between text-sm font-medium">
                      <span className="text-slate-400">Días transcurridos:</span>
                      <span className="text-slate-800">{days} días</span>
                    </div>
                    <div className="flex justify-between text-sm font-medium">
                      <span className="text-slate-400">Cantidad de plantas:</span>
                      <span className="text-slate-800">{lot.plant_count} unidades</span>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs text-slate-400 font-bold">
                        <span>Progreso de la etapa</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2">
                        <div
                          className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full bg-white border border-slate-200 rounded-2xl shadow-sm">
              <EmptyState
                icon={<Sprout size={48} />}
                title="No tenés ningún lote de cultivo activo."
                className="py-12"
              />
            </div>
          )}
        </div>
      </div>

      <QuickLogModal
        open={showQuickLog}
        activeLots={activeLots}
        helpers={helpers}
        onClose={() => setShowQuickLog(false)}
        onSubmit={log => void addLog(log)}
      />

      <PhotoLightbox url={activePhotoUrl} onClose={() => setActivePhotoUrl(null)} />
    </div>
  );
};
