// Rangos de alerta para las mediciones cargadas a mano.
// Sirven para avisar de un posible error de tipeo o de una condición peligrosa.

export interface LogFormValues {
  temp: string;
  humidity: string;
  ph: string;
  ec: string;
  phRunoff: string;
  ecRunoff: string;
}

export interface LogWarnings {
  temp: string | null;
  humidity: string | null;
  ph: string | null;
  ec: string | null;
  phRunoff: string | null;
  ecRunoff: string | null;
}

const outOfRange = (value: string, min: number, max: number): boolean => {
  const num = Number.parseFloat(value);
  return !Number.isNaN(num) && (num < min || num > max);
};

const above = (value: string, limit: number): boolean => {
  const num = Number.parseFloat(value);
  return !Number.isNaN(num) && num > limit;
};

export const computeLogWarnings = (values: LogFormValues): LogWarnings => ({
  temp: outOfRange(values.temp, 15, 32)
    ? 'Temperatura inusual para salas indoor (15°C - 32°C)'
    : null,
  humidity: outOfRange(values.humidity, 30, 85)
    ? 'Humedad inusual para vegetativo/flora (30% - 85%)'
    : null,
  ph: outOfRange(values.ph, 5.2, 6.6)
    ? 'pH de riego fuera de rango óptimo para coco (5.5 - 6.2)'
    : null,
  ec: above(values.ec, 2.3)
    ? 'EC de entrada alta: posible riesgo de sobrefertilización'
    : null,
  phRunoff: outOfRange(values.phRunoff, 5.0, 6.8)
    ? 'pH del drenaje fuera de límites ideales del sustrato'
    : null,
  ecRunoff: above(values.ecRunoff, 2.6)
    ? '¡EC de drenaje alta! Alerta de acumulación de sales en las macetas.'
    : null,
});

export const listWarnings = (warnings: LogWarnings): string[] =>
  Object.values(warnings).filter((w): w is string => w !== null);
