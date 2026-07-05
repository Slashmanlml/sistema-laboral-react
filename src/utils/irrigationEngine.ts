import type { Lot, Log } from '../types/grow';
import { 
  calculateDaysElapsed, 
  getAthenaRunoffTargets 
} from './calculations';
import { 
  VEG_SCHEDULE, 
  FLOWER_SCHEDULE, 
  ATHENA_PRO_VEG_SCHEDULE, 
  ATHENA_PRO_FLOWER_SCHEDULE, 
  ATHENA_BLENDED_VEG_SCHEDULE, 
  ATHENA_BLENDED_FLOWER_SCHEDULE 
} from './schedules';
import type { ScheduleWeek } from './schedules';

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

export interface RunoffAnalysisResult {
  status: 'optimal' | 'warning' | 'critical' | 'insufficient_data';
  message: string;
  alerts: string[];
  suggestedCorrection: string;
  averages: {
    avgRunoffEC: number;
    avgRunoffPH: number;
    avgInputEC: number;
    avgInputPH: number;
  };
}

// Auxiliar para calcular días entre dos fechas (formato string YYYY-MM-DD)
const calculateDaysElapsedBetween = (startDateStr: string, endDateStr: string): number => {
  const start = new Date(startDateStr + 'T00:00:00');
  const end = new Date(endDateStr + 'T00:00:00');
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  const diffTime = end.getTime() - start.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
};

// Genera un arreglo de Lunes a Domingo para la semana que contiene referenceDate
export const getWeeklyIrrigationSchedule = (
  lot: Lot,
  referenceDate: Date,
  nutrientLine: 'ryanodine' | 'athena_pro' | 'athena_blended',
  irrigationMethod: 'manual' | 'automated',
  logs: Log[]
): WeeklyIrrigationDay[] => {
  const daysOfWeek = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  
  // Calcular el Lunes de la semana de la fecha de referencia
  const day = referenceDate.getDay();
  //getDay() devuelve 0 para Domingo, 1 para Lunes...
  const diff = referenceDate.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(referenceDate);
  monday.setDate(diff);
  monday.setHours(0, 0, 0, 0);

  return daysOfWeek.map((dayName, index) => {
    const currentDay = new Date(monday);
    currentDay.setDate(monday.getDate() + index);
    const dateStr = currentDay.toISOString().split('T')[0];

    const daysElapsed = calculateDaysElapsedBetween(lot.start_date, dateStr);
    
    // Si la fecha calculada es anterior al inicio del lote, no hay tareas aplicables
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
        notes: '-'
      };
    }

    const rawWeek = Math.floor(daysElapsed / 7);
    const isFlower = lot.stage === 'Floración';
    const weekNum = isFlower ? Math.max(rawWeek + 1, 1) : rawWeek;

    // Obtener el cronograma de nutrientes
    let scheduleWeeks: ScheduleWeek[] = [];
    if (lot.stage === 'Vegetativo') {
      if (nutrientLine === 'athena_pro') {
        scheduleWeeks = ATHENA_PRO_VEG_SCHEDULE;
      } else if (nutrientLine === 'athena_blended') {
        scheduleWeeks = ATHENA_BLENDED_VEG_SCHEDULE;
      } else {
        scheduleWeeks = VEG_SCHEDULE;
      }
    } else if (lot.stage === 'Floración') {
      if (nutrientLine === 'athena_pro') {
        scheduleWeeks = ATHENA_PRO_FLOWER_SCHEDULE;
      } else if (nutrientLine === 'athena_blended') {
        scheduleWeeks = ATHENA_BLENDED_FLOWER_SCHEDULE;
      } else {
        scheduleWeeks = FLOWER_SCHEDULE;
      }
    }

    // Buscar semana correspondiente
    let currentWeekData = scheduleWeeks.find(s => s.week === weekNum);
    if (!currentWeekData && scheduleWeeks.length > 0) {
      // Si se pasa de semanas, usar la última definida
      currentWeekData = scheduleWeeks[scheduleWeeks.length - 1];
    }

    const phTarget = currentWeekData ? currentWeekData.ph : 5.8;
    const ecTarget = currentWeekData ? currentWeekData.ec : (lot.stage === 'Germinación' ? 0.4 : 0.0);

    let dosisText = '';
    if (currentWeekData) {
      if (nutrientLine === 'athena_pro') {
        const isFade = currentWeekData.week === 8;
        dosisText = `Pro Bloom: ${currentWeekData.makroA} g/10L, ${isFade ? 'Fade' : 'Pro Core'}: ${currentWeekData.mikroB} ${isFade ? 'mL' : 'g'}/10L, Cleanse: ${currentWeekData.calcisC} mL/10L`;
      } else if (nutrientLine === 'athena_blended') {
        const suffixDose = currentWeekData.title.toLowerCase().includes('veg') ? 'Grow A & B' : 'Bloom A & B';
        dosisText = `${suffixDose}: ${currentWeekData.makroA} mL/10L, CaMg / PK: ${currentWeekData.calcisC} mL/10L, Cleanse: 0.8 mL/L`;
      } else {
        dosisText = `A: ${currentWeekData.makroA} ml/L, B: ${currentWeekData.mikroB} ml/L, C: ${currentWeekData.calcisC} ml/L`;
      }
    } else {
      dosisText = lot.stage === 'Germinación' ? 'Agua blanda + Enraizador leve' : 'Agua base PH regulado';
    }

    const isCompleted = checkWateringStatus(lot.id, logs, dateStr);

    let frequency = 'Riego diario';
    let timeOfDay = 'Mañana (Primeras 2h de luces)';

    if (irrigationMethod === 'automated') {
      frequency = 'Multidisparos automáticos';
      timeOfDay = 'Fase P1 (1h a 4h de encendido) + P2 opcional';
    } else {
      if (lot.stage === 'Secado' || lot.stage === 'Curado') {
        frequency = 'Sin riego';
        timeOfDay = '-';
        dosisText = 'Monitoreo de Humedad y Curado';
      } else if (lot.stage === 'Germinación') {
        frequency = 'Cada 2 días (humedecer sustrato)';
        timeOfDay = 'Por la mañana o cuando el medio esté ligero';
      }
    }

    return {
      dayName,
      date: dateStr,
      phTarget,
      ecTarget,
      frequency,
      timeOfDay,
      dosisText,
      isCompleted,
      notes: currentWeekData ? currentWeekData.notes : 'Mantener condiciones climáticas de la fase.'
    };
  });
};

