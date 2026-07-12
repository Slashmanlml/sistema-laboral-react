import { useState, useMemo } from 'react';
import { useGrow } from '../context/GrowContext';
import { BarChart3, Filter, Image as ImageIcon, TrendingUp, Droplets, X, Calendar } from 'lucide-react';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

// Registrar componentes de Chart.js necesarios
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// ─── Componente principal de Reportes y Análisis ──────────────────────────────
export const ReportsView = () => {
  const { lots, logs } = useGrow();

  // ─── Estado de filtros ────────────────────────────────────────────────────────
  const [selectedLotId, setSelectedLotId] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [activePhotoUrl, setActivePhotoUrl] = useState<string | null>(null);

  const activeLots = lots.filter(l => !l.is_archived);

  // ─── Logs filtrados según lote y rango de fechas ──────────────────────────────
  const filteredLogs = useMemo(() => {
    let result = [...logs];

    // Filtrar por lote
    if (selectedLotId !== 'all') {
      result = result.filter(l => l.lot_id === selectedLotId);
    }

    // Filtrar por fecha de inicio
    if (dateFrom) {
      const from = new Date(dateFrom + 'T00:00:00');
      result = result.filter(l => new Date(l.date) >= from);
    }

    // Filtrar por fecha de fin
    if (dateTo) {
      const to = new Date(dateTo + 'T23:59:59');
      result = result.filter(l => new Date(l.date) <= to);
    }

    // Ordenar cronológicamente (más antiguo primero) para los gráficos
    return result.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [logs, selectedLotId, dateFrom, dateTo]);

  // ─── Etiquetas del eje X (fechas formateadas) ────────────────────────────────
  const chartLabels = filteredLogs.map(l => {
    const date = new Date(l.date);
    return date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
  });

  // ─── Opciones comunes para gráficos ──────────────────────────────────────────
  const commonChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: { color: '#475569', font: { size: 11, weight: 'bold' as const } },
      },
    },
    scales: {
      x: { grid: { color: '#f1f5f9' }, ticks: { color: '#64748b', font: { size: 10 } } },
      y: { grid: { color: '#f1f5f9' }, ticks: { color: '#64748b', font: { size: 10 } } },
    },
  };

  // ═══════════════════════════════════════════════════════════════════════════════
  // 1. CURVAS DE pH Y EC — Gráfico de líneas con doble eje Y
  // ═══════════════════════════════════════════════════════════════════════════════
  const phEcData = {
    labels: chartLabels,
    datasets: [
      {
        label: 'pH Entrada',
        data: filteredLogs.map(l => l.ph ?? null),
        borderColor: '#0ea5e9',
        backgroundColor: 'rgba(14, 165, 233, 0.08)',
        yAxisID: 'yPh',
        tension: 0.3,
        pointRadius: 3,
        borderWidth: 2,
      },
      {
        label: 'pH Drenaje',
        data: filteredLogs.map(l => l.ph_runoff ?? null),
        borderColor: '#06b6d4',
        backgroundColor: 'rgba(6, 182, 212, 0.08)',
        yAxisID: 'yPh',
        tension: 0.3,
        borderDash: [5, 5],
        pointRadius: 3,
        borderWidth: 2,
      },
      {
        label: 'EC Entrada (mS/cm)',
        data: filteredLogs.map(l => l.ec ?? null),
        borderColor: '#8b5cf6',
        backgroundColor: 'rgba(139, 92, 246, 0.08)',
        yAxisID: 'yEc',
        tension: 0.3,
        pointRadius: 3,
        borderWidth: 2,
      },
      {
        label: 'EC Drenaje (mS/cm)',
        data: filteredLogs.map(l => l.ec_runoff ?? null),
        borderColor: '#a78bfa',
        backgroundColor: 'rgba(167, 139, 250, 0.08)',
        yAxisID: 'yEc',
        tension: 0.3,
        borderDash: [5, 5],
        pointRadius: 3,
        borderWidth: 2,
      },
    ],
  };

  const phEcOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: { color: '#475569', font: { size: 11, weight: 'bold' as const } },
      },
      tooltip: { mode: 'index' as const, intersect: false },
    },
    scales: {
      x: { grid: { color: '#f1f5f9' }, ticks: { color: '#64748b', font: { size: 10 } } },
      yPh: {
        type: 'linear' as const,
        position: 'left' as const,
        min: 4,
        max: 8,
        title: { display: true, text: 'pH', color: '#0ea5e9', font: { weight: 'bold' as const } },
        grid: { color: '#f1f5f9' },
        ticks: { color: '#0ea5e9', font: { size: 10 } },
      },
      yEc: {
        type: 'linear' as const,
        position: 'right' as const,
        min: 0,
        max: 4,
        title: { display: true, text: 'EC (mS/cm)', color: '#8b5cf6', font: { weight: 'bold' as const } },
        grid: { drawOnChartArea: false },
        ticks: { color: '#8b5cf6', font: { size: 10 } },
      },
    },
  };

  // ═══════════════════════════════════════════════════════════════════════════════
  // 2. DELTA EC (ABSORCIÓN) — Gráfico de barras positivas/negativas
  // ═══════════════════════════════════════════════════════════════════════════════
  const deltaEcLogs = filteredLogs.filter(l => l.ec != null && l.ec_runoff != null);
  const deltaEcLabels = deltaEcLogs.map(l => {
    const date = new Date(l.date);
    return date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
  });
  const deltaEcValues = deltaEcLogs.map(l => parseFloat(((l.ec_runoff ?? 0) - (l.ec ?? 0)).toFixed(2)));

  const deltaEcData = {
    labels: deltaEcLabels,
    datasets: [
      {
        label: 'ΔEC (Drenaje - Entrada)',
        data: deltaEcValues,
        backgroundColor: deltaEcValues.map(v => (v <= 0 ? 'rgba(16, 185, 129, 0.7)' : 'rgba(239, 68, 68, 0.7)')),
        borderColor: deltaEcValues.map(v => (v <= 0 ? '#059669' : '#dc2626')),
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  const deltaEcOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: { color: '#475569', font: { size: 11, weight: 'bold' as const } },
      },
      tooltip: {
        callbacks: {
          label: (ctx: any) => {
            const val = ctx.parsed.y;
            if (val === null || val === undefined) return '';
            if (val <= 0) return `ΔEC: ${val} mS/cm (absorción ✓)`;
            return `ΔEC: +${val} mS/cm (acumulación ⚠)`;
          },
        },
      },
    },
    scales: {
      x: { grid: { color: '#f1f5f9' }, ticks: { color: '#64748b', font: { size: 10 } } },
      y: {
        grid: { color: '#f1f5f9' },
        ticks: { color: '#64748b', font: { size: 10 } },
        title: { display: true, text: 'ΔEC (mS/cm)', color: '#475569', font: { weight: 'bold' as const } },
      },
    },
  };

  // ═══════════════════════════════════════════════════════════════════════════════
  // 3. AMBIENTE (Temperatura / Humedad / VPD) — Líneas con bandas ideales
  // ═══════════════════════════════════════════════════════════════════════════════
  const envData = {
    labels: chartLabels,
    datasets: [
      // Banda ideal de temperatura (20-28°C) — zona sombreada
      {
        label: 'Rango Temp Ideal',
        data: filteredLogs.map(() => 28),
        borderColor: 'transparent',
        backgroundColor: 'rgba(14, 165, 233, 0.06)',
        fill: true,
        pointRadius: 0,
        borderWidth: 0,
      },
      {
        label: 'Temperatura (°C)',
        data: filteredLogs.map(l => l.temp),
        borderColor: '#0284c7',
        backgroundColor: 'rgba(2, 132, 199, 0.05)',
        tension: 0.3,
        fill: false,
        pointRadius: 3,
        borderWidth: 2,
      },
      {
        label: 'Humedad (%)',
        data: filteredLogs.map(l => l.humidity),
        borderColor: '#059669',
        backgroundColor: 'rgba(5, 150, 105, 0.05)',
        tension: 0.3,
        fill: false,
        pointRadius: 3,
        borderWidth: 2,
      },
      {
        label: 'VPD (kPa × 10)',
        data: filteredLogs.map(l => parseFloat((l.vpd * 10).toFixed(1))),
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245, 158, 11, 0.05)',
        tension: 0.3,
        fill: false,
        pointRadius: 3,
        borderWidth: 2,
      },
    ],
  };

  const envOptions = {
    ...commonChartOptions,
    plugins: {
      ...commonChartOptions.plugins,
      tooltip: { mode: 'index' as const, intersect: false },
    },
  };

  // ═══════════════════════════════════════════════════════════════════════════════
  // 4. CONSUMO DE AGUA — Barras semanales agrupadas por lote
  // ═══════════════════════════════════════════════════════════════════════════════
  const waterData = useMemo(() => {
    // Agrupar logs por semana (número ISO de semana) y lote
    const waterLogs = filteredLogs.filter(l => l.water_amount && l.water_amount > 0);

    // Obtener la semana ISO de una fecha
    const getWeekKey = (dateStr: string) => {
      const d = new Date(dateStr + 'T00:00:00');
      // Algoritmo ISO 8601: normalizar al jueves de la semana actual
      const dayOfWeek = d.getDay() || 7; // 0 (dom) -> 7
      d.setDate(d.getDate() + 4 - dayOfWeek); // Mover al jueves
      const yearStart = new Date(d.getFullYear(), 0, 1);
      const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
      return `S${weekNo}`;
    };

    // Recopilar todas las semanas únicas en orden
    const weekSet = new Set<string>();
    waterLogs.forEach(l => weekSet.add(getWeekKey(l.date)));
    const weeks = Array.from(weekSet);

    // Determinar qué lotes mostrar
    const relevantLotIds = selectedLotId === 'all'
      ? Array.from(new Set(waterLogs.map(l => l.lot_id)))
      : [selectedLotId];

    // Colores para cada lote
    const lotColors = ['#10b981', '#0ea5e9', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899'];

    const datasets = relevantLotIds.map((lotId, idx) => {
      const lot = lots.find(l => l.id === lotId);
      const lotName = lot ? lot.name : 'Desconocido';
      const color = lotColors[idx % lotColors.length];

      const weeklyTotals = weeks.map(weekKey => {
        return waterLogs
          .filter(l => l.lot_id === lotId && getWeekKey(l.date) === weekKey)
          .reduce((sum, l) => sum + (l.water_amount ?? 0), 0);
      });

      return {
        label: lotName,
        data: weeklyTotals,
        backgroundColor: color + 'b3', // ~70% opacidad
        borderColor: color,
        borderWidth: 1,
        borderRadius: 4,
      };
    });

    return {
      labels: weeks,
      datasets,
    };
  }, [filteredLogs, selectedLotId, lots]);

  const waterOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: { color: '#475569', font: { size: 11, weight: 'bold' as const } },
      },
    },
    scales: {
      x: {
        grid: { color: '#f1f5f9' },
        ticks: { color: '#64748b', font: { size: 10 } },
        title: { display: true, text: 'Semana', color: '#475569', font: { weight: 'bold' as const } },
      },
      y: {
        grid: { color: '#f1f5f9' },
        ticks: { color: '#64748b', font: { size: 10 } },
        title: { display: true, text: 'Litros totales', color: '#475569', font: { weight: 'bold' as const } },
      },
    },
  };

  // ─── Fotos de los registros ───────────────────────────────────────────────────
  const logsWithPhotos = filteredLogs.filter(l => l.image_url);

  // ─── Verificar si hay datos suficientes para los gráficos ─────────────────────
  const hasPhEcData = filteredLogs.some(l => l.ph != null || l.ec != null);
  const hasDeltaEcData = deltaEcLogs.length > 0;
  const hasEnvData = filteredLogs.length > 0;
  const hasWaterData = filteredLogs.some(l => l.water_amount && l.water_amount > 0);

  return (
    <div className="space-y-8 max-w-7xl mx-auto text-slate-700">
      {/* ─── Encabezado ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <BarChart3 size={28} className="text-emerald-500" />
            Reportes y Análisis
          </h2>
          <p className="text-slate-500 mt-1 font-medium">
            Visualizá las tendencias de pH, EC, ambiente y consumo de agua de tus salas de cultivo.
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-600 font-semibold shadow-sm">
          <Calendar size={16} className="text-emerald-500" />
          <span>{new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'short' })}</span>
        </div>
      </div>

      {/* ─── Barra de filtros ────────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={18} className="text-emerald-500" />
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Filtros</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Selector de lote */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Lote de Cultivo</label>
            <select
              value={selectedLotId}
              onChange={e => setSelectedLotId(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-emerald-500 text-sm shadow-sm"
            >
              <option value="all">Todos los lotes</option>
              {activeLots.map(l => (
                <option key={l.id} value={l.id}>{l.name} ({l.stage})</option>
              ))}
            </select>
          </div>
          {/* Fecha desde */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Desde</label>
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-emerald-500 text-sm shadow-sm"
            />
          </div>
          {/* Fecha hasta */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Hasta</label>
            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-emerald-500 text-sm shadow-sm"
            />
          </div>
        </div>
        {/* Botón para limpiar filtros */}
        {(selectedLotId !== 'all' || dateFrom || dateTo) && (
          <button
            onClick={() => { setSelectedLotId('all'); setDateFrom(''); setDateTo(''); }}
            className="mt-3 text-xs font-bold text-emerald-600 hover:text-emerald-700 transition flex items-center gap-1"
          >
            <X size={14} />
            Limpiar filtros
          </button>
        )}
      </div>

      {/* ─── Grilla de gráficos (2x2) ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ─── 1. Curvas de pH y EC ────────────────────────────────────────── */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col">
          <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
            <TrendingUp size={18} className="text-sky-500" />
            Curvas de pH y EC
          </h3>
          <div className="flex-1 min-h-[300px] relative">
            {hasPhEcData ? (
              <Line data={phEcData} options={phEcOptions} />
            ) : (
              <EmptyState message="No hay datos de pH o EC para el rango seleccionado." />
            )}
          </div>
          <p className="text-xs text-slate-400 mt-3 font-medium">
            Eje izquierdo: pH (4-8) • Eje derecho: EC en mS/cm (0-4). Líneas punteadas = drenaje.
          </p>
        </div>

        {/* ─── 2. Delta EC (Absorción) ─────────────────────────────────────── */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col">
          <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
            <BarChart3 size={18} className="text-violet-500" />
            Delta EC (Absorción)
          </h3>
          <div className="flex-1 min-h-[300px] relative">
            {hasDeltaEcData ? (
              <Bar data={deltaEcData} options={deltaEcOptions} />
            ) : (
              <EmptyState message="Se necesitan datos de EC de entrada y drenaje para calcular la absorción." />
            )}
          </div>
          <p className="text-xs text-slate-400 mt-3 font-medium">
            <span className="text-emerald-600 font-bold">Verde (negativo)</span> = la planta absorbe nutrientes.{' '}
            <span className="text-red-500 font-bold">Rojo (positivo)</span> = acumulación de sales.
          </p>
        </div>

        {/* ─── 3. Ambiente (Temp / Humedad / VPD) ──────────────────────────── */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col">
          <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Droplets size={18} className="text-emerald-500" />
            Ambiente (Temp / Humedad / VPD)
          </h3>
          <div className="flex-1 min-h-[300px] relative">
            {hasEnvData ? (
              <Line data={envData} options={envOptions} />
            ) : (
              <EmptyState message="No hay registros ambientales para el rango seleccionado." />
            )}
          </div>
          <p className="text-xs text-slate-400 mt-3 font-medium">
            El VPD se muestra multiplicado por 10 para mejor visualización en la misma escala. Zona celeste = rango ideal de temp.
          </p>
        </div>

        {/* ─── 4. Consumo de Agua ──────────────────────────────────────────── */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col">
          <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Droplets size={18} className="text-blue-500" />
            Consumo de Agua (Semanal)
          </h3>
          <div className="flex-1 min-h-[300px] relative">
            {hasWaterData ? (
              <Bar data={waterData} options={waterOptions} />
            ) : (
              <EmptyState message="No hay registros de riego para el rango seleccionado." />
            )}
          </div>
          <p className="text-xs text-slate-400 mt-3 font-medium">
            Litros totales consumidos por semana, agrupados por lote de cultivo.
          </p>
        </div>
      </div>

      {/* ─── Galería de Fotos ────────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <ImageIcon size={20} className="text-emerald-500" />
            Galería de Fotos
          </h3>
          <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-md">
            {logsWithPhotos.length} {logsWithPhotos.length === 1 ? 'foto' : 'fotos'}
          </span>
        </div>

        {logsWithPhotos.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {logsWithPhotos.map(log => {
              const lot = lots.find(l => l.id === log.lot_id);
              const lotName = lot ? lot.name : 'Lote Desconocido';
              const formattedDate = new Date(log.date).toLocaleDateString('es-AR', {
                day: '2-digit',
                month: '2-digit',
                year: '2-digit',
              });

              return (
                <button
                  key={log.id}
                  onClick={() => setActivePhotoUrl(log.image_url!)}
                  className="group relative aspect-square bg-slate-100 border border-slate-200 rounded-xl overflow-hidden hover:border-emerald-400 transition duration-150 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <img
                    src={log.image_url!}
                    alt={`Foto de ${lotName}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  {/* Overlay con información */}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-900/80 to-transparent p-2.5">
                    <p className="text-white text-xs font-bold truncate">{lotName}</p>
                    <p className="text-white/70 text-xs font-medium">{formattedDate}</p>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="py-12 text-center">
            <ImageIcon size={40} className="mx-auto text-slate-300 mb-3" />
            <p className="text-sm text-slate-400 font-semibold">No hay fotos en los registros del rango seleccionado.</p>
            <p className="text-xs text-slate-400 mt-1">Las fotos se agregan desde el formulario de Registro Diario.</p>
          </div>
        )}
      </div>

      {/* ─── Modal de foto ampliada (lightbox) ───────────────────────────────── */}
      {activePhotoUrl && (
        <div
          className="fixed inset-0 bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4 z-50"
          onClick={() => setActivePhotoUrl(null)}
        >
          <div
            className="relative max-w-4xl max-h-[85vh] overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-2xl p-2"
            onClick={e => e.stopPropagation()}
          >
            <img
              src={activePhotoUrl}
              alt="Foto de la cama de cultivo"
              className="max-h-[80vh] w-auto h-auto object-contain rounded-xl"
            />
            <button
              onClick={() => setActivePhotoUrl(null)}
              className="absolute top-4 right-4 bg-slate-900/60 hover:bg-slate-900 text-white p-2 rounded-full transition text-sm font-bold shadow-md"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Componente de estado vacío reutilizable ──────────────────────────────────
const EmptyState = ({ message }: { message: string }) => (
  <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
    <BarChart3 size={36} className="text-slate-300 mb-2" />
    <p className="text-sm font-semibold text-center px-4">{message}</p>
  </div>
);
