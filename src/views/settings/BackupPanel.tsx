import { useRef, useState, type ChangeEvent } from 'react';
import { Database, Download, Upload, AlertTriangle, Trash2, Plus } from 'lucide-react';

import type { BackupFile } from '../../types/grow';
import { buildBackup, downloadFile, parseBackup } from '../../utils/backup';
import { todayStr } from '../../utils/date';
import { useToast } from '../../components/ToastProvider';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';

interface BackupPanelProps {
  data: Omit<BackupFile, 'exportedAt' | 'appVersion'>;
  onImport: (backup: BackupFile) => Promise<void>;
  onClearDatabase: () => Promise<void>;
  onLoadDemoData: () => Promise<void>;
}

const CONFIRM_WORD = 'CONFIRMAR';

export const BackupPanel = ({
  data,
  onImport,
  onClearDatabase,
  onLoadDemoData,
}: BackupPanelProps) => {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [pendingImport, setPendingImport] = useState<BackupFile | null>(null);
  const [showClearModal, setShowClearModal] = useState(false);
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const handleExport = () => {
    downloadFile(
      JSON.stringify(buildBackup(data), null, 2),
      `growmanager_respaldo_${todayStr()}.json`,
      'application/json'
    );
    toast.success('Respaldo descargado');
  };

  const handleFileSelected = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // Permite volver a elegir el mismo archivo después de cancelar.
    event.target.value = '';
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const { backup, skipped } = parseBackup(JSON.parse(String(reader.result)));
        if (skipped > 0) {
          toast.warning(
            'Se descartaron filas inválidas',
            `${skipped} registro(s) del archivo no cumplen el formato y no se van a importar.`
          );
        }
        setPendingImport(backup);
      } catch (error) {
        toast.error(
          'Archivo inválido',
          error instanceof Error ? error.message : 'No se pudo leer el respaldo.'
        );
      }
    };
    reader.onerror = () => toast.error('No se pudo leer el archivo');
    reader.readAsText(file);
  };

  const confirmImport = async () => {
    if (!pendingImport) return;
    const backup = pendingImport;
    setPendingImport(null);
    try {
      await onImport(backup);
    } catch {
      /* el contexto ya avisó del error */
    }
  };

  return (
    <>
      <Card className="p-6">
        <div className="flex items-center gap-2.5 mb-5">
          <div className="p-2.5 bg-blue-50 border border-blue-100 rounded-xl text-blue-600">
            <Database size={22} />
          </div>
          <h3 className="text-lg font-bold text-slate-800">Base de Datos</h3>
        </div>

        <p className="text-xs text-slate-500 mb-6 leading-relaxed font-medium">
          Tus datos se guardan de forma privada en tu cuenta de Supabase. Descargá copias de
          seguridad periódicamente.
        </p>

        <div className="space-y-4">
          <Button
            variant="ghost"
            fullWidth
            icon={<Download size={18} className="text-emerald-600" />}
            onClick={handleExport}
            className="py-3"
          >
            Exportar Copia (.json)
          </Button>

          <Button
            variant="ghost"
            fullWidth
            icon={<Upload size={18} className="text-blue-600" />}
            onClick={() => fileInputRef.current?.click()}
            className="py-3"
          >
            Importar Copia
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFileSelected}
            className="hidden"
            aria-hidden="true"
            tabIndex={-1}
          />
        </div>

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
            <Button
              variant="ghost"
              fullWidth
              size="sm"
              icon={<Trash2 size={16} />}
              onClick={() => setShowClearModal(true)}
              className="py-2.5 bg-red-50 hover:bg-red-100/70 text-red-600 border-red-200"
            >
              Vaciar Base de Datos (Comenzar Limpio)
            </Button>

            <Button
              variant="secondary"
              fullWidth
              size="sm"
              icon={<Plus size={16} className="text-slate-500" />}
              onClick={() => setShowDemoModal(true)}
              className="py-2.5"
            >
              Cargar Datos de Demostración
            </Button>
          </div>
        </div>
      </Card>

      {/* Confirmación de importación */}
      <Modal
        open={pendingImport !== null}
        onClose={() => setPendingImport(null)}
        title="Confirmar importación"
        size="sm"
        footer={
          <div className="flex gap-3">
            <Button variant="secondary" fullWidth onClick={() => setPendingImport(null)}>
              Cancelar
            </Button>
            <Button variant="danger" fullWidth onClick={() => void confirmImport()}>
              Importar y sobrescribir
            </Button>
          </div>
        }
      >
        <div className="p-6 space-y-3 text-sm text-slate-600 font-medium">
          <p>
            Se va a <strong>borrar toda la base actual</strong> y reemplazarla por el
            contenido del respaldo:
          </p>
          {pendingImport && (
            <ul className="text-xs bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-1 font-semibold">
              <li>Genéticas: {pendingImport.strains.length}</li>
              <li>Lotes: {pendingImport.lots.length}</li>
              <li>Registros: {pendingImport.logs.length}</li>
              <li>Tareas: {pendingImport.tasks.length}</li>
              <li>Ayudantes: {pendingImport.helpers?.length ?? 0}</li>
            </ul>
          )}
          <p className="text-xs text-red-600 font-bold">Esta acción es irreversible.</p>
        </div>
      </Modal>

      {/* Confirmación de vaciado */}
      <Modal
        open={showClearModal}
        onClose={() => {
          setShowClearModal(false);
          setConfirmText('');
        }}
        title="Confirmar vaciado de base de datos"
        size="sm"
        footer={
          <div className="flex gap-3">
            <Button
              variant="secondary"
              fullWidth
              onClick={() => {
                setShowClearModal(false);
                setConfirmText('');
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              fullWidth
              disabled={confirmText !== CONFIRM_WORD}
              onClick={() => {
                void onClearDatabase();
                setShowClearModal(false);
                setConfirmText('');
              }}
            >
              Sí, vaciar
            </Button>
          </div>
        }
      >
        <div className="p-6 space-y-3">
          <p className="text-sm text-slate-600 font-medium">
            Esta acción es <strong>irreversible</strong>. Se eliminarán todos los lotes,
            registros, tareas y genéticas.
          </p>
          <label htmlFor="clear-confirm" className="block text-sm text-slate-600 font-medium">
            Escribí <strong>{CONFIRM_WORD}</strong> para continuar:
          </label>
          <input
            id="clear-confirm"
            type="text"
            value={confirmText}
            onChange={event => setConfirmText(event.target.value)}
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-red-400 text-sm"
            placeholder={`Escribí ${CONFIRM_WORD}`}
          />
        </div>
      </Modal>

      {/* Confirmación de datos de demostración */}
      <Modal
        open={showDemoModal}
        onClose={() => setShowDemoModal(false)}
        title="Cargar datos de demostración"
        size="sm"
        footer={
          <div className="flex gap-3">
            <Button variant="secondary" fullWidth onClick={() => setShowDemoModal(false)}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              fullWidth
              onClick={() => {
                void onLoadDemoData();
                setShowDemoModal(false);
              }}
            >
              Cargar demo
            </Button>
          </div>
        }
      >
        <p className="p-6 text-sm text-slate-600 font-medium leading-relaxed">
          Se van a cargar lotes, registros y tareas simulados.{' '}
          <strong>Esto reemplaza los datos actuales.</strong> Si tenés información real,
          exportá un respaldo antes.
        </p>
      </Modal>
    </>
  );
};
