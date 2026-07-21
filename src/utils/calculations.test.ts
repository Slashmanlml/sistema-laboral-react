import { describe, test, expect } from 'vitest';
import { calculateVPD, getVPDInfo, calculateDaysElapsed, getCycleWeek } from './calculations';
import { todayStr, addDaysToStr } from './date';

describe('Cálculos Científicos de Cultivo', () => {
  test('Debe calcular VPD correctamente según temperatura y humedad', () => {
    // 24°C y 55% humedad relativa da un VPD aproximado de 1.34 kPa
    const vpd = calculateVPD(24, 55);
    expect(vpd).toBeGreaterThan(1.2);
    expect(vpd).toBeLessThan(1.5);
  });

  test('Debe clasificar el nivel de VPD correctamente', () => {
    const vpdMuyBajo = getVPDInfo(0.2);
    expect(vpdMuyBajo.label).toBe('Muy Bajo');
    
    const vpdOptimoVeg = getVPDInfo(0.6);
    expect(vpdOptimoVeg.label).toBe('Veg Óptimo');

    const vpdMuySeco = getVPDInfo(1.8);
    expect(vpdMuySeco.label).toBe('Muy Seco');
  });

  test('Debe calcular la cantidad de días transcurridos desde una fecha', () => {
    // Usar todayStr() y no `toISOString().split('T')[0]`: el segundo devuelve la
    // fecha UTC, que a la noche en Argentina ya es el día siguiente.
    expect(calculateDaysElapsed(todayStr())).toBe(0);
    expect(calculateDaysElapsed(addDaysToStr(todayStr(), -10))).toBe(10);
  });

  test('Debe devolver días negativos si el lote todavía no arrancó', () => {
    expect(calculateDaysElapsed(addDaysToStr(todayStr(), 3))).toBe(-3);
  });

  test('getCycleWeek: vegetativo arranca en semana 0 y floración en semana 1', () => {
    const start = addDaysToStr(todayStr(), -10); // 10 días → semana 1 cruda

    expect(getCycleWeek({ stage: 'Vegetativo', start_date: start })).toBe(1);
    // Floración corre un lugar: la primera semana ya tiene receta propia.
    expect(getCycleWeek({ stage: 'Floración', start_date: start })).toBe(2);
    // Un lote recién iniciado en floración nunca cae por debajo de la semana 1.
    expect(getCycleWeek({ stage: 'Floración', start_date: todayStr() })).toBe(1);
  });
});
