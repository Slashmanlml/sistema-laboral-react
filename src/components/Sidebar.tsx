import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Box, Thermometer, CalendarCheck, Settings, Sprout, X, LogOut, BarChart3, Wifi, WifiOff, AlertCircle } from 'lucide-react';
import { useGrow } from '../context/GrowContext';
import { calculateDaysElapsed } from '../utils/calculations';
import { supabase } from '../lib/supabaseClient';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const { lots, tasks, dbStatus } = useGrow();
  const location = useLocation();

  const activeLots = lots.filter(l => !l.is_archived);
  const latestLot = [...activeLots].sort((a, b) => b.start_date.localeCompare(a.start_date))[0];

  // Badge de tareas pendientes hoy
  const todayStr = new Date().toISOString().split('T')[0];
  const todayPendingCount = tasks.filter(t => t.date === todayStr && !t.is_completed).length;

  // Indicador de estado de DB
  const dbIndicator = {
    connected:    { color: '#10b981', label: 'Online', icon: <Wifi size={11} /> },
    disconnected: { color: '#ef4444', label: 'Sin conexión', icon: <WifiOff size={11} /> },
    auth_error:   { color: '#f59e0b', label: 'Error de auth', icon: <AlertCircle size={11} /> },
    config_error: { color: '#f59e0b', label: 'Config error', icon: <AlertCircle size={11} /> },
    loading:      { color: '#94a3b8', label: 'Conectando...', icon: <Wifi size={11} /> },
  };
  const dbInfo = dbIndicator[dbStatus] || dbIndicator.loading;

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 w-64 text-slate-200 p-5 flex flex-col h-screen select-none z-50 transition-transform duration-300 ease-in-out md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{
          background: 'linear-gradient(180deg, #0f172a 0%, #0d1f0e 60%, #0f172a 100%)',
          borderRight: '1px solid rgba(30, 58, 32, 0.6)',
        }}
      >
        {/* Header / Logo */}
        <div className="flex items-center justify-between gap-3 mb-7">
          <div className="flex items-center gap-3">
            <div
              className="p-2.5 rounded-xl"
              style={{
                background: 'rgba(5, 150, 105, 0.2)',
                border: '1px solid rgba(5, 150, 105, 0.35)',
              }}
            >
              <Sprout size={22} className="text-emerald-400" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight text-white leading-none">GrowManager</h1>
              <span className="text-[10px] text-emerald-500/70 font-bold uppercase tracking-widest">Cultivo Controlado</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white md:hidden transition"
          >
            <X size={16} />
          </button>
        </div>

        {/* DB Status Indicator */}
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-xl mb-5"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <span style={{ color: dbInfo.color }}>{dbInfo.icon}</span>
          <span className="text-[10px] font-bold" style={{ color: dbInfo.color }}>Supabase</span>
          <span className="text-[10px] text-slate-500 font-semibold ml-auto">{dbInfo.label}</span>
        </div>

        {/* Menú de Navegación */}
        <nav className="space-y-1 flex-1">
          <NavItem to="/"       active={location.pathname === '/'}        icon={<LayoutDashboard size={18}/>} label="Dashboard"       badge={0}                  onClick={onClose} />
          <NavItem to="/lots"   active={location.pathname === '/lots'}    icon={<Box size={18}/>}             label="Lotes de Cultivo"  badge={0}                  onClick={onClose} />
          <NavItem to="/logs"   active={location.pathname === '/logs'}    icon={<Thermometer size={18}/>}     label="Registro Diario"   badge={0}                  onClick={onClose} />
          <NavItem to="/tasks"  active={location.pathname === '/tasks'}   icon={<CalendarCheck size={18}/>}   label="Tareas y Agenda"   badge={todayPendingCount}  onClick={onClose} />
          <NavItem to="/reports" active={location.pathname === '/reports'} icon={<BarChart3 size={18}/>}      label="Reportes"          badge={0}                  onClick={onClose} />
          <NavItem to="/settings" active={location.pathname === '/settings'} icon={<Settings size={18}/>}     label="Ajustes"           badge={0}                  onClick={onClose} />
        </nav>

        {/* Bottom Section */}
        <div className="mt-auto space-y-3">
          {latestLot && (
            <div
              className="p-4 rounded-2xl"
              style={{
                background: 'rgba(5, 150, 105, 0.1)',
                border: '1px solid rgba(5, 150, 105, 0.2)',
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[10px] text-emerald-400 font-black uppercase tracking-widest">Lote Activo</span>
              </div>
              <h4 className="text-sm font-bold text-white truncate">{latestLot.name}</h4>
              <p className="text-xs text-slate-400 mt-1 truncate font-medium">
                {latestLot.strain} · {latestLot.stage} (Día {calculateDaysElapsed(latestLot.start_date)})
              </p>
            </div>
          )}

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '12px' }}>
            <button
              onClick={async () => {
                onClose();
                await supabase.auth.signOut();
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition duration-200"
              style={{ color: '#94a3b8' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(239,68,68,0.08)';
                e.currentTarget.style.color = '#f87171';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#94a3b8';
              }}
            >
              <LogOut size={18} />
              <span className="text-sm font-semibold">Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

interface NavItemProps {
  to: string;
  active: boolean;
  icon: React.ReactNode;
  label: string;
  badge: number;
  onClick: () => void;
}

const NavItem = ({ to, active, icon, label, badge, onClick }: NavItemProps) => (
  <Link
    to={to}
    onClick={onClick}
    className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 relative"
    style={{
      background: active ? 'rgba(5, 150, 105, 0.18)' : 'transparent',
      border: active ? '1px solid rgba(5, 150, 105, 0.25)' : '1px solid transparent',
      color: active ? '#34d399' : '#94a3b8',
      fontWeight: active ? '700' : '500',
    }}
    onMouseEnter={(e) => {
      if (!active) {
        e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
        e.currentTarget.style.color = '#e2e8f0';
      }
    }}
    onMouseLeave={(e) => {
      if (!active) {
        e.currentTarget.style.background = 'transparent';
        e.currentTarget.style.color = '#94a3b8';
      }
    }}
  >
    {icon}
    <span className="text-sm flex-1">{label}</span>
    {badge > 0 && (
      <span
        className="text-[10px] font-black text-white min-w-[18px] h-[18px] flex items-center justify-center px-1 rounded-full"
        style={{ background: '#ef4444' }}
      >
        {badge > 9 ? '9+' : badge}
      </span>
    )}
  </Link>
);
