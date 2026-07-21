import { useState, type FormEvent } from 'react';
import type { Lot, LotStage, Strain } from '../../types/grow';
import { LOT_STAGES } from '../../types/grow';
import { todayStr } from '../../utils/date';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { TextField, SelectField, TextAreaField } from '../../components/ui/Field';

export type LotFormData = Omit<Lot, 'id' | 'is_archived'>;

interface LotFormModalProps {
  /** Lote a editar, o `null` para crear uno nuevo. */
  editingLot: Lot | null;
  strains: Strain[];
  onClose: () => void;
  onSubmit: (data: LotFormData) => void;
}

/**
 * El componente se monta sólo cuando el modal está abierto y el padre le pasa
 * una `key`, así que el estado inicial se calcula una vez y no hace falta un
 * efecto que lo resetee.
 */
export const LotFormModal = ({
  editingLot,
  strains,
  onClose,
  onSubmit,
}: LotFormModalProps) => {
  const [name, setName] = useState(editingLot?.name ?? '');
  const [strain, setStrain] = useState(editingLot?.strain ?? strains[0]?.name ?? '');
  const [plantCount, setPlantCount] = useState(
    editingLot ? String(editingLot.plant_count) : ''
  );
  const [stage, setStage] = useState<LotStage>(editingLot?.stage ?? 'Vegetativo');
  const [startDate, setStartDate] = useState(editingLot?.start_date ?? todayStr);
  const [notes, setNotes] = useState(editingLot?.notes ?? '');

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const count = Number.parseInt(plantCount, 10);
    if (!name.trim() || !strain.trim() || Number.isNaN(count)) return;

    onSubmit({
      name: name.trim(),
      strain: strain.trim(),
      plant_count: count,
      stage,
      start_date: startDate,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={editingLot ? 'Editar Lote de Cultivo' : 'Crear Nuevo Lote'}
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <TextField
          label="Nombre del Lote / Sala"
          required
          value={name}
          onChange={event => setName(event.target.value)}
          placeholder="Ej: Cama 1 - Clones"
        />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <TextField
              label="Genética / Variedad"
              required
              list="strains-datalist"
              value={strain}
              onChange={event => setStrain(event.target.value)}
              placeholder="Ej: Moby Dick"
            />
            <datalist id="strains-datalist">
              {strains.map(item => (
                <option key={item.id} value={item.name} />
              ))}
            </datalist>
          </div>
          <TextField
            label="Cantidad de Plantas"
            required
            type="number"
            min="1"
            value={plantCount}
            onChange={event => setPlantCount(event.target.value)}
            placeholder="Ej: 5"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <SelectField
            label="Etapa de Cultivo"
            value={stage}
            onChange={event => setStage(event.target.value as LotStage)}
          >
            {LOT_STAGES.map(item => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </SelectField>
          <TextField
            label="Fecha de Inicio"
            required
            type="date"
            value={startDate}
            onChange={event => setStartDate(event.target.value)}
          />
        </div>

        <TextAreaField
          label="Notas del Lote"
          rows={3}
          value={notes}
          onChange={event => setNotes(event.target.value)}
          placeholder="Ej: Sustrato coco-perlita, macetas geotextiles."
        />

        <div className="flex gap-3 pt-2">
          <Button variant="secondary" fullWidth onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" fullWidth>
            {editingLot ? 'Guardar Cambios' : 'Crear Lote'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
