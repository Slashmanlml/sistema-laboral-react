import { memo, type ReactNode } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export type Trend = 'up' | 'down' | 'neutral';

interface MetricCardProps {
  icon: ReactNode;
  title: string;
  value: string;
  subtext: string;
  badgeClass?: string;
  theme: 'blue' | 'green' | 'amber' | 'emerald';
  trend?: Trend;
  /** Explicación de contra qué se compara la tendencia. */
  trendLabel?: string;
}

const THEMES = {
  blue: 'text-blue-600 bg-blue-50 border-blue-100',
  green: 'text-emerald-600 bg-emerald-50 border-emerald-100',
  amber: 'text-amber-600 bg-amber-50 border-amber-100',
  emerald: 'text-emerald-600 bg-emerald-50 border-emerald-100',
} as const;

const TrendIcon = ({ trend, label }: { trend: Trend; label?: string }) => {
  if (trend === 'neutral') {
    return (
      <span className="ml-1 inline-flex items-center text-slate-300" title={label}>
        <Minus size={12} />
      </span>
    );
  }
  return (
    <span
      className={`ml-1 inline-flex items-center ${trend === 'up' ? 'text-emerald-500' : 'text-red-400'}`}
      title={label}
    >
      {trend === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
    </span>
  );
};

export const MetricCard = memo(
  ({ icon, title, value, subtext, badgeClass, theme, trend, trendLabel }: MetricCardProps) => (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center gap-4 hover:border-slate-300 transition duration-150 shadow-sm">
      <div className={`p-3.5 rounded-xl border ${THEMES[theme]}`}>{icon}</div>
      <div className="flex-1 min-w-0">
        <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">
          {title}
        </span>
        <div className="flex items-center gap-1">
          <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{value}</h3>
          {trend && <TrendIcon trend={trend} label={trendLabel} />}
        </div>
        <div className="flex items-center gap-2 mt-1">
          {badgeClass ? (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badgeClass}`}>
              {subtext}
            </span>
          ) : (
            <span className="text-xs text-slate-500 font-semibold">{subtext}</span>
          )}
        </div>
      </div>
    </div>
  )
);
MetricCard.displayName = 'MetricCard';
