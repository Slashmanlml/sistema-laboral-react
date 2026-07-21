import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { InitialData } from '../api/growApi';
import type { Log, Lot, Task } from '../types/grow';
import { todayStr, addDaysToStr } from '../utils/date';

// Supabase no debe tocarse en los tests.
vi.mock('../lib/supabaseClient', () => ({
  supabase: { auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) } },
  isSupabaseConfigured: true,
}));

const lots: Lot[] = [
  {
    id: 'lot_1',
    name: 'Cama 1 de Flora',
    strain: 'Gelato #33',
    plant_count: 8,
    stage: 'Floración',
    start_date: addDaysToStr(todayStr(), -45),
    is_archived: false,
  },
  {
    id: 'lot_archivado',
    name: 'Cama Vieja',
    strain: 'Moby Dick',
    plant_count: 2,
    stage: 'Curado',
    start_date: addDaysToStr(todayStr(), -200),
    is_archived: true,
  },
];

const logs: Log[] = [
  {
    id: 'log_1',
    lot_id: 'lot_1',
    date: new Date().toISOString(),
    temp: 24.5,
    humidity: 60,
    vpd: 1.23,
    ph: 5.8,
    ec: 1.5,
    water_amount: 10,
    watered_by: 'José',
  },
  {
    id: 'log_2',
    lot_id: 'lot_1',
    date: new Date(Date.now() - 3 * 3600_000).toISOString(),
    temp: 23.0,
    humidity: 58,
    vpd: 1.15,
  },
];

const tasks: Task[] = [
  {
    id: 'task_1',
    lot_id: 'lot_1',
    title: 'Riego con Nutrientes Flora',
    date: todayStr(),
    type: 'fertilizante',
    is_completed: false,
  },
];

const initialData: InitialData = {
  strains: [],
  lots,
  logs,
  tasks,
  helpers: [],
  hasMoreLogs: false,
};

vi.mock('../api/growApi', async () => {
  const actual = await vi.importActual<typeof import('../api/growApi')>('../api/growApi');
  return {
    ...actual,
    fetchInitialData: vi.fn(() => Promise.resolve(initialData)),
    pingDatabase: vi.fn(),
  };
});

// Se importan después de declarar los mocks.
const { GrowProvider } = await import('../context/GrowContext');
const { ToastProvider } = await import('../components/ToastProvider');
const { DashboardView } = await import('./DashboardView');

const renderDashboard = () =>
  render(
    <MemoryRouter>
      <ToastProvider>
        <GrowProvider>
          <DashboardView />
        </GrowProvider>
      </ToastProvider>
    </MemoryRouter>
  );

describe('DashboardView (integración con el contexto)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renderiza el dashboard con los datos cargados', async () => {
    renderDashboard();

    expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
    // El lote activo aparece; el archivado no.
    expect(await screen.findAllByText('Cama 1 de Flora')).not.toHaveLength(0);
    expect(screen.queryByText('Cama Vieja')).toBeNull();
  });

  test('muestra las métricas del último registro', async () => {
    renderDashboard();

    expect(await screen.findByText('24.5 °C')).toBeInTheDocument();
    expect(screen.getByText('60%')).toBeInTheDocument();
    expect(screen.getByText('1.23 kPa')).toBeInTheDocument();
    // Un solo lote activo de los dos cargados.
    expect(screen.getByText('8 plantas en curso')).toBeInTheDocument();
  });

  test('lista las tareas de hoy calculadas en hora local', async () => {
    renderDashboard();

    expect(await screen.findByText('Riego con Nutrientes Flora')).toBeInTheDocument();
    expect(screen.getByText('1 pendientes')).toBeInTheDocument();
  });

  test('muestra las alertas de riego del lote en floración', async () => {
    renderDashboard();

    expect(
      await screen.findByText('Alertas de Riego y Escorrentía de Hoy')
    ).toBeInTheDocument();
  });
});
