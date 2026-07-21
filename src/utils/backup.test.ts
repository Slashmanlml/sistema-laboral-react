import { describe, test, expect } from 'vitest';
import { parseBackup, buildBackup } from './backup';

const validBackup = {
  exportedAt: '2026-07-05T00:00:00.000Z',
  appVersion: '1.0.0',
  strains: [{ id: 's1', name: 'Moby Dick', type: 'Sativa' }],
  lots: [
    {
      id: 'l1',
      name: 'Cama 1',
      strain: 'Moby Dick',
      plant_count: 4,
      stage: 'Vegetativo',
      start_date: '2026-06-01',
      is_archived: false,
    },
  ],
  logs: [
    { id: 'g1', lot_id: 'l1', date: '2026-06-05T10:00:00Z', temp: 24, humidity: 60, vpd: 1.1 },
  ],
  tasks: [
    { id: 't1', lot_id: 'l1', title: 'Riego', date: '2026-06-05', type: 'riego', is_completed: false },
  ],
  helpers: [{ id: 'h1', name: 'Juan' }],
};

describe('Validación de respaldos', () => {
  test('acepta un respaldo bien formado sin descartar filas', () => {
    const { backup, skipped } = parseBackup(validBackup);
    expect(skipped).toBe(0);
    expect(backup.lots).toHaveLength(1);
    expect(backup.logs).toHaveLength(1);
    expect(backup.tasks).toHaveLength(1);
    expect(backup.helpers).toHaveLength(1);
  });

  test('rechaza archivos que no son respaldos', () => {
    expect(() => parseBackup(null)).toThrow();
    expect(() => parseBackup('texto suelto')).toThrow();
    expect(() => parseBackup({ cualquier: 'cosa' })).toThrow();
  });

  test('descarta filas con campos obligatorios faltantes', () => {
    const { backup, skipped } = parseBackup({
      ...validBackup,
      lots: [...validBackup.lots, { id: 'l2' /* sin name ni stage */ }],
    });
    expect(backup.lots).toHaveLength(1);
    expect(skipped).toBe(1);
  });

  test('descarta lotes con una etapa desconocida', () => {
    const { backup } = parseBackup({
      ...validBackup,
      lots: [{ ...validBackup.lots[0], stage: 'Cama 7 (Inventada)' }],
      logs: [],
      tasks: [],
    });
    expect(backup.lots).toHaveLength(0);
  });

  test('descarta registros y tareas cuyo lote no está en el respaldo', () => {
    // Insertarlos violaría la clave foránea contra la tabla lots.
    const { backup, skipped } = parseBackup({
      ...validBackup,
      logs: [...validBackup.logs, { ...validBackup.logs[0], id: 'g2', lot_id: 'inexistente' }],
      tasks: [...validBackup.tasks, { ...validBackup.tasks[0], id: 't2', lot_id: 'inexistente' }],
    });

    expect(backup.logs).toHaveLength(1);
    expect(backup.tasks).toHaveLength(1);
    expect(skipped).toBe(2);
  });

  test('normaliza un tipo de tarea desconocido a "otro"', () => {
    const { backup } = parseBackup({
      ...validBackup,
      tasks: [{ ...validBackup.tasks[0], type: 'hechizo' }],
    });
    expect(backup.tasks[0].type).toBe('otro');
  });

  test('tolera tablas ausentes', () => {
    const { backup } = parseBackup({ lots: validBackup.lots, strains: [] });
    expect(backup.logs).toEqual([]);
    expect(backup.tasks).toEqual([]);
    expect(backup.helpers).toEqual([]);
  });

  test('buildBackup agrega fecha y versión', () => {
    const result = buildBackup({
      strains: [],
      lots: [],
      logs: [],
      tasks: [],
      helpers: [],
    });
    expect(result.exportedAt).toBeTruthy();
    expect(result.appVersion).toBe('1.0.0');
  });
});
