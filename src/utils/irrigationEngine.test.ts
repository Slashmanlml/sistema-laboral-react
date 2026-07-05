import { describe, test, expect } from 'vitest';
import type { Lot, Log } from '../types/grow';
import { 
  getWeeklyIrrigationSchedule, 
  checkWateringStatus, 
  analyzeRunoffAndStrategy 
} from './irrigationEngine';

describe('Motor Científico de Riego y Runoff', () => {
  const dummyLot: Lot = {
    id: 'test_lot_1',
    name: 'Cama Test',
    strain: 'Moby Dick',
    plant_count: 5,
    stage: 'Vegetativo',
    start_date: '2026-07-01',
    is_archived: false
  };

  const dummyLogs: Log[] = [
    {
      id: 'log_1',
      lot_id: 'test_lot_1',
      date: '2026-07-05T10:00:00.000Z',
      temp: 24,
      humidity: 60,
      vpd: 1.1,
      ph: 5.8,
      ec: 1.5,
      ph_runoff: 5.9,
      ec_runoff: 3.5,
      water_amount: 10
    }
  ];

  test('checkWateringStatus debe validar si hubo riego un día', () => {
    // El log_1 es del día 2026-07-05
    const watered = checkWateringStatus('test_lot_1', dummyLogs, '2026-07-05');
    expect(watered).toBe(true);

    const notWatered = checkWateringStatus('test_lot_1', dummyLogs, '2026-07-06');
    expect(notWatered).toBe(false);
  });

  test('getWeeklyIrrigationSchedule debe generar Lunes a Domingo con targets correctos', () => {
    const referenceDate = new Date('2026-07-05T12:00:00'); // Un Domingo
    const schedule = getWeeklyIrrigationSchedule(dummyLot, referenceDate, 'athena_pro', 'manual', dummyLogs);

    expect(schedule.length).toBe(7);
    expect(schedule[0].dayName).toBe('Lunes');
    expect(schedule[6].dayName).toBe('Domingo');

    // Debe contener el día 2026-07-05 completado como true (porque checkWateringStatus da true para ese día)
    const sundayItem = schedule.find(d => d.date === '2026-07-05');
    expect(sundayItem).toBeDefined();
    expect(sundayItem?.isCompleted).toBe(true);
  });

  test('analyzeRunoffAndStrategy debe diagnosticar desvíos de EC o pH', () => {
    // Simular acumulación severa de sales (EC de drenaje alta)
    const logsHighEC: Log[] = [
      {
        id: 'log_high_ec',
        lot_id: 'test_lot_1',
        date: '2026-07-05T10:00:00Z',
        temp: 24,
        humidity: 60,
        vpd: 1.1,
        ph: 6.0,
        ec: 3.0,
        ph_runoff: 6.2,
        ec_runoff: 6.5 // El target máximo para Veg Athena Pro es 5.0 (ver getAthenaRunoffTargets)
      }
    ];

    const result = analyzeRunoffAndStrategy(dummyLot, logsHighEC, 'athena_pro');
    expect(result.status).toBe('warning');
    expect(result.alerts[0]).toContain('Acumulación de sales alta');
    expect(result.suggestedCorrection).toContain('aumentá el volumen de agua');
  });

  test('analyzeRunoffAndStrategy debe detectar asfixia radicular por caída de pH', () => {
    const logsAcid: Log[] = [
      {
        id: 'log_acid',
        lot_id: 'test_lot_1',
        date: '2026-07-05T10:00:00Z',
        temp: 24,
        humidity: 60,
        vpd: 1.1,
        ph: 6.0, // Entrada 6.0
        ec: 3.0,
        ph_runoff: 5.6, // Salida 5.6 (ácido, menor a Entrada - 0.2)
        ec_runoff: 4.5
      }
    ];

    const result = analyzeRunoffAndStrategy(dummyLot, logsAcid, 'athena_pro');
    expect(result.status).toBe('critical');
    expect(result.alerts[0]).toContain('asfixia radicular');
    expect(result.suggestedCorrection).toContain('Incrementá el tiempo de secado');
  });
});
