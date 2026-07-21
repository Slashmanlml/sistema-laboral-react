import { useCallback, useMemo, useState } from 'react';
import type { Log } from '../../types/grow';
import { calculateVPD, getVPDInfo } from '../../utils/calculations';
import { parseEC, parseOptionalNumber } from '../../utils/format';
import { computeLogWarnings, listWarnings } from './logWarnings';

export interface LogFormState {
  lotId: string;
  temp: string;
  humidity: string;
  ph: string;
  ec: string;
  phRunoff: string;
  ecRunoff: string;
  water: string;
  wateredBy: string;
  notes: string;
}

const EMPTY_FORM: LogFormState = {
  lotId: '',
  temp: '',
  humidity: '',
  ph: '',
  ec: '',
  phRunoff: '',
  ecRunoff: '',
  water: '',
  wateredBy: '',
  notes: '',
};

/**
 * Estado del formulario de registro diario, con los valores derivados que
 * necesitan tanto el formulario como el asistente Athena.
 */
export const useLogForm = (initial?: Partial<LogFormState>) => {
  const [values, setValues] = useState<LogFormState>({ ...EMPTY_FORM, ...initial });

  const setField = useCallback(<K extends keyof LogFormState>(field: K, value: LogFormState[K]) => {
    setValues(prev => ({ ...prev, [field]: value }));
  }, []);

  const reset = useCallback((next?: Partial<LogFormState>) => {
    setValues({ ...EMPTY_FORM, ...next });
  }, []);

  /** Normaliza una EC escrita en µS/cm al salir del campo. */
  const normalizeECField = useCallback(
    (field: 'ec' | 'ecRunoff') => {
      setValues(prev => {
        const parsed = parseEC(prev[field]);
        if (parsed === undefined) return prev;
        return { ...prev, [field]: parsed.toFixed(2) };
      });
    },
    []
  );

  const derived = useMemo(() => {
    const temp = parseOptionalNumber(values.temp);
    const humidity = parseOptionalNumber(values.humidity);
    const vpd = temp !== undefined && humidity !== undefined ? calculateVPD(temp, humidity) : null;

    const warnings = computeLogWarnings({
      temp: values.temp,
      humidity: values.humidity,
      ph: values.ph,
      ec: values.ec,
      phRunoff: values.phRunoff,
      ecRunoff: values.ecRunoff,
    });

    return {
      temp,
      humidity,
      vpd,
      vpdInfo: vpd !== null ? getVPDInfo(vpd) : null,
      inputPH: parseOptionalNumber(values.ph),
      inputEC: parseEC(values.ec),
      runoffPH: parseOptionalNumber(values.phRunoff),
      runoffEC: parseEC(values.ecRunoff),
      warnings,
      warningList: listWarnings(warnings),
    };
  }, [values]);

  /** Arma el registro listo para guardar, o `null` si faltan campos obligatorios. */
  const buildLog = useCallback((): Omit<Log, 'id' | 'date' | 'vpd'> | null => {
    if (!values.lotId || derived.temp === undefined || derived.humidity === undefined) {
      return null;
    }
    return {
      lot_id: values.lotId,
      temp: derived.temp,
      humidity: derived.humidity,
      ph: derived.inputPH,
      ec: derived.inputEC,
      ph_runoff: derived.runoffPH,
      ec_runoff: derived.runoffEC,
      water_amount: parseOptionalNumber(values.water),
      watered_by: values.wateredBy || undefined,
      notes: values.notes.trim() || undefined,
    };
  }, [values, derived]);

  return { values, setField, reset, normalizeECField, derived, buildLog };
};
