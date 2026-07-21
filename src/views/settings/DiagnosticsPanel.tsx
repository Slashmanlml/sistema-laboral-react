import { useState } from 'react';
import { Activity, RefreshCw, FileText } from 'lucide-react';

import type { AppError, DbStatus, IrrigationMethod, NutrientLine } from '../../types/grow';
import { downloadFile } from '../../utils/backup';
import { todayStr } from '../../utils/date';
import { useToast } from '../../components/ToastProvider';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

interface Counts {
  lots: number;
  strains: number;
  logs: number;
  tasks: number;
  helpers: number;
}

interface DiagnosticsPanelProps {
  counts: Counts;
  dbStatus: DbStatus;
  dbLatency: number | null;
  appErrors: AppError[];
  activeNutrientLine: NutrientLine;
  irrigationMethod: IrrigationMethod;
  onCheckConnection: () => Promise<void>;
  onCleanOrphans: () => Promise<{ orphanedLogsCount: number; orphanedTasksCount: number }>;
  onClearErrors: () => void;
}

const STATUS_LABELS: Record<DbStatus, string> = {
  connected: 'Conectado a Supabase',
  disconnected: 'Desconectado de la Red',
  auth_error: 'Error de Autenticación (Credenciales)',
  config_error: 'Error de Configuración (faltan variables .env)',
  loading: 'Verificando conexión...',
};

const STATUS_DOT: Record<DbStatus, string> = {
  connected: 'bg-emerald-500 shadow-sm shadow-emerald-500/50',
  disconnected: 'bg-rose-500',
  auth_error: 'bg-amber-500',
  config_error: 'bg-amber-500',
  loading: 'bg-blue-500',
};

