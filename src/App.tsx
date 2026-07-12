import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './views/DashboardView';
import { LotsView } from './views/LotsView';
import { LogsView } from './views/LogsView';
import { TasksView } from './views/TasksView';
import { SettingsView } from './views/SettingsView';
import { LoginView } from './views/LoginView';
import { ReportsView } from './views/ReportsView';
import { GrowProvider } from './context/GrowContext';
import { ToastProvider } from './components/ToastProvider';
import { Menu, Sprout } from 'lucide-react';
import { supabase } from './lib/supabaseClient';
import type { Session } from '@supabase/supabase-js';
import { AiChatWidget } from './components/AiChatWidget';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    // Obtener sesión inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    });

    // Escuchar cambios de estado de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session?.user?.user_metadata) {
      const { grow_ai_provider, grow_ai_api_key, grow_ai_model } = session.user.user_metadata;
      if (grow_ai_provider) localStorage.setItem('grow_ai_provider', grow_ai_provider);
      if (grow_ai_api_key) localStorage.setItem('grow_ai_api_key', grow_ai_api_key);
      if (grow_ai_model !== undefined) localStorage.setItem('grow_ai_model', grow_ai_model || '');
      // Disparar evento para actualizar componentes
      window.dispatchEvent(new Event('storage'));
    }
  }, [session]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center font-sans select-none"
        style={{ background: 'linear-gradient(135deg, #f0f5f1 0%, #e8f0e9 50%, #f0f4f0 100%)' }}
      >
        <div className="text-center space-y-5">
          <div className="relative inline-flex items-center justify-center">
            <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Sprout size={22} className="text-emerald-500" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-slate-700 font-bold text-sm">GrowManager</p>
            <p className="text-slate-400 text-xs font-medium animate-pulse">Verificando sesión...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return <LoginView />;
  }

  return (
    <ToastProvider>
      <GrowProvider>
        <BrowserRouter>
          <div className="flex min-h-screen font-sans relative overflow-x-hidden" style={{ background: 'var(--bg-app, #f0f5f1)', color: 'var(--text-primary, #0f172a)' }}>
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            
            <div className="flex-1 flex flex-col min-w-0">
              {/* Top Bar for Mobile */}
              <header className="flex md:hidden items-center justify-between px-6 py-4 bg-slate-900 border-b border-slate-800 sticky top-0 z-40">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl text-emerald-400" style={{ background: 'rgba(5,150,105,0.15)', border: '1px solid rgba(5,150,105,0.25)' }}>
                    <Sprout size={20} />
                  </div>
                  <span className="font-bold text-lg text-white tracking-tight">GrowManager</span>
                </div>
                <button 
                  onClick={() => setSidebarOpen(true)}
                  className="p-2 hover:bg-slate-800 rounded-xl text-gray-400 hover:text-white transition"
                >
                  <Menu size={24} />
                </button>
              </header>

              <main className="flex-1 p-6 md:p-8 overflow-y-auto">
                <Routes>
                  <Route path="/" element={<DashboardView />} />
                  <Route path="/lots" element={<LotsView />} />
                  <Route path="/logs" element={<LogsView />} />
                  <Route path="/tasks" element={<TasksView />} />
                  <Route path="/reports" element={<ReportsView />} />
                  <Route path="/settings" element={<SettingsView />} />
                </Routes>
              </main>
            </div>
            <AiChatWidget />
          </div>
        </BrowserRouter>
      </GrowProvider>
    </ToastProvider>
  );
}

export default App;
