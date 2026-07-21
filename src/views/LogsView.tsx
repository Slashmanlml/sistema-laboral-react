import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { useGrow, useGrowActions } from '../context/GrowContext';
import { supabase } from '../lib/supabaseClient';
import { readQuickLogState } from '../utils/quickLog';
import { useToast } from '../components/ToastProvider';
import { PhotoLightbox } from '../components/ui/PhotoLightbox';
import { LogForm } from './logs/LogForm';
import { LogHistory } from './logs/LogHistory';
import { AthenaAssistant } from './logs/AthenaAssistant';
import { useLogForm } from './logs/useLogForm';

const FALLBACK_USER = 'José';

export const LogsView = () => {
  const { logs, activeLots, lotsById, helpers, activeNutrientLine, irrigationMethod, hasMoreLogs, loadingMoreLogs } =
    useGrow();
  const { addLog, deleteLog, toggleTask, uploadPhoto, loadMoreLogs } = useGrowActions();
  const toast = useToast();
  const location = useLocation();

  // El "Riego Rápido" de la agenda llega por el estado del router, no por
  // sessionStorage: así no queda precargado si el usuario cancela.
  const quickLog = useMemo(() => readQuickLogState(location.state), [location.state]);

  const form = useLogForm(
    quickLog
      ? {
          lotId: quickLog.lotId,
          ph: quickLog.ph ?? '',
          ec: quickLog.ec ?? '',
          notes: 'Riego registrado desde tarea programada.',
        }
      : undefined
  );

  const [currentUser, setCurrentUser] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [activePhotoUrl, setActivePhotoUrl] = useState<string | null>(null);

  const { setField } = form;

  useEffect(() => {
    let cancelled = false;
    void supabase.auth.getUser().then(({ data }) => {
      if (cancelled) return;
      const name = data.user?.email?.split('@')[0] ?? FALLBACK_USER;
      setCurrentUser(name);
      setField('wateredBy', name);
    });
    return () => {
      cancelled = true;
    };
  }, [setField]);

  const selectedLot = form.values.lotId ? lotsById.get(form.values.lotId) : undefined;

  const showAthenaAssistant =
    selectedLot !== undefined &&
    (activeNutrientLine === 'athena_pro' || activeNutrientLine === 'athena_blended');

  const handleSubmit = async (photo: File | null): Promise<boolean> => {
    const logData = form.buildLog();
    if (!logData) {
      toast.warning('Faltan datos', 'Elegí un lote y cargá temperatura y humedad.');
      return false;
    }

    setSubmitting(true);
    try {
      const imageUrl = photo ? await uploadPhoto(photo) : null;
      await addLog({ ...logData, image_url: imageUrl ?? undefined });

      // Si el registro vino de una tarea de la agenda, se marca completada.
      if (quickLog?.taskId) await toggleTask(quickLog.taskId);

      form.reset({ wateredBy: currentUser || FALLBACK_USER });
      toast.success('Registro guardado');
      return true;
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto text-slate-700">
      <div>
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Registro Diario</h2>
        <p className="text-slate-500 mt-1 font-medium">
          Ingresá mediciones del clima, riegos y revisá el historial completo.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 space-y-6">
          <LogForm
            form={form}
            activeLots={activeLots}
            selectedLot={selectedLot}
            helpers={helpers}
            currentUser={currentUser}
            nutrientLine={activeNutrientLine}
            submitting={submitting}
            onSubmit={handleSubmit}
          />

          {showAthenaAssistant && (
            <AthenaAssistant
              lot={selectedLot}
              nutrientLine={activeNutrientLine}
              irrigationMethod={irrigationMethod}
              inputPH={form.derived.inputPH}
              inputEC={form.derived.inputEC}
              runoffPH={form.derived.runoffPH}
              runoffEC={form.derived.runoffEC}
            />
          )}
        </div>

        <div className="lg:col-span-7">
          <LogHistory
            logs={logs}
            lotsById={lotsById}
            hasMoreLogs={hasMoreLogs}
            loadingMoreLogs={loadingMoreLogs}
            onLoadMore={() => void loadMoreLogs()}
            onDelete={id => void deleteLog(id)}
            onViewPhoto={setActivePhotoUrl}
          />
        </div>
      </div>

      <PhotoLightbox url={activePhotoUrl} onClose={() => setActivePhotoUrl(null)} />
    </div>
  );
};
