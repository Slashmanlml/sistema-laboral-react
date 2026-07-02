/**
 * Perfiles de cronograma de riego con sales Ryanodine (Fibra de Coco) para GrowManager.
 */

export interface ScheduleWeek {
  week: number;
  title: string;
  ph: number;
  ec: number;
  makroA: number;
  mikroB: number;
  calcisC: number;
  notes: string;
}

export const VEG_SCHEDULE: ScheduleWeek[] = [
  { 
    week: 0, 
    title: 'Semana 0 (Enraizamiento y Clones)', 
    ph: 5.8, 
    ec: 0.55, 
    makroA: 1.2,
    mikroB: 1.2,
    calcisC: 1.2,
    notes: 'Etapa de Enraizamiento y Aeroclonadoras. Dosis inicial baja para estimular desarrollo de raíces.' 
  },
  { 
    week: 1, 
    title: 'Semana 1 (Vegetativo Temprano)', 
    ph: 5.8, 
    ec: 1.21, 
    makroA: 2.6,
    mikroB: 2.6,
    calcisC: 2.6,
    notes: 'Vegetativo Temprano. Incremento de sales base para promover el crecimiento inicial.' 
  },
  { 
    week: 2, 
    title: 'Semana 2 (Vegetativo Temprano)', 
    ph: 5.8, 
    ec: 1.29, 
    makroA: 2.8,
    mikroB: 2.8,
    calcisC: 2.8,
    notes: 'Vegetativo Temprano. Estabilización de la estructura vegetativa y desarrollo de follaje.' 
  },
  { 
    week: 3, 
    title: 'Semana 3 (Vegetativo Tardío)', 
    ph: 5.8, 
    ec: 1.34, 
    makroA: 3.0,
    mikroB: 3.0,
    calcisC: 3.0,
    notes: 'Vegetativo Tardío. Crecimiento pleno y demanda media de nitrógeno y calcio.' 
  },
  { 
    week: 4, 
    title: 'Semana 4 (Vegetativo Tardío)', 
    ph: 5.8, 
    ec: 1.43, 
    makroA: 3.2,
    mikroB: 3.2,
    calcisC: 3.2,
    notes: 'Vegetativo Tardío. Preparación de estructura fuerte para soportar futura floración.' 
  },
  { 
    week: 5, 
    title: 'Semana 5 (Vegetativo Tardío)', 
    ph: 5.8, 
    ec: 1.51, 
    makroA: 3.4,
    mikroB: 3.4,
    calcisC: 3.4,
    notes: 'Vegetativo Tardío Final. Preparación del sustrato y lixiviación suave previa a floración.' 
  }
];

export const FLOWER_SCHEDULE: ScheduleWeek[] = [
  { 
    week: 1, 
    title: 'Flora Semana 1 (Pre-floración)', 
    ph: 5.8, 
    ec: 1.51, 
    makroA: 3.6,
    mikroB: 3.6,
    calcisC: 3.6,
    notes: 'Pre-floración. Inducción al cambio de ciclo y desarrollo de primeros nudos florales.' 
  },
  { 
    week: 2, 
    title: 'Flora Semana 2 (Floración Estiramiento)', 
    ph: 5.8, 
    ec: 1.60, 
    makroA: 3.6,
    mikroB: 3.6,
    calcisC: 3.6,
    notes: 'Floración Estiramiento. Estiramiento de ramas (stretch). Demanda estable de bases y microelementos.' 
  },
  { 
    week: 3, 
    title: 'Flora Semana 3 (Floración Estiramiento)', 
    ph: 5.8, 
    ec: 1.68, 
    makroA: 3.8,
    mikroB: 3.8,
    calcisC: 3.8,
    notes: 'Floración Estiramiento. Fin de estiramiento. Aparición de primeros botones de resina.' 
  },
  { 
    week: 4, 
    title: 'Flora Semana 4 (Floración Engorde)', 
    ph: 5.8, 
    ec: 1.44, 
    makroA: 3.8,
    mikroB: 3.8,
    calcisC: 2.6,
    notes: 'Floración Engorde. Reducción de Calcis C para favorecer el engorde de cálices y absorción de fósforo.' 
  },
  { 
    week: 5, 
    title: 'Flora Semana 5 (Floración Engorde)', 
    ph: 5.8, 
    ec: 1.44, 
    makroA: 3.8,
    mikroB: 3.8,
    calcisC: 2.6,
    notes: 'Floración Engorde Pleno. Pico de alimentación para desarrollo masivo de flores.' 
  },
  { 
    week: 6, 
    title: 'Flora Semana 6 (Floración Engorde)', 
    ph: 5.8, 
    ec: 1.44, 
    makroA: 3.8,
    mikroB: 3.8,
    calcisC: 2.6,
    notes: 'Floración Engorde Pleno. Mantener balance nutricional y controlar humedad del coco.' 
  },
  { 
    week: 7, 
    title: 'Flora Semana 7 (Floración Maduración)', 
    ph: 5.8, 
    ec: 1.23, 
    makroA: 3.2,
    mikroB: 3.2,
    calcisC: 2.0,
    notes: 'Floración Maduración. Maduración de tricomas. Reducción progresiva de bases para forzar consumo interno.' 
  },
  { 
    week: 8, 
    title: 'Flora Semana 8 (Floración Maduración)', 
    ph: 5.8, 
    ec: 0.77, 
    makroA: 3.0,
    mikroB: 3.0,
    calcisC: 0.0,
    notes: 'Floración Maduración Final. Retirar calcio por completo. Enfoque exclusivo en bases de maduración.' 
  },
  { 
    week: 9, 
    title: 'Flora Semana 9 (Fin de Ciclo / Lavado)', 
    ph: 5.8, 
    ec: 0.00, 
    makroA: 0.0,
    mikroB: 0.0,
    calcisC: 0.0,
    notes: 'Fin de Ciclo. Lavado de raíces con agua pura para remover remanentes de sales del medio.' 
  }
];
