import React, { useState } from 'react';
import { useGrow } from '../context/GrowContext';
import { calculateVPD, getVPDInfo } from '../utils/calculations';
import { Trash2, Calendar, Activity } from 'lucide-react';

export const LogsView = () => {
  const { lots, logs, addLog, deleteLog } = useGrow();

  // Inputs del Formulario
  const [lotId, setLotId] = useState('');
  const [temp, setTemp] = useState('');
  const [humidity, setHumidity] = useState('');
  const [ph, setPh] = useState('');
  const [ec, setEc] = useState('');
  const [water, setWater] = useState('');
  const [notes, setNotes] = useState('');

  const activeLots = lots.filter(l => !l.is_archived);

  // Calcular el VPD interactivo directamente en el renderizado
  const t = parseFloat(temp);
  const h = parseFloat(humidity);
  const vpd = (!isNaN(t) && !isNaN(h)) ? calculateVPD(t, h) : null;
  const vpdDetails = vpd !== null ? getVPDInfo(vpd) : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lotId || !temp || !humidity) return;

    addLog({
      lot_id: lotId,
      temp: parseFloat(temp),
      humidity: parseFloat(humidity),
      ph: ph ? parseFloat(ph) : undefined,
      ec: ec ? parseFloat(ec) : undefined,
      water_amount: water ? parseFloat(water) : undefined,
      notes: notes || undefined
    });

    // Resetear formulario
    setLotId('');
    setTemp('');
    setHumidity('');
    setPh('');
    setEc('');
    setWater('');
    setNotes('');
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto select-none">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-white tracking-tight">Registro Diario</h2>
        <p className="text-gray-400 mt-1">Ingresa mediciones del clima, riegos y revisa el historial completo.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Formulario de Medición */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-gray-950 border border-gray-800 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
              <Activity size={20} className="text-green-400" />
              Registrar Medición
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Lote de Cultivo *</label>
                <select
                  value={lotId}
                  onChange={(e) => setLotId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-white focus:outline-none focus:border-green-500 text-sm"
                  required
                >
                  <option value="">Selecciona un lote...</option>
                  {activeLots.map(l => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Temperatura (°C) *</label>
                  <input
                    type="number"
                    step="0.1"
                    value={temp}
                    onChange={(e) => setTemp(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-800 rounded-xl text-white focus:outline-none focus:border-green-500"
                    placeholder="Ej: 24.5"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Humedad (%) *</label>
                  <input
                    type="number"
                    value={humidity}
                    onChange={(e) => setHumidity(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-800 rounded-xl text-white focus:outline-none focus:border-green-500"
                    placeholder="Ej: 55"
                    required
                  />
                </div>
              </div>

              {/* Tarjeta interactiva de cálculo de VPD */}
              <div className={`p-4 rounded-xl border transition-all duration-300 ${
                vpdDetails 
                  ? 'bg-gray-900/40 border-gray-800' 
                  : 'bg-gray-900/10 border-gray-900 border-dashed'
              }`}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-gray-400 font-medium">VPD Calculado</span>
                  {vpdDetails && (
                    <span className={`text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full ${vpdDetails.statusClass}`}>
                      {vpdDetails.label}
                    </span>
                  )}
                </div>
                <div className="text-2xl font-black text-white tracking-tight">
                  {vpd !== null ? `${vpd} kPa` : '-.-- kPa'}
                </div>
                <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                  {vpdDetails ? vpdDetails.desc : 'Ingresa temperatura y humedad para ver el déficit de presión de vapor.'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">pH de Riego (opcional)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={ph}
                    onChange={(e) => setPh(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-800 rounded-xl text-white focus:outline-none focus:border-green-500"
                    placeholder="Ej: 6.2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">EC de Riego (opcional)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={ec}
                    onChange={(e) => setEc(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-800 rounded-xl text-white focus:outline-none focus:border-green-500"
                    placeholder="Ej: 1.2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Cantidad de Agua (Litros / opcional)</label>
                <input
                  type="number"
                  step="0.1"
                  value={water}
                  onChange={(e) => setWater(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-800 rounded-xl text-white focus:outline-none focus:border-green-500"
                  placeholder="Ej: 10"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Notas / Observaciones</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-800 rounded-xl text-white focus:outline-none focus:border-green-500"
                  rows={2}
                  placeholder="Ej: Defoliación ligera, aparición de resina, etc."
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-green-500 hover:bg-green-600 text-gray-950 font-bold rounded-xl transition duration-200 mt-2"
              >
                Guardar Registro
              </button>
            </form>
          </div>
        </div>

        {/* Historial de Registros */}
        <div className="lg:col-span-7">
          <div className="bg-gray-950 border border-gray-800 rounded-2xl overflow-hidden h-full flex flex-col">
            <div className="p-6 border-b border-gray-900">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Calendar size={20} className="text-green-400" />
                Historial de Registros
              </h3>
            </div>

            <div className="flex-1 overflow-x-auto">
              <table className="w-full text-left border-collapse select-none">
                <thead>
                  <tr className="border-b border-gray-900 text-gray-400 text-xs font-semibold uppercase bg-gray-900/20">
                    <th className="p-4">Fecha/Hora</th>
                    <th className="p-4">Lote</th>
                    <th className="p-4">Temp/Hum</th>
                    <th className="p-4">VPD</th>
                    <th className="p-4">Riego (pH/EC)</th>
                    <th className="p-4 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-900 text-sm">
                  {logs.length > 0 ? (
                    logs.map(log => {
                      const lot = lots.find(l => l.id === log.lot_id);
                      const lotName = lot ? lot.name : 'Lote Desconocido';
                      const vpdInfo = getVPDInfo(log.vpd);

                      const formattedDate = new Date(log.date).toLocaleString('es-AR', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      });

                      return (
                        <tr key={log.id} className="hover:bg-gray-900/30 transition">
                          <td className="p-4 text-gray-300 font-medium">{formattedDate}</td>
                          <td className="p-4 text-green-400 font-semibold truncate max-w-[120px]">{lotName}</td>
                          <td className="p-4 text-gray-400">
                            <span className="text-white font-medium">{log.temp.toFixed(1)}°C</span> / {log.humidity}%
                          </td>
                          <td className="p-4">
                            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${vpdInfo.statusClass}`}>
                              {log.vpd.toFixed(2)} kPa
                            </span>
                          </td>
                          <td className="p-4 text-xs text-gray-400 leading-normal">
                            {log.ph || log.ec || log.water_amount ? (
                              <div>
                                {log.water_amount && <span className="block text-white font-medium">{log.water_amount} L agua</span>}
                                {(log.ph || log.ec) && (
                                  <span>pH: {log.ph || '-.-'} • EC: {log.ec || '-.-'}</span>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-600">Sin riego</span>
                            )}
                          </td>
                          <td className="p-4 text-center">
                            <button
                              onClick={() => deleteLog(log.id)}
                              className="p-1.5 hover:bg-red-500/10 text-gray-500 hover:text-red-400 rounded-lg border border-transparent hover:border-red-500/10 transition"
                              title="Eliminar Registro"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="p-12 text-center text-gray-500">
                        <Activity size={32} className="mx-auto text-green-500/20 mb-2" />
                        <p>No hay registros diarios guardados aún.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
