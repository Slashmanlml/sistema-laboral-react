// =============================================================================
// lunar.ts — Módulo de cálculo de fases lunares y tipos de día
// Reemplaza los datos estáticos de growlendario.ts con cálculos dinámicos.
// =============================================================================

// -----------------------------------------------------------------------------
// Tipos
// -----------------------------------------------------------------------------

/** Tipo de día lunar según la posición zodiacal de la luna */
export type LunarDayType = 'flor' | 'hoja' | 'fruto' | 'raiz' | 'nodo';

/** Fase lunar nombrada */
export type LunarPhase = 'nueva' | 'creciente' | 'llena' | 'menguante';

/** Información completa de un día lunar */
export interface LunarDayInfo {
  /** Tipo de día (flor, hoja, fruto, raíz, nodo) */
  type: LunarDayType;
  /** Fase lunar nombrada */
  phase: LunarPhase;
  /** Ángulo de fase crudo (0-1) donde 0=nueva, 0.5=llena */
  phaseAngle: number;
  /** Porcentaje de iluminación (0-100) */
  illumination: number;
  /** Actividades recomendadas para este día */
  activities: string[];
  /** Advertencia opcional (ej: día nodo) */
  warning?: string;
}

// -----------------------------------------------------------------------------
// Constantes astronómicas
// -----------------------------------------------------------------------------

/** Luna nueva de referencia: 6 de enero de 2000 a las 18:14 UTC */
const REFERENCE_NEW_MOON = Date.UTC(2000, 0, 6, 18, 14, 0);

/** Duración del mes sinódico en días (ciclo de fases) */
const SYNODIC_MONTH = 29.53058868;

/** Duración del mes sidéreo en días (ciclo zodiacal) */
const SIDEREAL_MONTH = 27.321661;

/** Duración del mes dracónico en días (ciclo de nodos) */
const DRACONIC_MONTH = 27.2122;

/** Milisegundos en un día */
const MS_PER_DAY = 86400000;

/**
 * Fecha de referencia para la posición zodiacal:
 * El 1 de enero de 2000 la luna estaba en Aries (~0° del zodiaco).
 */
const ZODIAC_REFERENCE = Date.UTC(2000, 0, 1, 0, 0, 0);

/**
 * Fecha de referencia para el nodo lunar ascendente.
 * El 12 de enero de 2000 la luna cruzó un nodo.
 */
const NODE_REFERENCE = Date.UTC(2000, 0, 12, 0, 0, 0);

// -----------------------------------------------------------------------------
// Mapeo de signos zodiacales a elementos / tipos de día
// -----------------------------------------------------------------------------

/**
 * Los 12 signos en orden, mapeados a su tipo de día:
 * - Fuego (Aries, Leo, Sagitario) → fruto
 * - Tierra (Tauro, Virgo, Capricornio) → raíz
 * - Aire (Géminis, Libra, Acuario) → flor
 * - Agua (Cáncer, Escorpio, Piscis) → hoja
 */
const ZODIAC_DAY_TYPES: LunarDayType[] = [
  'fruto', // 0  - Aries (fuego)
  'raiz',  // 1  - Tauro (tierra)
  'flor',  // 2  - Géminis (aire)
  'hoja',  // 3  - Cáncer (agua)
  'fruto', // 4  - Leo (fuego)
  'raiz',  // 5  - Virgo (tierra)
  'flor',  // 6  - Libra (aire)
  'hoja',  // 7  - Escorpio (agua)
  'fruto', // 8  - Sagitario (fuego)
  'raiz',  // 9  - Capricornio (tierra)
  'flor',  // 10 - Acuario (aire)
  'hoja',  // 11 - Piscis (agua)
];

/**
 * Tolerancia para considerar que la luna está en un punto de nodo.
 * Aproximadamente medio día antes y después del cruce exacto.
 */
const NODE_TOLERANCE = 0.5; // días

// -----------------------------------------------------------------------------
// Funciones de cálculo
// -----------------------------------------------------------------------------

/**
 * Calcula el ángulo de fase lunar (0-1) para una fecha dada.
 *
 * Usa el algoritmo del mes sinódico:
 * 1. Calcula los días transcurridos desde la luna nueva de referencia.
 * 2. Divide por la duración del mes sinódico.
 * 3. Toma la parte fraccionaria como posición en el ciclo.
 *
 * @param date - Fecha para la cual calcular la fase
 * @returns Valor entre 0 y 1 donde:
 *   - 0.00 = Luna nueva
 *   - 0.25 = Cuarto creciente
 *   - 0.50 = Luna llena
 *   - 0.75 = Cuarto menguante
 */
export function getMoonPhase(date: Date): number {
  const diffMs = date.getTime() - REFERENCE_NEW_MOON;
  const diffDays = diffMs / MS_PER_DAY;
  const cycles = diffDays / SYNODIC_MONTH;

  // Parte fraccionaria (siempre positiva, incluso para fechas anteriores al 2000)
  const phase = cycles - Math.floor(cycles);
  return phase < 0 ? phase + 1 : phase;
}

