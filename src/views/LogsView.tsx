import React, { useState, useEffect } from 'react';
import { useGrow } from '../context/GrowContext';
import { calculateVPD, getVPDInfo, calculateDaysElapsed } from '../utils/calculations';
import { Trash2, Calendar, Activity, Image as ImageIcon, Camera, AlertTriangle, Info } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { VEG_SCHEDULE, FLOWER_SCHEDULE } from '../utils/schedules';

export const LogsView = () => {
  const { lots, logs, helpers, addLog, deleteLog, uploadPhoto, toggleTask } = useGrow();

  // Inputs del Formulario
  const [lotId, setLotId] = useState('');
  const [temp, setTemp] = useState('');
  const [humidity, setHumidity] = useState('');
  const [ph, setPh] = useState('');
  const [ec, setEc] = useState('');
  const [phRunoff, setPhRunoff] = useState('');
  const [ecRunoff, setEcRunoff] = useState('');
  const [water, setWater] = useState('');
  const [notes, setNotes] = useState('');
  
  // Archivo fotográfico y previsualización
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [activePhotoUrl, setActivePhotoUrl] = useState<string | null>(null);

  // Ayudante / Quién regó
  const [currentUser, setCurrentUser] = useState('');
  const [wateredBy, setWateredBy] = useState('');

  // Filtros
  const [onlyWaterings, setOnlyWaterings] = useState(false);

  const handleECBlur = (val: string, setter: (v: string) => void) => {
    const num = parseFloat(val);
    if (!isNaN(num) && num >= 10) {
      setter((num / 1000).toFixed(2));
    }
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) {
        const name = user.email.split('@')[0];
        setCurrentUser(name);
        setWateredBy(name);
      } else {
        setCurrentUser('José');
        setWateredBy('José');
      }
    });

    // Detectar si venimos redireccionados desde "Riego Rápido" en el calendario
    const qLotId = sessionStorage.getItem('quick_log_lot_id');
    const qPh = sessionStorage.getItem('quick_log_ph');
    const qEc = sessionStorage.getItem('quick_log_ec');

    if (qLotId) {
      setLotId(qLotId);
      if (qPh) setPh(qPh);
      if (qEc) setEc(qEc);
      setNotes('Riego registrado desde tarea programada.');
    }
  }, []);

  const activeLots = lots.filter(l => !l.is_archived);

  // Calcular el VPD interactivo directamente en el renderizado
  const t = parseFloat(temp);
  const h = parseFloat(humidity);
  const vpd = (!isNaN(t) && !isNaN(h)) ? calculateVPD(t, h) : null;
  const vpdDetails = vpd !== null ? getVPDInfo(vpd) : null;

  // Guía de Riego en Vivo
  const selectedLotObj = lots.find(l => l.id === lotId);
  let wateringGuide = null;
  if (selectedLotObj && (selectedLotObj.stage === 'Vegetativo' || selectedLotObj.stage === 'Floración')) {
    const days = calculateDaysElapsed(selectedLotObj.start_date);
    const week = Math.floor(days / 7);
    const isFlower = selectedLotObj.stage === 'Floración';
    const schedule = isFlower ? FLOWER_SCHEDULE : VEG_SCHEDULE;
    const weekData = schedule.find(s => s.week === week) || schedule[schedule.length - 1]; // Capped at last week
    
    wateringGuide = {
      week,
      stage: selectedLotObj.stage,
      days,
      ph: weekData.ph,
      ec: weekData.ec,
      notes: weekData.notes
    };
  }

  // Previsualizar la foto antes de subirla
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setPhotoFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPhotoPreview(null);
    }
  };

  const removePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    const fileInput = document.getElementById('photo-upload-input') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lotId || !temp || !humidity) return;

    try {
      setUploading(true);
      let imageUrl = undefined;
      
      if (photoFile) {
        const uploadedUrl = await uploadPhoto(photoFile);
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        }
      }

      const formatEC = (val: string): number | undefined => {
        if (!val) return undefined;
        const num = parseFloat(val);
        if (isNaN(num)) return undefined;
        if (num >= 10) return num / 1000;
        return num;
      };

      await addLog({
        lot_id: lotId,
        temp: parseFloat(temp),
        humidity: parseFloat(humidity),
        ph: ph ? parseFloat(ph) : undefined,
        ec: formatEC(ec),
        ph_runoff: phRunoff ? parseFloat(phRunoff) : undefined,
        ec_runoff: formatEC(ecRunoff),
        water_amount: water ? parseFloat(water) : undefined,
        watered_by: wateredBy || undefined,
        notes: notes || undefined,
        image_url: imageUrl
      });

      // Si venía de una tarea rápida de agenda, la marcamos completada
      const qTaskId = sessionStorage.getItem('quick_log_task_id');
      if (qTaskId) {
        await toggleTask(qTaskId);
        // Limpiar sessionStorage
        sessionStorage.removeItem('quick_log_lot_id');
        sessionStorage.removeItem('quick_log_ph');
        sessionStorage.removeItem('quick_log_ec');
        sessionStorage.removeItem('quick_log_task_id');
      }

      // Resetear formulario
      setLotId('');
      setTemp('');
      setHumidity('');
      setPh('');
      setEc('');
      setPhRunoff('');
      setEcRunoff('');
      setWater('');
      setNotes('');
      removePhoto();
      setWateredBy(currentUser || 'José');

    } catch (err) {
      console.error("Error al guardar registro diario:", err);
    } finally {
      setUploading(false);
    }
  };

  // Aplicar filtros en el historial
  const filteredLogs = logs.filter(log => {
    if (onlyWaterings && (!log.water_amount || log.water_amount <= 0)) {
      return false;
    }
    return true;
  });

  // Validaciones en tiempo real para alertar al cultivador
  const tempNum = parseFloat(temp);
  const humNum = parseFloat(humidity);
  const phNum = parseFloat(ph);
  const ecNum = parseFloat(ec);
  const phRO = parseFloat(phRunoff);
  const ecRO = parseFloat(ecRunoff);

  const warnings = {
    temp: (!isNaN(tempNum) && (tempNum > 32 || tempNum < 15)) ? 'Temperatura inusual para salas indoor (15°C - 32°C)' : null,
    humidity: (!isNaN(humNum) && (humNum > 85 || humNum < 30)) ? 'Humedad inusual para vegetativo/flora (30% - 85%)' : null,
    ph: (!isNaN(phNum) && (phNum > 6.6 || phNum < 5.2)) ? 'pH de riego fuera de rango óptimo para coco (5.5 - 6.2)' : null,
    ec: (!isNaN(ecNum) && ecNum > 2.3) ? 'EC de entrada alta: posible riesgo de sobrefertilización' : null,
    phRO: (!isNaN(phRO) && (phRO > 6.8 || phRO < 5.0)) ? 'pH del drenaje fuera de límites ideales del sustrato' : null,
    ecRO: (!isNaN(ecRO) && ecRO > 2.6) ? '¡EC de drenaje alta! Alerta de acumulación de sales en las macetas.' : null
  };

  const hasAnyWarning = Object.values(warnings).some(w => w !== null);

  return (
    <div className="space-y-8 max-w-7xl mx-auto select-none text-slate-750">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Registro Diario</h2>
        <p className="text-slate-500 mt-1 font-medium">Ingresa mediciones del clima, riegos y revisa el historial completo.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Formulario de Medición */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-2">
              <Activity size={20} className="text-emerald-600" />
              Registrar Medición
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1">Lote de Cultivo *</label>
                <select
                  value={lotId}
                  onChange={(e) => setLotId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-805 focus:outline-none focus:border-emerald-500 text-sm shadow-sm"
                  required
                >
                  <option value="">Selecciona un lote...</option>
                  {activeLots.map(l => (
                    <option key={l.id} value={l.id}>{l.name} ({l.stage})</option>
                  ))}
                </select>
              </div>

              {/* Guía Visual en Vivo */}
              {wateringGuide && (
                <div className="p-4 bg-emerald-55/10 border border-emerald-500/20 rounded-xl space-y-2 animate-in fade-in duration-200">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1">
                      <Info size={14} /> Guía del Riego Actual
                    </span>
                    <span className="text-[10px] bg-white text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-100 font-extrabold">
                      Semana {wateringGuide.week} ({wateringGuide.stage})
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-1">
                    <div className="p-2.5 bg-white border border-slate-100 rounded-lg text-center shadow-sm">
                      <span className="text-[10px] text-slate-400 uppercase block font-bold">pH Ideal</span>
                      <span className="text-lg font-black text-slate-900">{wateringGuide.ph.toFixed(1)}</span>
                    </div>
                    <div className="p-2.5 bg-white border border-slate-100 rounded-lg text-center shadow-sm">
                      <span className="text-[10px] text-slate-400 uppercase block font-bold">EC Ideal</span>
                      <span className="text-lg font-black text-slate-900">{wateringGuide.ec.toFixed(2)} mS/cm</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed italic pt-1 font-semibold">
                    {wateringGuide.notes}
                  </p>
                </div>
              )}

              {/* Parámetros Ambientales */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-1">Temperatura (°C) *</label>
                  <input
                    type="number"
                    step="0.1"
                    value={temp}
                    onChange={(e) => setTemp(e.target.value)}
                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-emerald-500 shadow-sm"
                    placeholder="Ej: 24.5"
                    required
                  />
                  {warnings.temp && <p className="text-[10px] text-amber-600 font-bold mt-1">{warnings.temp}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-1">Humedad (%) *</label>
                  <input
                    type="number"
                    value={humidity}
                    onChange={(e) => setHumidity(e.target.value)}
                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-emerald-500 shadow-sm"
                    placeholder="Ej: 55"
                    required
                  />
                  {warnings.humidity && <p className="text-[10px] text-amber-600 font-bold mt-1">{warnings.humidity}</p>}
                </div>
              </div>

              {/* Tarjeta interactiva de cálculo de VPD */}
              <div className={`p-4 rounded-xl border transition-all duration-300 ${
                vpdDetails 
                  ? 'bg-slate-50 border-slate-250 shadow-sm' 
                  : 'bg-slate-50/50 border-slate-200 border-dashed'
              }`}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-slate-500 font-bold">VPD Calculado</span>
                  {vpdDetails && (
                    <span className={`text-[9px] uppercase font-black px-2 py-0.5 rounded-full ${vpdDetails.statusClass}`}>
                      {vpdDetails.label}
                    </span>
                  )}
                </div>
                <div className="text-2xl font-black text-slate-900 tracking-tight">
                  {vpd !== null ? `${vpd} kPa` : '-.-- kPa'}
                </div>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed font-semibold">
                  {vpdDetails ? vpdDetails.desc : 'Ingresa temperatura y humedad para ver el déficit de presión de vapor.'}
                </p>
              </div>

              {/* Parámetros de Riego (Entrada) */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 shadow-sm">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block">1. Agua y Nutrientes (Entrada)</span>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1 font-bold">pH de Riego</label>
                    <input
                      type="number"
                      step="0.1"
                      value={ph}
                      onChange={(e) => setPh(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-500 text-sm shadow-sm"
                      placeholder="Ej: 5.8"
                    />
                    {warnings.ph && <p className="text-[9px] text-amber-600 font-bold mt-1">{warnings.ph}</p>}
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1 font-bold">EC Riego (mS/cm)</label>
                    <input
                      type="number"
                      step="0.01"
                      onChange={(e) => setEc(e.target.value)}
                      onBlur={() => handleECBlur(ec, setEc)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-500 text-sm shadow-sm"
                      placeholder="Ej: 1.4"
                    />
                    {warnings.ec && <p className="text-[9px] text-amber-600 font-bold mt-1">{warnings.ec}</p>}
                  </div>
                </div>
              </div>

              {/* Parámetros de Drenaje (Runoff/Salida) */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 shadow-sm">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block">2. Retorno / Drenaje (Runoff)</span>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1 font-bold">pH Drenaje</label>
                    <input
                      type="number"
                      step="0.1"
                      value={phRunoff}
                      onChange={(e) => setPhRunoff(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-500 text-sm shadow-sm"
                      placeholder="Ej: 6.2"
                    />
                    {warnings.phRO && <p className="text-[9px] text-amber-600 font-bold mt-1">{warnings.phRO}</p>}
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1 font-bold">EC Drenaje (mS/cm)</label>
                    <input
                      type="number"
                      step="0.01"
                      onChange={(e) => setEcRunoff(e.target.value)}
                      onBlur={() => handleECBlur(ecRunoff, setEcRunoff)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-500 text-sm shadow-sm"
                      placeholder="Ej: 1.8"
                    />
                    {warnings.ecRO && <p className="text-[9px] text-red-600 font-extrabold mt-1">{warnings.ecRO}</p>}
                  </div>
                </div>
              </div>

              {/* Registro Fotográfico Móvil */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 shadow-sm">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block flex items-center gap-1">
                  <Camera size={14} className="text-slate-500" />
                  3. Registro Fotográfico (Cámara/Medidores)
                </span>
                
                <div className="space-y-3">
                  <label className="block text-[11px] text-slate-450 mb-1 font-semibold">Toma una foto de la cama o los lápices medidores</label>
                  <input
                    id="photo-upload-input"
                    type="file"
                    accept="image/*"
                    capture="environment" // Fuerza apertura de la cámara trasera en celulares
                    onChange={handleFileChange}
                    className="w-full text-xs text-slate-550 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-extrabold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 transition cursor-pointer"
                  />

                  {/* Previsualización en Vivo de la foto tomada */}
                  {photoPreview && (
                    <div className="mt-3 relative w-32 h-32 border border-slate-200 rounded-2xl overflow-hidden shadow-md group">
                      <img src={photoPreview} alt="Vista previa de toma" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={removePhoto}
                        className="absolute top-1.5 right-1.5 bg-slate-900/70 hover:bg-red-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-black transition shadow"
                        title="Quitar foto"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Alertas generales de cultivo */}
              {hasAnyWarning && (
                <div className="p-3.5 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl flex items-start gap-2 animate-in fade-in duration-200 font-semibold">
                  <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                  <div>
                    <span className="font-extrabold block">Advertencias de Cultivo Detectadas:</span>
                    <ul className="list-disc pl-4 mt-1 font-medium space-y-0.5">
                      {Object.values(warnings).filter(w => w !== null).map((w, idx) => (
                        <li key={idx}>{w}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-655 mb-1">Agua (L / opcional)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={water}
                    onChange={(e) => setWater(e.target.value)}
                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-emerald-500 shadow-sm"
                    placeholder="Ej: 10"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-655 mb-1">Quién Regó *</label>
                  <select
                    value={wateredBy}
                    onChange={(e) => setWateredBy(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-850 focus:outline-none focus:border-emerald-500 text-sm shadow-sm"
                    required
                  >
                    <option value="">Selecciona...</option>
                    {currentUser && <option value={currentUser}>{currentUser} (Tú)</option>}
                    {helpers.map(h => (
                      <option key={h.id} value={h.name}>{h.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-655 mb-1">Notas / Observaciones</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-emerald-500 shadow-sm"
                  rows={2}
                  placeholder="Ej: Runoff un poco alto, subir lixiviación."
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={uploading}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition duration-150 shadow-sm text-sm disabled:opacity-50"
              >
                {uploading ? 'Subiendo foto y guardando...' : 'Guardar Registro'}
              </button>
            </form>
          </div>
        </div>

        {/* Historial de Registros */}
        <div className="lg:col-span-7">
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden h-full flex flex-col shadow-sm">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Calendar size={20} className="text-emerald-650" />
                Historial de Registros
              </h3>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="onlyWaterings"
                  checked={onlyWaterings}
                  onChange={(e) => setOnlyWaterings(e.target.checked)}
                  className="rounded border-slate-350 bg-white text-emerald-600 focus:ring-emerald-500/50"
                />
                <label htmlFor="onlyWaterings" className="text-xs text-slate-500 cursor-pointer select-none font-bold">
                  Ver solo riegos
                </label>
              </div>
            </div>

            {/* VISTA DESKTOP: TABLA HORIZONTAL */}
            <div className="hidden md:block flex-1 overflow-x-auto">
              <table className="w-full text-left border-collapse select-none">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 text-xs font-bold uppercase bg-slate-50">
                    <th className="p-4">Fecha/Hora</th>
                    <th className="p-4">Lote</th>
                    <th className="p-4">Temp/Hum</th>
                    <th className="p-4">VPD</th>
                    <th className="p-4">Riego (Entrada)</th>
                    <th className="p-4">Runoff (Salida)</th>
                    <th className="p-4">Foto</th>
                    <th className="p-4">Regado Por</th>
                    <th className="p-4 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredLogs.length > 0 ? (
                    filteredLogs.map(log => {
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
                        <tr key={log.id} className="hover:bg-slate-50/50 transition">
                          <td className="p-4 text-slate-600 font-semibold">{formattedDate}</td>
                          <td className="p-4 text-emerald-600 font-bold truncate max-w-[120px]">{lotName}</td>
                          <td className="p-4 text-slate-500">
                            <span className="text-slate-800 font-bold">{log.temp.toFixed(1)}°C</span> / {log.humidity}%
                          </td>
                          <td className="p-4">
                            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${vpdInfo.statusClass}`}>
                              {log.vpd.toFixed(2)} kPa
                            </span>
                          </td>
                          <td className="p-4 text-xs text-slate-500 leading-normal">
                            {log.water_amount || log.ph || log.ec ? (
                              <div>
                                {log.water_amount && <span className="block text-slate-855 font-bold">{log.water_amount} L agua</span>}
                                {(log.ph || log.ec) && (
                                  <span>pH: {log.ph || '-.-'} • EC: {log.ec || '-.-'}</span>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-400 italic">Sin riego</span>
                            )}
                          </td>
                          <td className="p-4 text-xs text-slate-500 leading-normal">
                            {log.ph_runoff || log.ec_runoff ? (
                              <div>
                                <span className="block text-emerald-600 font-bold">Runoff</span>
                                <span>pH: {log.ph_runoff || '-.-'} • EC: {log.ec_runoff || '-.-'}</span>
                              </div>
                            ) : (
                              <span className="text-slate-400 italic">Sin medir</span>
                            )}
                          </td>
                          <td className="p-4">
                            {log.image_url ? (
                              <button
                                onClick={() => setActivePhotoUrl(log.image_url!)}
                                className="p-1.5 hover:bg-slate-100 text-emerald-600 hover:text-emerald-700 rounded-lg transition"
                                title="Ver foto de la cama"
                              >
                                <ImageIcon size={18} />
                              </button>
                            ) : (
                              <span className="text-slate-305">-</span>
                            )}
                          </td>
                          <td className="p-4 text-slate-655 font-semibold truncate max-w-[100px]">{log.watered_by || 'José'}</td>
                          <td className="p-4 text-center">
                            <button
                              onClick={() => deleteLog(log.id)}
                              className="p-1.5 hover:bg-red-50 text-slate-455 hover:text-red-500 rounded-lg border border-transparent transition"
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
                      <td colSpan={9} className="p-12 text-center text-slate-400 font-semibold">
                        <Activity size={32} className="mx-auto text-emerald-500/20 mb-2" />
                        <p>No hay registros diarios guardados aún.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* VISTA MÓVIL: TARJETAS DIAGNÓSTICAS DE FÁCIL ACCESO */}
            <div className="block md:hidden flex-1 p-4 space-y-4 overflow-y-auto max-h-[75vh]">
              {filteredLogs.length > 0 ? (
                filteredLogs.map(log => {
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
                    <div key={log.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3.5 shadow-sm hover:border-slate-300 transition duration-150">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-extrabold text-slate-900 text-sm">{lotName}</h4>
                          <p className="text-[10px] text-slate-400 font-bold">{formattedDate}</p>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-200/60 text-slate-600 rounded-full border border-slate-300/30">
                          {log.watered_by || 'José'}
                        </span>
                      </div>

                      {/* Clima & VPD */}
                      <div className="grid grid-cols-3 gap-2 py-2 border-t border-b border-slate-200/50 text-center text-xs font-semibold">
                        <div>
                          <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Temp</span>
                          <span className="font-black text-slate-805">{log.temp.toFixed(1)}°C</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Hum</span>
                          <span className="font-black text-slate-805">{log.humidity}%</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">VPD</span>
                          <span className={`inline-block text-[9px] font-black px-1.5 py-0.5 rounded mt-0.5 ${vpdInfo.statusClass}`}>
                            {log.vpd.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {/* Riego vs Runoff */}
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Entrada (Riego)</span>
                          {log.water_amount || log.ph || log.ec ? (
                            <div className="font-bold text-slate-700 mt-1 space-y-0.5 leading-snug">
                              {log.water_amount && <span className="block">💧 {log.water_amount} L</span>}
                              <span className="block text-slate-800">pH: {log.ph || '-.-'} | EC: {log.ec || '-.-'}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic text-[10px] block mt-1">Sin riego</span>
                          )}
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Retorno (Runoff)</span>
                          {log.ph_runoff || log.ec_runoff ? (
                            <div className="font-bold text-emerald-700 mt-1 space-y-0.5 leading-snug">
                              <span className="block">🌱 Drenaje</span>
                              <span className="block text-emerald-800">pH: {log.ph_runoff || '-.-'} | EC: {log.ec_runoff || '-.-'}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic text-[10px] block mt-1">Sin medir</span>
                          )}
                        </div>
                      </div>

                      {log.notes && (
                        <p className="text-[11px] text-slate-500 font-medium leading-relaxed italic bg-white p-2 rounded-lg border border-slate-100">
                          {log.notes}
                        </p>
                      )}

                      {/* Botones y foto */}
                      <div className="flex justify-between items-center pt-2 border-t border-slate-200/50">
                        {log.image_url ? (
                          <button
                            onClick={() => setActivePhotoUrl(log.image_url!)}
                            className="flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700"
                          >
                            <ImageIcon size={14} />
                            Ver foto de medidores
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic font-semibold">Sin foto</span>
                        )}
                        <button
                          onClick={() => deleteLog(log.id)}
                          className="text-xs text-red-500 hover:text-red-650 font-bold flex items-center gap-1"
                        >
                          <Trash2 size={13} />
                          Eliminar
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-12 text-center text-slate-400 font-semibold">
                  <Activity size={32} className="mx-auto text-emerald-500/20 mb-2" />
                  <p>No hay registros diarios guardados aún.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox para ver Foto */}
      {activePhotoUrl && (
        <div 
          className="fixed inset-0 bg-slate-900/95 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200"
          onClick={() => setActivePhotoUrl(null)}
        >
          <div className="relative max-w-4xl max-h-[85vh] overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-2xl p-2 animate-in zoom-in-95 duration-200">
            <img 
              src={activePhotoUrl} 
              alt="Foto de la cama de cultivo" 
              className="max-h-[80vh] w-auto h-auto object-contain rounded-xl"
            />
            <button 
              onClick={() => setActivePhotoUrl(null)}
              className="absolute top-4 right-4 bg-slate-900/60 hover:bg-slate-900 text-white p-2 rounded-full transition text-sm font-bold shadow-md"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
