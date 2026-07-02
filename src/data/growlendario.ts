/**
 * Growlendario - Calendario Lunar para el Hemisferio Sur
 * Datos basados en el Growlendario de GardenHighPro para el Hemisferio Sur.
 *
 * Tipos de día lunar:
 *  - 'flor'        → Días Flor: ideal para cosecha, esquejes y trasplantes
 *  - 'hoja'        → Días Hoja: abonado de crecimiento, riegos, foliares
 *  - 'fruto'       → Días Fruto/Semilla: cosecha semillas, tratamientos fungicidas
 *  - 'raiz'        → Días Raíz: tratamientos fitosanitarios, limpiezas
 *  - 'nodo'        → Días Nodo: NO manipular las plantas (tránsito lunar)
 *
 * Fases lunares:
 *  - 'creciente'   → Luna Creciente (savia sube, siembras, esquejes, trasplantes)
 *  - 'llena'       → Luna Llena (máxima actividad, cosecha)
 *  - 'menguante'   → Luna Menguante (tratamientos fitosanitarios)
 *  - 'nueva'       → Luna Nueva (descanso, preparación de sustrato)
 */

export type LunarDayType = 'flor' | 'hoja' | 'fruto' | 'raiz' | 'nodo';
export type LunarPhase = 'creciente' | 'llena' | 'menguante' | 'nueva';

export interface LunarDay {
  type: LunarDayType;
  phase: LunarPhase;
  /** Actividades recomendadas en lenguaje natural */
  activities: string[];
  /** Advertencias o restricciones */
  warning?: string;
}

