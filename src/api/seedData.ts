// =============================================================================
// Datos de demostración. Se insertan desde Ajustes → "Cargar Datos de Demostración".
// =============================================================================

import type { Log, Lot, Strain, Task } from '../types/grow';
import { calculateVPD } from '../utils/calculations';
import { addDaysToStr, todayStr } from '../utils/date';
import { generateId } from './growApi';

export interface SeedData {
  strains: Strain[];
  lots: Lot[];
  logs: Log[];
  tasks: Task[];
}

export const buildSeedData = (): SeedData => {
  const today = todayStr();

  const strains: Strain[] = [
    { id: generateId('strain'), name: 'Moby Dick', type: 'Sativa' },
    { id: generateId('strain'), name: 'Gorilla Glue #4', type: 'Híbrido' },
    { id: generateId('strain'), name: 'Gelato #33', type: 'Híbrido' },
  ];

  const vegLotId = generateId('lot');
  const flowerLotId = generateId('lot');

  const lots: Lot[] = [
    {
      id: vegLotId,
      name: 'Carpa Vegetativo - Cama 1',
      strain: 'Moby Dick',
      plant_count: 4,
      stage: 'Vegetativo',
      start_date: addDaysToStr(today, -20),
      notes: 'Sustrato Fibra de Coco con perlita. LED 240W.',
      is_archived: false,
    },
    {
      id: flowerLotId,
      name: 'Cama 1 de Flora',
      strain: 'Zaza, Straw, PK, Skittles, DK',
      plant_count: 8,
      stage: 'Floración',
      start_date: addDaysToStr(today, -45),
      notes: 'Fibra de coco pura en camas elevadas. Riego mineral por goteo.',
      is_archived: false,
    },
  ];

  // Ocho mediciones cada 3 horas, con una oscilación suave de clima.
  const logs: Log[] = Array.from({ length: 8 }, (_, index) => {
    const hoursAgo = (7 - index) * 3;
    const timestamp = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);
    const temp = Number.parseFloat((23.5 + Math.sin(hoursAgo) * 1.8).toFixed(1));
    const humidity = Math.round(55 + Math.cos(hoursAgo) * 8);

    return {
      id: generateId('log'),
      lot_id: flowerLotId,
      date: timestamp.toISOString(),
      temp,
      humidity,
      vpd: calculateVPD(temp, humidity),
      ph: 5.8,
      ec: 1.4,
      water_amount: 5,
      notes: 'Riego con sales minerales.',
    };
  });

  const tasks: Task[] = [
    {
      id: generateId('task'),
      lot_id: flowerLotId,
      title: 'Riego con Nutrientes Flora',
      date: today,
      type: 'fertilizante',
      notes: 'Dosis: A: 3.8 ml/L, B: 3.8 ml/L, C: 2.6 ml/L. pH 5.8, EC 1.44.',
      is_completed: false,
    },
    {
      id: generateId('task'),
      lot_id: vegLotId,
      title: 'Aplicación Preventiva foliar',
      date: addDaysToStr(today, -1),
      type: 'preventivo',
      notes: 'Pulverizar al apagarse las luces.',
      is_completed: true,
    },
    {
      id: generateId('task'),
      lot_id: vegLotId,
      title: 'Defoliación de bajos y poda',
      date: addDaysToStr(today, 1),
      type: 'poda',
      notes: 'Quitar brotes débiles de la zona baja.',
      is_completed: false,
    },
  ];

  return { strains, lots, logs, tasks };
};
