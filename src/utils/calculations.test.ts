import { describe, test, expect } from 'vitest';
import { calculateVPD, getVPDInfo, calculateDaysElapsed } from './calculations';

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
    const todayStr = new Date().toISOString().split('T')[0];
    const days = calculateDaysElapsed(todayStr);
    expect(days).toBeGreaterThanOrEqual(0);
    expect(days).toBeLessThan(2);
  });
});
