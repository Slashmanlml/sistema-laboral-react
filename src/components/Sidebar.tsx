import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Box, Thermometer, CalendarCheck, Settings, Sprout } from 'lucide-react';
import { useGrow } from '../context/GrowContext';
import { calculateDaysElapsed } from '../utils/calculations';

export const Sidebar = () => {
  const { lots } = useGrow();
  const location = useLocation();

  const activeLots = lots.filter(l => !l.is_archived);
  const latestLot = activeLots[activeLots.length - 1];

  return (
    <aside className="w-64 bg-gray-950 border-r border-gray-800 text-gray-200 p-6 flex flex-col h-screen select-none">
      {/* Header / Logo */}
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2.5 bg-green-500/10 rounded-xl text-green-400 border border-green-500/20">
          <Sprout size={24} />
        </div>
        <div>
          <h1 className="text-xl font-bold font-sans tracking-tight text-white leading-none">GrowManager</h1>
          <span className="text-xs text-gray-500">Cultivo Controlado</span>
        </div>
      </div>

      {/* Menú de Navegación */}
      <nav className="space-y-1.5 flex-1">
        <NavItem to="/" active={location.pathname === '/'} icon={<LayoutDashboard size={20}/>} label="Dashboard" />
        <NavItem to="/lots" active={location.pathname === '/lots'} icon={<Box size={20}/>} label="Lotes de Cultivo" />
        <NavItem to="/logs" active={location.pathname === '/logs'} icon={<Thermometer size={20}/>} label="Registro Diario" />
        <NavItem to="/tasks" active={location.pathname === '/tasks'} icon={<CalendarCheck size={20}/>} label="Tareas y Agenda" />
        <NavItem to="/settings" active={location.pathname === '/settings'} icon={<Settings size={20}/>} label="Ajustes" />
      </nav>

      {/* Widget de Lote Activo en el Sidebar */}
      {latestLot && (
        <div className="mt-auto p-4 bg-gray-900/50 border border-gray-800/80 rounded-2xl">
          <div className="flex items-center gap-2 mb-2 text-xs text-green-400 font-medium">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            Lote Activo
          </div>
          <h4 className="text-sm font-semibold text-white truncate">{latestLot.name}</h4>
          <p className="text-xs text-gray-400 mt-1 truncate">
            {latestLot.strain} • {latestLot.stage} (Día {calculateDaysElapsed(latestLot.start_date)})
          </p>
        </div>
      )}
    </aside>
  );
};

interface NavItemProps {
  to: string;
  active: boolean;
  icon: React.ReactNode;
  label: string;
}

const NavItem = ({ to, active, icon, label }: NavItemProps) => (
  <Link
    to={to}
    className={`flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all duration-200 ${
      active
        ? 'bg-green-500/10 text-green-400 border border-green-500/20 font-medium shadow-sm shadow-green-950/20'
        : 'text-gray-400 hover:text-white hover:bg-gray-900/80 border border-transparent'
    }`}
  >
    {icon}
    <span>{label}</span>
  </Link>
);
