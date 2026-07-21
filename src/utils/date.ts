// =============================================================================
// Utilidades de fecha en HORA LOCAL.
//
// IMPORTANTE: nunca usar `date.toISOString().split('T')[0]` para obtener "el día
// de hoy". `toISOString()` convierte a UTC, así que en Argentina (UTC-3) entre
// las 21:00 y la medianoche devuelve la fecha del día siguiente. Todo el
// calendario, las tareas del día y el control de riegos dependen de esto.
// =============================================================================

/** Devuelve la fecha en formato YYYY-MM-DD usando el huso horario local. */
export const toLocalDateStr = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/** La fecha de hoy en formato YYYY-MM-DD (hora local). */
export const todayStr = (): string => toLocalDateStr();

/**
 * Convierte un YYYY-MM-DD a un Date en medianoche local.
 * Ojo: `new Date('2026-07-05')` se interpreta como UTC; agregar la hora fuerza
 * la interpretación local.
 */
export const parseLocalDate = (dateStr: string): Date =>
  new Date(`${dateStr}T00:00:00`);

/** Convierte un YYYY-MM-DD a un Date al mediodía local (evita saltos de día). */
export const parseLocalNoon = (dateStr: string): Date =>
  new Date(`${dateStr}T12:00:00`);

/** Suma días a una fecha y devuelve una nueva instancia. */
export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

/** Suma días a un YYYY-MM-DD y devuelve otro YYYY-MM-DD. */
export const addDaysToStr = (dateStr: string, days: number): string =>
  toLocalDateStr(addDays(parseLocalDate(dateStr), days));

/** Devuelve el lunes de la semana que contiene a `date` (medianoche local). */
export const startOfWeekMonday = (date: Date): Date => {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  // getDay(): 0 = domingo, 1 = lunes, ... 6 = sábado
  const dayOfWeek = result.getDay();
  const offsetToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  result.setDate(result.getDate() + offsetToMonday);
  return result;
};

/** Cantidad de días completos entre dos fechas YYYY-MM-DD (puede ser negativa). */
export const daysBetween = (startDateStr: string, endDateStr: string): number => {
  const start = parseLocalDate(startDateStr);
  const end = parseLocalDate(endDateStr);
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((end.getTime() - start.getTime()) / msPerDay);
};

/** Extrae la parte de fecha (YYYY-MM-DD) de un timestamp ISO, en hora local. */
export const isoToLocalDateStr = (isoTimestamp: string): string =>
  toLocalDateStr(new Date(isoTimestamp));
