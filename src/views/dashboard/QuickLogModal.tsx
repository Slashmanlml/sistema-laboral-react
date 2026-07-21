import type { FormEvent } from 'react';
import type { Helper, Log, Lot } from '../../types/grow';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { TextField, SelectField, TextAreaField } from '../../components/ui/Field';
import { useLogForm } from '../logs/useLogForm';

interface QuickLogModalProps {
  open: boolean;
  activeLots: Lot[];
  helpers: Helper[];
  onClose: () => void;
  onSubmit: (log: Omit<Log, 'id' | 'date' | 'vpd'>) => void;
}

/** Registro rápido desde el dashboard: los mismos campos, sin foto. */
export const QuickLogModal = ({
  open,
  activeLots,
  helpers,
  onClose,
  onSubmit,
}: QuickLogModalProps) => {
  const { values, setField, reset, normalizeECField, derived, buildLog } = useLogForm();

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const log = buildLog();
    if (!log) return;
    onSubmit(log);
    reset();
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Nuevo Registro Rápido">
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <SelectField
          label="Lote de Cultivo"
          required
          value={values.lotId}
          onChange={event => setField('lotId', event.target.value)}
        >
          <option value="">Selecciona un lote...</option>
          {activeLots.map(lot => (
            <option key={lot.id} value={lot.id}>
              {lot.name}
            </option>
          ))}
        </SelectField>

        <div className="grid grid-cols-2 gap-4">
          <TextField
            label="Temperatura (°C)"
            required
            type="number"
            step="0.1"
            value={values.temp}
            onChange={event => setField('temp', event.target.value)}
            placeholder="Ej: 24"
            warning={derived.warnings.temp}
          />
          <TextField
            label="Humedad (%)"
            required
            type="number"
            value={values.humidity}
            onChange={event => setField('humidity', event.target.value)}
            placeholder="Ej: 55"
            warning={derived.warnings.humidity}
          />
        </div>

        {derived.vpd !== null && derived.vpdInfo && (
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3">
            <span className="text-xs font-bold text-slate-600">
              VPD: <strong className="text-slate-900">{derived.vpd} kPa</strong>
            </span>
            <span
              className={`text-[9px] uppercase font-black px-2 py-0.5 rounded-full ${derived.vpdInfo.statusClass}`}
            >
              {derived.vpdInfo.label}
            </span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <TextField
            label="pH Riego"
            type="number"
            step="0.1"
            value={values.ph}
            onChange={event => setField('ph', event.target.value)}
            placeholder="Ej: 5.8"
            warning={derived.warnings.ph}
          />
          <TextField
            label="EC Riego (mS/cm o µS)"
            type="text"
            inputMode="decimal"
            value={values.ec}
            onChange={event => setField('ec', event.target.value.replace(/[^0-9.]/g, ''))}
            onBlur={() => normalizeECField('ec')}
            placeholder="Ej: 1.2 o 1200"
            warning={derived.warnings.ec}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <TextField
            label="pH Drenaje"
            type="number"
            step="0.1"
            value={values.phRunoff}
            onChange={event => setField('phRunoff', event.target.value)}
            placeholder="Ej: 6.2"
            warning={derived.warnings.phRunoff}
          />
          <TextField
            label="EC Drenaje (mS/cm o µS)"
            type="text"
            inputMode="decimal"
            value={values.ecRunoff}
            onChange={event => setField('ecRunoff', event.target.value.replace(/[^0-9.]/g, ''))}
            onBlur={() => normalizeECField('ecRunoff')}
            placeholder="Ej: 1.8 o 1800"
            warning={derived.warnings.ecRunoff}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <TextField
            label="Agua (L)"
            type="number"
            step="0.1"
            value={values.water}
            onChange={event => setField('water', event.target.value)}
            placeholder="Ej: 5"
          />
          <SelectField
            label="Quién Regó"
            value={values.wateredBy}
            onChange={event => setField('wateredBy', event.target.value)}
          >
            <option value="">Sin especificar</option>
            {helpers.map(helper => (
              <option key={helper.id} value={helper.name}>
                {helper.name}
              </option>
            ))}
          </SelectField>
        </div>

        <TextAreaField
          label="Notas / Observaciones"
          rows={2}
          value={values.notes}
          onChange={event => setField('notes', event.target.value)}
          placeholder="Detalles sobre el riego, control foliar..."
        />

        <div className="flex gap-3 pt-2">
          <Button variant="secondary" fullWidth onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" fullWidth>
            Guardar Registro
          </Button>
        </div>
      </form>
    </Modal>
  );
};
