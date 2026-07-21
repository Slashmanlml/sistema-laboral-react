import { Trash2, Sprout, Calendar, Beaker } from 'lucide-react';
import type { Task } from '../../types/grow';
import { formatShortDate } from '../../utils/format';
import { parseLocalDate, parseLocalNoon } from '../../utils/date';
import { getLunarInfo, LUNAR_DAY_META } from '../../utils/lunar';
import { taskTypeBadge, isWateringTask } from './taskStyles';

interface TaskItemProps {
  task: Task;
  lotName: string;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onQuickWatering: (task: Task) => void;
  /** Mostrar la fecha y el día lunar (vista de lista, no del día seleccionado). */
  showDate?: boolean;
  className?: string;
}

export const TaskItem = ({
  task,
  lotName,
  onToggle,
  onDelete,
  onQuickWatering,
  showDate = false,
  className = '',
}: TaskItemProps) => {
  const lunarMeta = showDate
    ? LUNAR_DAY_META[getLunarInfo(parseLocalNoon(task.date)).type]
    : null;

  return (
    <div className={`flex items-start gap-4 ${task.is_completed ? 'opacity-60' : ''} ${className}`}>
      <input
        type="checkbox"
        id={`task-${task.id}`}
        checked={task.is_completed}
        onChange={() => onToggle(task.id)}
        className="mt-1.5 rounded border-slate-300 bg-white text-emerald-600 focus:ring-emerald-500/50 cursor-pointer"
      />
      <div className="flex-1 min-w-0">
        <label
          htmlFor={`task-${task.id}`}
          className={`text-sm font-bold cursor-pointer ${
            task.is_completed ? 'line-through text-slate-400 font-medium' : 'text-slate-800'
          }`}
        >
          {task.title}
        </label>
        {task.notes && (
          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed font-medium">
            {task.notes}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-3 mt-2.5">
          {showDate && (
            <span className="flex items-center gap-1.5 text-[11px] text-slate-500 font-bold">
              <Calendar size={12} className="text-slate-400" />
              {formatShortDate(parseLocalDate(task.date))}
            </span>
          )}
          <span className="flex items-center gap-1.5 text-[11px] text-slate-500 font-bold">
            <Sprout size={12} className="text-emerald-600" />
            {lotName}
          </span>
          <span
            className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${taskTypeBadge(task.type)}`}
          >
            {task.type}
          </span>

          {lunarMeta && (
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full border"
              style={{
                backgroundColor: lunarMeta.bgColor,
                borderColor: lunarMeta.borderColor,
                color: lunarMeta.textColor,
              }}
            >
              {lunarMeta.emoji} {lunarMeta.label}
            </span>
          )}

          {isWateringTask(task.type) && !task.is_completed && (
            <button
              type="button"
              onClick={() => onQuickWatering(task)}
              className="flex items-center gap-1 text-[10px] font-extrabold text-emerald-600 hover:text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-2.5 py-1 transition shadow-sm"
            >
              <Beaker size={10} />
              Registrar Riego
            </button>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={() => onDelete(task.id)}
        aria-label={`Eliminar tarea ${task.title}`}
        className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg border border-transparent transition"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
};
