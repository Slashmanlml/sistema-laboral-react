import { Dna } from 'lucide-react';
import type { IrrigationMethod, NutrientLine } from '../../types/grow';
import { Card, SectionHeader } from '../../components/ui/Card';
import { SelectField } from '../../components/ui/Field';

interface NutrientSettingsPanelProps {
  activeNutrientLine: NutrientLine;
  irrigationMethod: IrrigationMethod;
  onNutrientLineChange: (line: NutrientLine) => void;
  onIrrigationMethodChange: (method: IrrigationMethod) => void;
}

export const NutrientSettingsPanel = ({
  activeNutrientLine,
  irrigationMethod,
  onNutrientLineChange,
  onIrrigationMethodChange,
}: NutrientSettingsPanelProps) => (
  <Card className="p-6">
    <div className="mb-5">
      <SectionHeader icon={<Dna size={22} />} title="Metodología y Nutrientes" />
    </div>

    <p className="text-xs text-slate-500 mb-6 leading-relaxed font-medium">
      Elegí qué línea de fertilizantes estás usando y tu método de riego. El sistema adapta
      las recetas, dosis, alertas de VPD y el diagnóstico de escorrentía. Cambiar la línea
      regenera los cronogramas de los lotes activos.
    </p>

    <div className="space-y-4">
      <SelectField
        label="Línea de Nutrientes"
        value={activeNutrientLine}
        onChange={event => onNutrientLineChange(event.target.value as NutrientLine)}
      >
        <option value="ryanodine">Sales Ryanodine (Sales Nacionales Coco)</option>
        <option value="athena_pro">Athena Pro Line (Solubles Secos - Gr/10L)</option>
        <option value="athena_blended">Athena Blended Line (Sales Líquidas - mL/10L)</option>
      </SelectField>

      <SelectField
        label="Método de Riego"
        value={irrigationMethod}
        onChange={event => onIrrigationMethodChange(event.target.value as IrrigationMethod)}
      >
        <option value="manual">Riego Manual (Un riego abundante por la mañana + pesaje)</option>
        <option value="automated">Riego Automático (Eventos múltiples P1/P2/P3)</option>
      </SelectField>
    </div>
  </Card>
);
