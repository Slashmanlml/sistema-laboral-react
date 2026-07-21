import type { Lot, Log, NutrientLine, IrrigationMethod } from '../types/grow';
import { isWaterableStage } from '../types/grow';
import { getCycleWeek, getAthenaRunoffTargets } from './calculations';
import { getSchedule, findScheduleWeek, formatDose } from './schedules';
import {
  toLocalDateStr,
  addDays,
  startOfWeekMonday,
  daysBetween,
  isoToLocalDateStr,
} from './date';

export interface WeeklyIrrigationDay {
  dayName: string;
  date: string;
  phTarget: number;
  ecTarget: number;
  frequency: string;
  timeOfDay: string;
  dosisText: string;
  isCompleted: boolean;
  notes: string;
}

export interface RunoffAverages {
  avgRunoffEC: number;
  avgRunoffPH: number;
  avgInputEC: number;
  avgInputPH: number;
}

export interface RunoffAnalysisResult {
  status: 'optimal' | 'warning' | 'critical' | 'insufficient_data';
  message: string;
  alerts: string[];
  suggestedCorrection: string;
  averages: RunoffAverages;
}

const DAYS_OF_WEEK = [
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
  'Domingo',
];

const EMPTY_AVERAGES: RunoffAverages = {
  avgRunoffEC: 0,
  avgRunoffPH: 0,
  avgInputEC: 0,
  avgInputPH: 0,
};

/** Promedia una lista de números y redondea a dos decimales. Vacío ⇒ 0. */
const average = (values: number[]): number =>
  values.length === 0
    ? 0
    : Number.parseFloat((values.reduce((a, b) => a + b, 0) / values.length).toFixed(2));

/** Extrae de los logs los valores positivos de un campo numérico opcional. */
const positiveValues = (logs: Log[], field: keyof Log): number[] =>
  logs
    .map(log => log[field])
    .filter((value): value is number => typeof value === 'number' && value > 0);

/**
 * Genera el plan de riego de lunes a domingo para la semana que contiene a
 * `referenceDate`.
 */
export const getWeeklyIrrigationSchedule = (
  lot: Lot,
  referenceDate: Date,
  nutrientLine: NutrientLine,
  irrigationMethod: IrrigationMethod,
  logs: Log[]
): WeeklyIrrigationDay[] => {
  const monday = startOfWeekMonday(referenceDate);
  const schedule = getSchedule(lot.stage, nutrientLine);

  return DAYS_OF_WEEK.map((dayName, index) => {
    const dateStr = toLocalDateStr(addDays(monday, index));
    const daysElapsed = daysBetween(lot.start_date, dateStr);

    // El lote todavía no había arrancado en esta fecha.
    if (daysElapsed < 0) {
      return {
        dayName,
        date: dateStr,
        phTarget: 5.8,
        ecTarget: 0,
        frequency: 'Sin iniciar',
        timeOfDay: '-',
        dosisText: 'Lote no iniciado en esta fecha',
        isCompleted: false,
        notes: '-',
      };
    }

    const weekNum = getCycleWeek(lot, dateStr);
    const weekData = findScheduleWeek(schedule, weekNum);

    const phTarget = weekData ? weekData.ph : 5.8;
    const ecTarget = weekData
      ? weekData.ec
      : lot.stage === 'Germinación'
        ? 0.4
        : 0.0;

    let dosisText = weekData
      ? formatDose(weekData, nutrientLine)
      : lot.stage === 'Germinación'
        ? 'Agua blanda + Enraizador leve'
        : 'Agua base PH regulado';

    let frequency = 'Riego diario';
    let timeOfDay = 'Mañana (Primeras 2h de luces)';

    if (irrigationMethod === 'automated') {
      frequency = 'Multidisparos automáticos';
      timeOfDay = 'Fase P1 (1h a 4h de encendido) + P2 opcional';
    } else if (lot.stage === 'Secado' || lot.stage === 'Curado') {
      frequency = 'Sin riego';
      timeOfDay = '-';
      dosisText = 'Monitoreo de Humedad y Curado';
    } else if (lot.stage === 'Germinación') {
      frequency = 'Cada 2 días (humedecer sustrato)';
      timeOfDay = 'Por la mañana o cuando el medio esté ligero';
    }

    return {
      dayName,
      date: dateStr,
      phTarget,
      ecTarget,
      frequency,
      timeOfDay,
      dosisText,
      isCompleted: checkWateringStatus(lot.id, logs, dateStr),
      notes: weekData ? weekData.notes : 'Mantener condiciones climáticas de la fase.',
    };
  });
};

/** ¿Hay algún riego registrado para este lote en esta fecha local? */
export const checkWateringStatus = (
  lotId: string,
  logs: Log[],
  dateStr: string
): boolean =>
  logs.some(
    log =>
      log.lot_id === lotId &&
      isoToLocalDateStr(log.date) === dateStr &&
      typeof log.water_amount === 'number' &&
      log.water_amount > 0
  );

/**
 * Analiza la escorrentía de los últimos 3 riegos y sugiere correcciones de
 * volumen, EC y pH.
 */