/** Mapa de fecha (YYYY-MM-DD) → datos lunares */
export const GROWLENDARIO: Record<string, LunarDay> = {
  // ─── JULIO 2025 (Hemisferio Sur) ────────────────────────────────────────────
  '2025-07-01': { type: 'nodo',  phase: 'creciente', activities: [], warning: 'Día de Nodo. NO realizar labores de cultivo.' },
  '2025-07-02': { type: 'flor',  phase: 'creciente', activities: ['Esquejes', 'Trasplantes', 'Cosecha temprana'] },
  '2025-07-03': { type: 'flor',  phase: 'creciente', activities: ['Esquejes', 'Trasplantes', 'Cosecha temprana'] },
  '2025-07-04': { type: 'flor',  phase: 'creciente', activities: ['Trasplantes', 'Poda ligera', 'Esquejes'] },
  '2025-07-05': { type: 'flor',  phase: 'creciente', activities: ['Trasplante ideal', 'Esquejes de calidad', 'Poda FIM/LST'] },
  '2025-07-06': { type: 'flor',  phase: 'creciente', activities: ['Trasplante ideal', 'Esquejes de calidad'] },
  '2025-07-07': { type: 'hoja',  phase: 'creciente', activities: ['Abonado de Crecimiento', 'Riego con nutrientes', 'Foliar vegetal'] },
  '2025-07-08': { type: 'hoja',  phase: 'creciente', activities: ['Abonado de Crecimiento', 'Riego nutritivo', 'Foliar'] },
  '2025-07-09': { type: 'fruto', phase: 'llena',     activities: ['Cosecha de Semillas', 'Recolección', 'Tratamiento fungicida'] },
  '2025-07-10': { type: 'fruto', phase: 'llena',     activities: ['Cosecha de Semillas', 'Tratamiento fungicida'] },
  '2025-07-11': { type: 'raiz',  phase: 'menguante', activities: ['Tratamientos fitosanitarios', 'Riegos de lavado', 'Control de plagas'] },
  '2025-07-12': { type: 'raiz',  phase: 'menguante', activities: ['Tratamientos fitosanitarios', 'Limpieza radicular', 'Control plagas'] },
  '2025-07-13': { type: 'raiz',  phase: 'menguante', activities: ['Insecticidas preventivos', 'Limpieza sustrato'] },
  '2025-07-14': { type: 'flor',  phase: 'menguante', activities: ['Tratamiento insecticida muy efectivo', 'Control de plagas', 'Poda de sanidad'] },
  '2025-07-15': { type: 'nodo',  phase: 'menguante', activities: [], warning: 'Día de Nodo. NO realizar labores de cultivo.' },
  '2025-07-16': { type: 'hoja',  phase: 'menguante', activities: ['Abonado de Crecimiento', 'Riego nutritivo', 'Foliar'] },
  '2025-07-17': { type: 'hoja',  phase: 'menguante', activities: ['Abonado de Crecimiento', 'Foliar de corrección'] },
  '2025-07-18': { type: 'fruto', phase: 'menguante', activities: ['Fungicidas preventivos', 'Control de hongos', 'Tratamiento de semillas'] },
  '2025-07-19': { type: 'fruto', phase: 'menguante', activities: ['Fungicidas preventivos', 'Control de Botrytis'] },
  '2025-07-20': { type: 'raiz',  phase: 'menguante', activities: ['Tratamientos fitosanitarios', 'Control de plagas', 'Limpieza'] },
  '2025-07-21': { type: 'raiz',  phase: 'nueva',     activities: ['Esquejes tardíos', 'Control de plagas', 'Preparar sustrato'] },
  '2025-07-22': { type: 'flor',  phase: 'nueva',     activities: ['Riego de mantenimiento', 'Observación', 'Preparación nutrientes'] },
  '2025-07-23': { type: 'hoja',  phase: 'nueva',     activities: ['Preparar mezclas de sustrato', 'Organizar camas', 'Planificación'] },
  '2025-07-24': { type: 'hoja',  phase: 'nueva',     activities: ['Preparar mezclas de sustrato', 'Higiene del espacio'] },
  '2025-07-25': { type: 'fruto', phase: 'nueva',     activities: ['Riego de mantenimiento', 'Observación de plantas'] },
  '2025-07-26': { type: 'raiz',  phase: 'creciente', activities: ['Riegos de raíz', 'Primer abono de ciclo', 'Micorrizas'] },
  '2025-07-27': { type: 'raiz',  phase: 'creciente', activities: ['Riego con micorrizas', 'Estimulador de raíces'] },
  '2025-07-28': { type: 'flor',  phase: 'creciente', activities: ['Trasplantes', 'Esquejes', 'Poda apical'] },
  '2025-07-29': { type: 'hoja',  phase: 'creciente', activities: ['Abonado de Crecimiento', 'Foliar vegetal'] },
  '2025-07-30': { type: 'hoja',  phase: 'creciente', activities: ['Abonado de Crecimiento', 'Riego nutritivo'] },
  '2025-07-31': { type: 'fruto', phase: 'creciente', activities: ['Cosecha de Semillas', 'Recolección', 'Tratamiento fungicida'] },

  // ─── AGOSTO 2025 (Hemisferio Sur) ───────────────────────────────────────────
  '2025-08-01': { type: 'fruto', phase: 'llena',     activities: ['Cosecha', 'Máxima actividad', 'Tratamiento fungicida'] },
  '2025-08-02': { type: 'flor',  phase: 'llena',     activities: ['Cosecha de máxima calidad', 'Esquejes'] },
  '2025-08-03': { type: 'flor',  phase: 'menguante', activities: ['Tratamientos fitosanitarios', 'Cosecha temprana'] },
  '2025-08-04': { type: 'hoja',  phase: 'menguante', activities: ['Tratamientos fitosanitarios', 'Foliar correctivo'] },
  '2025-08-05': { type: 'hoja',  phase: 'menguante', activities: ['Abonado correctivo', 'Control de pH/EC'] },
  '2025-08-06': { type: 'raiz',  phase: 'menguante', activities: ['Control plagas', 'Limpieza radicular'] },
  '2025-08-07': { type: 'nodo',  phase: 'menguante', activities: [], warning: 'Día de Nodo. NO realizar labores de cultivo.' },
  '2025-08-08': { type: 'flor',  phase: 'menguante', activities: ['Tratamiento insecticida', 'Poda de saneamiento'] },
  '2025-08-09': { type: 'fruto', phase: 'menguante', activities: ['Fungicidas', 'Control de Botrytis'] },
  '2025-08-10': { type: 'fruto', phase: 'menguante', activities: ['Fungicidas preventivos'] },
  '2025-08-11': { type: 'raiz',  phase: 'menguante', activities: ['Limpieza fitosanitaria', 'Control plagas'] },
  '2025-08-12': { type: 'raiz',  phase: 'menguante', activities: ['Micorrizas', 'Estimulador de raíces'] },
  '2025-08-13': { type: 'hoja',  phase: 'menguante', activities: ['Foliar correctivo', 'Abono de crecimiento'] },
  '2025-08-14': { type: 'hoja',  phase: 'menguante', activities: ['Foliar vegetal', 'Abono de crecimiento'] },
  '2025-08-15': { type: 'flor',  phase: 'nueva',     activities: ['Riego de mantenimiento', 'Planificación'] },
  '2025-08-16': { type: 'nodo',  phase: 'nueva',     activities: [], warning: 'Día de Nodo. NO realizar labores de cultivo.' },
  '2025-08-17': { type: 'fruto', phase: 'nueva',     activities: ['Preparar sustrato', 'Organización'] },
  '2025-08-18': { type: 'raiz',  phase: 'nueva',     activities: ['Preparar mezcla sustrato', 'Higiene'] },
  '2025-08-19': { type: 'raiz',  phase: 'creciente', activities: ['Riego con estimulador', 'Micorrizas'] },
  '2025-08-20': { type: 'flor',  phase: 'creciente', activities: ['Trasplantes', 'Esquejes', 'Poda apical'] },
  '2025-08-21': { type: 'flor',  phase: 'creciente', activities: ['Trasplantes', 'Esquejes'] },
  '2025-08-22': { type: 'hoja',  phase: 'creciente', activities: ['Abonado de Crecimiento', 'Foliar vegetal'] },
  '2025-08-23': { type: 'hoja',  phase: 'creciente', activities: ['Abonado de Crecimiento', 'Riego nutritivo'] },
  '2025-08-24': { type: 'fruto', phase: 'creciente', activities: ['Cosecha Semillas', 'Tratamiento fungicida'] },
  '2025-08-25': { type: 'raiz',  phase: 'creciente', activities: ['Riego de raíz', 'Micorrizas'] },
  '2025-08-26': { type: 'raiz',  phase: 'creciente', activities: ['Riego raíz', 'Estimulador radicular'] },
  '2025-08-27': { type: 'flor',  phase: 'creciente', activities: ['Esquejes', 'Poda LST', 'Trasplantes'] },
  '2025-08-28': { type: 'hoja',  phase: 'llena',     activities: ['Abono de Crecimiento', 'Cosecha temprana'] },
  '2025-08-29': { type: 'hoja',  phase: 'llena',     activities: ['Abono de Crecimiento', 'Cosecha'] },
  '2025-08-30': { type: 'fruto', phase: 'llena',     activities: ['Cosecha de máxima calidad', 'Semillas'] },
  '2025-08-31': { type: 'raiz',  phase: 'menguante', activities: ['Tratamientos fitosanitarios', 'Control plagas'] },

  // ─── JUNIO 2025 (datos previos para referencia) ──────────────────────────────
  '2025-06-01': { type: 'flor',  phase: 'creciente', activities: ['Esquejes', 'Trasplantes'] },
  '2025-06-02': { type: 'flor',  phase: 'creciente', activities: ['Trasplantes', 'Esquejes'] },
  '2025-06-03': { type: 'hoja',  phase: 'creciente', activities: ['Abonado de Crecimiento', 'Riego nutritivo'] },
  '2025-06-04': { type: 'hoja',  phase: 'creciente', activities: ['Abonado', 'Foliar vegetal'] },
  '2025-06-05': { type: 'fruto', phase: 'llena',     activities: ['Cosecha', 'Semillas'] },
  '2025-06-06': { type: 'fruto', phase: 'llena',     activities: ['Cosecha de máxima calidad'] },
  '2025-06-07': { type: 'nodo',  phase: 'llena',     activities: [], warning: 'Día de Nodo. NO realizar labores de cultivo.' },
  '2025-06-08': { type: 'raiz',  phase: 'menguante', activities: ['Tratamientos fitosanitarios', 'Control plagas'] },
  '2025-06-09': { type: 'raiz',  phase: 'menguante', activities: ['Control plagas', 'Limpieza'] },
  '2025-06-10': { type: 'flor',  phase: 'menguante', activities: ['Tratamiento insecticida', 'Poda saneamiento'] },
  '2025-06-11': { type: 'hoja',  phase: 'menguante', activities: ['Foliar correctivo', 'Abono crecimiento'] },
  '2025-06-12': { type: 'hoja',  phase: 'menguante', activities: ['Foliar vegetal'] },
  '2025-06-13': { type: 'fruto', phase: 'menguante', activities: ['Fungicidas'] },
  '2025-06-14': { type: 'fruto', phase: 'menguante', activities: ['Fungicidas preventivos', 'Botrytis'] },
  '2025-06-15': { type: 'nodo',  phase: 'menguante', activities: [], warning: 'Día de Nodo. NO realizar labores de cultivo.' },
  '2025-06-16': { type: 'raiz',  phase: 'menguante', activities: ['Limpieza fitosanitaria', 'Micorrizas'] },
  '2025-06-17': { type: 'raiz',  phase: 'nueva',     activities: ['Preparar sustrato', 'Higiene'] },
  '2025-06-18': { type: 'flor',  phase: 'nueva',     activities: ['Riego mantenimiento', 'Planificación'] },
  '2025-06-19': { type: 'hoja',  phase: 'nueva',     activities: ['Preparar mezclas', 'Organización'] },
  '2025-06-20': { type: 'hoja',  phase: 'nueva',     activities: ['Preparar sustrato', 'Higiene del espacio'] },
  '2025-06-21': { type: 'fruto', phase: 'creciente', activities: ['Cosecha semillas', 'Tratamiento fungicida'] },
  '2025-06-22': { type: 'nodo',  phase: 'creciente', activities: [], warning: 'Día de Nodo. NO realizar labores de cultivo.' },
  '2025-06-23': { type: 'raiz',  phase: 'creciente', activities: ['Riego raíz', 'Micorrizas'] },
  '2025-06-24': { type: 'raiz',  phase: 'creciente', activities: ['Estimulador radicular'] },
  '2025-06-25': { type: 'flor',  phase: 'creciente', activities: ['Trasplantes', 'Esquejes'] },
  '2025-06-26': { type: 'flor',  phase: 'creciente', activities: ['Poda LST', 'Trasplantes'] },
  '2025-06-27': { type: 'hoja',  phase: 'creciente', activities: ['Abonado de Crecimiento', 'Foliar'] },
  '2025-06-28': { type: 'hoja',  phase: 'creciente', activities: ['Abono crecimiento', 'Riego nutritivo'] },
  '2025-06-29': { type: 'fruto', phase: 'creciente', activities: ['Cosecha semillas', 'Fungicida'] },
  '2025-06-30': { type: 'fruto', phase: 'llena',     activities: ['Cosecha', 'Máxima actividad'] },
};

