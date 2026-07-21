import { useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import { Wind } from 'lucide-react';
import type { Log } from '../../types/grow';
import { formatTime } from '../../utils/format';
import { baseChartOptions } from '../../lib/chartSetup';

interface ClimateChartProps {
  /** Registros más recientes primero. */
  logs: Log[];
  maxPoints?: number;
}

export const ClimateChart = ({ logs, maxPoints = 10 }: ClimateChartProps) => {
  const chartData = useMemo(() => {
    // Los logs vienen del más nuevo al más viejo; el gráfico necesita orden
    // cronológico ascendente.
    const points = logs.slice(0, maxPoints).reverse();

    return {
      labels: points.map(log => formatTime(log.date)),
      datasets: [
        {
          label: 'Temperatura (°C)',
          data: points.map(log => log.temp),
          borderColor: '#0284c7',
          backgroundColor: 'rgba(2, 132, 199, 0.05)',
          tension: 0.3,
          fill: true,
        },
        {
          label: 'Humedad (%)',
          data: points.map(log => log.humidity),
          borderColor: '#059669',
          backgroundColor: 'rgba(5, 150, 105, 0.05)',
          tension: 0.3,
          fill: true,
        },
      ],
    };
  }, [logs, maxPoints]);

  return (
    <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col">
      <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
        <Wind size={20} className="text-emerald-500" />
        Últimas {maxPoints} mediciones ambientales
      </h3>
      <div className="flex-1 min-h-[300px] relative">
        {logs.length > 0 ? (
          <Line data={chartData} options={baseChartOptions} />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
            <Wind size={36} className="text-slate-300 mb-2" />
            <p className="text-sm font-semibold">
              No hay suficientes datos climáticos para mostrar el gráfico.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