export const analyzeRunoffAndStrategy = (
  lot: Lot,
  logs: Log[],
  nutrientLine: NutrientLine
): RunoffAnalysisResult => {
  const recentLogs = logs
    .filter(
      log =>
        log.lot_id === lot.id &&
        (log.ph !== undefined ||
          log.ec !== undefined ||
          log.ph_runoff !== undefined ||
          log.ec_runoff !== undefined)
    )
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3);

  if (recentLogs.length === 0) {
    return {
      status: 'insufficient_data',
      message: 'Sin registros climáticos de riego suficientes.',
      alerts: [],
      suggestedCorrection:
        'Ingresá al menos un registro diario midiendo el pH/EC de entrada y salida (drenaje) para comenzar el diagnóstico adaptativo.',
      averages: EMPTY_AVERAGES,
    };
  }

  const averages: RunoffAverages = {
    avgRunoffEC: average(positiveValues(recentLogs, 'ec_runoff')),
    avgRunoffPH: average(positiveValues(recentLogs, 'ph_runoff')),
    avgInputEC: average(positiveValues(recentLogs, 'ec')),
    avgInputPH: average(positiveValues(recentLogs, 'ph')),
  };

  // Germinación, secado y curado no requieren lixiviación de sales.
  if (!isWaterableStage(lot.stage)) {
    return {
      status: 'optimal',
      message: 'Fase del lote sin requerimiento de lixiviación de sales.',
      alerts: [],
      suggestedCorrection:
        'En esta etapa (germinación/cosecha/secado) no se requiere evaluar drenaje.',
      averages,
    };
  }

  const targets = getAthenaRunoffTargets(lot.stage, getCycleWeek(lot), nutrientLine);
  const alerts: string[] = [];
  let suggestedCorrection = '';
  let status: RunoffAnalysisResult['status'] = 'optimal';

  // 1. Salinidad del sustrato (EC de escorrentía).
  const { avgRunoffEC, avgRunoffPH, avgInputPH } = averages;
  if (avgRunoffEC > 0) {
    if (avgRunoffEC > targets.maxEC) {
      status = 'warning';
      alerts.push(
        `⚠️ Acumulación de sales alta en sustrato (Drenaje Promedio: ${avgRunoffEC} mS/cm)`
      );
      suggestedCorrection += `• La conductividad de salida supera el objetivo máximo de ${targets.maxEC} mS/cm. En el próximo riego, aumentá el volumen de agua un 20% para lograr más drenaje (escorrentía) y arrastrar las sales acumuladas, o bajá temporalmente la EC de entrada en -0.2 mS/cm.\n`;
    } else if (avgRunoffEC < targets.minEC) {
      status = 'warning';
      alerts.push(
        `✓ Absorción acelerada / Nutrientes bajos en sustrato (Drenaje Promedio: ${avgRunoffEC} mS/cm)`
      );
      suggestedCorrection += `• El drenaje está por debajo del mínimo de ${targets.minEC} mS/cm, sugiriendo que la planta consume más rápido de lo regado. Incrementá la EC de entrada en +0.15 mS/cm en tu próximo riego o reducí ligeramente el volumen de riego para evitar lixiviar nutrientes útiles.\n`;
    }
  }

  // 2. Salud radicular (pH de escorrentía).
  if (avgRunoffPH > 0 && avgInputPH > 0) {
    // Una caída de más de 0.2 respecto a la entrada indica acidificación:
    // típico de raíces ahogadas o sales ácidas acumuladas.
    if (avgRunoffPH < avgInputPH - 0.2) {
      status = 'critical';
      alerts.push(
        `⚠️ Alerta: pH de Escorrentía ácido (${avgRunoffPH}) - Posible asfixia radicular`
      );
      suggestedCorrection += `• El pH del drenaje está cayendo por debajo del pH de entrada. Esto indica encharcamiento, pudrición radicular latente o acumulación de sales ácidas. Incrementá el tiempo de secado entre riegos (dryback), asegurate de no regar si la maceta pesa y subí el pH de entrada a 6.2 en el próximo riego para compensar.\n`;
    } else if (avgRunoffPH > targets.maxPH) {
      status = 'warning';
      alerts.push(`⚠️ Alcalinización del medio (Drenaje Promedio: ${avgRunoffPH})`);
      suggestedCorrection += `• El pH del drenaje es superior a ${targets.maxPH}. Reducí el pH de entrada a 5.7 o 5.8 para neutralizar y recuperar la disponibilidad de microelementos (hierro, zinc).\n`;
    }
  }

  if (status === 'optimal') {
    suggestedCorrection =
      '✓ Los parámetros del sustrato están estables y saludables. Mantené la EC y el pH en los niveles indicados en el cronograma semanal.';
  }

  const message =
    status === 'optimal'
      ? 'Parámetros de escorrentía en rango ideal.'
      : status === 'critical'
        ? '¡Atención! Se requiere acción correctiva urgente en el riego.'
        : 'Desvíos leves detectados en el drenaje.';

  return { status, message, alerts, suggestedCorrection, averages };
};