/** Metadatos visuales por tipo de día */
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
    color: '#ec4899',
    bgColor: '#fdf2f8',
    borderColor: '#f9a8d4',
    textColor: '#be185d',
    description: 'Ideal para esquejes, trasplantes y cosecha de flores.',
  },
  hoja: {
    label: 'Día Hoja',
    emoji: '🌿',
    color: '#16a34a',
    bgColor: '#f0fdf4',
    borderColor: '#86efac',
    textColor: '#15803d',
    description: 'Perfecto para abonado de crecimiento, riegos y foliares.',
  },
  fruto: {
    label: 'Día Fruto',
    emoji: '🍎',
    color: '#dc2626',
    bgColor: '#fff1f2',
    borderColor: '#fca5a5',
    textColor: '#b91c1c',
    description: 'Cosecha de semillas y tratamientos fungicidas preventivos.',
  },
  raiz: {
    label: 'Día Raíz',
    emoji: '🌱',
    color: '#854d0e',
    bgColor: '#fffbeb',
    borderColor: '#fcd34d',
    textColor: '#92400e',
    description: 'Tratamientos fitosanitarios, micorrizas y limpiezas de sustrato.',
  },
  nodo: {
    label: 'Día Nodo',
    emoji: '⚠️',
    color: '#475569',
    bgColor: '#f8fafc',
    borderColor: '#cbd5e1',
    textColor: '#475569',
    description: 'NO manipular las plantas. Día de tránsito lunar.',
  },
};

export const LUNAR_PHASE_META: Record<LunarPhase, { label: string; emoji: string }> = {
  creciente: { label: 'Luna Creciente', emoji: '🌒' },
  llena:     { label: 'Luna Llena',     emoji: '🌕' },
  menguante: { label: 'Luna Menguante', emoji: '🌘' },
  nueva:     { label: 'Luna Nueva',     emoji: '🌑' },
};
