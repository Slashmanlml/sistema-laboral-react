import { useState, type FormEvent } from 'react';
import { Bot, ShieldAlert } from 'lucide-react';
import { getAiConfig, saveAiConfig, type AiProvider } from '../../utils/aiConfig';
import { Card, SectionHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { SelectField, TextField } from '../../components/ui/Field';

interface AiSettingsPanelProps {
  onSaved: () => void;
}

export const AiSettingsPanel = ({ onSaved }: AiSettingsPanelProps) => {
  // Inicialización perezosa: leer localStorage una sola vez, al montar.
  const [provider, setProvider] = useState<AiProvider>(() => getAiConfig().provider);
  const [apiKey, setApiKey] = useState(() => getAiConfig().apiKey);
  const [model, setModel] = useState(() => getAiConfig().model);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    saveAiConfig({ provider, apiKey, model });
    onSaved();
  };

  return (
    <Card className="p-6">
      <div className="mb-5">
        <SectionHeader icon={<Bot size={22} />} title="Asistente de IA (GrowIA)" />
      </div>

      <p className="text-xs text-slate-500 mb-4 leading-relaxed font-medium">
        Configurá tus credenciales para habilitar el chat de diagnóstico de runoff,
        climatología y registro de labores.
      </p>

      <div className="flex items-start gap-2 p-3 mb-6 bg-amber-50 border border-amber-200 rounded-xl">
        <ShieldAlert size={15} className="text-amber-600 shrink-0 mt-0.5" />
        <p className="text-[11px] text-amber-800 font-semibold leading-relaxed">
          La clave se guarda <strong>solo en este dispositivo</strong>. Ya no se sincroniza
          con tu cuenta: guardarla en la nube la exponía dentro del token de sesión.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <SelectField
          label="Proveedor de IA"
          value={provider}
          onChange={event => {
            setProvider(event.target.value as AiProvider);
            setModel('');
          }}
        >
          <option value="gemini">Google Gemini API (Modelos Flash)</option>
          <option value="openai">OpenAI API (ChatGPT)</option>
        </SelectField>

        <TextField
          label="API Key"
          type="password"
          required
          value={apiKey}
          onChange={event => setApiKey(event.target.value)}
          placeholder={provider === 'gemini' ? 'Ingresá tu clave de Gemini...' : 'sk-proj-...'}
          className="font-mono"
        />

        <TextField
          label="Modelo Personalizado (Opcional)"
          value={model}
          onChange={event => setModel(event.target.value)}
          placeholder={provider === 'gemini' ? 'gemini-2.5-flash' : 'gpt-4o-mini'}
          className="font-mono"
        />

        <Button type="submit" fullWidth>
          Guardar Configuración de IA
        </Button>
      </form>
    </Card>
  );
};
