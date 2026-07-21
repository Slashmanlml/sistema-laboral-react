import { describe, test, expect } from 'vitest';
import {
  parseEC,
  willConvertFromMicrosiemens,
  parseOptionalNumber,
  showOptional,
} from './format';

describe('Parseo de conductividad eléctrica', () => {
  test('deja los valores en mS/cm tal como se escribieron', () => {
    expect(parseEC('1.4')).toBe(1.4);
    expect(parseEC('0.55')).toBe(0.55);
  });

  test('convierte microsiemens a mS/cm', () => {
    expect(parseEC('1400')).toBe(1.4);
    expect(parseEC('550')).toBe(0.55);
  });

  test('NO corrompe lecturas altas legítimas de drenaje', () => {
    // Athena Pro apunta hasta 7.0 mS/cm y un sustrato salinizado supera los 10.
    // Con el umbral viejo (>= 10) estos valores se guardaban divididos por mil.
    expect(parseEC('7')).toBe(7);
    expect(parseEC('12.5')).toBe(12.5);
    expect(parseEC('99')).toBe(99);
  });

  test('devuelve undefined para entradas vacías o no numéricas', () => {
    expect(parseEC('')).toBeUndefined();
    expect(parseEC('   ')).toBeUndefined();
    expect(parseEC('abc')).toBeUndefined();
  });

  test('willConvertFromMicrosiemens avisa sólo cuando va a dividir', () => {
    expect(willConvertFromMicrosiemens('1400')).toBe(true);
    expect(willConvertFromMicrosiemens('1.4')).toBe(false);
    expect(willConvertFromMicrosiemens('12')).toBe(false);
    expect(willConvertFromMicrosiemens('')).toBe(false);
  });
});

describe('Helpers de formato', () => {
  test('parseOptionalNumber distingue vacío de cero', () => {
    expect(parseOptionalNumber('0')).toBe(0);
    expect(parseOptionalNumber('')).toBeUndefined();
    expect(parseOptionalNumber('5.5')).toBe(5.5);
  });

  test('showOptional muestra un guion cuando no hay dato', () => {
    expect(showOptional(undefined)).toBe('-.-');
    expect(showOptional(null)).toBe('-.-');
    expect(showOptional(5.84, 2)).toBe('5.84');
    expect(showOptional(0)).toBe('0.0');
  });
});
