import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './views/DashboardView';
import { LotsView } from './views/LotsView';
import { LogsView } from './views/LogsView';
import { TasksView } from './views/TasksView';
import { SettingsView } from './views/SettingsView';
import { GrowProvider } from './context/GrowContext';

function App() {
  return (
    <GrowProvider>
      <BrowserRouter>
        <div className="flex min-h-screen bg-gray-900 text-gray-100 font-sans">
          <Sidebar />
          <main className="flex-1 p-8 overflow-y-auto">
            <Routes>
              <Route path="/" element={<DashboardView />} />
              <Route path="/lots" element={<LotsView />} />
              <Route path="/logs" element={<LogsView />} />
              <Route path="/tasks" element={<TasksView />} />
              <Route path="/settings" element={<SettingsView />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </GrowProvider>
  );
}

export default App;
