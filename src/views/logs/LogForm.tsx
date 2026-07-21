import { useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { Activity, AlertTriangle, Camera } from 'lucide-react';

import type { Helper, Lot, NutrientLine } from '../../types/grow';
import { willConvertFromMicrosiemens } from '../../utils/format';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { TextField, SelectField, TextAreaField } from '../../components/ui/Field';
import { WateringGuide } from './WateringGuide';
import type { useLogForm } from './useLogForm';

interface LogFormProps {
  form: ReturnType<typeof useLogForm>;
  activeLots: Lot[];
  selectedLot: Lot | undefined;
  helpers: Helper[];
  currentUser: string;
  nutrientLine: NutrientLine;
  submitting: boolean;
  onSubmit: (photo: File | null) => Promise<boolean>;
}

/** Sólo se permiten fotos: evita subir archivos arbitrarios al bucket. */
const MAX_PHOTO_BYTES = 8 * 1024 * 1024;

export const LogForm = ({
  form,
  activeLots,
  selectedLot,
  helpers,
  currentUser,
  nutrientLine,
  submitting,
  onSubmit,
}: LogFormProps) => {
  const { values, setField, derived, normalizeECField } = form;
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setPhotoError(null);

    if (!file) {
      setPhoto(null);
      setPhotoPreview(null);
      return;
    }

    if (!file.type.startsWith('image/')) {
      setPhotoError('El archivo seleccionado no es una imagen.');
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setPhotoError('La imagen supera los 8 MB.');
      return;
    }

    setPhoto(file);
    const reader = new FileReader();
    reader.onloadend = () => setPhotoPreview(String(reader.result));
    reader.readAsDataURL(file);
  };

  const removePhoto = () => {
    setPhoto(null);
    setPhotoPreview(null);
    setPhotoError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const saved = await onSubmit(photo);
    if (saved) removePhoto();
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-2">
        <Activity size={20} className="text-emerald-600" />
        Registrar Medición
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <SelectField
          label="Lote de Cultivo"
          required
          value={values.lotId}
          onChange={event => setField('lotId', event.target.value)}
        >
          <option value="">Selecciona un lote...</option>
          {activeLots.map(lot => (
            <option key={lot.id} value={lot.id}>
              {lot.name} ({lot.stage})
            </option>
          ))}
        </SelectField>

        {selectedLot && <WateringGuide lot={selectedLot} nutrientLine={nutrientLine} />}

        <div className="grid grid-cols-2 gap-4">
          <TextField
            label="Temperatura (°C)"
            required
            type="number"
            step="0.1"
            value={values.temp}
            onChange={event => setField('temp', event.target.value)}
            placeholder="Ej: 24.5"
            warning={derived.warnings.temp}
          />
          <TextField
            label="Humedad (%)"
            required
            type="number"
            value={values.humidity}
            onChange={event => setField('humidity', event.target.value)}
            placeholder="Ej: 55"
            warning={derived.warnings.humidity}
          />
        </div>

        {/* VPD calculado en vivo */}
        <div
          className={`p-4 rounded-xl border transition-all duration-300 ${
            derived.vpdInfo
              ? 'bg-slate-50 border-slate-300 shadow-sm'
              : 'bg-slate-50/50 border-slate-200 border-dashed'
          }`}
        >
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-slate-500 font-bold">VPD Calculado</span>
            {derived.vpdInfo && (
              <span
                className={`text-[9px] uppercase font-black px-2 py-0.5 rounded-full ${derived.vpdInfo.statusClass}`}
              >
                {derived.vpdInfo.label}
              </span>
            )}
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">
            {derived.vpd !== null ? `${derived.vpd} kPa` : '-.-- kPa'}
          </div>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed font-semibold">
            {derived.vpdInfo
              ? derived.vpdInfo.desc
              : 'Ingresá temperatura y humedad para ver el déficit de presión de vapor.'}
          </p>
        </div>

        {/* Entrada */}
        <fieldset className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 shadow-sm">
          <legend className="text-xs font-bold text-slate-600 uppercase tracking-wider px-1">
            1. Agua y Nutrientes (Entrada)
          </legend>
          <div className="grid grid-cols-2 gap-4">
            <TextField
              label="pH de Riego"
              type="number"
              step="0.1"
              value={values.ph}
              onChange={event => setField('ph', event.target.value)}
              placeholder="Ej: 5.8"
              warning={derived.warnings.ph}
            />
            <TextField
              label="EC Riego (mS/cm o µS)"
              type="text"
              inputMode="decimal"
              value={values.ec}
              onChange={event => setField('ec', event.target.value.replace(/[^0-9.]/g, ''))}
              onBlur={() => normalizeECField('ec')}
              placeholder="Ej: 1.4 o 1400"
              hint={
                willConvertFromMicrosiemens(values.ec)
                  ? `→ Se guardará como ${(Number.parseFloat(values.ec) / 1000).toFixed(2)} mS/cm`
                  : undefined
              }
              warning={derived.warnings.ec}
            />
          </div>
        </fieldset>

        {/* Drenaje */}
        <fieldset className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 shadow-sm">
          <legend className="text-xs font-bold text-slate-600 uppercase tracking-wider px-1">
            2. Retorno / Drenaje (Runoff)
          </legend>
          <div className="grid grid-cols-2 gap-4">
            <TextField
              label="pH Drenaje"
              type="number"
              step="0.1"
              value={values.phRunoff}
              onChange={event => setField('phRunoff', event.target.value)}
              placeholder="Ej: 6.2"
              warning={derived.warnings.phRunoff}
            />
            <TextField
              label="EC Drenaje (mS/cm o µS)"
              type="text"
              inputMode="decimal"
              value={values.ecRunoff}
              onChange={event =>
                setField('ecRunoff', event.target.value.replace(/[^0-9.]/g, ''))
              }
              onBlur={() => normalizeECField('ecRunoff')}
              placeholder="Ej: 1.8 o 1800"
              hint={
                willConvertFromMicrosiemens(values.ecRunoff)
                  ? `→ Se guardará como ${(Number.parseFloat(values.ecRunoff) / 1000).toFixed(2)} mS/cm`
                  : undefined
              }
              warning={derived.warnings.ecRunoff}
            />
          </div>
        </fieldset>

        {/* Foto */}
        <fieldset className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 shadow-sm">
          <legend className="text-xs font-bold text-slate-600 uppercase tracking-wider px-1 flex items-center gap-1">
            <Camera size={14} className="text-slate-500" />
            3. Registro Fotográfico
          </legend>

          <label
            htmlFor="photo-upload-input"
            className="block text-[11px] text-slate-500 font-semibold"
          >
            Tomá una foto de la cama o de los medidores
          </label>
          <input
            id="photo-upload-input"
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handlePhotoChange}
            className="w-full text-xs text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-extrabold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 transition cursor-pointer"
          />

          {photoError && (
            <p role="alert" className="text-[11px] text-red-600 font-bold">
              {photoError}
            </p>
          )}

          {photoPreview && (
            <div className="mt-3 relative w-32 h-32 border border-slate-200 rounded-2xl overflow-hidden shadow-md">
              <img
                src={photoPreview}
                alt="Vista previa de la foto seleccionada"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={removePhoto}
                aria-label="Quitar foto"
                className="absolute top-1.5 right-1.5 bg-slate-900/70 hover:bg-red-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-black transition shadow"
              >
                ✕
              </button>
            </div>
          )}
        </fieldset>

        {derived.warningList.length > 0 && (
          <div
            role="status"
            className="p-3.5 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl flex items-start gap-2 animate-in fade-in duration-200 font-semibold"
          >
            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
            <div>
              <span className="font-extrabold block">Advertencias de Cultivo Detectadas:</span>
              <ul className="list-disc pl-4 mt-1 font-medium space-y-0.5">
                {derived.warningList.map(warning => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <TextField
            label="Agua (L / opcional)"
            type="number"
            step="0.1"
            value={values.water}
            onChange={event => setField('water', event.target.value)}
            placeholder="Ej: 10"
          />
          <SelectField
            label="Quién Regó"
            required
            value={values.wateredBy}
            onChange={event => setField('wateredBy', event.target.value)}
          >
            <option value="">Selecciona...</option>
            {currentUser && <option value={currentUser}>{currentUser} (Tú)</option>}
            {helpers.map(helper => (
              <option key={helper.id} value={helper.name}>
                {helper.name}
              </option>
            ))}
          </SelectField>
        </div>

        <TextAreaField
          label="Notas / Observaciones"
          rows={2}
          value={values.notes}
          onChange={event => setField('notes', event.target.value)}
          placeholder="Ej: Runoff un poco alto, subir lixiviación."
        />

        <Button type="submit" fullWidth disabled={submitting} className="py-3">
          {submitting ? 'Guardando...' : 'Guardar Registro'}
        </Button>
      </form>
    </Card>
  );
};
