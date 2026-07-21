import { useState, type FormEvent } from 'react';
import { ArrowRight } from 'lucide-react';
import type { Lot, LotStage } from '../../types/grow';
import { LOT_STAGES } from '../../types/grow';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { TextField, SelectField, TextAreaField } from '../../components/ui/Field';
import { STAGE_META } from './stageMeta';

export interface TransplantData {
  targetStage: LotStage;
  potSize: string;
  plantHeight: string;
  notes: string;
}

interface TransplantModalProps {
  /** El padre monta este componente sólo cuando hay un lote seleccionado. */
  lot: Lot;
  onClose: () => void;
  onConfirm: (data: TransplantData) => void;
}

export const TransplantModal = ({ lot, onClose, onConfirm }: TransplantModalProps) => {
  const suggestedStage = STAGE_META[lot.stage].nextStage;

  const [targetStage, setTargetStage] = useState<LotStage>(suggestedStage);
  const [potSize, setPotSize] = useState(STAGE_META[suggestedStage].potSize);
  const [plantHeight, setPlantHeight] = useState('');
  const [notes, setNotes] = useState('');

  const handleStageChange = (stage: LotStage) => {
    setTargetStage(stage);
    setPotSize(STAGE_META[stage].potSize);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    onConfirm({ targetStage, potSize, plantHeight, notes });
  };

  return (
    <Modal
      open
      onClose={onClose}
      size="sm"
      title="Trasplantar / Cambiar Etapa"
      subtitle={`Lote: ${lot.name} (${lot.plant_count} plantas)`}
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <SelectField
          label="Nueva Etapa"
          required
          value={targetStage}
          onChange={event => handleStageChange(event.target.value as LotStage)}
        >
          {LOT_STAGES.map(stage => (
            <option key={stage} value={stage}>
              {stage}
            </option>
          ))}
        </SelectField>

        <div className="grid grid-cols-2 gap-4">
          <TextField
            label="Volumen Maceta / Envase"
            required
            value={potSize}
            onChange={event => setPotSize(event.target.value)}
            placeholder="Ej: 10 Litros"
          />
          <TextField
            label="Altura Planta (cm)"
            type="number"
            value={plantHeight}
            onChange={event => setPlantHeight(event.target.value)}
            placeholder="Ej: 75"
          />
        </div>

        <TextAreaField
          label="Notas del Trasplante"
          rows={2}
          value={notes}
          onChange={event => setNotes(event.target.value)}
          placeholder="Detalles sobre sustrato, aditivos, etc."
        />

        <p className="text-[11px] text-slate-500 leading-normal bg-emerald-500/5 p-3 rounded-lg border border-emerald-500/10 flex gap-2">
          <ArrowRight size={14} className="text-emerald-600 shrink-0 mt-0.5" />
          <span>
            Al confirmar se actualiza la etapa del lote, se reinicia el contador de días de
            esta fase, se regenera el cronograma de sales y se agrega una entrada a la
            bitácora. Las notas actuales del lote se conservan.
          </span>
        </p>

        <div className="flex gap-3 pt-2">
          <Button variant="secondary" fullWidth onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" fullWidth>
            Confirmar Trasplante
          </Button>
        </div>
      </form>
    </Modal>
  );
};
