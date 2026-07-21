import { Image as ImageIcon } from 'lucide-react';
import type { Log, Lot } from '../../types/grow';
import { formatDateTime, showOptional } from '../../utils/format';

interface RecentWateringsProps {
  waterings: Log[];
  lotsById: Map<string, Lot>;
  onViewPhoto: (url: string) => void;
}

export const RecentWaterings = ({
  waterings,
  lotsById,
  onViewPhoto,
}: RecentWateringsProps) => (
  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
    <div className="flex justify-between items-center mb-4 gap-4">
      <h3 className="text-lg font-bold text-slate-800">Monitoreo Diario de Riegos</h3>
      <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-1 rounded-md shrink-0">
        Últimos {waterings.length} riegos
      </span>
    </div>

    {waterings.length > 0 ? (
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500 text-xs font-bold uppercase bg-slate-50">
              <th scope="col" className="py-3 px-4">Fecha/Hora</th>
              <th scope="col" className="py-3 px-4">Lote</th>
              <th scope="col" className="py-3 px-4">Agua</th>
              <th scope="col" className="py-3 px-4">Riego (Entrada)</th>
              <th scope="col" className="py-3 px-4">Drenaje (Runoff)</th>
              <th scope="col" className="py-3 px-4">Foto</th>
              <th scope="col" className="py-3 px-4">Quién Regó</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {waterings.map(log => (
              <tr key={log.id} className="hover:bg-slate-50/50 transition">
                <td className="py-3.5 px-4 text-slate-600 font-semibold">
                  {formatDateTime(log.date)}
                </td>
                <td className="py-3.5 px-4 text-emerald-600 font-bold">
                  {lotsById.get(log.lot_id)?.name ?? 'Lote Desconocido'}
                </td>
                <td className="py-3.5 px-4 text-slate-800 font-semibold">
                  {log.water_amount} L
                </td>
                <td className="py-3.5 px-4 text-slate-500">
                  pH: <span className="text-slate-800 font-bold">{showOptional(log.ph)}</span> •
                  EC:{' '}
                  <span className="text-slate-800 font-bold">
                    {showOptional(log.ec, 2)} mS/cm
                  </span>
                </td>
                <td className="py-3.5 px-4 text-slate-500">
                  {log.ph_runoff || log.ec_runoff ? (
                    <>
                      pH:{' '}
                      <span className="text-emerald-600 font-bold">
                        {showOptional(log.ph_runoff)}
                      </span>{' '}
                      • EC:{' '}
                      <span className="text-emerald-600 font-bold">
                        {showOptional(log.ec_runoff, 2)} mS/cm
                      </span>
                    </>
                  ) : (
                    <span className="text-slate-400 italic text-xs">Sin medir</span>
                  )}
                </td>
                <td className="py-3.5 px-4">
                  {log.image_url ? (
                    <button
                      type="button"
                      onClick={() => onViewPhoto(log.image_url!)}
                      aria-label="Ver foto del riego"
                      className="p-1 hover:bg-slate-100 text-emerald-600 hover:text-emerald-700 rounded transition"
                    >
                      <ImageIcon size={18} />
                    </button>
                  ) : (
                    <span className="text-slate-300">-</span>
                  )}
                </td>
                <td className="py-3.5 px-4 text-slate-600 font-semibold">
                  {log.watered_by ?? '–'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ) : (
      <div className="py-8 text-center text-slate-400 text-sm font-semibold">
        No hay riegos registrados recientemente en el diario.
      </div>
    )}
  </div>
);