/**
 * Convierte el ángulo de fase crudo (0-1) en una fase lunar nombrada.
 *
 * Rangos:
 *   - 0.00–0.06 o 0.94–1.00 → nueva
 *   - 0.06–0.44            → creciente
 *   - 0.44–0.56            → llena
 *   - 0.56–0.94            → menguante
 *
 * @param phaseAngle - Valor 0-1 del ciclo lunar
 * @returns Nombre de la fase en español
 */
export function getLunarPhase(phaseAngle: number): LunarPhase {
  if (phaseAngle < 0.06 || phaseAngle >= 0.94) return 'nueva';
  if (phaseAngle < 0.44) return 'creciente';
  if (phaseAngle < 0.56) return 'llena';
  return 'menguante';
}

/**
 * Calcula el porcentaje de iluminación lunar a partir del ángulo de fase.
 *
 * Usa una aproximación coseno: iluminación = (1 - cos(phase * 2π)) / 2 * 100
 * Esto da 0% en luna nueva y 100% en luna llena.
 *
 * @param phaseAngle - Valor 0-1 del ciclo lunar
 * @returns Porcentaje de iluminación (0-100), redondeado a 1 decimal
 */
function getIllumination(phaseAngle: number): number {
  const illumination = (1 - Math.cos(phaseAngle * 2 * Math.PI)) / 2 * 100;
  return Math.round(illumination * 10) / 10;
}

/**
 * Determina si la luna está cruzando un nodo lunar en la fecha dada.
 *
 * Los nodos lunares se cruzan cada ~13.606 días (medio mes dracónico).
 * Cuando la luna está en un nodo, se considera "día nodo" y se desaconseja
 * manipular las plantas.
 *
 * @param date - Fecha a evaluar
 * @returns true si la luna está en un punto de nodo (±0.5 días del cruce exacto)
 */
function isNodeDay(date: Date): boolean {
  const diffMs = date.getTime() - NODE_REFERENCE;
  const diffDays = diffMs / MS_PER_DAY;

  // Los nodos se cruzan cada medio mes dracónico (~13.606 días)
  const halfDraconic = DRACONIC_MONTH / 2;
  const cycles = diffDays / halfDraconic;
  const fractional = cycles - Math.floor(cycles);

  // Distancia al punto de cruce más cercano (0 o 1 en el ciclo)
  const distanceToNode = Math.min(fractional, 1 - fractional) * halfDraconic;

  return distanceToNode < NODE_TOLERANCE;
}

/**
 * Determina el tipo de día lunar basado en la posición zodiacal de la luna.
 *
 * La luna tarda ~27.32 días (mes sidéreo) en recorrer los 12 signos zodiacales,
 * permaneciendo ~2.28 días en cada signo. Cada signo pertenece a un elemento:
 *
 * - Fuego → fruto (Aries, Leo, Sagitario)
 * - Tierra → raíz (Tauro, Virgo, Capricornio)
 * - Aire  → flor (Géminis, Libra, Acuario)
 * - Agua  → hoja (Cáncer, Escorpio, Piscis)
 *
 * Si la luna está cruzando un nodo, se devuelve 'nodo' independientemente del signo.
 *
 * @param date - Fecha para la cual determinar el tipo de día
 * @returns Tipo de día lunar
 */
export function getLunarDayType(date: Date): LunarDayType {
  // Primero verificar si es día de nodo
  if (isNodeDay(date)) return 'nodo';

  // Calcular la posición zodiacal
  const diffMs = date.getTime() - ZODIAC_REFERENCE;
  const diffDays = diffMs / MS_PER_DAY;

  // Posición en el ciclo sidéreo (0-1)
  const siderealCycles = diffDays / SIDEREAL_MONTH;
  const fractional = siderealCycles - Math.floor(siderealCycles);
  const position = fractional < 0 ? fractional + 1 : fractional;

  // Convertir a índice de signo zodiacal (0-11)
  const signIndex = Math.floor(position * 12) % 12;

  return ZODIAC_DAY_TYPES[signIndex];
}

// -----------------------------------------------------------------------------
// Actividades recomendadas
// -----------------------------------------------------------------------------

/** Mapa de actividades por combinación tipo + fase */
const ACTIVITY_MAP: Record<string, string[]> = {
  // Flor
  'flor-creciente':  ['Trasplantes', 'Esquejes', 'Poda apical/LST'],
  'flor-menguante':  ['Tratamiento insecticida', 'Poda de saneamiento'],
  'flor-llena':      ['Cosecha de máxima calidad', 'Esquejes'],
  'flor-nueva':      ['Riego de mantenimiento', 'Planificación'],

  // Hoja
  'hoja-creciente':  ['Abonado de Crecimiento', 'Riego con nutrientes', 'Foliar vegetal'],
  'hoja-menguante':  ['Foliar correctivo', 'Abono de crecimiento'],
  'hoja-llena':      ['Abono de Crecimiento', 'Cosecha temprana'],
  'hoja-nueva':      ['Preparar mezclas de sustrato', 'Organización'],

  // Fruto
  'fruto-creciente': ['Cosecha de Semillas', 'Tratamiento fungicida'],
  'fruto-menguante': ['Fungicidas preventivos', 'Control de Botrytis'],
  'fruto-llena':     ['Cosecha', 'Máxima actividad', 'Tratamiento fungicida'],
  'fruto-nueva':     ['Riego de mantenimiento', 'Observación'],

  // Raíz
  'raiz-creciente':  ['Riego con micorrizas', 'Estimulador de raíces'],
  'raiz-menguante':  ['Tratamientos fitosanitarios', 'Control de plagas', 'Limpieza'],
  'raiz-llena':      ['Riegos profundos', 'Micorrizas'],
  'raiz-nueva':      ['Preparar sustrato', 'Higiene del espacio'],
};

