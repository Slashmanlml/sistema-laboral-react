// =============================================================================
// Configuración del asistente de IA.
//
// SEGURIDAD: la API key se guarda SOLO en localStorage de este dispositivo.
//
// Antes se sincronizaba con `supabase.auth.updateUser({ data: {...} })`, es
// decir dentro de `user_metadata`. Eso es un lugar pésimo para un secreto:
//   · `user_metadata` viaja dentro del JWT en cada request al backend;
//   · el propio cliente puede editarlo, así que no ofrece ninguna garantía;
//   · queda en logs de red, en la sesión persistida y en cualquier volcado.
//
// Se dejó de sincronizar y además se limpia lo que haya quedado guardado de
// versiones anteriores (ver `purgeLegacyCloudKey`).
//
// A futuro, lo correcto es que la clave no toque nunca el navegador: una Edge
// Function de Supabase que reciba el mensaje, agregue la clave del servidor y
// haga la llamada al proveedor.
// =============================================================================

import { supabase } from '../lib/supabaseClient';

export type AiProvider = 'gemini' | 'openai';

export interface AiConfig {
  provider: AiProvider;
  apiKey: string;
  model: string;
}

const KEYS = {
  provider: 'grow_ai_provider',
  apiKey: 'grow_ai_api_key',
  model: 'grow_ai_model',
} as const;

/** Evento propio para que el widget y los ajustes se mantengan sincronizados. */
export const AI_CONFIG_CHANGED_EVENT = 'grow:ai-config-changed';

const readStorage = (key: string): string => {
  try {
    return localStorage.getItem(key) ?? '';
  } catch {
    return '';
  }
};

export const getAiConfig = (): AiConfig => ({
  provider: readStorage(KEYS.provider) === 'openai' ? 'openai' : 'gemini',
  apiKey: readStorage(KEYS.apiKey),
  model: readStorage(KEYS.model),
});

export const saveAiConfig = (config: AiConfig): void => {
  try {
    localStorage.setItem(KEYS.provider, config.provider);
    localStorage.setItem(KEYS.apiKey, config.apiKey.trim());
    localStorage.setItem(KEYS.model, config.model.trim());
  } catch (error) {
    console.error('No se pudo guardar la configuración de IA:', error);
  }
  window.dispatchEvent(new Event(AI_CONFIG_CHANGED_EVENT));
};

export const setAiModel = (model: string): void => {
  try {
    localStorage.setItem(KEYS.model, model);
  } catch {
    /* almacenamiento no disponible */
  }
};

export const clearAiConfig = (): void => {
  try {
    Object.values(KEYS).forEach(key => localStorage.removeItem(key));
  } catch {
    /* almacenamiento no disponible */
  }
  window.dispatchEvent(new Event(AI_CONFIG_CHANGED_EVENT));
};

/**
 * Borra la API key que versiones anteriores dejaron en `user_metadata`.
 * Se ejecuta una vez por sesión al iniciar; si falla, no es bloqueante.
 */
export const purgeLegacyCloudKey = async (
  metadata: Record<string, unknown> | undefined
): Promise<void> => {
  if (!metadata || metadata.grow_ai_api_key === undefined) return;

  // Rescatar la clave localmente antes de borrarla de la nube, para no dejar al
  // usuario sin asistente después de actualizar.
  const legacyKey = metadata.grow_ai_api_key;
  if (typeof legacyKey === 'string' && legacyKey && !readStorage(KEYS.apiKey)) {
    const legacyProvider = metadata.grow_ai_provider;
    const legacyModel = metadata.grow_ai_model;
    saveAiConfig({
      provider: legacyProvider === 'openai' ? 'openai' : 'gemini',
      apiKey: legacyKey,
      model: typeof legacyModel === 'string' ? legacyModel : '',
    });
  }

  try {
    await supabase.auth.updateUser({
      data: { grow_ai_api_key: null, grow_ai_provider: null, grow_ai_model: null },
    });
  } catch (error) {
    console.error('No se pudo limpiar la API key almacenada en la nube:', error);
  }
};
