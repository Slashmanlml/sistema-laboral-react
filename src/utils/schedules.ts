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
    notes: 'Flora Semana 4. Reducción de Calcis C para favorecer el engorde de cálices y absorción de fósforo.' 
  },
  { 
    week: 5, 
    title: 'Flora Semana 5 (Floración Engorde)', 
    ph: 5.8, 
    ec: 1.44, 
    makroA: 3.8,
    mikroB: 3.8,
    calcisC: 2.6,
    notes: 'Flora Semana 5. Pico de alimentación para desarrollo masivo de flores.' 
  },
  { 
    week: 6, 
    title: 'Flora Semana 6 (Floración Engorde)', 
    ph: 5.8, 
    ec: 1.44, 
    makroA: 3.8,
    mikroB: 3.8,
    calcisC: 2.6,
    notes: 'Flora Semana 6. Mantener balance nutricional y controlar humedad del coco.' 
  },
  { 
    week: 7, 
    title: 'Flora Semana 7 (Floración Maduración)', 
    ph: 5.8, 
    ec: 1.23, 
    makroA: 3.2,
    mikroB: 3.2,
    calcisC: 2.0,
    notes: 'Flora Semana 7. Maduración de tricomas. Reducción progresiva de bases para forzar consumo interno.' 
  },
  { 
    week: 8, 
    title: 'Flora Semana 8 (Floración Maduración)', 
    ph: 5.8, 
    ec: 0.77, 
    makroA: 3.0,
    mikroB: 3.0,
    calcisC: 0.0,
    notes: 'Flora Semana 8. Retirar calcio por completo. Enfoque exclusivo en bases de maduración.' 
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

// --- ATHENA PRO LINE (Sales Solubles) ---
export const ATHENA_PRO_VEG_SCHEDULE: ScheduleWeek[] = [
  {
    week: 0,
    title: 'Semana 0 (Enraizamiento / Clones)',
    ph: 5.6,
    ec: 2.0,
    makroA: 1.29, // Pro Bloom (12.9g por 10L)
    mikroB: 0.77, // Pro Core (7.7g por 10L)
    calcisC: 0.3, // Cleanse (3mL por 10L)
    notes: 'Procedimiento de Clon Athena. Remojar medio a capacidad de campo, esperar dryback del 50% antes de regar.'
  },
  {
    week: 1,
    title: 'Semana 1 (Veg Temprano)',
    ph: 6.0,
    ec: 3.0,
    makroA: 2.03, // Pro Bloom (20.3g por 10L)
    mikroB: 1.22, // Pro Core (12.2g por 10L)
    calcisC: 0.8, // Cleanse (8mL promedio por 10L)
    notes: 'Vegetativo Completo. Mantener EC de sustrato entre 3.0 y 5.0. Secado diario de 30-40%.'
  },
  {
    week: 2,
    title: 'Semana 2 (Veg Temprano)',
    ph: 6.0,
    ec: 3.0,
    makroA: 2.03,
    mikroB: 1.22,
    calcisC: 0.8,
    notes: 'Vegetativo Completo. Monitorear peso de macetas y escorrentía diaria buscando 10-25% de drenaje.'
  },
  {
    week: 3,
    title: 'Semana 3 (Veg Tardío)',
    ph: 6.0,
    ec: 3.0,
    makroA: 2.03,
    mikroB: 1.22,
    calcisC: 0.8,
    notes: 'Vegetativo Pleno. Ajustar tamaño de disparo manual si la EC de drenaje sube de 5.0.'
  },
  {
    week: 4,
    title: 'Semana 4 (Veg Tardío)',
    ph: 6.0,
    ec: 3.0,
    makroA: 2.03,
    mikroB: 1.22,
    calcisC: 0.8,
    notes: 'Fin de Vegetativo. Preparación de estructura y enraizamiento sano antes del paso a 12/12.'
  }
];

export const ATHENA_PRO_FLOWER_SCHEDULE: ScheduleWeek[] = [
  {
    week: 1,
    title: 'Flora Semana 1 (Pre-floración / Estiramiento)',
    ph: 6.1,
    ec: 3.0,
    makroA: 2.03, // Pro Bloom
    mikroB: 1.22, // Pro Core
    calcisC: 0.8, // Cleanse
    notes: 'Fase de Estiramiento. Generar escorrentía manual del 10-25%. Objetivo EC de drenaje: 6.0-7.0 (alto para frenar estiramiento).'
  },
  {
    week: 2,
    title: 'Flora Semana 2 (Estiramiento)',
    ph: 6.1,
    ec: 3.0,
    makroA: 2.03,
    mikroB: 1.22,
    calcisC: 0.8,
    notes: 'Fase de Estiramiento. No regar hasta 2h de luces encendidas. Secado nocturno grande (40-50%).'
  },
  {
    week: 3,
    title: 'Flora Semana 3 (Estiramiento)',
    ph: 6.1,
    ec: 3.0,
    makroA: 2.03,
    mikroB: 1.22,
    calcisC: 0.8,
    notes: 'Fin de Estiramiento. Primeros botones de resina. Mantener drenaje alto y control por peso de maceta.'
  },
  {
    week: 4,
    title: 'Flora Semana 4 (Engorde Temprano)',
    ph: 6.1,
    ec: 3.0,
    makroA: 2.03,
    mikroB: 1.22,
    calcisC: 0.8,
    notes: 'Fase de Engorde. Bajar objetivo de EC de escorrentía a 5.0-6.0. Reducir estrés: secado diario menor (30-40%).'
  },
  {
    week: 5,
    title: 'Flora Semana 5 (Engorde Pleno)',
    ph: 6.1,
    ec: 3.0,
    makroA: 2.03,
    mikroB: 1.22,
    calcisC: 0.8,
    notes: 'Fase de Engorde Pleno. Desarrollo de cogollos pesados. Asegurar transpiración óptima (VPD 1.0-1.2 kPa).'
  },
  {
    week: 6,
    title: 'Flora Semana 6 (Engorde Pleno)',
    ph: 6.1,
    ec: 3.0,
    makroA: 2.03,
    mikroB: 1.22,
    calcisC: 0.8,
    notes: 'Fase de Engorde Pleno. Control estricto de escorrentía. Si la EC de drenaje baja de 4.0, reducir riego para acumular.'
  },
  {
    week: 7,
    title: 'Flora Semana 7 (Maduración)',
    ph: 6.1,
    ec: 3.0,
    makroA: 2.03,
    mikroB: 1.22,
    calcisC: 0.8,
    notes: 'Maduración. Preparación para el lavado de nitrógeno. Objetivo EC de escorrentía: 4.0-5.0.'
  },
  {
    week: 8,
    title: 'Flora Semana 8 (Maduración / Lavado con Fade)',
    ph: 6.1,
    ec: 3.0,
    makroA: 2.03, // Pro Bloom (20.3g por 10L)
    mikroB: 5.1,  // Fade (51mL por 10L) - REEMPLAZA a Pro Core para quitar Nitrógeno.
    calcisC: 0.8, // Cleanse
    notes: 'Fase de Enjuague con Fade. Se remueve Pro Core para eliminar nitrógeno y movilizar fósforo/potasio.'
  },
  {
    week: 9,
    title: 'Flora Semana 9 (Enjuague Final)',
    ph: 6.1,
    ec: 0.5,
    makroA: 0.0,
    mikroB: 0.0,
    calcisC: 2.6, // Cleanse (26mL por 10L)
    notes: 'Lavado Final con agua pura de ósmosis (RO) y Cleanse para limpiar el sustrato y mejorar terpenos.'
  }
];

// --- ATHENA BLENDED LINE (Sales Líquidas) ---
export const ATHENA_BLENDED_VEG_SCHEDULE: ScheduleWeek[] = [
  {
    week: 0,
    title: 'Semana 0 (Enraizamiento / Clones)',
    ph: 5.6,
    ec: 1.0,
    makroA: 1.3, // Bloom A (13ml/10L) - Clon
    mikroB: 1.3, // Bloom B (13ml/10L) - Clon
    calcisC: 1.0, // CaMg: 1.0 ml/L (dosis complementaria)
    notes: 'Pre-remojo de clones con Bloom A/B y CaMg. Mantener pH en 5.6.'
  },
  {
    week: 1,
    title: 'Semana 1 (Veg Temprano)',
    ph: 6.0,
    ec: 2.1,
    makroA: 2.9, // Grow A (29ml/10L)
    mikroB: 2.9, // Grow B (29ml/10L)
    calcisC: 1.0, // CaMg (10ml por 10L)
    notes: 'Vegetativo Blended. Aplicar Grow A/B + CaMg + Cleanse (0.8 ml/L). Secado por peso de maceta.'
  },
  {
    week: 2,
    title: 'Semana 2 (Veg Temprano)',
    ph: 6.0,
    ec: 2.1,
    makroA: 2.9,
    mikroB: 2.9,
    calcisC: 1.0,
    notes: 'Vegetativo Blended. Estructura y follaje activo. Evitar excesos de riego en maceta manual.'
  },
  {
    week: 3,
    title: 'Semana 3 (Veg Tardío)',
    ph: 6.0,
    ec: 2.1,
    makroA: 2.9,
    mikroB: 2.9,
    calcisC: 1.0,
    notes: 'Vegetativo Tardío. Mantener la consistencia de riegos diarios por la mañana.'
  },
  {
    week: 4,
    title: 'Semana 4 (Veg Tardío)',
    ph: 6.0,
    ec: 2.1,
    makroA: 2.9,
    mikroB: 2.9,
    calcisC: 1.0,
    notes: 'Fin de Vegetativo. Plantas listas para trasplantar a sala de floración.'
  }
];

export const ATHENA_BLENDED_FLOWER_SCHEDULE: ScheduleWeek[] = [
  {
    week: 1,
    title: 'Flora Semana 1 (Pre-floración / Estiramiento)',
    ph: 6.1,
    ec: 2.3,
    makroA: 1.3, // Bloom A (13ml/10L)
    mikroB: 1.3, // Bloom B (13ml/10L)
    calcisC: 1.0, // CaMg (10ml por 10L)
    notes: 'Fase de Estiramiento. Transición de nutrientes a Bloom A/B. Dosis baja inicial.'
  },
  {
    week: 2,
    title: 'Flora Semana 2 (Estiramiento)',
    ph: 6.1,
    ec: 2.3,
    makroA: 2.6, // Bloom A (26ml/10L)
    mikroB: 2.6, // Bloom B (26ml/10L)
    calcisC: 1.0, // CaMg
    notes: 'Fase de Estiramiento. Aumento de dosificación de Bloom. Mantener secado nocturno grande.'
  },
  {
    week: 3,
    title: 'Flora Semana 3 (Estiramiento)',
    ph: 6.1,
    ec: 2.5,
    makroA: 3.2, // Bloom A (32ml/10L)
    mikroB: 3.2, // Bloom B (32ml/10L)
    calcisC: 1.1, // PK (11ml/10L)
    notes: 'Fin de Estiramiento. Incorporación de PK Blended. Aporte extra de fósforo y potasio.'
  },
  {
    week: 4,
    title: 'Flora Semana 4 (Engorde Temprano)',
    ph: 6.1,
    ec: 2.6,
    makroA: 3.2, // Bloom A
    mikroB: 3.2, // Bloom B
    calcisC: 1.6, // PK (16ml/10L)
    notes: 'Fase de Engorde. Pico de alimentación Blended. Controlar escorrentía diaria por la mañana.'
  },
  {
    week: 5,
    title: 'Flora Semana 5 (Engorde Pleno)',
    ph: 6.1,
    ec: 2.4,
    makroA: 3.2, // Bloom A
    mikroB: 3.2, // Bloom B
    calcisC: 2.4, // PK (24ml/10L)
    notes: 'Fase de Engorde Pleno. Incremento de PK y reducción de bases para promover resina.'
  },
  {
    week: 6,
    title: 'Flora Semana 6 (Engorde Pleno)',
    ph: 6.1,
    ec: 2.3,
    makroA: 3.2, // Bloom A
    mikroB: 3.2, // Bloom B
    calcisC: 2.6, // PK (26ml/10L)
    notes: 'Fase de Engorde Pleno. Pico de PK Blended. Drenaje estable del 15%.'
  },
  {
    week: 7,
    title: 'Flora Semana 7 (Maduración)',
    ph: 6.1,
    ec: 1.7,
    makroA: 2.6, // Bloom A (26ml/10L)
    mikroB: 2.6, // Bloom B (26ml/10L)
    calcisC: 3.2, // PK (32ml/10L)
    notes: 'Maduración. Reducción de bases y mantenimiento de PK para asimilar reservas.'
  },
  {
    week: 8,
    title: 'Flora Semana 8 (Maduración / Lavado con Fade)',
    ph: 6.1,
    ec: 1.7,
    makroA: 2.4, // Bloom A (24ml/10L)
    mikroB: 2.4, // Bloom B (24ml/10L)
    calcisC: 3.2, // PK
    notes: 'Maduración Avanzada. Preparación de plantas y retiro de CaMg para enjuague.'
  },
  {
    week: 9,
    title: 'Flora Semana 9 (Enjuague Final)',
    ph: 6.1,
    ec: 1.7,
    makroA: 1.3, // Bloom A (13ml/10L)
    mikroB: 1.3, // Bloom B (13ml/10L)
    calcisC: 3.2, // PK
    notes: 'Lavado final de sales acumuladas. Último empuje de resina sin nitrógeno.'
  }
];
