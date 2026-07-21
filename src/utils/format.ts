// =============================================================================
// Formateo y parseo de valores para la UI.
// =============================================================================

const LOCALE = 'es-AR';

// ─── Conductividad eléctrica ──────────────────────────────────────────────────

/**
 * Umbral a partir del cual se interpreta que el usuario cargó microsiemens.
 *
 * La EC de un riego se mide en mS/cm y en la práctica no supera ~8. Los medidores
 * baratos muestran µS/cm (ej: 1400 µS = 1.4 mS). Antes el umbral era 10, lo que
 * corrompía silenciosamente lecturas legítimas de drenaje (Athena Pro apunta
 * hasta 7.0 mS/cm y un runoff salinizado supera fácil los 10).
 */
const MICROSIEMENS_THRESHOLD = 100;

/** Normaliza una EC escrita por el usuario a mS/cm. Devuelve `undefined` si no es válida. */
export const parseEC = (value: string): number | undefined => {
  if (!value.trim()) return undefined;
  const num = Number.parseFloat(value);
  if (Number.isNaN(num)) return undefined;
  return num >= MICROSIEMENS_THRESHOLD ? num / 1000 : num;
};

/** `true` si el valor escrito se va a convertir de µS/cm a mS/cm al guardar. */
export const willConvertFromMicrosiemens = (value: string): boolean => {
  const num = Number.parseFloat(value);
  return !Number.isNaN(num) && num >= MICROSIEMENS_THRESHOLD;
};

/** Parsea un número opcional de un input de texto. */
export const parseOptionalNumber = (value: string): number | undefined => {
  if (!value.trim()) return undefined;
  const num = Number.parseFloat(value);
  return Number.isNaN(num) ? undefined : num;
};

// ─── Fechas ───────────────────────────────────────────────────────────────────

/** "05/07 14:30" — para tablas de historial. */
export const formatDateTime = (isoTimestamp: string): string =>
  new Date(isoTimestamp).toLocaleString(LOCALE, {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

/** "14:30" — para ejes de gráficos. */
export const formatTime = (isoTimestamp: string): string =>
  new Date(isoTimestamp).toLocaleTimeString(LOCALE, {
    hour: '2-digit',
    minute: '2-digit',
  });

/** "05/07" — para etiquetas compactas de gráficos. */
export const formatDayMonth = (isoTimestamp: string): string =>
  new Date(isoTimestamp).toLocaleDateString(LOCALE, {
    day: '2-digit',
    month: '2-digit',
  });

/** "dom, 5 jul" — para listados de tareas. */
export const formatShortDate = (date: Date): string =>
  date.toLocaleDateString(LOCALE, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

/** "domingo, 5 de julio" — para cabeceras. */
export const formatLongDate = (date: Date): string =>
  date.toLocaleDateString(LOCALE, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

/** "domingo, 5 jul" — para el encabezado del dashboard. */
export const formatHeaderDate = (date: Date): string =>
  date.toLocaleDateString(LOCALE, {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  });

// ─── Valores numéricos ────────────────────────────────────────────────────────

/** Muestra un número opcional, o un guion si no hay dato. */
export const showOptional = (value: number | undefined | null, digits = 1): string =>
  value === undefined || value === null ? '-.-' : value.toFixed(digits);
