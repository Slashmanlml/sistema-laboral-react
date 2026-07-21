import type { LunarDayInfo } from '../../utils/lunar';
import { LUNAR_DAY_META, LUNAR_PHASE_META } from '../../utils/lunar';

interface LunarDayPanelProps {
  info: LunarDayInfo;
  className?: string;
}

/** Ficha del día lunar seleccionado: tipo, fase y labores recomendadas. */
export const LunarDayPanel = ({ info, className = '' }: LunarDayPanelProps) => {
  const meta = LUNAR_DAY_META[info.type];
  const phase = LUNAR_PHASE_META[info.phase];

  return (
    <div
      className={`rounded-2xl p-5 shadow-sm border ${className}`}
      style={{ backgroundColor: meta.bgColor, borderColor: meta.borderColor }}
    >
      <div className="flex items-center gap-3 mb-3">
        <span className="text-3xl" aria-hidden="true">
          {meta.emoji}
        </span>
        <div>
          <h4 className="text-base font-extrabold" style={{ color: meta.textColor }}>
            {meta.label}
          </h4>
          <span
            className="text-xs font-semibold opacity-70"
            style={{ color: meta.textColor }}
          >
            {phase.emoji} {phase.label}
          </span>
        </div>
      </div>

      <p
        className="text-xs mb-3 font-medium"
        style={{ color: meta.textColor, opacity: 0.8 }}
      >
        {meta.description}
      </p>

      {info.warning ? (
        <div className="flex items-center gap-2 bg-slate-900/10 rounded-xl px-3 py-2.5">
          <span className="text-base" aria-hidden="true">
            ⚠️
          </span>
          <p className="text-xs font-extrabold text-slate-700">{info.warning}</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          <p
            className="text-[10px] font-extrabold uppercase tracking-wider opacity-60"
            style={{ color: meta.textColor }}
          >
            Actividades recomendadas hoy:
          </p>
          {info.activities.map(activity => (
            <div
              key={activity}
              className="flex items-center gap-2 text-xs font-semibold"
              style={{ color: meta.textColor }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ backgroundColor: meta.color }}
              />
              {activity}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
