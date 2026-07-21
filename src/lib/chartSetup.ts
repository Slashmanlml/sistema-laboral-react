// Registro único de los componentes de Chart.js.
// Antes cada vista repetía su propio `ChartJS.register(...)`.

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

/** Opciones compartidas: tipografía y grillas del sistema de diseño. */
export const baseChartOptions = {
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
