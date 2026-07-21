import { useMemo } from 'react';
import { getLunarInfo, LUNAR_DAY_META, LUNAR_PHASE_META } from '../../utils/lunar';

/** Recomendación lunar del día en la cabecera del dashboard. */
export const LunarWidget = () => {
  const info = useMemo(() => getLunarInfo(new Date()), []);
  const meta = LUNAR_DAY_META[info.type];
  const phase = LUNAR_PHASE_META[info.phase];

  return (
    <div
      className="p-5 border rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition animate-in fade-in duration-200"
      style={{ backgroundColor: meta.bgColor, borderColor: meta.borderColor }}
    >
      <div className="flex items-start gap-4">
        <span className="text-4xl leading-none mt-1 shrink-0" aria-hidden="true">
          {meta.emoji}
        </span>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded border border-white/50"
              style={{ backgroundColor: `${meta.color}15`, color: meta.textColor }}
            >
              {meta.label}
            </span>
            <span className="text-xs text-slate-500 font-bold flex items-center gap-1">
              Fase:{' '}
              <strong className="text-slate-800 flex items-center gap-0.5">
                {phase.emoji} {phase.label}
              </strong>
            </span>
          </div>

          <h3 className="text-base font-extrabold text-slate-900 mt-1.5">
            Recomendación Lunar de Hoy
          </h3>

          {info.warning ? (
            <p className="text-xs font-bold text-red-600 mt-1">⚠️ {info.warning}</p>
          ) : (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {info.activities.map(activity => (
                <span
                  key={activity}
                  className="text-xs font-bold bg-white/80 border border-slate-100 text-slate-700 px-2.5 py-1 rounded-xl flex items-center gap-1.5"
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: meta.color }}
                  />
                  {activity}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="text-xs text-slate-600 leading-normal max-w-xs font-semibold bg-white/60 p-3 rounded-xl border border-white/50 self-stretch md:self-auto flex items-center">
        <span>
          💡 <strong>Efecto lunar:</strong> la gravedad y la luz de la luna regulan la presión
          de la savia. Durante el {meta.label.toLowerCase()} ({phase.label.toLowerCase()}), las
          plantas responden de forma óptima a estas labores.
        </span>
      </div>
    </div>
  );
};