// Verifica si existe un log de riego registrado para un lote en una fecha específica
export const checkWateringStatus = (lotId: string, logs: Log[], dateStr: string): boolean => {
  return logs.some(log => {
    const logDateStr = log.date.split('T')[0];
    return log.lot_id === lotId && logDateStr === dateStr && log.water_amount !== undefined && log.water_amount > 0;
  });
};

// Analiza escorrentía histórica (últimos 3 riegos) y genera estrategias correctoras
export const analyzeRunoffAndStrategy = (
  lot: Lot,
  logs: Log[],
  nutrientLine: 'ryanodine' | 'athena_pro' | 'athena_blended'
): RunoffAnalysisResult => {
  // Filtrar logs de este lote que tengan mediciones de EC o pH (tanto de entrada como runoff)
  const lotLogs = logs
    .filter(l => l.lot_id === lot.id && (l.ph !== undefined || l.ec !== undefined || l.ph_runoff !== undefined || l.ec_runoff !== undefined))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const recentLogs = lotLogs.slice(0, 3);

  if (recentLogs.length === 0) {
    return {
      status: 'insufficient_data',
      message: 'Sin registros climáticos de riego suficientes.',
      alerts: [],
      suggestedCorrection: 'Ingresá al menos un registro diario midiendo el pH/EC de entrada y salida (drenaje) para comenzar el diagnóstico adaptativo.',
      averages: { avgRunoffEC: 0, avgRunoffPH: 0, avgInputEC: 0, avgInputPH: 0 }
    };
  }

  // Filtrar nulos para promedios
  const runoffECs = recentLogs.map(l => l.ec_runoff).filter((val): val is number => val !== undefined && val > 0);
  const runoffPHs = recentLogs.map(l => l.ph_runoff).filter((val): val is number => val !== undefined && val > 0);
  const inputECs = recentLogs.map(l => l.ec).filter((val): val is number => val !== undefined && val > 0);
  const inputPHs = recentLogs.map(l => l.ph).filter((val): val is number => val !== undefined && val > 0);

  const avgRunoffEC = runoffECs.length > 0 ? parseFloat((runoffECs.reduce((a, b) => a + b, 0) / runoffECs.length).toFixed(2)) : 0;
  const avgRunoffPH = runoffPHs.length > 0 ? parseFloat((runoffPHs.reduce((a, b) => a + b, 0) / runoffPHs.length).toFixed(2)) : 0;
  const avgInputEC = inputECs.length > 0 ? parseFloat((inputECs.reduce((a, b) => a + b, 0) / inputECs.length).toFixed(2)) : 0;
  const avgInputPH = inputPHs.length > 0 ? parseFloat((inputPHs.reduce((a, b) => a + b, 0) / inputPHs.length).toFixed(2)) : 0;

  const alerts: string[] = [];
  let suggestedCorrection = '';
  let status: RunoffAnalysisResult['status'] = 'optimal';

  // Solo evaluar si es etapa con escorrentía regulada (Veg o Flora)
  if (lot.stage !== 'Vegetativo' && lot.stage !== 'Floración') {
    return {
      status: 'optimal',
      message: 'Fase del lote sin requerimiento de lixiviación de sales.',
      alerts: [],
      suggestedCorrection: 'En esta etapa (germinación/cosecha/secado) no se requiere evaluar drenaje.',
      averages: { avgRunoffEC, avgRunoffPH, avgInputEC, avgInputPH }
    };
  }

  // Obtener targets de la semana actual
  const days = calculateDaysElapsed(lot.start_date);
  const rawWeek = Math.floor(days / 7);
  const isFlower = lot.stage === 'Floración';
  const weekNum = isFlower ? Math.max(rawWeek + 1, 1) : rawWeek;
  const targets = getAthenaRunoffTargets(lot.stage, weekNum, nutrientLine);

  // 1. Diagnóstico de EC de escorrentía (Salinidad del sustrato)
  if (avgRunoffEC > 0) {
    if (avgRunoffEC > targets.maxEC) {
      status = 'warning';
      alerts.push(`⚠️ Acumulación de sales alta en sustrato (Drenaje Promedio: ${avgRunoffEC} mS/cm)`);
      suggestedCorrection += `• La conductividad de salida supera el objetivo máximo de ${targets.maxEC} mS/cm. En el próximo riego, aumentá el volumen de agua un 20% para lograr más drenaje (escorrentía) y arrastrar las sales acumuladas, o bajá temporalmente la EC de entrada en -0.2 mS/cm.\n`;
    } else if (avgRunoffEC < targets.minEC) {
      status = 'warning';
      alerts.push(`✓ Absorción acelerada / Nutrientes bajos en sustrato (Drenaje Promedio: ${avgRunoffEC} mS/cm)`);
      suggestedCorrection += `• El drenaje está por debajo del mínimo de ${targets.minEC} mS/cm, sugiriendo que la planta consume más rápido de lo regado. Incrementá la EC de entrada en +0.15 mS/cm en tu próximo riego o reducí ligeramente el volumen de riego para evitar lixiviar nutrientes útiles.\n`;
    }
  }

  // 2. Diagnóstico de pH de escorrentía (Salud radicular y metabolización)
  if (avgRunoffPH > 0 && avgInputPH > 0) {
    // Si el pH de salida es menor que el de entrada en más de 0.2, hay acidificación (típico de raíces ahogadas o sales ácidas)
    if (avgRunoffPH < avgInputPH - 0.2) {
      status = 'critical';
      alerts.push(`⚠️ Alerta: pH de Escorrentía ácido (${avgRunoffPH}) - Posible asfixia radicular`);
      suggestedCorrection += `• El pH del drenaje está cayendo por debajo del pH de entrada. Esto indica encharcamiento, pudrición radicular latente o acumulación de sales ácidas. Incrementá el tiempo de secado entre riegos (dryback), asegurate de no regar si la maceta pesa y subí el pH de entrada a 6.2 en el próximo riego para compensar.\n`;
    } else if (avgRunoffPH > targets.maxPH) {
      status = 'warning';
      alerts.push(`⚠️ Alcalinización del medio (Drenaje Promedio: ${avgRunoffPH})`);
      suggestedCorrection += `• El pH del drenaje es superior a ${targets.maxPH}. Reducí el pH de entrada a 5.7 o 5.8 para neutralizar y recuperar la disponibilidad de microelementos (hierro, zinc).\n`;
    }
  }

  if (status === 'optimal') {
    suggestedCorrection = '✓ Los parámetros del sustrato están estables y saludables. Mantené la EC y el pH en los niveles indicados en el cronograma semanal.';
  }

  const message = status === 'optimal' 
    ? 'Parámetros de escorrentía en rango ideal.' 
    : status === 'critical'
      ? '¡Atención! Se requiere acción correctiva urgente en el riego.'
      : 'Desvíos leves detectados en el drenaje.';

  return {
    status,
    message,
    alerts,
    suggestedCorrection,
    averages: { avgRunoffEC, avgRunoffPH, avgInputEC, avgInputPH }
  };
};
