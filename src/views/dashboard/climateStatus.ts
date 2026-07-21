import type { ClimateTargets } from '../../utils/calculations';
import type { Trend } from './MetricCard';

/**
 * Texto de estado de una métrica contra los objetivos Athena.
 * Sin objetivos activos cae a los rangos genéricos de indoor.
 */
export const climateSubtext = (
  value: number | undefined,
  targets: { min: number; max: number } | null,
  fallback: { low: number; high: number; labels: [string, string, string] },
  unit: string
): string => {
  if (value === undefined) return 'Sin datos';

  if (targets) {
    if (value > targets.max) return `⚠️ Alto (Athena máx: ${targets.max}${unit})`;
    if (value < targets.min) return `⚠️ Bajo (Athena mín: ${targets.min}${unit})`;
    return `✓ Rango ideal (${targets.min}-${targets.max}${unit})`;
  }

  const [lowLabel, okLabel, highLabel] = fallback.labels;
  if (value > fallback.high) return highLabel;
  if (value < fallback.low) return lowLabel;
  return okLabel;
};

export const climateTargetsFor = (
  targets: ClimateTargets | null,
  metric: 'temp' | 'humidity' | 'vpd'
): { min: number; max: number } | null => {
  if (!targets) return null;
  switch (metric) {
    case 'temp':
      return { min: targets.minTemp, max: targets.maxTemp };
    case 'humidity':
      return { min: targets.minRH, max: targets.maxRH };
    case 'vpd':
      return { min: targets.minVPD, max: targets.maxVPD };
  }
};

/**
 * Compara dos lecturas consecutivas. Devuelve `undefined` si no hay con qué
 * comparar: antes se comparaban `logs[0]` y `logs[1]` aunque fueran de lotes
 * distintos, lo que producía una flecha sin sentido.
 */
export const getTrend = (
  current: number | undefined,
  previous: number | undefined,
  threshold = 0.1
): Trend | undefined => {
  if (current === undefined || previous === undefined) return undefined;
  const diff = current - previous;
  if (Math.abs(diff) < threshold) return 'neutral';
  return diff > 0 ? 'up' : 'down';
};
