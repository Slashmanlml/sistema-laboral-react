import { useMemo, useState } from 'react';
import { Beaker } from 'lucide-react';
import type { IrrigationMethod, Log, Lot, NutrientLine } from '../../types/grow';
import { calculateDaysElapsed, getCycleWeek } from '../../utils/calculations';
import { getSchedule } from '../../utils/schedules';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { ScheduleSalesTab } from './ScheduleSalesTab';
import { ScheduleIrrigationTab } from './ScheduleIrrigationTab';

interface ScheduleModalProps {
  /** El padre monta este componente sólo cuando hay un lote seleccionado. */
  lot: Lot;
  logs: Log[];
  nutrientLine: NutrientLine;
  irrigationMethod: IrrigationMethod;
  onClose: () => void;
}

type Tab = 'sales' | 'irrigation';

/** Acota la semana del cultivo al rango que define el cronograma. */
const clampToSchedule = (week: number, schedule: { week: number }[]): number => {
  if (schedule.length === 0) return 0;
  const first = schedule[0].week;
  const last = schedule[schedule.length - 1].week;
  return Math.min(Math.max(week, first), last);
};

export const ScheduleModal = ({
  lot,
  logs,
  nutrientLine,
  irrigationMethod,
  onClose,
}: ScheduleModalProps) => {
  // El cronograma ahora respeta la línea de nutrientes activa: antes el modal
  // mostraba siempre las recetas Ryanodine aunque estuviera seleccionada Athena.
  const schedule = useMemo(
    () => getSchedule(lot.stage, nutrientLine),
    [lot.stage, nutrientLine]
  );

  const currentWeek = getCycleWeek(lot);

  const [tab, setTab] = useState<Tab>('sales');
  const [activeWeek, setActiveWeek] = useState(() => clampToSchedule(currentWeek, schedule));
  const [tankLiters, setTankLiters] = useState(20);

  const daysElapsed = calculateDaysElapsed(lot.start_date);

  return (
    <Modal
      open
      onClose={onClose}
      size="xl"
      title={
        <span className="flex items-center gap-2.5">
          <Beaker className="text-emerald-600" size={24} />
          Dosificación: {lot.name}
        </span>
      }
      subtitle={`Etapa: ${lot.stage} • Variedad: ${lot.strain} • Día ${daysElapsed} en esta etapa`}
      footer={
        <div className="text-right">
          <Button variant="ghost" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      }
    >
      <div className="flex border-b border-slate-200 px-6 bg-white sticky top-0 z-10">
        {(
          [
            ['sales', 'Dosificación de Sales'],
            ['irrigation', 'Estrategia y Calendario de Riego'],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value)}
            aria-pressed={tab === value}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition ${
              tab === value
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="p-6 space-y-6 bg-slate-50/30">
        {tab === 'sales' ? (
          <ScheduleSalesTab
            schedule={schedule}
            nutrientLine={nutrientLine}
            activeWeek={activeWeek}
            currentWeek={currentWeek}
            onSelectWeek={setActiveWeek}
            tankLiters={tankLiters}
            onTankLitersChange={setTankLiters}
          />
        ) : (
          <ScheduleIrrigationTab
            lot={lot}
            logs={logs}
            nutrientLine={nutrientLine}
            irrigationMethod={irrigationMethod}
          />
        )}
      </div>
    </Modal>
  );
};
