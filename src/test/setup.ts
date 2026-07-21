import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// jsdom crea `window.localStorage`, pero vitest no siempre lo expone como global
// suelto. El código de la app usa `localStorage.getItem(...)` directo, así que se
// instala un almacenamiento en memoria cuando falta.
const createMemoryStorage = (): Storage => {
  let store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, String(value));
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => {
      store = new Map();
    },
  } as Storage;
};

const ensureStorage = (name: 'localStorage' | 'sessionStorage') => {
  const existing = (globalThis as Record<string, unknown>)[name];
  if (existing) return existing as Storage;
  const storage = createMemoryStorage();
  Object.defineProperty(globalThis, name, { value: storage, writable: true });
  if (typeof window !== 'undefined') {
    Object.defineProperty(window, name, { value: storage, writable: true });
  }
  return storage;
};

const localStorageRef = ensureStorage('localStorage');
const sessionStorageRef = ensureStorage('sessionStorage');

// Desmontar los componentes entre tests para que no se pisen entre sí.
afterEach(() => {
  cleanup();
  localStorageRef.clear();
  sessionStorageRef.clear();
});

// jsdom no implementa scrollIntoView y el widget de chat lo usa.
Element.prototype.scrollIntoView = vi.fn();

// Chart.js necesita un contexto de canvas que jsdom no provee.
HTMLCanvasElement.prototype.getContext =
  vi.fn() as unknown as typeof HTMLCanvasElement.prototype.getContext;
