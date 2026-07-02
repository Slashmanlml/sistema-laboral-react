import React, { useState } from 'react';
import { useGrow } from '../context/GrowContext';
import { calculateDaysElapsed, getVPDInfo } from '../utils/calculations';
import { Thermometer, Droplets, Wind, Sprout, Plus, Calendar, CheckCircle2, Dna } from 'lucide-react';
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
  const { lots, logs, tasks, toggleTask, addLog } = useGrow();
  const [showQuickLog, setShowQuickLog] = useState(false);

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
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.3,
        fill: true,
      },
      {
        label: 'Humedad (%)',
        data: sortedLogs.map(l => l.humidity),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.3,
        fill: true,
      },
      {
        label: 'VPD (kPa)',
        data: sortedLogs.map(l => l.vpd),
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        tension: 0.3,
        fill: true,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: { color: '#9ca3af' }
      },
    },
    scales: {
      x: { grid: { color: '#1f2937' }, ticks: { color: '#9ca3af' } },
      y: { grid: { color: '#1f2937' }, ticks: { color: '#9ca3af' } }
    }
  };

  const handleQuickLogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLot || !temp || !humidity) return;

    addLog({
      lot_id: selectedLot,
      temp: parseFloat(temp),
      humidity: parseFloat(humidity),
      ph: ph ? parseFloat(ph) : undefined,
      ec: ec ? parseFloat(ec) : undefined,
      water_amount: water ? parseFloat(water) : undefined,
      notes: notes || undefined
    });

    // Resetear formulario
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
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Dashboard</h2>
          <p className="text-gray-400 mt-1">Resumen general del estado de tus salas de cultivo.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-gray-900 border border-gray-800 rounded-xl text-sm text-gray-400">
            <Calendar size={16} />
            <span>{new Date().toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
          </div>
          <button
            onClick={() => setShowQuickLog(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-green-500 hover:bg-green-600 text-gray-950 font-semibold rounded-xl transition duration-200"
          >
            <Plus size={18} />
            Nuevo Registro
          </button>
        </div>
      </div>

      {/* Grid de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard
          icon={<Thermometer size={24} />}
          title="Última Temperatura"
          value={lastLog ? `${lastLog.temp.toFixed(1)} °C` : '--.- °C'}
          subtext={lastLog ? (lastLog.temp > 28 ? 'Caluroso' : lastLog.temp < 18 ? 'Frío' : 'Ideal') : 'Sin datos'}
          theme="blue"
        />
        <MetricCard
          icon={<Droplets size={24} />}
          title="Última Humedad"
          value={lastLog ? `${lastLog.humidity}%` : '--%'}
          subtext={lastLog ? (lastLog.humidity > 75 ? 'Húmedo' : lastLog.humidity < 40 ? 'Seco' : 'Adecuado') : 'Sin datos'}
          theme="green"
        />
        <MetricCard
          icon={<Wind size={24} />}
          title="Último VPD"
          value={lastLog ? `${lastLog.vpd.toFixed(2)} kPa` : '-.-- kPa'}
          subtext={vpdInfo ? vpdInfo.label : 'Sin datos'}
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
        <div className="lg:col-span-2 bg-gray-950 border border-gray-800/80 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Historial Ambiental de las últimas 24 horas</h3>
          <div className="h-80">
            {sortedLogs.length > 0 ? (
              <Line data={chartData} options={chartOptions} />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-500">
                <Wind size={40} className="mb-2 animate-bounce" />
                <span>No hay suficientes datos climáticos para mostrar el gráfico.</span>
              </div>
            )}
          </div>
        </div>

        {/* Tareas del Día */}
        <div className="bg-gray-950 border border-gray-800/80 rounded-2xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-white">Tareas de Hoy</h3>
            <span className="text-xs font-semibold px-2.5 py-1 bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 rounded-full">
              {pendingTasksCount} pendientes
            </span>
          </div>
          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {todayTasks.length > 0 ? (
              todayTasks.map(task => (
                <div key={task.id} className="flex items-start gap-3 p-3 bg-gray-900/55 border border-gray-800 rounded-xl">
                  <input
                    type="checkbox"
                    checked={task.is_completed}
                    onChange={() => toggleTask(task.id)}
                    className="mt-1 rounded border-gray-700 bg-gray-800 text-green-500 focus:ring-green-500/50"
                  />
                  <div>
                    <h4 className={`text-sm font-semibold ${task.is_completed ? 'line-through text-gray-500' : 'text-white'}`}>{task.title}</h4>
                    {task.notes && <p className="text-xs text-gray-400 mt-1">{task.notes}</p>}
                    <span className="inline-block text-[10px] uppercase font-bold text-green-400 mt-2">
                      {task.type}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center text-gray-500 py-12">
                <CheckCircle2 size={32} className="text-green-500/50 mb-2" />
                <p className="text-sm">¡Todo al día por hoy!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Monitoreo Diario de Riegos */}
      <div className="bg-gray-950 border border-gray-800/80 rounded-2xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-white">Monitoreo Diario de Riegos</h3>
          <span className="text-xs text-gray-500">Últimos 5 riegos registrados</span>
        </div>
        {recentWaterings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse select-none">
              <thead>
                <tr className="border-b border-gray-900 text-gray-400 text-xs font-semibold uppercase bg-gray-900/25">
                  <th className="py-3 px-4">Fecha/Hora</th>
                  <th className="py-3 px-4">Lote</th>
                  <th className="py-3 px-4">Agua</th>
                  <th className="py-3 px-4">Riego (Entrada)</th>
                  <th className="py-3 px-4">Drenaje (Runoff)</th>
                  <th className="py-3 px-4">Quién Regó</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-900 text-sm">
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
                    <tr key={log.id} className="hover:bg-gray-900/30 transition">
                      <td className="py-3.5 px-4 text-gray-300 font-medium">{date}</td>
                      <td className="py-3.5 px-4 text-emerald-400 font-semibold">{lotName}</td>
                      <td className="py-3.5 px-4 text-white font-medium">{log.water_amount} L</td>
                      <td className="py-3.5 px-4 text-gray-400">
                        pH: <span className="text-white font-semibold">{log.ph || '-.-'}</span> • EC: <span className="text-white font-semibold">{log.ec || '-.-'} mS/cm</span>
                      </td>
                      <td className="py-3.5 px-4 text-gray-400">
                        {log.ph_runoff || log.ec_runoff ? (
                          <>
                            pH: <span className="text-emerald-400 font-semibold">{log.ph_runoff || '-.-'}</span> • EC: <span className="text-emerald-400 font-semibold">{log.ec_runoff || '-.-'} mS/cm</span>
                          </>
                        ) : (
                          <span className="text-gray-550 italic text-xs">Sin medir</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-gray-300 font-medium">{log.watered_by || 'José'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center text-gray-500 text-sm">
            No hay riegos registrados recientemente en el diario.
          </div>
        )}
      </div>

      {/* Lotes de Cultivo Activos (Sumario) */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold text-white">Lotes en Curso</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {activeLots.length > 0 ? (
            activeLots.map(lot => {
              const days = calculateDaysElapsed(lot.start_date);
              const progress = Math.min(Math.round((days / 90) * 100), 100);

              return (
                <div key={lot.id} className="bg-gray-950 border border-gray-800/80 rounded-2xl p-6 hover:border-gray-700 transition duration-200">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-lg font-bold text-white">{lot.name}</h4>
                      <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-1">
                        <Dna size={12} className="text-green-400" />
                        <span>{lot.strain}</span>
                      </div>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded-full">
                      {lot.stage}
                    </span>
                  </div>

                  <div className="mt-6 space-y-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Días transcurridos:</span>
                      <span className="text-white font-medium">{days} días</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Cantidad de plantas:</span>
                      <span className="text-white font-medium">{lot.plant_count} unidades</span>
                    </div>

                    {/* Barra de progreso */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Progreso del ciclo</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="w-full bg-gray-900 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full bg-gray-950 border border-gray-800 rounded-2xl p-12 text-center text-gray-500">
              <Sprout size={48} className="mx-auto text-green-500/30 mb-4" />
              <p>No tienes ningún lote de cultivo activo.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Registro Rápido */}
      {showQuickLog && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-950 border border-gray-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-800 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">Nuevo Registro Rápido</h3>
              <button onClick={() => setShowQuickLog(false)} className="text-gray-400 hover:text-white transition">
                ✕
              </button>
            </div>
            <form onSubmit={handleQuickLogSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Lote de Cultivo *</label>
                <select
                  value={selectedLot}
                  onChange={(e) => setSelectedLot(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-800 rounded-xl text-white focus:outline-none focus:border-green-500"
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
                  <label className="block text-sm font-medium text-gray-400 mb-1">Temperatura (°C) *</label>
                  <input
                    type="number"
                    step="0.1"
                    value={temp}
                    onChange={(e) => setTemp(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-800 rounded-xl text-white focus:outline-none focus:border-green-500"
                    placeholder="Ej: 24.5"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Humedad (%) *</label>
                  <input
                    type="number"
                    value={humidity}
                    onChange={(e) => setHumidity(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-800 rounded-xl text-white focus:outline-none focus:border-green-500"
                    placeholder="Ej: 55"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">pH</label>
                  <input
                    type="number"
                    step="0.1"
                    value={ph}
                    onChange={(e) => setPh(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-800 rounded-xl text-white focus:outline-none focus:border-green-500"
                    placeholder="Ej: 6.2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">EC (mS/cm)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={ec}
                    onChange={(e) => setEc(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-800 rounded-xl text-white focus:outline-none focus:border-green-500"
                    placeholder="Ej: 1.2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Agua (L)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={water}
                    onChange={(e) => setWater(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-800 rounded-xl text-white focus:outline-none focus:border-green-500"
                    placeholder="Ej: 5"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Notas / Observaciones</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-800 rounded-xl text-white focus:outline-none focus:border-green-500"
                  rows={2}
                  placeholder="Detalles sobre el riego, control foliar..."
                ></textarea>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowQuickLog(false)}
                  className="flex-1 py-2.5 bg-gray-900 hover:bg-gray-800 text-gray-300 font-semibold rounded-xl border border-gray-800 transition duration-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-green-500 hover:bg-green-600 text-gray-950 font-semibold rounded-xl transition duration-200"
                >
                  Guardar Registro
                </button>
              </div>
            </form>
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
    blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    green: 'text-green-400 bg-green-500/10 border-green-500/20',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
  };

  return (
    <div className="bg-gray-950 border border-gray-800/80 rounded-2xl p-5 flex items-center gap-4 hover:border-gray-700/80 transition duration-200 select-none">
      <div className={`p-3.5 rounded-xl border ${themes[theme]}`}>
        {icon}
      </div>
      <div className="flex-1">
        <span className="text-xs text-gray-400 block font-medium uppercase tracking-wider">{title}</span>
        <h3 className="text-2xl font-bold text-white mt-1">{value}</h3>
        <div className="flex items-center gap-2 mt-1.5">
          {badgeClass ? (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badgeClass}`}>
              {subtext}
            </span>
          ) : (
            <span className="text-xs text-gray-500 font-medium">{subtext}</span>
          )}
        </div>
      </div>
    </div>
  );
};
