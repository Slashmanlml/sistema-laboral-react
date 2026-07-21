import { useGrow, useGrowActions } from '../context/GrowContext';
import { useToast } from '../components/ToastProvider';
import { StrainsPanel } from './settings/StrainsPanel';
import { HelpersPanel } from './settings/HelpersPanel';
import { NutrientSettingsPanel } from './settings/NutrientSettingsPanel';
import { AiSettingsPanel } from './settings/AiSettingsPanel';
import { BackupPanel } from './settings/BackupPanel';
import { DiagnosticsPanel } from './settings/DiagnosticsPanel';

export const SettingsView = () => {
  const {
    strains,
    lots,
    logs,
    tasks,
    helpers,
    activeNutrientLine,
    irrigationMethod,
    appErrors,
    dbStatus,
    dbLatency,
  } = useGrow();

  const {
    addStrain,
    deleteStrain,
    addHelper,
    deleteHelper,
    clearDatabase,
    loadDemoData,
    importDatabase,
    setActiveNutrientLine,
    setIrrigationMethod,
    clearAppErrors,
    checkDbConnection,
    cleanOrphanedRecords,
  } = useGrowActions();

  const toast = useToast();

  return (
    <div className="space-y-8 max-w-5xl mx-auto text-slate-700">
      <div>
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Ajustes y Parámetros
        </h2>
        <p className="text-slate-500 mt-1 font-medium">
          Configurá tu catálogo de genéticas, ayudantes y copias de seguridad.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        <div className="space-y-8">
          <StrainsPanel
            strains={strains}
            onAdd={strain => void addStrain(strain)}
            onDelete={id => void deleteStrain(id)}
          />

          <HelpersPanel
            helpers={helpers}
            onAdd={name => void addHelper(name)}
            onDelete={id => void deleteHelper(id)}
          />

          <NutrientSettingsPanel
            activeNutrientLine={activeNutrientLine}
            irrigationMethod={irrigationMethod}
            onNutrientLineChange={line => void setActiveNutrientLine(line)}
            onIrrigationMethodChange={setIrrigationMethod}
          />

          <AiSettingsPanel
            onSaved={() =>
              toast.success(
                'Configuración de IA guardada',
                'La clave queda almacenada solo en este dispositivo.'
              )
            }
          />
        </div>

        <BackupPanel
          data={{ strains, lots, logs, tasks, helpers }}
          onImport={importDatabase}
          onClearDatabase={clearDatabase}
          onLoadDemoData={loadDemoData}
        />
      </div>

      <DiagnosticsPanel
        counts={{
          lots: lots.length,
          strains: strains.length,
          logs: logs.length,
          tasks: tasks.length,
          helpers: helpers.length,
        }}
        dbStatus={dbStatus}
        dbLatency={dbLatency}
        appErrors={appErrors}
        activeNutrientLine={activeNutrientLine}
        irrigationMethod={irrigationMethod}
        onCheckConnection={checkDbConnection}
        onCleanOrphans={cleanOrphanedRecords}
        onClearErrors={clearAppErrors}
      />
    </div>
  );
};
