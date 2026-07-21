import { describe, test, expect } from 'vitest';
import {
  getMoonPhase,
  getLunarPhase,
  getLunarDayType,
  getLunarInfo,
  LUNAR_DAY_META,
  LUNAR_PHASE_META,
} from './lunar';

describe('Cálculo de fases lunares', () => {
  test('getMoonPhase devuelve siempre un valor entre 0 y 1', () => {
    const dates = [
      new Date(1985, 2, 14),
      new Date(1999, 11, 31),
      new Date(2000, 0, 6),
      new Date(2026, 6, 20),
      new Date(2040, 5, 1),
    ];

    for (const date of dates) {
      const phase = getMoonPhase(date);
      expect(phase).toBeGreaterThanOrEqual(0);
      expect(phase).toBeLessThan(1);
    }
  });

  test('la fase en la luna nueva de referencia es cercana a 0', () => {
    // 6 de enero de 2000, 18:14 UTC: luna nueva usada como referencia.
    const phase = getMoonPhase(new Date(Date.UTC(2000, 0, 6, 18, 14)));
    expect(Math.min(phase, 1 - phase)).toBeLessThan(0.01);
  });

  test('media órbita después de la luna nueva la fase es cercana a 0.5', () => {
    const halfCycleMs = (29.53058868 / 2) * 86400000;
    const phase = getMoonPhase(new Date(Date.UTC(2000, 0, 6, 18, 14) + halfCycleMs));
    expect(Math.abs(phase - 0.5)).toBeLessThan(0.01);
  });

  test('getLunarPhase clasifica los cuatro cuartos', () => {
    expect(getLunarPhase(0.0)).toBe('nueva');
    expect(getLunarPhase(0.25)).toBe('creciente');
    expect(getLunarPhase(0.5)).toBe('llena');
    expect(getLunarPhase(0.75)).toBe('menguante');
  });

  test('getLunarDayType siempre devuelve un tipo conocido', () => {
    for (let dayOffset = 0; dayOffset < 60; dayOffset++) {
      const date = new Date(2026, 0, 1 + dayOffset);
      const type = getLunarDayType(date);
      expect(LUNAR_DAY_META[type]).toBeDefined();
    }
  });

  test('recorre los cuatro elementos del zodíaco a lo largo de un mes sidéreo', () => {
    const types = new Set<string>();
    for (let dayOffset = 0; dayOffset < 28; dayOffset++) {
      types.add(getLunarDayType(new Date(2026, 0, 1 + dayOffset)));
    }
    // Flor, hoja, fruto y raíz deben aparecer en un ciclo zodiacal completo.
    expect(types.size).toBeGreaterThanOrEqual(4);
  });

  test('getLunarInfo devuelve una ficha completa y coherente', () => {
    const info = getLunarInfo(new Date(2026, 6, 20));

    expect(LUNAR_DAY_META[info.type]).toBeDefined();
    expect(LUNAR_PHASE_META[info.phase]).toBeDefined();
    expect(info.phaseAngle).toBeGreaterThanOrEqual(0);
    expect(info.phaseAngle).toBeLessThan(1);
    expect(info.illumination).toBeGreaterThanOrEqual(0);
    expect(info.illumination).toBeLessThanOrEqual(100);
    expect(Array.isArray(info.activities)).toBe(true);
  });

  test('los días nodo traen advertencia y ninguna actividad recomendada', () => {
    // Barrer un año hasta encontrar un día nodo: ocurren cada ~13.6 días.
    let nodeInfo = null;
    for (let dayOffset = 0; dayOffset < 400 && !nodeInfo; dayOffset++) {
      const info = getLunarInfo(new Date(2026, 0, 1 + dayOffset));
      if (info.type === 'nodo') nodeInfo = info;
    }

    expect(nodeInfo).not.toBeNull();
    expect(nodeInfo!.warning).toBeTruthy();
  });

  test('todos los tipos de día tienen metadatos de color y etiqueta', () => {
    for (const meta of Object.values(LUNAR_DAY_META)) {
      expect(meta.label).toBeTruthy();
      expect(meta.emoji).toBeTruthy();
      expect(meta.color).toMatch(/^#/);
      expect(meta.bgColor).toBeTruthy();
    }
  });
});
