/**
 * Cálculos científicos para GrowManager.
 */

import type { Lot, LotStage, NutrientLine } from '../types/grow';
import { daysBetween, todayStr } from './date';

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

/**
 * Días transcurridos desde el inicio del lote hasta `referenceDateStr` (hoy por
 * defecto). Puede ser negativo si el lote todavía no arrancó.
 */
export const calculateDaysElapsed = (
  startDateStr: string,
  referenceDateStr: string = todayStr()
): number => daysBetween(startDateStr, referenceDateStr);

/**
 * Semana del ciclo en la que está el lote.
 *
 * Vegetativo arranca en la semana 0 (enraizamiento); floración arranca en la
 * semana 1, porque la primera semana de flora ya tiene receta propia.
 *
 * Esta lógica estaba duplicada en cuatro lugares (LogsView, DashboardView y dos
 * veces en irrigationEngine); cualquier ajuste al criterio se hace acá.
 */
export const getCycleWeek = (
  lot: Pick<Lot, 'stage' | 'start_date'>,
  referenceDateStr: string = todayStr()
): number => {
  const rawWeek = Math.floor(calculateDaysElapsed(lot.start_date, referenceDateStr) / 7);
  return lot.stage === 'Floración' ? Math.max(rawWeek + 1, 1) : rawWeek;
};

export interface ClimateTargets {
  minTemp: number;
  maxTemp: number;
  minRH: number;
  maxRH: number;
  minVPD: number;
  maxVPD: number;
  ppfd: string;
  notes: string;
}

export const getAthenaClimateTargets = (stage: LotStage, week: number): ClimateTargets => {
  if (stage === 'Vegetativo') {
    return {
      minTemp: 22.2,
      maxTemp: 27.7,
      minRH: 58,
      maxRH: 75,
      minVPD: 0.8,
      maxVPD: 1.0,
      ppfd: '300 - 600',
      notes: 'Fase Vegetativa. Fomentar humedad y temperatura óptima para un crecimiento vigoroso.'
    };
  }
  
  if (stage === 'Floración') {
    if (week >= 1 && week <= 3) {
      return {
        minTemp: 25.5,
        maxTemp: 27.7,
        minRH: 60,
        maxRH: 72,
        minVPD: 1.0,
        maxVPD: 1.2,
        ppfd: '600 - 1000',
        notes: 'Estiramiento de Floración (Semanas 1-3). Controlar estiramiento con PPFD fuerte y VPD estable.'
      };
    } else if (week >= 4 && week <= 7) {
      return {
        minTemp: 23.8,
        maxTemp: 26.6,
        minRH: 60,
        maxRH: 70,
        minVPD: 1.0,
        maxVPD: 1.2,
        ppfd: '850 - 1200',
        notes: 'Engorde Pleno (Semanas 4-7). Pico de alimentación. Máxima iluminación para engordar cálices.'
      };
    } else {
      return {
        minTemp: 18.3,
        maxTemp: 22.2,
        minRH: 50,
        maxRH: 60,
        minVPD: 1.2,
        maxVPD: 1.4,
        ppfd: '600 - 900',
        notes: 'Finalizar / Maduración (Semanas 8-9). Disminuir temperatura para resaltar terpenos y colores, reducir humedad para evitar moho.'
      };
    }
  }

  return {
    minTemp: 20.0,
    maxTemp: 28.0,
    minRH: 50,
    maxRH: 75,
    minVPD: 0.8,
    maxVPD: 1.2,
    ppfd: '300 - 900',
    notes: 'Etapa general de cultivo. Mantener parámetros equilibrados.'
  };
};

export interface RunoffTargets {
  minEC: number;
  maxEC: number;
  minPH: number;
  maxPH: number;
  dryback: string;
  waterVolume: string;
}

export const getAthenaRunoffTargets = (
  stage: LotStage,
  week: number,
  line: NutrientLine
): RunoffTargets => {
  const isPro = line === 'athena_pro';
  if (stage === 'Vegetativo') {
    return {
      minEC: isPro ? 4.0 : 3.0,
      maxEC: isPro ? 5.0 : 4.0,
      minPH: 5.8,
      maxPH: 6.2,
      dryback: '30% - 40%',
      waterVolume: '10% - 25% de escorrentía por la mañana'
    };
  }
  
  if (stage === 'Floración') {
    if (week >= 1 && week <= 3) {
      return {
        minEC: isPro ? 6.0 : 4.5,
        maxEC: isPro ? 7.0 : 6.0,
        minPH: 5.9,
        maxPH: 6.3,
        dryback: week === 1 ? '30% - 40%' : '50% - 60%',
        waterVolume: '10% - 25% de escorrentía por la mañana'
      };
    } else if (week >= 4 && week <= 6) {
      return {
        minEC: isPro ? 5.0 : 4.0,
        maxEC: isPro ? 6.0 : 5.0,
        minPH: 5.9,
        maxPH: 6.3,
        dryback: '30% - 40%',
        waterVolume: '15% de escorrentía por la mañana'
      };
    } else if (week === 7) {
      return {
        minEC: isPro ? 4.0 : 3.0,
        maxEC: isPro ? 5.0 : 4.0,
        minPH: 5.9,
        maxPH: 6.3,
        dryback: '30% - 40%',
        waterVolume: '15% de escorrentía por la mañana'
      };
    } else if (week === 8) {
      return {
        minEC: isPro ? 3.0 : 2.0,
        maxEC: isPro ? 3.5 : 3.0,
        minPH: 5.9,
        maxPH: 6.3,
        dryback: '50% - 60%',
        waterVolume: '15% - 20% de escorrentía por la mañana'
      };
    } else {
      return {
        minEC: isPro ? 0.0 : 0.0,
        maxEC: isPro ? 1.0 : 1.0,
        minPH: 5.9,
        maxPH: 6.3,
        dryback: '50% - 60%',
        waterVolume: '20% de escorrentía (Lavado final)'
      };
    }
  }

  return {
    minEC: 2.0,
    maxEC: 4.0,
    minPH: 5.8,
    maxPH: 6.2,
    dryback: '30% - 40%',
    waterVolume: '10% - 20% de escorrentía'
  };
};
