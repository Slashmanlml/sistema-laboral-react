import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './views/DashboardView';
import { LotsView } from './views/LotsView';
import { LogsView } from './views/LogsView';
import { TasksView } from './views/TasksView';
import { SettingsView } from './views/SettingsView';
import { LoginView } from './views/LoginView';
import { GrowProvider } from './context/GrowContext';
import { Menu, Sprout } from 'lucide-react';
import { supabase } from './lib/supabaseClient';
import type { Session } from '@supabase/supabase-js';

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

  if (authLoading) {
    return (
      <div className="flex min-h-screen bg-slate-50 text-slate-800 items-center justify-center font-sans select-none">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-500 text-sm font-medium animate-pulse">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return <LoginView />;
  }

  return (
    <GrowProvider>
      <BrowserRouter>
        <div className="flex min-h-screen bg-slate-50 text-slate-800 font-sans relative overflow-x-hidden">
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          
          <div className="flex-1 flex flex-col min-w-0">
            {/* Top Bar for Mobile */}
            <header className="flex md:hidden items-center justify-between px-6 py-4 bg-slate-900 border-b border-slate-800 sticky top-0 z-40">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/20">
                  <Sprout size={20} />
                </div>
                <span className="font-bold text-lg text-white">GrowManager</span>
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
                <Route path="/settings" element={<SettingsView />} />
              </Routes>
            </main>
          </div>
        </div>
      </BrowserRouter>
    </GrowProvider>
  );
}

export default App;