export const DiagnosticsPanel = ({
  counts,
  dbStatus,
  dbLatency,
  appErrors,
  activeNutrientLine,
  irrigationMethod,
  onCheckConnection,
  onCleanOrphans,
  onClearErrors,
}: DiagnosticsPanelProps) => {
  const toast = useToast();
  const [checking, setChecking] = useState(false);
  const [cleaning, setCleaning] = useState(false);

  const handleCheckConnection = async () => {
    setChecking(true);
    await onCheckConnection();
    setChecking(false);
  };

  const handleCleanOrphans = async () => {
    setCleaning(true);
    try {
      const result = await onCleanOrphans();
      const total = result.orphanedLogsCount + result.orphanedTasksCount;
      if (total === 0) {
        toast.info('Sin registros huérfanos', 'Todo está correctamente vinculado.');
      } else {
        toast.success(
          'Limpieza completada',
          `Se borraron ${result.orphanedLogsCount} registro(s) y ${result.orphanedTasksCount} tarea(s) sin lote.`
        );
      }
    } catch {
      /* el contexto ya notificó el error */
    } finally {
      setCleaning(false);
    }
  };

  const handleExportReport = () => {
    const report = [
      '=== REPORTE DE DIAGNÓSTICO GROWMANAGER ===',
      `Fecha: ${new Date().toISOString()}`,
      `Plataforma: ${navigator.userAgent}`,
      `Conectividad a Supabase: ${dbStatus}`,
      `Latencia Supabase: ${dbLatency !== null ? `${dbLatency}ms` : 'N/A'}`,
      '',
      '=== PARÁMETROS DE CONFIGURACIÓN ===',
      `Nutrientes Activos: ${activeNutrientLine}`,
      `Método de Riego: ${irrigationMethod}`,
      '',
      '=== MÉTRICAS DE BASE DE DATOS LOCAL ===',
      `Camas (Lots): ${counts.lots}`,
      `Genéticas (Strains): ${counts.strains}`,
      `Registros (Logs): ${counts.logs}`,
      `Tareas (Tasks): ${counts.tasks}`,
      `Ayudantes (Helpers): ${counts.helpers}`,
      '',
      '=== HISTORIAL DE ERRORES CAPTURADOS ===',
      appErrors.length === 0
        ? 'Ninguno.'
        : appErrors
            .map((error, index) =>
              [
                `[${index + 1}] Hora: ${error.timestamp}`,
                `    Contexto: ${error.context}`,
                `    Mensaje: ${error.message}`,
                error.stack
                  ? `    Stack:\n${error.stack
                      .split('\n')
                      .map(line => `        ${line}`)
                      .join('\n')}`
                  : '',
              ]
                .filter(Boolean)
                .join('\n')
            )
            .join('\n---\n'),
    ].join('\n');

    downloadFile(report, `growmanager_diagnostico_${todayStr()}.txt`, 'text/plain;charset=utf-8');
  };

  return (
    <Card className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700">
            <Activity size={22} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">
              Diagnóstico y Depuración del Sistema
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Estado de la base de datos, conexión y registro de errores.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={checking}
            onClick={() => void handleCheckConnection()}
            icon={<RefreshCw size={13} className={checking ? 'animate-spin' : ''} />}
          >
            Probar Conexión
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleExportReport}
            icon={<FileText size={13} />}
            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-100"
          >
            Exportar Reporte
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3.5">
          <span className="text-[10px] font-extrabold uppercase text-slate-400 block tracking-wider">
            Estado de Conexión
          </span>
          <div className="flex items-center gap-2.5">
            <div className={`w-3 h-3 rounded-full animate-pulse ${STATUS_DOT[dbStatus]}`} />
            <span className="text-sm font-bold text-slate-800">{STATUS_LABELS[dbStatus]}</span>
          </div>
          {dbStatus === 'connected' && dbLatency !== null && (
            <p className="text-xs text-slate-500 font-semibold">
              Latencia de respuesta: <strong className="text-slate-700">{dbLatency} ms</strong>
            </p>
          )}
          <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
            La conexión se valida con una consulta directa a las tablas en la nube.
          </p>
        </div>

        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3.5">
          <span className="text-[10px] font-extrabold uppercase text-slate-400 block tracking-wider">
            Registros en Memoria
          </span>
          <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-slate-600">
            <div>
              Camas: <strong className="text-slate-800 font-extrabold">{counts.lots}</strong>
            </div>
            <div>
              Genéticas:{' '}
              <strong className="text-slate-800 font-extrabold">{counts.strains}</strong>
            </div>
            <div>
              Registros: <strong className="text-slate-800 font-extrabold">{counts.logs}</strong>
            </div>
            <div>
              Tareas: <strong className="text-slate-800 font-extrabold">{counts.tasks}</strong>
            </div>
            <div className="col-span-2">
              Ayudantes:{' '}
              <strong className="text-slate-800 font-extrabold">{counts.helpers}</strong>
            </div>
          </div>
          <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
            Los registros diarios se cargan paginados: puede haber más en la nube.
          </p>
        </div>

        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3.5">
          <span className="text-[10px] font-extrabold uppercase text-slate-400 block tracking-wider">
            Integridad de Datos
          </span>
          <Button
            variant="secondary"
            size="sm"
            fullWidth
            disabled={cleaning}
            onClick={() => void handleCleanOrphans()}
          >
            {cleaning ? 'Limpiando...' : 'Corregir Huérfanos'}
          </Button>
          <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
            Busca y remueve registros o tareas vinculados a lotes inexistentes.
          </p>
        </div>
      </div>

      {/* Consola de errores */}
      <div className="mt-6 border border-slate-200 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
          <span className="text-xs font-bold text-slate-700">
            Historial de Errores de la Sesión ({appErrors.length})
          </span>
          {appErrors.length > 0 && (
            <button
              type="button"
              onClick={onClearErrors}
              className="text-[10px] font-bold text-rose-600 hover:text-rose-700 border border-rose-200 px-2 py-0.5 rounded hover:bg-rose-50/50 transition"
            >
              Limpiar Consola
            </button>
          )}
        </div>

        <div className="p-4 bg-white max-h-64 overflow-y-auto font-mono text-xs text-slate-600">
          {appErrors.length > 0 ? (
            <div className="space-y-3">
              {appErrors.map(error => (
                <div
                  key={error.id}
                  className="p-3 bg-rose-50/30 border border-rose-100 rounded-lg space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-bold">
                      {new Date(error.timestamp).toLocaleTimeString()}
                    </span>
                    <span className="text-[10px] uppercase font-extrabold bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded">
                      {error.context}
                    </span>
                  </div>
                  <p className="text-slate-800 font-bold break-all leading-normal">
                    {error.message}
                  </p>
                  {error.stack && (
                    <details className="mt-1">
                      <summary className="text-[9px] text-slate-400 cursor-pointer hover:text-slate-600 font-sans font-bold">
                        Ver Stack Trace Técnico
                      </summary>
                      <pre className="mt-1.5 p-2 bg-slate-900 text-slate-300 rounded overflow-x-auto text-[10px] leading-relaxed break-all whitespace-pre-wrap max-h-36 select-text">
                        {error.stack}
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
    </Card>
  );
};
