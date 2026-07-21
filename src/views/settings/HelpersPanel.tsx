import { useState, type FormEvent } from 'react';
import { Users, Plus, Trash2 } from 'lucide-react';
import type { Helper } from '../../types/grow';
import { Card, SectionHeader } from '../../components/ui/Card';

interface HelpersPanelProps {
  helpers: Helper[];
  onAdd: (name: string) => void;
  onDelete: (id: string) => void;
}

export const HelpersPanel = ({ helpers, onAdd, onDelete }: HelpersPanelProps) => {
  const [name, setName] = useState('');

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    onAdd(name.trim());
    setName('');
  };

  return (
    <Card className="p-6">
      <div className="mb-5">
        <SectionHeader icon={<Users size={22} />} title="Cultivadores / Ayudantes" />
      </div>

      <form onSubmit={handleSubmit} className="flex gap-3 mb-6">
        <label htmlFor="helper-name" className="sr-only">
          Nombre del ayudante
        </label>
        <input
          id="helper-name"
          type="text"
          value={name}
          onChange={event => setName(event.target.value)}
          className="flex-1 px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-emerald-500 text-sm shadow-sm"
          placeholder="Nombre del ayudante (Ej: Juan)"
          required
        />
        <button
          type="submit"
          aria-label="Agregar ayudante"
          className="p-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition duration-150 shadow-sm"
        >
          <Plus size={20} />
        </button>
      </form>

      <ul className="space-y-2 max-h-60 overflow-y-auto pr-1">
        {helpers.length > 0 ? (
          helpers.map(helper => (
            <li
              key={helper.id}
              className="flex items-center justify-between px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl"
            >
              <span className="text-sm font-bold text-slate-800">{helper.name}</span>
              <button
                type="button"
                onClick={() => onDelete(helper.id)}
                aria-label={`Borrar ${helper.name}`}
                className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg border border-transparent transition"
              >
                <Trash2 size={14} />
              </button>
            </li>
          ))
        ) : (
          <li className="text-center text-slate-400 text-sm py-6 font-medium">
            Solo estás tú registrado. Añade ayudantes para registrar quién regó.
          </li>
        )}
      </ul>
    </Card>
  );
};
