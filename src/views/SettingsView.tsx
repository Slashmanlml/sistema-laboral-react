import React, { useState, useEffect } from 'react';
import { useGrow } from '../context/GrowContext';
import { Dna, Plus, Trash2, Download, Upload, AlertTriangle, Database, Users, Activity, RefreshCw, FileText, Bot } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

export const SettingsView = () => {
  const { 
    strains, lots, logs, tasks, helpers, 
    addStrain, deleteStrain, addHelper, deleteHelper, 
    clearDatabase, loadDemoData, importDatabase,
    activeNutrientLine, setActiveNutrientLine,
    irrigationMethod, setIrrigationMethod,
    appErrors, clearAppErrors,
    dbStatus, dbLatency, checkDbConnection, cleanOrphanedRecords
  } = useGrow();

  // Formulario de genética
  const [strainName, setStrainName] = useState('');
  const [strainType, setStrainType] = useState<'Híbrido' | 'Índica' | 'Sativa' | 'CBD'>('Híbrido');

  // Formulario de ayudante
  const [helperName, setHelperName] = useState('');

  // Estados de Depuración y Diagnóstico
  const [checkingConn, setCheckingConn] = useState(false);
  const [cleanStatus, setCleanStatus] = useState<string | null>(null);

  // Estado del modal de confirmación de vaciado de base de datos
  const [showClearDbModal, setShowClearDbModal] = useState(false);
  const [clearConfirmText, setClearConfirmText] = useState('');

  // Estados de Asistente IA
  const [aiProvider, setAiProvider] = useState<'gemini' | 'openai'>('gemini');
  const [aiApiKey, setAiApiKey] = useState('');
  const [aiModel, setAiModel] = useState('');
  const [aiSavedStatus, setAiSavedStatus] = useState(false);

  useEffect(() => {
    setAiProvider((localStorage.getItem('grow_ai_provider') as 'gemini' | 'openai') || 'gemini');
    setAiApiKey(localStorage.getItem('grow_ai_api_key') || '');
    setAiModel(localStorage.getItem('grow_ai_model') || '');
  }, []);

  const handleSaveAiConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('grow_ai_provider', aiProvider);
    localStorage.setItem('grow_ai_api_key', aiApiKey.trim());
    localStorage.setItem('grow_ai_model', aiModel.trim());
    
    try {
      await supabase.auth.updateUser({
        data: {
          grow_ai_provider: aiProvider,
          grow_ai_api_key: aiApiKey.trim(),
          grow_ai_model: aiModel.trim()
        }
      });
    } catch (err) {
      console.error("Error al sincronizar con Supabase:", err);
    }
    
    setAiSavedStatus(true);
    setTimeout(() => setAiSavedStatus(false), 3000);
    // Notificar al widget si estuviera montado
    window.dispatchEvent(new Event('storage'));
  };

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
    const data = { exportedAt: new Date().toISOString(), appVersion: '1.0.0', strains, lots, logs, tasks, helpers };
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

          {/* Configuración del Cultivo (Metodología Athena) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="p-2.5 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-600">
                <Dna size={22} />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Metodología y Nutrientes</h3>
            </div>

            <p className="text-xs text-slate-500 mb-6 leading-relaxed font-medium">
              Elegí qué línea de fertilizantes estás usando y tu método de riego. El sistema adaptará las recetas, dosis, alertas de VPD y el diagnóstico de escorrentía automáticamente.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Línea de Nutrientes</label>
                <select
                  value={activeNutrientLine}
                  onChange={(e) => setActiveNutrientLine(e.target.value as any)}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-emerald-500 text-sm font-bold shadow-xs cursor-pointer"
                >
                  <option value="ryanodine">Sales Ryanodine (Sales Nacionales Coco)</option>
                  <option value="athena_pro">Athena Pro Line (Solubles Secos - Gr/10L)</option>
                  <option value="athena_blended">Athena Blended Line (Sales Líquidas - mL/10L)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Método de Riego</label>
                <select
                  value={irrigationMethod}
                  onChange={(e) => setIrrigationMethod(e.target.value as any)}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-emerald-500 text-sm font-bold shadow-xs cursor-pointer"
                >
                  <option value="manual">Riego Manual (Un riego abundante por la mañana + pesaje)</option>
                  <option value="automated">Riego Automático (Eventos múltiples P1/P2/P3)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Configuración de Asistente IA */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="p-2.5 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-600">
                <Bot size={22} />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Asistente de IA (GrowIA)</h3>
            </div>

            <p className="text-xs text-slate-500 mb-6 leading-relaxed font-medium">
              Configura tus credenciales para habilitar el chat interactivo de diagnóstico de runoff, climatología y ejecución de tareas.
            </p>

            <form onSubmit={handleSaveAiConfig} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Proveedor de IA</label>
                <select
                  value={aiProvider}
                  onChange={(e) => {
                    const val = e.target.value as 'gemini' | 'openai';
                    setAiProvider(val);
                    setAiModel('');
                  }}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-emerald-500 text-sm font-bold shadow-xs cursor-pointer"
                >
                  <option value="gemini">Google Gemini API (Modelos Flash)</option>
                  <option value="openai">OpenAI API (ChatGPT)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">API Key</label>
                <input
                  type="password"
                  value={aiApiKey}
                  onChange={(e) => setAiApiKey(e.target.value)}
                  placeholder={aiProvider === 'gemini' ? 'Ingresa tu clave de Gemini...' : 'sk-proj-...'}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-850 focus:outline-none focus:border-emerald-500 text-sm font-bold shadow-xs font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Modelo Personalizado (Opcional)</label>
                <input
                  type="text"
                  value={aiModel}
                  onChange={(e) => setAiModel(e.target.value)}
                  placeholder={aiProvider === 'gemini' ? 'gemini-2.5-flash' : 'gpt-4o-mini'}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-805 text-slate-800 focus:outline-none focus:border-emerald-500 text-sm font-bold shadow-xs font-mono"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition duration-150 shadow-sm cursor-pointer text-sm"
                >
                  {aiSavedStatus ? '✓ Configuración Guardada' : 'Guardar Configuración de IA'}
                </button>
              </div>
            </form>
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
                onClick={() => setShowClearDbModal(true)}
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

      {/* Sección de Depuración y Diagnóstico */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700">
              <Activity size={22} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-805 text-slate-800">Diagnóstico y Depuración del Sistema</h3>
              <p className="text-xs text-slate-505 text-slate-500 mt-0.5 font-medium">Analiza el estado de la base de datos, conexión y registro de errores.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={async () => {
                setCheckingConn(true);
                await checkDbConnection();
                setCheckingConn(false);
              }}
              disabled={checkingConn}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-750 font-bold rounded-lg border border-slate-200 transition text-xs disabled:opacity-50"
            >
              <RefreshCw size={13} className={checkingConn ? "animate-spin" : ""} />
              Probar Conexión
            </button>
            <button
              onClick={() => {
                const reportLines = [
                  `=== REPORTE DE DIAGNÓSTICO GROWMANAGER ===`,
                  `Fecha: ${new Date().toISOString()}`,
                  `Plataforma: ${navigator.userAgent}`,
                  `Conectividad a Supabase: ${dbStatus}`,
                  `Latencia Supabase: ${dbLatency !== null ? `${dbLatency}ms` : 'N/A'}`,
                  ``,
                  `=== PARÁMETROS DE CONFIGURACIÓN ===`,
                  `Nutrientes Activos: ${activeNutrientLine}`,
                  `Método de Riego: ${irrigationMethod}`,
                  ``,
                  `=== MÉTRICAS DE BASE DE DATOS LOCAL ===`,
                  `Camas (Lots): ${lots.length}`,
                  `Genéticas (Strains): ${strains.length}`,
                  `Registros (Logs): ${logs.length}`,
                  `Tareas (Tasks): ${tasks.length}`,
                  `Ayudantes (Helpers): ${helpers.length}`,
                  ``,
                  `=== HISTORIAL DE ERRORES CAPTURADOS ===`,
                  appErrors.length === 0 ? `Ninguno.` : appErrors.map((err, i) => (
                    `[${i + 1}] Hora: ${err.timestamp}\n    Contexto: ${err.context}\n    Mensaje: ${err.message}\n${err.stack ? `    Stack:\n${err.stack.split('\n').map(l => '        ' + l).join('\n')}\n` : ''}`
                  )).join('\n---\n')
                ].join('\n');

                const blob = new Blob([reportLines], { type: 'text/plain;charset=utf-8' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `growmanager_diagnostico_${new Date().toISOString().split('T')[0]}.txt`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-lg border border-emerald-100 transition text-xs"
            >
              <FileText size={13} />
              Exportar Reporte
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Tarjeta de Estado de Conexión */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3.5">
            <span className="text-[10px] font-extrabold uppercase text-slate-400 block tracking-wider">Estado de Conexión</span>
            <div className="flex items-center gap-2.5">
              <div className={`w-3 h-3 rounded-full ${
                dbStatus === 'connected' ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50 animate-pulse' :
                dbStatus === 'loading' ? 'bg-blue-500 animate-pulse' : 'bg-rose-500 animate-pulse'
              }`} />
              <span className="text-sm font-bold text-slate-800">
                {dbStatus === 'connected' ? 'Conectado a Supabase' :
                 dbStatus === 'disconnected' ? 'Desconectado de la Red' :
                 dbStatus === 'auth_error' ? 'Error de Autenticación (Credenciales)' :
                 dbStatus === 'config_error' ? 'Error de Configuración (Faltan variables .env)' :
                 'Verificando conexión...'}
              </span>
            </div>
            {dbStatus === 'connected' && dbLatency !== null && (
              <p className="text-xs text-slate-500 font-semibold">
                Latencia de respuesta: <strong className="text-slate-700">{dbLatency} ms</strong>
              </p>
            )}
            <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
              La conexión se valida mediante consultas directas a las tablas en la nube de Supabase.
            </p>
          </div>

          {/* Tarjeta de Resumen de Memoria */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3.5">
            <span className="text-[10px] font-extrabold uppercase text-slate-400 block tracking-wider">Registros en Memoria</span>
            <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-slate-600">
              <div>Camas: <strong className="text-slate-800 font-extrabold">{lots.length}</strong></div>
              <div>Genéticas: <strong className="text-slate-800 font-extrabold">{strains.length}</strong></div>
              <div>Registros: <strong className="text-slate-800 font-extrabold">{logs.length}</strong></div>
              <div>Tareas: <strong className="text-slate-800 font-extrabold">{tasks.length}</strong></div>
              <div className="col-span-2">Ayudantes: <strong className="text-slate-800 font-extrabold">{helpers.length}</strong></div>
            </div>
            <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
              Métricas correspondientes a la información local sincronizada actualmente.
            </p>
          </div>

          {/* Tarjeta de Herramientas de Integridad */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3.5">
            <span className="text-[10px] font-extrabold uppercase text-slate-400 block tracking-wider">Integridad de Datos</span>
            <button
              onClick={async () => {
                try {
                  const res = await cleanOrphanedRecords();
                  setCleanStatus(`Limpieza exitosa. Se borraron ${res.orphanedLogsCount} logs y ${res.orphanedTasksCount} tareas huérfanas.`);
                  setTimeout(() => setCleanStatus(null), 5000);
                } catch (err) {
                  alert("Error al ejecutar limpieza.");
                }
              }}
              className="w-full flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg border border-slate-350 transition text-xs shadow-xs cursor-pointer"
            >
              Corregir Huérfanos
            </button>
            {cleanStatus && (
              <p className="text-[11px] text-emerald-600 font-bold text-center leading-normal">
                {cleanStatus}
              </p>
            )}
            <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
              Busca y remueve registros o tareas vinculados a lotes inexistentes (eliminados).
            </p>
          </div>
        </div>

        {/* Consola de Errores */}
        <div className="mt-6 border border-slate-200 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
            <span className="text-xs font-bold text-slate-700">Historial de Errores de la Sesión ({appErrors.length})</span>
            {appErrors.length > 0 && (
              <button
                onClick={clearAppErrors}
                className="text-[10px] font-bold text-rose-600 hover:text-rose-700 border border-rose-200 px-2 py-0.5 rounded hover:bg-rose-50/50 transition cursor-pointer"
              >
                Limpiar Consola
              </button>
            )}
          </div>
          
          <div className="p-4 bg-white max-h-64 overflow-y-auto font-mono text-xs text-slate-600">
            {appErrors.length > 0 ? (
              <div className="space-y-3">
                {appErrors.map((err) => (
                  <div key={err.id} className="p-3 bg-rose-50/30 border border-rose-100/70 rounded-lg space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 font-bold">{new Date(err.timestamp).toLocaleTimeString()}</span>
                      <span className="text-[10px] uppercase font-extrabold bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded">{err.context}</span>
                    </div>
                    <p className="text-slate-800 font-bold break-all leading-normal">{err.message}</p>
                    {err.stack && (
                      <details className="mt-1 cursor-pointer">
                        <summary className="text-[9px] text-slate-400 select-none hover:text-slate-600 font-sans font-bold">Ver Stack Trace Técnico</summary>
                        <pre className="mt-1.5 p-2 bg-slate-900 text-slate-300 rounded overflow-x-auto text-[10px] leading-relaxed break-all font-mono select-text whitespace-pre-wrap max-h-36">
                          {err.stack}
                        </pre>
                      </details>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-slate-400 font-semibold font-sans">
                ✓ No se registraron errores en la sesión actual.
              </div>
            )}
          </div>
        </div>
      </div>

      {showClearDbModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full animate-scale-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-red-100 rounded-xl">
                <AlertTriangle size={22} className="text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Confirmar vaciado de base de datos</h3>
            </div>
            <p className="text-sm text-slate-600 mb-2">Esta acción es <strong>irreversible</strong>. Se eliminarán todos los lotes, registros, tareas y genéticas.</p>
            <p className="text-sm text-slate-600 mb-4">Escribí <strong>CONFIRMAR</strong> para continuar:</p>
            <input
              type="text"
              value={clearConfirmText}
              onChange={(e) => setClearConfirmText(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-red-400 mb-4 text-sm"
              placeholder="Escribí CONFIRMAR"
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setShowClearDbModal(false); setClearConfirmText(''); }}
                className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (clearConfirmText === 'CONFIRMAR') {
                    clearDatabase();
                    setShowClearDbModal(false);
                    setClearConfirmText('');
                  }
                }}
                disabled={clearConfirmText !== 'CONFIRMAR'}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white font-bold rounded-xl transition"
              >
                Sí, vaciar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
