import { useState, type FormEvent } from 'react';
import { Dna, Plus, Trash2 } from 'lucide-react';
import type { Strain, StrainType } from '../../types/grow';
import { STRAIN_TYPES } from '../../types/grow';
import { Card, SectionHeader } from '../../components/ui/Card';

interface StrainsPanelProps {
  strains: Strain[];
  onAdd: (strain: Omit<Strain, 'id'>) => void;
  onDelete: (id: string) => void;
}

export const StrainsPanel = ({ strains, onAdd, onDelete }: StrainsPanelProps) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<StrainType>('Híbrido');

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    onAdd({ name: name.trim(), type });
    setName('');
    setType('Híbrido');
  };

  return (
    <Card className="p-6">
      <div className="mb-5">
        <SectionHeader icon={<Dna size={22} />} title="Mis Genéticas" />
      </div>

      <form onSubmit={handleSubmit} className="flex gap-3 mb-6">
        <label htmlFor="strain-name" className="sr-only">
          Nombre de la genética
        </label>
        <input
          id="strain-name"
          type="text"
          value={name}
          onChange={event => setName(event.target.value)}
          className="flex-1 px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-emerald-500 text-sm shadow-sm"
          placeholder="Ej: Gorilla Glue #4"
          required
        />
        <label htmlFor="strain-type" className="sr-only">
          Tipo de genética
        </label>
        <select
          id="strain-type"
          value={type}
          onChange={event => setType(event.target.value as StrainType)}
          className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-emerald-500 text-sm shadow-sm"
        >
          {STRAIN_TYPES.map(strainType => (
            <option key={strainType} value={strainType}>
              {strainType}
            </option>
          ))}
        </select>
        <button
          type="submit"
          aria-label="Agregar genética"
          className="p-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition duration-150 shadow-sm"
        >
          <Plus size={20} />
        </button>
      </form>

      <ul className="space-y-2 max-h-60 overflow-y-auto pr-1">
        {strains.length > 0 ? (
          strains.map(strain => (
            <li
              key={strain.id}
              className="flex items-center justify-between px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl"
            >
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-slate-800">{strain.name}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full">
                  {strain.type}
                </span>
              </div>
              <button
                type="button"
                onClick={() => onDelete(strain.id)}
                aria-label={`Borrar ${strain.name}`}
                className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg border border-transparent transition"
              >
                <Trash2 size={14} />
              </button>
            </li>
          ))
        ) : (
          <li className="text-center text-slate-400 text-sm py-6 font-medium">
            No hay genéticas registradas.
          </li>
        )}
      </ul>
    </Card>
  );
};
