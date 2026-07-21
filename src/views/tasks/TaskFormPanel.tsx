import { useState, type FormEvent } from 'react';
import type { Lot, Task, TaskType } from '../../types/grow';
import { TASK_TYPES } from '../../types/grow';
import { todayStr } from '../../utils/date';
import { Button } from '../../components/ui/Button';
import { TextField, SelectField, TextAreaField } from '../../components/ui/Field';
import { TASK_TYPE_LABELS } from './taskStyles';

interface TaskFormPanelProps {
  activeLots: Lot[];
  initialDate: string;
  onSubmit: (task: Omit<Task, 'id' | 'is_completed'>) => void;
  onCancel: () => void;
}

export const TaskFormPanel = ({
  activeLots,
  initialDate,
  onSubmit,
  onCancel,
}: TaskFormPanelProps) => {
  const [title, setTitle] = useState('');
  const [lotId, setLotId] = useState('');
  const [date, setDate] = useState(initialDate || todayStr());
  const [type, setType] = useState<TaskType>('riego');
  const [notes, setNotes] = useState('');

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim() || !lotId || !date) return;
    onSubmit({
      title: title.trim(),
      lot_id: lotId,
      date,
      type,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-md animate-in slide-in-from-left duration-200">
      <h3 className="text-lg font-bold text-slate-900 mb-5">Crear Nueva Tarea</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <TextField
          label="Título"
          required
          value={title}
          onChange={event => setTitle(event.target.value)}
          placeholder="Ej: Riego con Fertilizante Ryanodine"
        />

        <SelectField
          label="Cama de Cultivo"
          required
          value={lotId}
          onChange={event => setLotId(event.target.value)}
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
            label="Fecha"
            required
            type="date"
            value={date}
            onChange={event => setDate(event.target.value)}
          />
          <SelectField
            label="Tipo"
            value={type}
            onChange={event => setType(event.target.value as TaskType)}
          >
            {TASK_TYPES.map(taskType => (
              <option key={taskType} value={taskType}>
                {TASK_TYPE_LABELS[taskType]}
              </option>
            ))}
          </SelectField>
        </div>

        <TextAreaField
          label="Instrucciones"
          rows={3}
          value={notes}
          onChange={event => setNotes(event.target.value)}
          placeholder="Ej: Diluir 3.8 ml/L de Makro A y Mikro B."
        />

        <div className="flex gap-3 pt-2">
          <Button variant="secondary" fullWidth onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" fullWidth>
            Agregar Tarea
          </Button>
        </div>
      </form>
    </div>
  );
};