/**
 * Devuelve las actividades recomendadas para una combinación de tipo de día y fase lunar.
 *
 * En días de nodo, se devuelve una lista vacía ya que no se recomienda
 * manipular las plantas.
 *
 * @param type - Tipo de día lunar
 * @param phase - Fase lunar actual
 * @returns Lista de actividades recomendadas en español
 */
export function getActivitiesForDay(type: LunarDayType, phase: LunarPhase): string[] {
  if (type === 'nodo') return [];

  const key = `${type}-${phase}`;
  return ACTIVITY_MAP[key] ?? [];
}

// -----------------------------------------------------------------------------
// Función principal
// -----------------------------------------------------------------------------

/**
 * Obtiene toda la información lunar para una fecha dada.
 *
 * Combina el cálculo de fase, tipo de día, iluminación y actividades
 * en un solo objeto LunarDayInfo.
 *
 * @param date - Fecha para la cual obtener la información lunar
 * @returns Objeto con toda la información lunar del día
 *
 * @example
 * ```ts
 * const info = getLunarInfo(new Date());
 * console.log(info.type);        // 'flor' | 'hoja' | 'fruto' | 'raiz' | 'nodo'
 * console.log(info.phase);       // 'nueva' | 'creciente' | 'llena' | 'menguante'
 * console.log(info.illumination); // 0-100
 * console.log(info.activities);  // ['Trasplantes', ...]
 * ```
 */
export function getLunarInfo(date: Date): LunarDayInfo {
  const phaseAngle = getMoonPhase(date);
  const phase = getLunarPhase(phaseAngle);
  const illumination = getIllumination(phaseAngle);
  const type = getLunarDayType(date);
  const activities = getActivitiesForDay(type, phase);

  const result: LunarDayInfo = {
    type,
    phase,
    phaseAngle: Math.round(phaseAngle * 1000) / 1000,
    illumination,
    activities,
  };

  // Agregar advertencia para días de nodo
  if (type === 'nodo') {
    result.warning = 'Día de Nodo lunar. Evitá manipular las plantas.';
  }

  return result;
}

// -----------------------------------------------------------------------------
// Metadatos visuales
// -----------------------------------------------------------------------------

/** Metadatos de presentación para cada tipo de día lunar */
export const LUNAR_DAY_META: Record<LunarDayType, {
  label: string;
  emoji: string;
  color: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  description: string;
}> = {
  flor: {
    label: 'Día Flor',
    emoji: '🌸',
    color: '#a855f7',
    bgColor: '#faf5ff',
    borderColor: '#d8b4fe',
    textColor: '#7e22ce',
    description: 'Ideal para esquejes, trasplantes y cosecha de flores.',
  },
  hoja: {
    label: 'Día Hoja',
    emoji: '🌿',
    color: '#16a34a',
    bgColor: '#f0fdf4',
    borderColor: '#86efac',
    textColor: '#15803d',
    description: 'Perfecto para abonado, riegos nutritivos y foliares.',
  },
  fruto: {
    label: 'Día Fruto',
    emoji: '🍇',
    color: '#ea580c',
    bgColor: '#fff7ed',
    borderColor: '#fdba74',
    textColor: '#c2410c',
    description: 'Cosecha de semillas, tratamientos fungicidas.',
  },
  raiz: {
    label: 'Día Raíz',
    emoji: '🌱',
    color: '#a16207',
    bgColor: '#fefce8',
    borderColor: '#fde047',
    textColor: '#854d0e',
    description: 'Tratamientos fitosanitarios, micorrizas y limpiezas.',
  },
  nodo: {
    label: 'Día Nodo',
    emoji: '⛔',
    color: '#64748b',
    bgColor: '#f1f5f9',
    borderColor: '#cbd5e1',
    textColor: '#475569',
    description: 'NO manipular las plantas. Tránsito lunar.',
  },
};

/** Metadatos de presentación para cada fase lunar */
export const LUNAR_PHASE_META: Record<LunarPhase, { label: string; emoji: string }> = {
  nueva:     { label: 'Luna Nueva',     emoji: '🌑' },
  creciente: { label: 'Luna Creciente', emoji: '🌒' },
  llena:     { label: 'Luna Llena',     emoji: '🌕' },
  menguante: { label: 'Luna Menguante', emoji: '🌘' },
};
