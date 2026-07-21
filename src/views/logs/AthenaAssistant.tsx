import { Activity } from 'lucide-react';
import type { IrrigationMethod, Lot, NutrientLine } from '../../types/grow';
import { getAthenaRunoffTargets, getCycleWeek } from '../../utils/calculations';
import { Card } from '../../components/ui/Card';

interface AthenaAssistantProps {
  lot: Lot;
  nutrientLine: NutrientLine;
  irrigationMethod: IrrigationMethod;
  /** Valores que el usuario está escribiendo, ya parseados. */
  inputPH?: number;
  inputEC?: number;
  runoffPH?: number;
  runoffEC?: number;
}

interface Diagnosis {
  title: string;
  description: string;
  className: string;
}

const diagnoseEC = (
  runoffEC: number,
  minEC: number,
  maxEC: number,
  method: IrrigationMethod
): Diagnosis => {
  if (runoffEC > maxEC) {
    return {
      title: '⚠️ Acumulación de sales alta',
      description:
        method === 'manual'
          ? 'El drenaje superó el objetivo. Mañana dale un riego manual levemente más abundante para aumentar la escorrentía (lixiviar) y lavar sales.'
          : 'La EC del sustrato está alta. Aumentá el volumen de disparo en P1 para forzar más escorrentía.',
      className: 'border-amber-200 bg-amber-50 text-amber-800',
    };
  }

  if (runoffEC < minEC) {
    return {
      title: '✓ Absorción acelerada',
      description:
        method === 'manual'
          ? 'EC baja en drenaje. Podés regar con un volumen ligeramente menor mañana (menor escorrentía) para acumular sales nutricionales.'
          : 'EC del sustrato baja. Disminuí el volumen del disparo o la escorrentía (apilamiento de sales).',
      className: 'border-blue-100 bg-blue-50/50 text-blue-800',
    };
  }

  return {
    title: 'EC en rango ideal',
    description: 'La acumulación de sales en el sustrato se encuentra estable.',
    className: 'border-emerald-100 bg-emerald-50 text-emerald-800',
  };
};

const diagnosePH = (runoffPH: number, inputPH: number | undefined): Diagnosis => {
  if (inputPH !== undefined && runoffPH < inputPH) {
    return {
      title: '⚠️ Alerta: Raíces ahogadas / Falta de oxígeno',
      description:
        'El pH de escorrentía es inferior al de entrada. Indica encharcamiento prolongado. Dejá secar el medio y no riegues mañana si la maceta sigue pesada.',
      className: 'border-red-200 bg-red-50 text-red-800',
    };
  }

  if (inputPH !== undefined && runoffPH <= inputPH + 0.5) {
    return {
      title: '✓ Metabolismo saludable',
      description:
        'El pH es ligeramente superior al de entrada (+0.1 a +0.4), indicando una transpiración y absorción radicular saludable.',
      className: 'border-emerald-100 bg-emerald-50 text-emerald-800',
    };
  }

  return {
    title: 'pH del drenaje estable',
    description: 'El pH se mantiene en parámetros equilibrados.',
    className: 'border-emerald-100 bg-emerald-50 text-emerald-800',
  };
};

const DiagnosisCard = ({ diagnosis, extra }: { diagnosis: Diagnosis; extra?: string }) => (
  <div className={`p-3 border rounded-xl text-xs font-semibold leading-relaxed ${diagnosis.className}`}>
    <strong className="font-extrabold block text-sm mb-0.5">{diagnosis.title}</strong>
    {diagnosis.description}
    {extra && (
      <span className="block mt-1.5 font-bold text-[10px] uppercase">{extra}</span>
    )}
  </div>
);

/** Guía de riego y diagnóstico en vivo para las líneas Athena. */
export const AthenaAssistant = ({
  lot,
  nutrientLine,
  irrigationMethod,
  inputPH,
  inputEC,
  runoffPH,
  runoffEC,
}: AthenaAssistantProps) => {
  const week = getCycleWeek(lot);
  const targets = getAthenaRunoffTargets(lot.stage, week, nutrientLine);

  const deltaEC =
    inputEC !== undefined && runoffEC !== undefined ? runoffEC - inputEC : undefined;
  const deltaLabel =
    deltaEC !== undefined
      ? `Delta EC (Drenaje - Entrada): ${deltaEC > 0 ? '+' : ''}${deltaEC.toFixed(2)} mS/cm`
      : undefined;

  const isEarlyFlower = lot.stage === 'Floración' && week <= 3;

  return (
    <Card className="p-6 space-y-5 animate-in fade-in duration-200">
      <div className="flex items-center gap-2">
        <span className="p-2 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-600">
          <Activity size={20} />
        </span>
        <div>
          <h3 className="text-base font-bold text-slate-800">Asistente de Riego Athena</h3>
          <p className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">
            Metodología: {irrigationMethod === 'manual' ? 'Riego Manual por Peso' : 'Riego Automático'}
          </p>
        </div>
      </div>

      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs font-semibold text-slate-700 leading-relaxed">
        <span className="text-[10px] uppercase font-extrabold text-slate-500 block tracking-wider">
          Estrategia sugerida para {lot.stage}
        </span>
        {irrigationMethod === 'manual' ? (
          <p>
            💡 <strong>Athena Riego Manual:</strong> Regá una sola vez por la mañana (primeras
            2 horas de encendido) apuntando a un <strong>10% - 25% de escorrentía</strong> para
            barrer sales. Antes de regar, levantá la maceta: si se siente pesada,{' '}
            <u>no riegues</u> para evitar la asfixia radicular.
          </p>
        ) : (
          <p>
            💡 <strong>Athena Riego Automático:</strong> Iniciá fase P1 a las 1-2 horas de
            encender luces. Usá micro-disparos (2-6% de volumen de maceta) cada 15-30 minutos
            hasta lograr drenaje.{' '}
            {isEarlyFlower
              ? 'No uses disparos de mantenimiento (P2) al final del día para permitir un secado nocturno grande (40-50%).'
              : 'Añadí eventos P2 para sostener la humedad.'}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3.5 pt-1">
        <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-center">
          <span className="text-[9px] text-slate-400 uppercase block font-bold tracking-wider mb-0.5">
            Drenaje EC Objetivo
          </span>
          <span className="text-base font-black text-slate-900">
            {targets.minEC.toFixed(1)} - {targets.maxEC.toFixed(1)}{' '}
            <span className="text-xs font-bold text-slate-500">mS/cm</span>
          </span>
        </div>
        <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-center">
          <span className="text-[9px] text-slate-400 uppercase block font-bold tracking-wider mb-0.5">
            Secado diario (Dryback)
          </span>
          <span className="text-base font-black text-slate-900">
            {targets.dryback} <span className="text-xs font-bold text-slate-500">WC</span>
          </span>
        </div>
      </div>

      {(runoffEC !== undefined || runoffPH !== undefined) && (
        <div className="p-4 border border-slate-200 rounded-xl space-y-3.5 animate-in slide-in-from-top duration-150">
          <span className="text-[10px] uppercase font-extrabold text-slate-500 block tracking-wider">
            Diagnóstico en tiempo real
          </span>

          {runoffEC !== undefined && (
            <DiagnosisCard
              diagnosis={diagnoseEC(runoffEC, targets.minEC, targets.maxEC, irrigationMethod)}
              extra={deltaLabel}
            />
          )}

          {runoffPH !== undefined && (
            <DiagnosisCard diagnosis={diagnosePH(runoffPH, inputPH)} />
          )}
        </div>
      )}
    </Card>
  );
};
