import type { LotStage } from '../../types/grow';

interface StageMeta {
  label: string;
  description: string;
  /** Duración típica de la etapa en días, para la barra de progreso. */
  durationDays: number;
  /** Etapa a la que se pasa al trasplantar. */
  nextStage: LotStage;
  /** Envase sugerido al llegar a esta etapa. */
  potSize: string;
}

export const STAGE_META: Record<LotStage, StageMeta> = {
  Germinación: {
    label: 'Germinación',
    description: 'Plántulas / Clones',
    durationDays: 14,
    nextStage: 'Vegetativo',
    potSize: 'Bandeja / Jiffy',
  },
  Vegetativo: {
    label: 'Vegetativo',
    description: 'Crecimiento de hojas',
    durationDays: 60,
    nextStage: 'Floración',
    potSize: '3 Litros',
  },
  Floración: {
    label: 'Floración',
    description: 'Producción de flores',
    durationDays: 70,
    nextStage: 'Secado',
    potSize: '10 Litros',
  },
  Secado: {
    label: 'Secado',
    description: 'Cosechas secando',
    durationDays: 14,
    nextStage: 'Curado',
    potSize: 'Colgado',
  },
  Curado: {
    label: 'Curado',
    description: 'Maduración final',
    durationDays: 30,
    nextStage: 'Curado',
    potSize: 'Frascos',
  },
};

/** Porcentaje de avance del lote dentro de su etapa actual (0-100). */
export const stageProgress = (stage: LotStage, daysElapsed: number): number => {
  const duration = STAGE_META[stage].durationDays;
  return Math.min(Math.max(Math.round((daysElapsed / duration) * 100), 0), 100);
};
