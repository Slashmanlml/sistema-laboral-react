import React, { useState } from 'react';
import { useGrow } from '../context/GrowContext';
import { calculateDaysElapsed, getVPDInfo, getAthenaClimateTargets } from '../utils/calculations';
import { Thermometer, Droplets, Wind, Sprout, Plus, Calendar, CheckCircle2, Dna, Image as ImageIcon, Activity, Clock, AlertCircle } from 'lucide-react';
import { getLunarInfo, LUNAR_DAY_META, LUNAR_PHASE_META } from '../utils/lunar';
import { getWeeklyIrrigationSchedule, analyzeRunoffAndStrategy } from '../utils/irrigationEngine';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export const DashboardView = () => {
  const { 
    lots, logs, tasks, toggleTask, addLog, 
    activeNutrientLine, irrigationMethod
  } = useGrow();
  const [showQuickLog, setShowQuickLog] = useState(false);
  const [activePhotoUrl, setActivePhotoUrl] = useState<string | null>(null);

  // Estados del modal rápido
  const [selectedLot, setSelectedLot] = useState('');
  const [temp, setTemp] = useState('');
  const [humidity, setHumidity] = useState('');
  const [ph, setPh] = useState('');
  const [ec, setEc] = useState('');
  const [water, setWater] = useState('');
  const [notes, setNotes] = useState('');

  const activeLots = lots.filter(l => !l.is_archived);
  const todayStr = new Date().toISOString().split('T')[0];
  const todayTasks = tasks.filter(t => t.date === todayStr);
  const pendingTasksCount = todayTasks.filter(t => !t.is_completed).length;

  // Obtener últimas métricas registradas
  const lastLog = logs.length > 0 ? logs[0] : null;
  const vpdInfo = lastLog ? getVPDInfo(lastLog.vpd) : null;
  const recentWaterings = logs.filter(l => l.water_amount && l.water_amount > 0).slice(0, 5);

  // Objetivos de Clima Athena basados en el lote del último registro
  const lastLogLot = lastLog ? lots.find(l => l.id === lastLog.lot_id) : null;
  const lastLogDays = lastLogLot ? calculateDaysElapsed(lastLogLot.start_date) : 0;
  const lastLogWeek = lastLogLot?.stage === 'Floración' ? Math.max(Math.floor(lastLogDays / 7) + 1, 1) : Math.floor(lastLogDays / 7);
  const athenaClimate = (lastLogLot && (activeNutrientLine === 'athena_pro' || activeNutrientLine === 'athena_blended'))
    ? getAthenaClimateTargets(lastLogLot.stage, lastLogWeek)
    : null;

  // Preparar datos para el gráfico ambiental (últimas 10 mediciones en orden cronológico)
  const sortedLogs = [...logs].slice(0, 10).reverse();
  const chartData = {
    labels: sortedLogs.map(l => {
      const date = new Date(l.date);
      return date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
    }),
    datasets: [
      {
        label: 'Temperatura (°C)',
        data: sortedLogs.map(l => l.temp),
        borderColor: '#0284c7', // sky-600
        backgroundColor: 'rgba(2, 132, 199, 0.05)',
        tension: 0.3,
        fill: true,
      },
      {
        label: 'Humedad (%)',
        data: sortedLogs.map(l => l.humidity),
        borderColor: '#059669', // emerald-600
        backgroundColor: 'rgba(5, 150, 105, 0.05)',
        tension: 0.3,
        fill: true,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: { color: '#475569', font: { weight: 'bold' as const } }
      },
    },
    scales: {
      x: { grid: { color: '#f1f5f9' }, ticks: { color: '#64748b' } },
      y: { grid: { color: '#f1f5f9' }, ticks: { color: '#64748b' } }
    }
  };

  const formatEC = (val: string): number | undefined => {
    const num = parseFloat(val);
    if (!val || isNaN(num)) return undefined;
    return num >= 10 ? num / 1000 : num;
  };

  const handleQuickLogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLot || !temp || !humidity) return;

    addLog({
      lot_id: selectedLot,
      temp: parseFloat(temp),
      humidity: parseFloat(humidity),
      ph: ph ? parseFloat(ph) : undefined,
      ec: formatEC(ec),
      water_amount: water ? parseFloat(water) : undefined,
      notes: notes || undefined
    });

    setSelectedLot('');
    setTemp('');
    setHumidity('');
    setPh('');
    setEc('');
    setWater('');
    setNotes('');
    setShowQuickLog(false);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto text-slate-700">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Dashboard</h2>
          <p className="text-slate-500 mt-1 font-medium">Resumen general del estado de tus salas de cultivo.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-600 font-semibold shadow-sm">
            <Calendar size={16} className="text-emerald-500" />
            <span>{new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'short' })}</span>
          </div>
          <button
            onClick={() => setShowQuickLog(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition duration-150 shadow-sm shadow-emerald-600/10 text-sm"
          >
            <Plus size={18} />
            Nuevo Registro
          </button>
        </div>
      </div>

      {/* Widget Growlendario Lunar */}
      {(() => {
        const lunarInfo = getLunarInfo(new Date());
        const meta = LUNAR_DAY_META[lunarInfo.type];
        const phase = LUNAR_PHASE_META[lunarInfo.phase];
        return (
          <div className="p-5 border rounded-2xl shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition animate-in fade-in duration-200"
            style={{ backgroundColor: meta.bgColor, borderColor: meta.borderColor }}
          >
            <div className="flex items-start gap-4">
              <span className="text-4xl leading-none mt-1 select-none shrink-0">{meta.emoji}</span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded border border-white/50" style={{ backgroundColor: `${meta.color}15`, color: meta.textColor }}>
                    {meta.label}
                  </span>
                  <span className="text-xs text-slate-500 font-bold flex items-center gap-1">
                    Fase: <strong className="text-slate-800 flex items-center gap-0.5">{phase.emoji} {phase.label}</strong>
                  </span>
                </div>
                <h3 className="text-base font-extrabold text-slate-900 mt-1.5">Recomendación Lunar de Hoy</h3>
                {lunarInfo.warning ? (
                  <p className="text-xs font-bold text-red-600 mt-1">⚠️ {lunarInfo.warning}</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {lunarInfo.activities.map((act, idx) => (
                      <span key={idx} className="text-xs font-bold bg-white/80 border border-slate-100 text-slate-700 px-2.5 py-1 rounded-xl shadow-xs flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: meta.color }} />
                        {act}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="text-xs text-slate-600 leading-normal max-w-xs font-semibold bg-white/60 p-3 rounded-xl border border-white/50 self-stretch md:self-auto flex items-center shadow-2xs">
              <span>💡 <strong>Efecto lunar:</strong> La gravedad y la luz de la luna regulan la presión de la savia. Durante el {meta.label.toLowerCase()} ({phase.label.toLowerCase()}), las plantas responden de forma óptima a estas labores.</span>
            </div>
          </div>
        );
      })()}

      {/* Widget de Alertas y Estrategia de Riego de Hoy */}
      {(() => {
        const waterableLots = activeLots.filter(l => l.stage === 'Vegetativo' || l.stage === 'Floración');
        if (waterableLots.length === 0) return null;

        return (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-600">
                <Activity size={22} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">Alertas de Riego y Escorrentía de Hoy</h3>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">Cronograma de labores diario y sugerencias correctivas basadas en tus últimas mediciones de escorrentía.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {waterableLots.map(lot => {
                const schedule = getWeeklyIrrigationSchedule(lot, new Date(), activeNutrientLine, irrigationMethod, logs);
                const todaySched = schedule.find(d => d.date === todayStr);
                const runoffAnalysis = analyzeRunoffAndStrategy(lot, logs, activeNutrientLine);

                const isCompleted = todaySched ? todaySched.isCompleted : false;
                const phTarget = todaySched ? todaySched.phTarget : 5.8;
                const ecTarget = todaySched ? todaySched.ecTarget : 0.0;
                const frequency = todaySched ? todaySched.frequency : 'Riego diario';
                const timeOfDay = todaySched ? todaySched.timeOfDay : 'Mañana';
                const dosisText = todaySched ? todaySched.dosisText : 'Agua base';

                // Determinar clases de la tarjeta de runoff
                let runoffBg = 'bg-slate-50 border-slate-100 text-slate-700';
                if (runoffAnalysis.status === 'optimal') {
                  runoffBg = 'bg-emerald-50/50 border-emerald-100 text-emerald-800';
                } else if (runoffAnalysis.status === 'warning') {
                  runoffBg = 'bg-amber-50/70 border-amber-200 text-amber-800';
                } else if (runoffAnalysis.status === 'critical') {
                  runoffBg = 'bg-rose-50/50 border-rose-100 text-rose-800';
                }

                return (
                  <div key={lot.id} className="p-4 border border-slate-200 rounded-xl space-y-3.5 hover:border-slate-300 transition shadow-2xs flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <h4 className="font-extrabold text-slate-900 text-sm">{lot.name}</h4>
                          <span className="text-[10px] text-emerald-600 font-bold block mt-0.5">{lot.strain} • {lot.plant_count} plantas</span>
                        </div>
                        {isCompleted ? (
                          <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-emerald-100 text-emerald-700 border border-emerald-250 rounded">
                            ✓ Regado
                          </span>
                        ) : (
                          <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-amber-100 text-amber-705 text-amber-700 border border-amber-200 rounded animate-pulse">
                            ⚠️ Pendiente
                          </span>
                        )}
                      </div>

                      {/* Parámetros de Hoy */}
                      <div className="grid grid-cols-2 gap-2 text-xs font-semibold pt-1 border-t border-slate-100">
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <Droplets size={12} className="text-emerald-500" />
                          <span>pH: <strong className="text-slate-800 font-extrabold">{phTarget.toFixed(1)}</strong></span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <Wind size={12} className="text-emerald-500" />
                          <span>EC: <strong className="text-slate-800 font-extrabold">{ecTarget.toFixed(2)} mS</strong></span>
                        </div>
                        <div className="col-span-2 flex items-center gap-1.5 text-slate-500">
                          <Clock size={12} className="text-emerald-500 shrink-0" />
                          <span className="truncate">{frequency} • {timeOfDay}</span>
                        </div>
                      </div>

                      <p className="text-[10px] text-slate-500 font-bold leading-snug bg-slate-50 p-2 rounded border border-slate-100">
                        Fórmula: {dosisText}
                      </p>
                    </div>

                    {/* Recomendación de Escorrentía */}
                    <div className={`p-3 border rounded-lg text-[10.5px] font-semibold leading-relaxed mt-2 ${runoffBg}`}>
                      {runoffAnalysis.status === 'insufficient_data' ? (
                        <p className="text-slate-500 flex items-start gap-1">
                          <AlertCircle size={12} className="mt-0.5 text-slate-400 shrink-0" />
                          <span>Medir drenaje hoy para calibrar estrategia adaptativa.</span>
                        </p>
                      ) : (
                        <div className="space-y-1">
                          <span className="font-extrabold block text-slate-900">Estrategia de Runoff:</span>
                          <p className="text-slate-750 font-medium whitespace-pre-line leading-normal">{runoffAnalysis.suggestedCorrection.replace('• ', '')}</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Grid de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard
          icon={<Thermometer size={24} />}
          title="Última Temperatura"
          value={lastLog ? `${lastLog.temp.toFixed(1)} °C` : '--.- °C'}
          subtext={
            lastLog
              ? athenaClimate
                ? lastLog.temp > athenaClimate.maxTemp
                  ? `⚠️ Caluroso (Athena Máx: ${athenaClimate.maxTemp}°C)`
                  : lastLog.temp < athenaClimate.minTemp
                    ? `⚠️ Frío (Athena Mín: ${athenaClimate.minTemp}°C)`
                    : `✓ Rango Ideal (${athenaClimate.minTemp}-${athenaClimate.maxTemp}°C)`
                : lastLog.temp > 28
                  ? 'Caluroso'
                  : lastLog.temp < 18
                    ? 'Frío'
                    : 'Ideal'
              : 'Sin datos'
          }
          theme="blue"
        />
        <MetricCard
          icon={<Droplets size={24} />}
          title="Última Humedad"
          value={lastLog ? `${lastLog.humidity}%` : '--%'}
          subtext={
            lastLog
              ? athenaClimate
                ? lastLog.humidity > athenaClimate.maxRH
                  ? `⚠️ Húmedo (Athena Máx: ${athenaClimate.maxRH}%)`
                  : lastLog.humidity < athenaClimate.minRH
                    ? `⚠️ Seco (Athena Mín: ${athenaClimate.minRH}%)`
                    : `✓ Rango Ideal (${athenaClimate.minRH}-${athenaClimate.maxRH}%)`
                : lastLog.humidity > 75
                  ? 'Húmedo'
                  : lastLog.humidity < 40
                    ? 'Seco'
                    : 'Adecuado'
              : 'Sin datos'
          }
          theme="green"
        />
        <MetricCard
          icon={<Wind size={24} />}
          title="Último VPD"
          value={lastLog ? `${lastLog.vpd.toFixed(2)} kPa` : '-.-- kPa'}
          subtext={
            lastLog
              ? athenaClimate
                ? lastLog.vpd > athenaClimate.maxVPD
                  ? `⚠️ VPD Alto (Athena Máx: ${athenaClimate.maxVPD})`
                  : lastLog.vpd < athenaClimate.minVPD
                    ? `⚠️ VPD Bajo (Athena Mín: ${athenaClimate.minVPD})`
                    : `✓ VPD Ideal (${athenaClimate.minVPD}-${athenaClimate.maxVPD} kPa)`
                : vpdInfo
                  ? vpdInfo.label
                  : 'Sin datos'
              : 'Sin datos'
          }
          badgeClass={vpdInfo ? vpdInfo.statusClass : ''}
          theme="amber"
        />
        <MetricCard
          icon={<Sprout size={24} />}
          title="Lotes Activos"
          value={activeLots.length.toString()}
          subtext={`${activeLots.reduce((acc, curr) => acc + curr.plant_count, 0)} plantas en curso`}
          theme="emerald"
        />
      </div>

      {/* Gráfico y Tareas del Día */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico de Clima */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Wind size={20} className="text-emerald-500" />
            Historial Ambiental de las últimas 24 horas
          </h3>
          <div className="flex-1 min-h-[300px] relative">
            {logs.length > 0 ? (
              <Line data={chartData} options={chartOptions} />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                <Wind size={36} className="text-slate-300 mb-2 animate-pulse" />
                <p className="text-sm font-semibold">No hay suficientes datos climáticos para mostrar el gráfico.</p>
              </div>
            )}
          </div>
        </div>

        {/* Tareas del Día */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-slate-800">Tareas de Hoy</h3>
            <span className="text-xs font-bold px-2.5 py-1 bg-yellow-500/10 text-yellow-600 border border-yellow-500/20 rounded-full">
              {pendingTasksCount} pendientes
            </span>
          </div>
          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {todayTasks.length > 0 ? (
              todayTasks.map(task => (
                <div key={task.id} className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <input
                    type="checkbox"
                    checked={task.is_completed}
                    onChange={() => toggleTask(task.id)}
                    className="mt-1 rounded border-slate-300 bg-white text-emerald-600 focus:ring-emerald-500/50"
                  />
                  <div className="flex-1">
                    <h4 className={`text-sm font-bold ${task.is_completed ? 'line-through text-slate-400' : 'text-slate-800'}`}>{task.title}</h4>
                    {task.notes && <p className="text-xs text-slate-500 mt-1">{task.notes}</p>}
                    <span className="inline-block text-[9px] uppercase font-extrabold text-emerald-600 mt-2">
                      {task.type}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center text-slate-400 py-16">
                <CheckCircle2 size={36} className="text-emerald-500/30 mb-2" />
                <p className="text-sm font-bold">¡Todo al día por hoy!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Monitoreo Diario de Riegos */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-slate-800">Monitoreo Diario de Riegos</h3>
          <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-1 rounded-md">Últimos 5 riegos registrados</span>
        </div>
        {recentWaterings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse select-none">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 text-xs font-bold uppercase bg-slate-50">
                  <th className="py-3 px-4">Fecha/Hora</th>
                  <th className="py-3 px-4">Lote</th>
                  <th className="py-3 px-4">Agua</th>
                  <th className="py-3 px-4">Riego (Entrada)</th>
                  <th className="py-3 px-4">Drenaje (Runoff)</th>
                  <th className="py-3 px-4">Foto</th>
                  <th className="py-3 px-4">Quién Regó</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {recentWaterings.map(log => {
                  const lot = lots.find(l => l.id === log.lot_id);
                  const lotName = lot ? lot.name : 'Lote Desconocido';
                  const date = new Date(log.date).toLocaleDateString('es-AR', {
                    day: '2-digit',
                    month: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                  });
                  return (
                    <tr key={log.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-3.5 px-4 text-slate-600 font-semibold">{date}</td>
                      <td className="py-3.5 px-4 text-emerald-600 font-bold">{lotName}</td>
                      <td className="py-3.5 px-4 text-slate-800 font-semibold">{log.water_amount} L</td>
                      <td className="py-3.5 px-4 text-slate-500">
                        pH: <span className="text-slate-800 font-bold">{log.ph || '-.-'}</span> • EC: <span className="text-slate-800 font-bold">{log.ec || '-.-'} mS/cm</span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {log.ph_runoff || log.ec_runoff ? (
                          <>
                            pH: <span className="text-emerald-600 font-bold">{log.ph_runoff || '-.-'}</span> • EC: <span className="text-emerald-600 font-bold">{log.ec_runoff || '-.-'} mS/cm</span>
                          </>
                        ) : (
                          <span className="text-slate-400 italic text-xs">Sin medir</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {log.image_url ? (
                          <button 
                            onClick={() => setActivePhotoUrl(log.image_url!)}
                            className="p-1 hover:bg-slate-100 text-emerald-600 hover:text-emerald-700 rounded transition"
                            title="Ver foto de la cama"
                          >
                            <ImageIcon size={18} />
                          </button>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-semibold">{log.watered_by || 'José'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center text-slate-400 text-sm font-semibold">
            No hay riegos registrados recientemente en el diario.
          </div>
        )}
      </div>

      {/* Lotes de Cultivo Activos (Sumario) */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-extrabold text-slate-900">Lotes en Curso</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {activeLots.length > 0 ? (
            activeLots.map(lot => {
              const days = calculateDaysElapsed(lot.start_date);
              const progress = Math.min(Math.round((days / 90) * 100), 100);

              return (
                <div key={lot.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:border-slate-300 transition duration-150">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-lg font-bold text-slate-900">{lot.name}</h4>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold mt-1">
                        <Dna size={12} className="text-emerald-500" />
                        <span>{lot.strain}</span>
                      </div>
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 rounded-full">
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

                    {/* Barra de progreso */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs text-slate-400 font-bold">
                        <span>Progreso del ciclo</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2">
                        <div className="bg-emerald-500 h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 shadow-sm">
              <Sprout size={48} className="mx-auto text-emerald-500/20 mb-4" />
              <p className="text-base font-bold">No tienes ningún lote de cultivo activo.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Registro Rápido */}
      {showQuickLog && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-900">Nuevo Registro Rápido</h3>
              <button onClick={() => setShowQuickLog(false)} className="text-slate-400 hover:text-slate-600 transition text-lg font-bold">
                ✕
              </button>
            </div>
            <form onSubmit={handleQuickLogSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1">Lote de Cultivo *</label>
                <select
                  value={selectedLot}
                  onChange={(e) => setSelectedLot(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-emerald-500 text-sm"
                  required
                >
                  <option value="">Selecciona un lote...</option>
                  {activeLots.map(l => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-1">Temperatura (°C) *</label>
                  <input
                    type="number"
                    step="0.1"
                    value={temp}
                    onChange={(e) => setTemp(e.target.value)}
                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-emerald-500"
                    placeholder="Ej: 24"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-1">Humedad (%) *</label>
                  <input
                    type="number"
                    value={humidity}
                    onChange={(e) => setHumidity(e.target.value)}
                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-emerald-500"
                    placeholder="Ej: 55"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-1">pH Riego</label>
                  <input
                    type="number"
                    step="0.1"
                    value={ph}
                    onChange={(e) => setPh(e.target.value)}
                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-emerald-500"
                    placeholder="Ej: 6.2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-1">EC Riego <span className="text-slate-400 font-normal">(mS/cm o μS)</span></label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={ec}
                    onChange={(e) => setEc(e.target.value.replace(/[^0-9.]/g, ''))}
                    onBlur={() => { const n = parseFloat(ec); if (!isNaN(n) && n >= 10) setEc((n/1000).toFixed(2)); }}
                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-emerald-500"
                    placeholder="Ej: 1.2 o 1200"
                  />
                  {ec && parseFloat(ec) >= 10 && <p className="text-[10px] text-emerald-600 font-bold mt-1">→ Se guardará como {(parseFloat(ec) / 1000).toFixed(2)} mS/cm</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-1">Agua (L)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={water}
                    onChange={(e) => setWater(e.target.value)}
                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-emerald-500"
                    placeholder="Ej: 5"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1">Notas / Observaciones</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-emerald-500"
                  rows={2}
                  placeholder="Detalles sobre el riego, control foliar..."
                ></textarea>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowQuickLog(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl border border-slate-200 transition duration-150"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition duration-150"
                >
                  Guardar Registro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lightbox para ver Foto */}
      {activePhotoUrl && (
        <div 
          className="fixed inset-0 bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200"
          onClick={() => setActivePhotoUrl(null)}
        >
          <div className="relative max-w-4xl max-h-[85vh] overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-2xl p-2 animate-in zoom-in-95 duration-200">
            <img 
              src={activePhotoUrl} 
              alt="Foto de la cama de cultivo" 
              className="max-h-[80vh] w-auto h-auto object-contain rounded-xl"
            />
            <button 
              onClick={() => setActivePhotoUrl(null)}
              className="absolute top-4 right-4 bg-slate-900/60 hover:bg-slate-900 text-white p-2 rounded-full transition text-sm font-bold shadow-md"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

interface MetricCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  subtext: string;
  badgeClass?: string;
  theme: 'blue' | 'green' | 'amber' | 'emerald';
}

const MetricCard = ({ icon, title, value, subtext, badgeClass, theme }: MetricCardProps) => {
  const themes = {
    blue: 'text-blue-600 bg-blue-50 border-blue-100',
    green: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    amber: 'text-amber-600 bg-amber-50 border-amber-100',
    emerald: 'text-emerald-600 bg-emerald-50 border-emerald-100'
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center gap-4 hover:border-slate-300 transition duration-150 select-none shadow-sm">
      <div className={`p-3.5 rounded-xl border ${themes[theme]}`}>
        {icon}
      </div>
      <div className="flex-1">
        <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">{title}</span>
        <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{value}</h3>
        <div className="flex items-center gap-2 mt-1">
          {badgeClass ? (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badgeClass}`}>
              {subtext}
            </span>
          ) : (
            <span className="text-xs text-slate-500 font-semibold">{subtext}</span>
          )}
        </div>
      </div>
    </div>
  );
};
