import { useMemo } from 'react';
import { ChevronLeft, ChevronRight, Moon } from 'lucide-react';
import type { Task } from '../../types/grow';
import { toLocalDateStr, todayStr } from '../../utils/date';
import { getLunarInfo, LUNAR_DAY_META, LUNAR_PHASE_META } from '../../utils/lunar';
import { taskTypeBadge } from './taskStyles';

const WEEKDAY_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const LEGEND_TYPES = ['flor', 'hoja', 'fruto', 'raiz', 'nodo'] as const;

interface TaskCalendarProps {
  currentDate: Date;
  onCurrentDateChange: (date: Date) => void;
  selectedDate: string | null;
  onSelectDate: (dateStr: string) => void;
  tasksByDate: Map<string, Task[]>;
}

export const TaskCalendar = ({
  currentDate,
  onCurrentDateChange,
  selectedDate,
  onSelectDate,
  tasksByDate,
}: TaskCalendarProps) => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysGrid = useMemo<(Date | null)[]>(() => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstWeekday = new Date(year, month, 1).getDay();
    // getDay(): 0 = domingo. La grilla arranca en lunes.
    const leadingBlanks = firstWeekday === 0 ? 6 : firstWeekday - 1;

    return [
      ...Array.from({ length: leadingBlanks }, () => null),
      ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1)),
    ];
  }, [year, month]);

  const today = todayStr();
  const monthName = currentDate.toLocaleString('es-AR', { month: 'long', year: 'numeric' });

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-extrabold text-slate-900 capitalize tracking-tight">
            {monthName}
          </h3>
          <p className="text-xs text-slate-400 font-medium mt-0.5 flex items-center gap-1">
            <Moon size={11} />
            Growlendario Lunar · Hemisferio Sur
          </p>
        </div>
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl p-1 shadow-sm">
          <button
            type="button"
            onClick={() => onCurrentDateChange(new Date(year, month - 1, 1))}
            aria-label="Mes anterior"
            className="p-1.5 hover:bg-slate-200 text-slate-500 hover:text-slate-800 rounded-lg transition"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            onClick={() => onCurrentDateChange(new Date())}
            className="px-3 py-1.5 hover:bg-slate-200 text-xs font-bold text-slate-700 rounded-lg transition"
          >
            Hoy
          </button>
          <button
            type="button"
            onClick={() => onCurrentDateChange(new Date(year, month + 1, 1))}
            aria-label="Mes siguiente"
            className="p-1.5 hover:bg-slate-200 text-slate-500 hover:text-slate-800 rounded-lg transition"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Leyenda del Growlendario */}
      <div className="flex flex-wrap gap-2 mb-5 pb-4 border-b border-slate-100">
        {LEGEND_TYPES.map(type => {
          const meta = LUNAR_DAY_META[type];
          return (
            <span
              key={type}
              className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg border"
              style={{
                backgroundColor: meta.bgColor,
                borderColor: meta.borderColor,
                color: meta.textColor,
              }}
            >
              <span aria-hidden="true">{meta.emoji}</span>
              {meta.label}
            </span>
          );
        })}
      </div>

      <div className="overflow-x-auto">
        <div className="grid grid-cols-7 gap-1.5 min-w-[600px] border-b border-slate-100 pb-2">
          {WEEKDAY_LABELS.map(day => (
            <div
              key={day}
              className="text-center text-xs font-bold text-slate-400 uppercase tracking-wider py-1.5"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1.5 min-w-[600px] pt-2">
          {daysGrid.map((day, index) => {
            if (!day) {
              return (
                <div
                  key={`empty-${index}`}
                  className="bg-slate-50/20 border border-slate-100 rounded-xl min-h-[90px] opacity-25"
                />
              );
            }

            // Hora local: `toISOString()` corría la fecha un día hacia atrás en
            // husos negativos y desalineaba las tareas del calendario.
            const dateStr = toLocalDateStr(day);
            const dayTasks = tasksByDate.get(dateStr) ?? [];
            const isToday = dateStr === today;
            const isSelected = selectedDate === dateStr;
            const lunar = getLunarInfo(day);
            const lunarMeta = LUNAR_DAY_META[lunar.type];
            const phaseMeta = LUNAR_PHASE_META[lunar.phase];

            return (
              <button
                key={dateStr}
                type="button"
                onClick={() => onSelectDate(dateStr)}
                aria-pressed={isSelected}
                aria-label={`${day.getDate()} — ${lunarMeta.label}, ${dayTasks.length} tarea(s)`}
                className={`text-left border rounded-xl p-2 min-h-[95px] flex flex-col justify-between cursor-pointer transition duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                  isSelected
                    ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm'
                    : isToday
                      ? 'border-slate-400 bg-slate-100/70'
                      : 'border-slate-200 hover:border-slate-300'
                }`}
                style={{
                  backgroundColor: isSelected ? lunarMeta.bgColor : `${lunarMeta.bgColor}dd`,
                  borderColor: isSelected ? lunarMeta.color : lunarMeta.borderColor,
                }}
              >
                <div className="flex justify-between items-start">
                  <span
                    className={`text-xs font-extrabold ${
                      isSelected || isToday ? 'text-slate-900' : 'text-slate-500'
                    }`}
                  >
                    {day.getDate()}
                  </span>
                  <div className="flex items-center gap-0.5 bg-white/70 px-1 py-0.5 rounded shadow-xs border border-slate-100">
                    <span className="text-[10px]" title={phaseMeta.label}>
                      {phaseMeta.emoji}
                    </span>
                    <span className="text-[10px]" title={lunarMeta.label}>
                      {lunarMeta.emoji}
                    </span>
                  </div>
                </div>

                <div className="mt-1 text-left">
                  <span
                    className="text-[8px] font-extrabold uppercase px-1 py-0.5 rounded border border-white/50"
                    style={{
                      backgroundColor: `${lunarMeta.color}15`,
                      color: lunarMeta.textColor,
                    }}
                  >
                    {lunarMeta.emoji} {lunarMeta.label.split(' ')[1]}
                  </span>
                </div>

                {lunar.type === 'nodo' && (
                  <span className="text-[8px] font-extrabold text-slate-500 mt-1 uppercase tracking-wider">
                    ⚠ No tocar
                  </span>
                )}

                <div className="space-y-0.5 mt-2 overflow-hidden max-h-[38px]">
                  {dayTasks.slice(0, 2).map(task => (
                    <div
                      key={task.id}
                      className={`text-[8px] truncate px-1 py-0.5 rounded font-extrabold border leading-none ${taskTypeBadge(task.type)}`}
                      title={task.title}
                    >
                      {task.title}
                    </div>
                  ))}
                  {dayTasks.length > 2 && (
                    <div className="text-[7px] text-slate-500 text-center font-bold">
                      +{dayTasks.length - 2} tareas
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
