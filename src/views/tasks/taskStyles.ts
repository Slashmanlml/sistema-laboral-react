import type { TaskType } from '../../types/grow';

const BADGES: Record<TaskType, string> = {
  riego: 'bg-blue-50 text-blue-600 border border-blue-100',
  fertilizante: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
  poda: 'bg-yellow-50 text-yellow-600 border border-yellow-100',
  preventivo: 'bg-red-50 text-red-600 border border-red-100',
  otro: 'bg-slate-50 text-slate-600 border border-slate-100',
};

export const taskTypeBadge = (type: TaskType): string => BADGES[type];

export const TASK_TYPE_LABELS: Record<TaskType, string> = {
  riego: 'Riego',
  fertilizante: 'Nutrientes',
  poda: 'Poda / Trasplante',
  preventivo: 'Pesticida / Preventivo',
  otro: 'Otro',
};

/** Los riegos y fertilizantes pueden registrarse directo desde la agenda. */
export const isWateringTask = (type: TaskType): boolean =>
  type === 'riego' || type === 'fertilizante';
