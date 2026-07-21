import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';

const CONTROL_CLASSES =
  'w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm shadow-sm transition focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:bg-slate-50 disabled:text-slate-400';

interface FieldWrapperProps {
  label: string;
  htmlFor: string;
  required?: boolean;
  hint?: ReactNode;
  warning?: string | null;
  children: ReactNode;
}

const FieldWrapper = ({
  label,
  htmlFor,
  required,
  hint,
  warning,
  children,
}: FieldWrapperProps) => (
  <div>
    <label htmlFor={htmlFor} className="block text-sm font-semibold text-slate-600 mb-1">
      {label}
      {required && <span className="text-emerald-600"> *</span>}
    </label>
    {children}
    {hint && <p className="text-[10px] text-emerald-600 font-bold mt-1">{hint}</p>}
    {warning && (
      <p role="status" className="text-[10px] text-amber-600 font-bold mt-1">
        {warning}
      </p>
    )}
  </div>
);

// ─── Input ────────────────────────────────────────────────────────────────────

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label: string;
  hint?: ReactNode;
  warning?: string | null;
}

export const TextField = ({ label, hint, warning, className = '', ...rest }: TextFieldProps) => {
  const id = useId();
  return (
    <FieldWrapper label={label} htmlFor={id} required={rest.required} hint={hint} warning={warning}>
      <input id={id} className={`${CONTROL_CLASSES} ${className}`} {...rest} />
    </FieldWrapper>
  );
};

// ─── Select ───────────────────────────────────────────────────────────────────

interface SelectFieldProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id'> {
  label: string;
  hint?: ReactNode;
  warning?: string | null;
}

export const SelectField = ({
  label,
  hint,
  warning,
  className = '',
  children,
  ...rest
}: SelectFieldProps) => {
  const id = useId();
  return (
    <FieldWrapper label={label} htmlFor={id} required={rest.required} hint={hint} warning={warning}>
      <select id={id} className={`${CONTROL_CLASSES} cursor-pointer ${className}`} {...rest}>
        {children}
      </select>
    </FieldWrapper>
  );
};

// ─── Textarea ─────────────────────────────────────────────────────────────────

interface TextAreaFieldProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'> {
  label: string;
}

export const TextAreaField = ({ label, className = '', ...rest }: TextAreaFieldProps) => {
  const id = useId();
  return (
    <FieldWrapper label={label} htmlFor={id} required={rest.required}>
      <textarea id={id} className={`${CONTROL_CLASSES} ${className}`} {...rest} />
    </FieldWrapper>
  );
};
