/**
 * Cálculos científicos para GrowManager.
 */

export interface VPDInfo {
  statusClass: string;
  label: string;
  desc: string;
  color: string;
}

export const calculateVPD = (temp: number, humidity: number): number => {
  // SVP (Saturation Vapor Pressure en kPa)
  const svp = 0.61078 * Math.exp((17.27 * temp) / (temp + 237.3));
  // VPD (Vapor Pressure Deficit en kPa)
  const vpd = svp * (1 - (humidity / 100));
  return parseFloat(vpd.toFixed(2));
};

export const getVPDInfo = (vpd: number): VPDInfo => {
  if (vpd < 0.4) {
    return {
      statusClass: 'bg-blue-100 text-blue-800',
      label: 'Muy Bajo',
      desc: 'Riesgo extremo de hongos, pudrición y baja transpiración.',
      color: '#00b4d8'
    };
  } else if (vpd >= 0.4 && vpd < 0.8) {
    return {
      statusClass: 'bg-green-100 text-green-800',
      label: 'Veg Óptimo',
      desc: 'Excelente para clones y fase vegetativa temprana.',
      color: '#22c55e'
    };
  } else if (vpd >= 0.8 && vpd < 1.2) {
    return {
      statusClass: 'bg-green-200 text-green-900',
      label: 'Flora Óptimo',
      desc: 'Ideal para vegetativo tardío y floración temprana/media.',
      color: '#84cc90'
    };
  } else if (vpd >= 1.2 && vpd < 1.6) {
    return {
      statusClass: 'bg-yellow-100 text-yellow-800',
      label: 'Flora Avanzada',
      desc: 'Ideal para fin de floración (ayuda a evitar moho).',
      color: '#f59e0b'
    };
  } else {
    return {
      statusClass: 'bg-red-100 text-red-800',
      label: 'Muy Seco',
      desc: 'Estrés hídrico. Los estomas se cierran ralentizando el crecimiento.',
      color: '#ef4444'
    };
  }
};

export const calculateDaysElapsed = (startDateStr: string): number => {
  const start = new Date(startDateStr + 'T00:00:00');
  const now = new Date();
  start.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  const diffTime = Math.abs(now.getTime() - start.getTime());
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
};
