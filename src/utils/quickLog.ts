/**
 * Estado que viaja de la agenda al Registro Diario cuando se usa "Registrar Riego".
 *
 * Antes esto se pasaba por `sessionStorage` y sólo se limpiaba si el riego se
 * completaba: si el usuario cancelaba, el formulario quedaba precargado con
 * datos viejos en cada visita posterior. Con el estado del router el dato muere
 * junto con la navegación.
 */
export interface QuickLogState {
  lotId: string;
  taskId: string;
  ph?: string;
  ec?: string;
}

/** Extrae del `location.state` un QuickLogState válido, o `null`. */
export const readQuickLogState = (state: unknown): QuickLogState | null => {
  if (typeof state !== 'object' || state === null) return null;
  const candidate = state as Partial<QuickLogState>;
  if (typeof candidate.lotId !== 'string' || typeof candidate.taskId !== 'string') {
    return null;
  }
  return {
    lotId: candidate.lotId,
    taskId: candidate.taskId,
    ph: typeof candidate.ph === 'string' ? candidate.ph : undefined,
    ec: typeof candidate.ec === 'string' ? candidate.ec : undefined,
  };
};

/** Lee los objetivos de pH y EC embebidos en las notas de una tarea de cronograma. */
export const extractTargetsFromNotes = (
  notes: string | undefined
): { ph?: string; ec?: string } => {
  if (!notes) return {};
  return {
    ph: /pH:\s*([0-9.]+)/i.exec(notes)?.[1],
    ec: /EC:\s*([0-9.]+)/i.exec(notes)?.[1],
  };
};
