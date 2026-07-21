import { describe, test, expect } from 'vitest';
import {
  toLocalDateStr,
  parseLocalDate,
  addDays,
  addDaysToStr,
  startOfWeekMonday,
  daysBetween,
  isoToLocalDateStr,
} from './date';

describe('Utilidades de fecha en hora local', () => {
  test('toLocalDateStr usa el huso local, no UTC', () => {
    // 23:30 hora local del 5 de julio. En cualquier huso negativo (Argentina es
    // UTC-3) `toISOString()` ya devolvería el 6 de julio.
    const lateNight = new Date(2026, 6, 5, 23, 30, 0);
    expect(toLocalDateStr(lateNight)).toBe('2026-07-05');
  });

  test('toLocalDateStr rellena mes y día con ceros', () => {
    expect(toLocalDateStr(new Date(2026, 0, 9))).toBe('2026-01-09');
  });

  test('parseLocalDate interpreta el string como medianoche local', () => {
    const parsed = parseLocalDate('2026-07-05');
    expect(parsed.getFullYear()).toBe(2026);
    expect(parsed.getMonth()).toBe(6);
    expect(parsed.getDate()).toBe(5);
    expect(parsed.getHours()).toBe(0);
  });

  test('addDays no muta la fecha original', () => {
    const original = new Date(2026, 6, 5);
    const result = addDays(original, 3);
    expect(toLocalDateStr(result)).toBe('2026-07-08');
    expect(toLocalDateStr(original)).toBe('2026-07-05');
  });

  test('addDaysToStr cruza correctamente el fin de mes', () => {
    expect(addDaysToStr('2026-07-30', 3)).toBe('2026-08-02');
    expect(addDaysToStr('2026-03-01', -1)).toBe('2026-02-28');
  });

  test('startOfWeekMonday devuelve el lunes, incluso si la fecha es domingo', () => {
    // 2026-07-05 es domingo: su semana arranca el lunes 2026-06-29.
    expect(toLocalDateStr(startOfWeekMonday(new Date(2026, 6, 5)))).toBe('2026-06-29');
    // 2026-07-06 es lunes: se devuelve a sí mismo.
    expect(toLocalDateStr(startOfWeekMonday(new Date(2026, 6, 6)))).toBe('2026-07-06');
    // 2026-07-08 es miércoles.
    expect(toLocalDateStr(startOfWeekMonday(new Date(2026, 6, 8)))).toBe('2026-07-06');
  });

  test('daysBetween cuenta días completos y admite valores negativos', () => {
    expect(daysBetween('2026-07-01', '2026-07-08')).toBe(7);
    expect(daysBetween('2026-07-08', '2026-07-01')).toBe(-7);
    expect(daysBetween('2026-07-01', '2026-07-01')).toBe(0);
  });

  test('daysBetween no se corre por el cambio de horario de verano', () => {
    // Un mes completo debe dar 31 días aunque haya un salto de DST en el medio.
    expect(daysBetween('2026-10-01', '2026-11-01')).toBe(31);
    expect(daysBetween('2026-03-01', '2026-04-01')).toBe(31);
  });

  test('isoToLocalDateStr convierte un timestamp a su día local', () => {
    const iso = new Date(2026, 6, 5, 22, 15).toISOString();
    expect(isoToLocalDateStr(iso)).toBe('2026-07-05');
  });
});
