import React, { useState } from 'react';
import { useGrow } from '../context/GrowContext';
import { Dna, Plus, Trash2, Download, Upload, AlertTriangle, Database, Users } from 'lucide-react';

export const SettingsView = () => {
  const { strains, lots, logs, tasks, helpers, addStrain, deleteStrain, addHelper, deleteHelper, clearDatabase, loadDemoData, importDatabase } = useGrow();

  // Formulario de genética
  const [strainName, setStrainName] = useState('');
  const [strainType, setStrainType] = useState<'Híbrido' | 'Índica' | 'Sativa' | 'CBD'>('Híbrido');

  // Formulario de ayudante
  const [helperName, setHelperName] = useState('');

  const handleAddStrain = (e: React.FormEvent) => {
    e.preventDefault();
    if (!strainName) return;
    addStrain({ name: strainName, type: strainType });
    setStrainName('');
    setStrainType('Híbrido');
  };

  const handleAddHelper = (e: React.FormEvent) => {
    e.preventDefault();
    if (!helperName.trim()) return;
    addHelper(helperName.trim());
    setHelperName('');
  };

  const handleExport = () => {
    const data = { strains, lots, logs, tasks, helpers };
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
    reader.onload = async (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (imported.strains && imported.lots && imported.logs && imported.tasks) {
          if (confirm('¿Estás seguro de que deseas importar este respaldo? Se sobrescribirá la base de datos actual.')) {
            await importDatabase(imported);
            alert('Importación completada con éxito.');
          }
        } else {
          alert('El archivo no posee el formato de respaldo correcto.');
        }
      } catch (err) {
        alert('Error al importar el archivo JSON.');
        console.error(err);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto select-none text-slate-700">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Ajustes y Parámetros</h2>
        <p className="text-slate-500 mt-1 font-medium">Configura tu catálogo de genéticas, ayudantes y copias de seguridad.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Columna Izquierda: Genéticas y Ayudantes */}
        <div className="space-y-8">
          {/* Gestión de Genéticas */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="p-2.5 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-600">
                <Dna size={22} />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Mis Genéticas</h3>
            </div>

            <form onSubmit={handleAddStrain} className="flex gap-3 mb-6">
              <input
                type="text"
                value={strainName}
                onChange={(e) => setStrainName(e.target.value)}
                className="flex-1 px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-emerald-500 text-sm shadow-sm"
                placeholder="Ej: Gorilla Glue #4"
                required
              />
              <select
                value={strainType}
                onChange={(e) => setStrainType(e.target.value as typeof strainType)}
                className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-emerald-500 text-sm shadow-sm"
              >
                <option value="Híbrido">Híbrido</option>
                <option value="Índica">Índica</option>
                <option value="Sativa">Sativa</option>
                <option value="CBD">CBD</option>
              </select>
              <button
                type="submit"
                className="p-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition duration-150 shadow-sm"
              >
                <Plus size={20} />
              </button>
            </form>

            <ul className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {strains.length > 0 ? (
                strains.map(s => (
                  <li key={s.id} className="flex items-center justify-between px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-slate-800">{s.name}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full">{s.type}</span>
                    </div>
                    <button
                      onClick={() => deleteStrain(s.id)}
                      className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg border border-transparent transition"
                    >
                      <Trash2 size={14} />
                    </button>
                  </li>
                ))
              ) : (
                <li className="text-center text-slate-400 text-sm py-6 font-medium">No hay genéticas registradas.</li>
              )}
            </ul>
          </div>

          {/* Gestión de Ayudantes / Cultivadores */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="p-2.5 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-600">
                <Users size={22} />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Cultivadores / Ayudantes</h3>
            </div>

            <form onSubmit={handleAddHelper} className="flex gap-3 mb-6">
              <input
                type="text"
                value={helperName}
                onChange={(e) => setHelperName(e.target.value)}
                className="flex-1 px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-emerald-500 text-sm shadow-sm"
                placeholder="Nombre del ayudante (Ej: Juan)"
                required
              />
              <button
                type="submit"
                className="p-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition duration-150 shadow-sm"
              >
                <Plus size={20} />
              </button>
            </form>

            <ul className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {helpers && helpers.length > 0 ? (
                helpers.map(h => (
                  <li key={h.id} className="flex items-center justify-between px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <span className="text-sm font-bold text-slate-800">{h.name}</span>
                    <button
                      onClick={() => deleteHelper(h.id)}
                      className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg border border-transparent transition"
                    >
                      <Trash2 size={14} />
                    </button>
                  </li>
                ))
              ) : (
                <li className="text-center text-slate-400 text-sm py-6 font-medium">Solo estás tú registrado. Añade ayudantes para registrar quién regó.</li>
              )}
            </ul>
          </div>
        </div>

        {/* Columna Derecha: Base de Datos y Copias de Seguridad */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="p-2.5 bg-blue-50 border border-blue-100 rounded-xl text-blue-600">
              <Database size={22} />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Base de Datos</h3>
          </div>

          <p className="text-xs text-slate-500 mb-6 leading-relaxed font-medium">
            Tus datos se guardan de forma privada y segura en tu cuenta de Supabase. Descarga copias de seguridad periódicamente para tu tranquilidad.
          </p>

          <div className="space-y-4">
            <button
              onClick={handleExport}
              className="w-full flex items-center justify-center gap-2.5 px-5 py-3 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold rounded-xl border border-slate-200 transition duration-150 shadow-sm"
            >
              <Download size={18} className="text-emerald-600" />
              Exportar Copia (.json)
            </button>

            <label className="w-full flex items-center justify-center gap-2.5 px-5 py-3 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold rounded-xl border border-slate-200 transition duration-150 cursor-pointer shadow-sm">
              <Upload size={18} className="text-blue-600" />
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
          <div className="mt-8 p-4 bg-red-50 border border-red-200 rounded-xl space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={16} className="text-red-600" />
                <h4 className="text-sm font-bold text-red-600">Zona de Peligro</h4>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Estas acciones alteran los datos en la nube de Supabase para tu cuenta.
              </p>
            </div>
            <div className="space-y-2">
              <button
                onClick={() => {
                  if (window.confirm('¿Estás seguro de querer vaciar el sistema? Se eliminarán todas las camas, registros diarios y tareas para que puedas cargar tus datos reales.')) {
                    clearDatabase();
                  }
                }}
                className="w-full flex items-center justify-center gap-2.5 px-5 py-2.5 bg-red-50 hover:bg-red-100/70 text-red-600 font-bold rounded-xl border border-red-200 transition duration-150"
              >
                <Trash2 size={16} />
                Vaciar Base de Datos (Comenzar Limpio)
              </button>

              <button
                onClick={() => {
                  if (window.confirm('¿Deseas cargar los lotes, registros y tareas de demostración simulados?')) {
                    loadDemoData();
                  }
                }}
                className="w-full flex items-center justify-center gap-2.5 px-5 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold rounded-xl border border-slate-200 transition duration-150"
              >
                <Plus size={16} className="text-slate-500" />
                Cargar Datos de Demostración (Simulación)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
