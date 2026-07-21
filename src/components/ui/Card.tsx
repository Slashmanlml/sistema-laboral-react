import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
}

export const Card = ({ children, className = '' }: CardProps) => (
  <div className={`bg-white border border-slate-200 rounded-2xl shadow-sm ${className}`}>
    {children}
  </div>
);

interface SectionHeaderProps {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

/** Cabecera de panel: ícono en recuadro esmeralda + título + descripción. */
export const SectionHeader = ({ icon, title, description, action }: SectionHeaderProps) => (
  <div className="flex items-start justify-between gap-4">
    <div className="flex items-center gap-2.5">
      <div className="p-2.5 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-600 shrink-0">
        {icon}
      </div>
      <div>
        <h3 className="text-lg font-bold text-slate-800">{title}</h3>
        {description && (
          <p className="text-xs text-slate-500 mt-0.5 font-medium">{description}</p>
        )}
      </div>
    </div>
    {action}
  </div>
);

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: string;
  className?: string;
}

export const EmptyState = ({ icon, title, description, className = '' }: EmptyStateProps) => (
  <div className={`py-12 text-center text-slate-400 ${className}`}>
    <div className="mx-auto mb-3 text-emerald-500/25 flex justify-center">{icon}</div>
    <p className="text-base font-bold">{title}</p>
    {description && <p className="text-xs font-medium mt-1">{description}</p>}
  </div>
);

interface StatTileProps {
  label: string;
  value: ReactNode;
  emphasis?: boolean;
}

/** Recuadro chico de métrica usado en los paneles de diagnóstico. */
export const StatTile = ({ label, value, emphasis }: StatTileProps) => (
  <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-center">
    <span className="text-[9px] text-slate-400 block font-bold uppercase tracking-wider">
      {label}
    </span>
    <span
      className={`text-sm font-black mt-0.5 block ${emphasis ? 'text-emerald-600' : 'text-slate-800'}`}
    >
      {value}
    </span>
  </div>
);
