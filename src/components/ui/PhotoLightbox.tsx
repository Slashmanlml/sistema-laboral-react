import { useEffect } from 'react';

interface PhotoLightboxProps {
  url: string | null;
  onClose: () => void;
}

/** Visor de fotos a pantalla completa. Estaba duplicado en Dashboard y Registro Diario. */
export const PhotoLightbox = ({ url, onClose }: PhotoLightboxProps) => {
  useEffect(() => {
    if (!url) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [url, onClose]);

  if (!url) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Foto del registro"
      className="fixed inset-0 bg-slate-900/95 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative max-w-4xl max-h-[85vh] overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-2xl p-2 animate-in zoom-in-95 duration-200"
        onClick={event => event.stopPropagation()}
      >
        <img
          src={url}
          alt="Foto de la cama de cultivo"
          className="max-h-[80vh] w-auto h-auto object-contain rounded-xl"
        />
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar foto"
          className="absolute top-4 right-4 bg-slate-900/60 hover:bg-slate-900 text-white p-2 rounded-full transition text-sm font-bold shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
        >
          ✕
        </button>
      </div>
    </div>
  );
};
