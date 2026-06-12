import React, { useState } from 'react';
import { useGrow } from '../context/GrowContext';
import { Dna, Plus, Trash2, Download, Upload, AlertTriangle, Database } from 'lucide-react';

export const SettingsView = () => {
  const { strains, lots, logs, tasks, addStrain, deleteStrain, resetDatabase } = useGrow();

  // Formulario de genética
  const [strainName, setStrainName] = useState('');
  const [strainType, setStrainType] = useState<'Híbrido' | 'Índica' | 'Sativa' | 'CBD'>('Híbrido');

  const handleAddStrain = (e: React.FormEvent) => {
    e.preventDefault();
    if (!strainName) return;
    addStrain({ name: strainName, type: strainType });
    setStrainName('');
    setStrainType('Híbrido');
  };

  const handleExport = () => {
    const data = { strains, lots, logs, tasks };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `growmanager_respaldo_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (imported.strains && imported.lots && imported.logs && imported.tasks) {
          localStorage.setItem('growmanager_react_state', JSON.stringify(imported));
          window.location.reload();
        } else {
          alert('El archivo no posee el formato de respaldo correcto.');
        }
      } catch {
        alert('Error al parsear el archivo JSON.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto select-none">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-white tracking-tight">Ajustes y Parámetros</h2>
        <p className="text-gray-400 mt-1">Configura tu catálogo de genéticas y copias de seguridad.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Gestión de Genéticas */}
        <div className="bg-gray-950 border border-gray-800 rounded-2xl p-6">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="p-2 bg-green-500/10 rounded-xl text-green-400 border border-green-500/20">
              <Dna size={22} />
            </div>
            <h3 className="text-lg font-bold text-white">Mis Genéticas</h3>
          </div>

          <form onSubmit={handleAddStrain} className="flex gap-3 mb-6">
            <input
              type="text"
              value={strainName}
              onChange={(e) => setStrainName(e.target.value)}
              className="flex-1 px-4 py-2 bg-gray-900 border border-gray-800 rounded-xl text-white focus:outline-none focus:border-green-500 text-sm"
              placeholder="Ej: Gorilla Glue #4"
              required
            />
            <select
              value={strainType}
              onChange={(e) => setStrainType(e.target.value as typeof strainType)}
              className="px-3 py-2 bg-gray-900 border border-gray-800 rounded-xl text-white focus:outline-none focus:border-green-500 text-sm"
            >
              <option value="Híbrido">Híbrido</option>
              <option value="Índica">Índica</option>
              <option value="Sativa">Sativa</option>
              <option value="CBD">CBD</option>
            </select>
            <button
              type="submit"
              className="p-2.5 bg-green-500 hover:bg-green-600 text-gray-950 rounded-xl transition duration-200"
            >
              <Plus size={20} />
            </button>
          </form>

          <ul className="space-y-2">
            {strains.length > 0 ? (
              strains.map(s => (
                <li key={s.id} className="flex items-center justify-between px-4 py-3 bg-gray-900/50 border border-gray-800 rounded-xl">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-white">{s.name}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-green-500/10 text-green-400 border border-green-500/20 rounded-full">{s.type}</span>
                  </div>
                  <button
                    onClick={() => deleteStrain(s.id)}
                    className="p-1.5 hover:bg-red-500/10 text-gray-500 hover:text-red-400 rounded-lg border border-transparent hover:border-red-500/10 transition"
                  >
                    <Trash2 size={14} />
                  </button>
                </li>
              ))
            ) : (
              <li className="text-center text-gray-500 text-sm py-6">No hay genéticas registradas.</li>
            )}
          </ul>
        </div>

        {/* Base de Datos y Copias de Seguridad */}
        <div className="bg-gray-950 border border-gray-800 rounded-2xl p-6">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="p-2 bg-blue-500/10 rounded-xl text-blue-400 border border-blue-500/20">
              <Database size={22} />
            </div>
            <h3 className="text-lg font-bold text-white">Base de Datos</h3>
          </div>

          <p className="text-xs text-gray-400 mb-6 leading-relaxed">
            Tus datos se guardan localmente en el navegador. Descarga copias de seguridad periódicamente para evitar pérdidas.
          </p>

          <div className="space-y-4">
            <button
              onClick={handleExport}
              className="w-full flex items-center justify-center gap-2.5 px-5 py-3 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-xl border border-gray-800 transition duration-200"
            >
              <Download size={18} className="text-green-400" />
              Exportar Copia (.json)
            </button>

            <label className="w-full flex items-center justify-center gap-2.5 px-5 py-3 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-xl border border-gray-800 transition duration-200 cursor-pointer">
              <Upload size={18} className="text-blue-400" />
              Importar Copia
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
            </label>
          </div>

          {/* Zona de Peligro */}
          <div className="mt-8 p-4 bg-red-500/5 border border-red-500/20 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={16} className="text-red-400" />
              <h4 className="text-sm font-bold text-red-400">Zona de Peligro</h4>
            </div>
            <p className="text-xs text-gray-400 mb-4">
              Esto borrará toda la información del sistema. Esta acción es irreversible.
            </p>
            <button
              onClick={() => {
                if (window.confirm('¿Estás seguro de querer restablecer el sistema? Se borrarán todos los datos.')) {
                  resetDatabase();
                }
              }}
              className="w-full flex items-center justify-center gap-2.5 px-5 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-semibold rounded-xl border border-red-500/20 transition duration-200"
            >
              <Trash2 size={16} />
              Restaurar de Fábrica
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
