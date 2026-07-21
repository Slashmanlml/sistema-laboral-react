import { describe, test, expect } from 'vitest';
import { validateAgentAction, describeAgentAction } from './aiAgent';
import type { Lot, Task } from '../types/grow';
import { todayStr } from './date';

const lots: Lot[] = [
  {
    id: 'lot_1',
    name: 'Cama 1 Arriba',
    strain: 'Moby Dick',
    plant_count: 4,
    stage: 'Floración',
    start_date: '2026-06-01',
    is_archived: false,
  },
];

const tasks: Task[] = [
  {
    id: 'task_1',
    lot_id: 'lot_1',
    title: 'Riego',
    date: '2026-07-05',
    type: 'riego',
    is_completed: false,
  },
];

const context = { lots, tasks };

describe('Validación de acciones propuestas por la IA', () => {
  test('acepta una tarea bien formada', () => {
    const result = validateAgentAction(
      {
        action: 'CREATE_TASK',
        payload: { lot_id: 'lot_1', title: 'Defoliar', due_date: '2026-07-10', type: 'poda' },
      },
      context
    );

    expect('action' in result).toBe(true);
    if ('action' in result && result.action.action === 'CREATE_TASK') {
      expect(result.action.payload.title).toBe('Defoliar');
      expect(result.action.payload.type).toBe('poda');
    }
  });

  test('resuelve el lote por nombre cuando el modelo no manda el id', () => {
    const result = validateAgentAction(
      {
        action: 'CREATE_TASK',
        payload: { lot_name: 'cama 1 arriba', title: 'Podar', due_date: '2026-07-10' },
      },
      context
    );

    expect('action' in result).toBe(true);
    if ('action' in result && result.action.action === 'CREATE_TASK') {
      expect(result.action.payload.lot_id).toBe('lot_1');
    }
  });

  test('rechaza un lote inventado por el modelo', () => {
    const result = validateAgentAction(
      {
        action: 'CREATE_TASK',
        payload: { lot_id: 'lot_inventado', title: 'Podar', due_date: '2026-07-10' },
      },
      context
    );
    expect('error' in result).toBe(true);
  });

  test('rechaza completar una tarea que no existe', () => {
    const result = validateAgentAction(
      { action: 'COMPLETE_TASK', payload: { task_id: 'task_falsa' } },
      context
    );
    expect('error' in result).toBe(true);
  });

  test('acepta completar una tarea existente', () => {
    const result = validateAgentAction(
      { action: 'COMPLETE_TASK', payload: { task_id: 'task_1' } },
      context
    );
    expect('action' in result).toBe(true);
  });

  test('exige temperatura y humedad para registrar un riego', () => {
    const sinClima = validateAgentAction(
      { action: 'ADD_LOG', payload: { lot_id: 'lot_1', ph: 5.8 } },
      context
    );
    expect('error' in sinClima).toBe(true);

    const completo = validateAgentAction(
      { action: 'ADD_LOG', payload: { lot_id: 'lot_1', temp: 24.5, humidity: 60 } },
      context
    );
    expect('action' in completo).toBe(true);
  });

  test('convierte números enviados como texto', () => {
    const result = validateAgentAction(
      { action: 'ADD_LOG', payload: { lot_id: 'lot_1', temp: '24.5', humidity: '60' } },
      context
    );

    expect('action' in result).toBe(true);
    if ('action' in result && result.action.action === 'ADD_LOG') {
      expect(result.action.payload.temp).toBe(24.5);
      expect(result.action.payload.humidity).toBe(60);
    }
  });

  test('cae a la fecha de hoy si la fecha propuesta es inválida', () => {
    const result = validateAgentAction(
      {
        action: 'CREATE_TASK',
        payload: { lot_id: 'lot_1', title: 'Podar', due_date: 'el martes que viene' },
      },
      context
    );

    if ('action' in result && result.action.action === 'CREATE_TASK') {
      expect(result.action.payload.date).toBe(todayStr());
    }
  });

  test('rechaza acciones desconocidas y payloads que no son objetos', () => {
    expect('error' in validateAgentAction({ action: 'DROP_TABLE', payload: {} }, context)).toBe(true);
    expect('error' in validateAgentAction({ action: 'CREATE_TASK' }, context)).toBe(true);
    expect('error' in validateAgentAction('no soy un objeto', context)).toBe(true);
    expect('error' in validateAgentAction(null, context)).toBe(true);
  });

  test('describeAgentAction resuelve el nombre del lote para la confirmación', () => {
    const description = describeAgentAction(
      {
        action: 'CREATE_TASK',
        payload: {
          lot_id: 'lot_1',
          title: 'Defoliar',
          date: '2026-07-10',
          type: 'poda',
        },
      },
      lots
    );

    expect(description).toContain('Cama 1 Arriba');
    expect(description).toContain('Defoliar');
  });
});
