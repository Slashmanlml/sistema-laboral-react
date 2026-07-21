import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Evita que una excepción de render deje la pantalla en blanco sin explicación.
 */
export class ErrorBoundary extends Component<Props, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Error no controlado en la interfaz:', error, info.componentStack);
  }

  override render(): ReactNode {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 font-sans">
        <div className="max-w-lg w-full bg-white border border-slate-200 rounded-2xl shadow-sm p-8 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-50 border border-red-100 rounded-xl text-red-600">
              <AlertTriangle size={22} />
            </div>
            <h1 className="text-lg font-bold text-slate-900">Algo se rompió</h1>
          </div>

          <p className="text-sm text-slate-600 font-medium leading-relaxed">
            La aplicación encontró un error inesperado y no pudo seguir dibujando esta
            pantalla. Tus datos en Supabase no se vieron afectados.
          </p>

          <details className="text-xs">
            <summary className="cursor-pointer font-bold text-slate-500 hover:text-slate-700">
              Ver detalle técnico
            </summary>
            <pre className="mt-2 p-3 bg-slate-900 text-slate-300 rounded-xl overflow-x-auto text-[10px] leading-relaxed whitespace-pre-wrap max-h-48 select-text">
              {error.message}
              {error.stack ? `\n\n${error.stack}` : ''}
            </pre>
          </details>

          <button
            type="button"
            onClick={() => window.location.reload()}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition shadow-sm text-sm"
          >
            Recargar la aplicación
          </button>
        </div>
      </div>
    );
  }
}
