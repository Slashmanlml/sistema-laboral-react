import { Suspense, lazy, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { Menu, Sprout, AlertTriangle } from 'lucide-react';
import type { Session } from '@supabase/supabase-js';

import { Sidebar } from './components/Sidebar';
import { AiChatWidget } from './components/AiChatWidget';
import { ToastProvider } from './components/ToastProvider';
import { ErrorBoundary } from './components/ErrorBoundary';
import { GrowProvider } from './context/GrowContext';
import { LoginView } from './views/LoginView';
import { supabase, isSupabaseConfigured } from './lib/supabaseClient';
import { purgeLegacyCloudKey } from './utils/aiConfig';

// Las vistas se cargan bajo demanda: Dashboard y Reportes arrastran Chart.js,
// que no hace falta para entrar a la app.
const DashboardView = lazy(() =>
  import('./views/DashboardView').then(m => ({ default: m.DashboardView }))
);
const LotsView = lazy(() => import('./views/LotsView').then(m => ({ default: m.LotsView })));
const LogsView = lazy(() => import('./views/LogsView').then(m => ({ default: m.LogsView })));
const TasksView = lazy(() => import('./views/TasksView').then(m => ({ default: m.TasksView })));
const ReportsView = lazy(() =>
  import('./views/ReportsView').then(m => ({ default: m.ReportsView }))
);
const SettingsView = lazy(() =>
  import('./views/SettingsView').then(m => ({ default: m.SettingsView }))
);

const SplashScreen = ({ message }: { message: string }) => (
  <div
    className="flex min-h-screen items-center justify-center font-sans select-none"
    style={{ background: 'linear-gradient(135deg, #f0f5f1 0%, #e8f0e9 50%, #f0f4f0 100%)' }}
  >
    <div className="text-center space-y-5">
      <div className="relative inline-flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Sprout size={22} className="text-emerald-500" />
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-slate-700 font-bold text-sm">GrowManager</p>
        <p className="text-slate-400 text-xs font-medium animate-pulse">{message}</p>
      </div>
    </div>
  </div>
);

const ConfigErrorScreen = () => (
  <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 font-sans">
    <div className="max-w-lg w-full bg-white border border-slate-200 rounded-2xl shadow-sm p-8 space-y-4">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-amber-50 border border-amber-100 rounded-xl text-amber-600">
          <AlertTriangle size={22} />
        </div>
        <h1 className="text-lg font-bold text-slate-900">Falta configurar Supabase</h1>
      </div>
      <p className="text-sm text-slate-600 font-medium leading-relaxed">
        No se encontraron las variables de entorno{' '}
        <code className="bg-slate-100 px-1.5 py-0.5 rounded text-rose-600 font-mono text-xs">
          VITE_SUPABASE_URL
        </code>{' '}
        y{' '}
        <code className="bg-slate-100 px-1.5 py-0.5 rounded text-rose-600 font-mono text-xs">
          VITE_SUPABASE_ANON_KEY
        </code>
        . Copiá el archivo <strong>.env.example</strong> a <strong>.env</strong>, completá
        los valores de tu proyecto y reiniciá el servidor de desarrollo.
      </p>
    </div>
  </div>
);

const NotFoundView = () => (
  <div className="max-w-md mx-auto text-center py-24 space-y-4">
    <Sprout size={48} className="mx-auto text-emerald-500/25" />
    <h2 className="text-2xl font-extrabold text-slate-900">Esta página no existe</h2>
    <p className="text-sm text-slate-500 font-medium">
      El enlace que seguiste no corresponde a ninguna sección de GrowManager.
    </p>
    <Link
      to="/"
      className="inline-block px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition text-sm shadow-sm"
    >
      Volver al Dashboard
    </Link>
  </div>
);

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  // Sin configuración no hay sesión que verificar: se arranca ya resuelto.
  const [authLoading, setAuthLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Versiones anteriores guardaban la API key de IA en `user_metadata`, que viaja
  // dentro del JWT. Se rescata al almacenamiento local y se borra de la nube.
  useEffect(() => {
    if (session?.user?.user_metadata) {
      void purgeLegacyCloudKey(session.user.user_metadata);
    }
  }, [session]);

  if (!isSupabaseConfigured) return <ConfigErrorScreen />;
  if (authLoading) return <SplashScreen message="Verificando sesión..." />;
  if (!session) return <LoginView />;

  return (
    <ErrorBoundary>
      <ToastProvider>
        <GrowProvider>
          <BrowserRouter>
            <div
              className="flex min-h-screen font-sans relative overflow-x-hidden"
              style={{
                background: 'var(--bg-app, #f0f5f1)',
                color: 'var(--text-primary, #0f172a)',
              }}
            >
              <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

              <div className="flex-1 flex flex-col min-w-0">
                <header className="flex md:hidden items-center justify-between px-6 py-4 bg-slate-900 border-b border-slate-800 sticky top-0 z-40">
                  <div className="flex items-center gap-3">
                    <div
                      className="p-2 rounded-xl text-emerald-400"
                      style={{
                        background: 'rgba(5,150,105,0.15)',
                        border: '1px solid rgba(5,150,105,0.25)',
                      }}
                    >
                      <Sprout size={20} />
                    </div>
                    <span className="font-bold text-lg text-white tracking-tight">
                      GrowManager
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSidebarOpen(true)}
                    aria-label="Abrir menú de navegación"
                    className="p-2 hover:bg-slate-800 rounded-xl text-gray-400 hover:text-white transition"
                  >
                    <Menu size={24} />
                  </button>
                </header>

                <main className="flex-1 p-6 md:p-8 overflow-y-auto">
                  <ErrorBoundary>
                    <Suspense
                      fallback={
                        <div className="flex items-center justify-center py-24">
                          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                      }
                    >
                      <Routes>
                        <Route path="/" element={<DashboardView />} />
                        <Route path="/lots" element={<LotsView />} />
                        <Route path="/logs" element={<LogsView />} />
                        <Route path="/tasks" element={<TasksView />} />
                        <Route path="/reports" element={<ReportsView />} />
                        <Route path="/settings" element={<SettingsView />} />
                        <Route path="*" element={<NotFoundView />} />
                      </Routes>
                    </Suspense>
                  </ErrorBoundary>
                </main>
              </div>

              <AiChatWidget />
            </div>
          </BrowserRouter>
        </GrowProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;
