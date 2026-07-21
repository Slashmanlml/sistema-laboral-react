import { describe, test, expect } from 'vitest';
import {
  getSchedule,
  findScheduleWeek,
  formatDose,
  calculateTankDose,
  VEG_SCHEDULE,
  ATHENA_PRO_FLOWER_SCHEDULE,
} from './schedules';

describe('Selección de cronogramas', () => {
  test('devuelve el cronograma correcto según etapa y línea', () => {
    expect(getSchedule('Vegetativo', 'ryanodine')).toBe(VEG_SCHEDULE);
    expect(getSchedule('Floración', 'athena_pro')).toBe(ATHENA_PRO_FLOWER_SCHEDULE);
  });

  test('las etapas sin fertilización devuelven un cronograma vacío', () => {
    expect(getSchedule('Germinación', 'ryanodine')).toEqual([]);
    expect(getSchedule('Secado', 'athena_pro')).toEqual([]);
    expect(getSchedule('Curado', 'athena_blended')).toEqual([]);
  });

  test('findScheduleWeek usa la última semana si el cultivo se pasó', () => {
    const schedule = getSchedule('Vegetativo', 'ryanodine');
    const last = schedule[schedule.length - 1];
    expect(findScheduleWeek(schedule, 999)).toBe(last);
  });

  test('findScheduleWeek devuelve undefined en un cronograma vacío', () => {
    expect(findScheduleWeek([], 1)).toBeUndefined();
  });
});

describe('Dosificación', () => {
  const week = {
    week: 3,
    title: 'Semana 3 (Vegetativo Tardío)',
    ph: 5.8,
    ec: 1.34,
    makroA: 3,
    mikroB: 3,
    calcisC: 3,
    notes: '',
  };

  test('el texto de dosis cambia según la línea de nutrientes', () => {
    expect(formatDose(week, 'ryanodine')).toContain('ml/L');
    expect(formatDose(week, 'athena_pro')).toContain('Pro Bloom');
    expect(formatDose(week, 'athena_blended')).toContain('Cleanse');
  });

  test('Ryanodine se expresa en ml/L: 20 L multiplican la dosis por 20', () => {
    const rows = calculateTankDose(week, 'ryanodine', 20);
    expect(rows[0].amount).toBe('60.0');
    expect(rows[0].unit).toBe('ml');
  });

  test('Athena se expresa por 10 L: 20 L sólo duplican la dosis', () => {
    // La calculadora anterior multiplicaba siempre por litros, dando 10x de más.
    const rows = calculateTankDose(week, 'athena_pro', 20);
    expect(rows[0].label).toBe('Pro Bloom');
    expect(rows[0].amount).toBe('6.0');
    expect(rows[0].unit).toBe('g');
  });

  test('en la semana 8 de Athena Pro el Pro Core se reemplaza por Fade líquido', () => {
    const fadeWeek = { ...week, week: 8 };
    const rows = calculateTankDose(fadeWeek, 'athena_pro', 10);
    expect(rows[1].label).toBe('Fade');
    expect(rows[1].unit).toBe('mL');

    const proWeek = { ...week, week: 5 };
    expect(calculateTankDose(proWeek, 'athena_pro', 10)[1].label).toBe('Pro Core');
  });

  test('Athena Blended distingue receta de veg y de flora por el título', () => {
    const vegRows = calculateTankDose({ ...week, title: 'Semana Veg' }, 'athena_blended', 10);
    expect(vegRows[0].label).toBe('Grow A & B');

    const flowerRows = calculateTankDose({ ...week, title: 'Semana Flora' }, 'athena_blended', 10);
    expect(flowerRows[0].label).toBe('Bloom A & B');
  });
});
