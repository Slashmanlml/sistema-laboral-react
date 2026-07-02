/**
 * Perfiles de cronograma de riego con sales para GrowManager.
 */

export interface ScheduleWeek {
  week: number;
  title: string;
  ph: number;
  ec: number;
  notes: string;
}

export const VEG_SCHEDULE: ScheduleWeek[] = [
  { 
    week: 1, 
    title: 'Veg Semana 1 (Plántula/Clon)', 
    ph: 5.8, 
    ec: 0.6, 
    notes: 'Inicio de vegetativo / Enraizamiento. Sales de crecimiento a dosis muy baja, estimulante de raíces.' 
  },
  { 
    week: 2, 
    title: 'Veg Semana 2 (Crecimiento Inicial)', 
    ph: 5.9, 
    ec: 0.9, 
    notes: 'Crecimiento vegetativo suave. Sales base a dosis de transición.' 
  },
  { 
    week: 3, 
    title: 'Veg Semana 3 (Crecimiento Pleno)', 
    ph: 6.0, 
    ec: 1.2, 
    notes: 'Crecimiento vegetativo pleno. Sales base de crecimiento a dosis estándar.' 
  },
  { 
    week: 4, 
    title: 'Veg Semana 4 (Pre-flora / Transición)', 
    ph: 6.1, 
    ec: 1.4, 
    notes: 'Vegetativo tardío. Sales de crecimiento fuertes y preparación para inducción a floración (cambio de fotoperiodo).' 
  }
];

export const FLOWER_SCHEDULE: ScheduleWeek[] = [
  { 
    week: 1, 
    title: 'Flora Semana 1 (Transición)', 
    ph: 6.0, 
    ec: 1.2, 
    notes: 'S1 Floración (Transición). Sales base de floración dosis suave + estimulante.' 
  },
  { 
    week: 2, 
    title: 'Flora Semana 2 (Pre-flora)', 
    ph: 6.1, 
    ec: 1.3, 
    notes: 'S2 Floración (Pre-flora). Formación de primeros brotes. Sales base y bioestimulante de floración.' 
  },
  { 
    week: 3, 
    title: 'Flora Semana 3 (Flora Temprana)', 
    ph: 6.2, 
    ec: 1.5, 
    notes: 'S3 Floración (Flora Temprana). Aparición de flores. Aumento de sales base y primer aporte de Fósforo/Potasio (PK).' 
  },
  { 
    week: 4, 
    title: 'Flora Semana 4 (Engorde Inicial)', 
    ph: 6.2, 
    ec: 1.6, 
    notes: 'S4 Floración (Engorde Inicial). Mantener dosis de sales base y PK.' 
  },
  { 
    week: 5, 
    title: 'Flora Semana 5 (Flora Media - Pico)', 
    ph: 6.3, 
    ec: 1.8, 
    notes: 'S5 Floración (Flora Media - Pico). Pico de demanda. Dosis máximas de sales base y PK.' 
  },
  { 
    week: 6, 
    title: 'Flora Semana 6 (Flora Media)', 
    ph: 6.3, 
    ec: 1.9, 
    notes: 'S6 Floración (Flora Media). Mantener dosis altas de sales para desarrollo de cálices.' 
  },
  { 
    week: 7, 
    title: 'Flora Semana 7 (Flora Avanzada)', 
    ph: 6.4, 
    ec: 1.8, 
    notes: 'S7 Floración (Flora Avanzada - Maduración). Reducir sales base, mantener PK suave.' 
  },
  { 
    week: 8, 
    title: 'Flora Semana 8 (Flora Avanzada)', 
    ph: 6.4, 
    ec: 1.6, 
    notes: 'S8 Floración (Flora Avanzada). Maduración final. Reducir sales base gradualmente.' 
  },
  { 
    week: 9, 
    title: 'Flora Semana 9 (Lavado de raíces)', 
    ph: 6.0, 
    ec: 0.3, 
    notes: 'S9 Floración (Lavado de raíces). Riego con agua sola para limpiar sales acumuladas del medio.' 
  },
  { 
    week: 10, 
    title: 'Flora Semana 10 (Lavado Final)', 
    ph: 6.0, 
    ec: 0.2, 
    notes: 'S10 Floración (Lavado Final). Riego final con agua sola y sequía previa a la cosecha.' 
  }
];
