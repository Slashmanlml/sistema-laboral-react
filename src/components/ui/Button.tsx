import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';
type Size = 'sm' | 'md';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  fullWidth?: boolean;
}

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm border border-transparent',
  secondary:
    'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 shadow-sm',
  danger: 'bg-red-600 hover:bg-red-700 text-white border border-transparent shadow-sm',
  ghost:
    'bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-800 border border-slate-200 shadow-sm',
};

const SIZE_CLASSES: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  md: 'px-5 py-2.5 text-sm gap-2',
};

/**
 * Botón con los estilos del sistema de diseño.
 * Antes la misma cadena de ~12 clases de Tailwind estaba copiada ~80 veces.
 */
export const Button = ({
  variant = 'primary',
  size = 'md',
  icon,
  fullWidth,
  className = '',
  children,
  type = 'button',
  ...rest
}: ButtonProps) => (
  <button
    type={type}
    className={`inline-flex items-center justify-center font-bold rounded-xl transition duration-150 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1 ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
    {...rest}
  >
    {icon}
    {children}
  </button>
);
