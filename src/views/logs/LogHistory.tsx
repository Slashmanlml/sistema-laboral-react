import { useMemo, useState } from 'react';
import { Activity, Calendar, Image as ImageIcon, Trash2 } from 'lucide-react';

import type { Log, Lot } from '../../types/grow';
import { getVPDInfo } from '../../utils/calculations';
import { formatDateTime, showOptional } from '../../utils/format';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/Card';

const LOGS_PER_PAGE = 20;

interface LogHistoryProps {
  logs: Log[];
  lotsById: Map<string, Lot>;
  hasMoreLogs: boolean;
  loadingMoreLogs: boolean;
  onLoadMore: () => void;
  onDelete: (id: string) => void;
  onViewPhoto: (url: string) => void;
}

export const LogHistory = ({
  logs,
  lotsById,
  hasMoreLogs,
  loadingMoreLogs,
  onLoadMore,
  onDelete,
  onViewPhoto,
}: LogHistoryProps) => {
  const [onlyWaterings, setOnlyWaterings] = useState(false);
  const [page, setPage] = useState(1);

  const filteredLogs = useMemo(
    () =>
      onlyWaterings
        ? logs.filter(log => typeof log.water_amount === 'number' && log.water_amount > 0)
        : logs,
    [logs, onlyWaterings]
  );

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / LOGS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const pageLogs = filteredLogs.slice(
    (currentPage - 1) * LOGS_PER_PAGE,
    currentPage * LOGS_PER_PAGE
  );

  const lotName = (lotId: string) => lotsById.get(lotId)?.name ?? 'Lote Desconocido';
  const isLastPage = currentPage === totalPages;

  const pagination = (
    <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-slate-100 bg-slate-50">
      <Button
        variant="ghost"
        size="sm"
        disabled={currentPage === 1}
        onClick={() => setPage(p => Math.max(1, p - 1))}
      >
        ← Anterior
      </Button>
      <span className="text-xs font-semibold text-slate-500">
        Página {currentPage} de {totalPages}
      </span>
      {isLastPage && hasMoreLogs ? (
        <Button variant="ghost" size="sm" disabled={loadingMoreLogs} onClick={onLoadMore}>
          {loadingMoreLogs ? 'Cargando...' : 'Traer más ↓'}
        </Button>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          disabled={isLastPage}
          onClick={() => setPage(p => Math.min(totalPages, p + 1))}
        >
          Siguiente →
        </Button>
      )}
    </div>
  );

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden h-full flex flex-col shadow-sm">
      <div className="p-6 border-b border-slate-100 flex items-center justify-between gap-4">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <Calendar size={20} className="text-emerald-600" />
          Historial de Registros
        </h3>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="onlyWaterings"
            checked={onlyWaterings}
            onChange={event => {
              setOnlyWaterings(event.target.checked);
              setPage(1);
            }}
            className="rounded border-slate-300 bg-white text-emerald-600 focus:ring-emerald-500/50"
          />
          <label
            htmlFor="onlyWaterings"
            className="text-xs text-slate-500 cursor-pointer font-bold"
          >
            Ver solo riegos
          </label>
        </div>
      </div>

      {filteredLogs.length === 0 ? (
        <EmptyState
          icon={<Activity size={32} />}
          title="No hay registros diarios guardados aún."
          className="py-12"
        />
      ) : (
        <>
          {/* Desktop: tabla */}
          <div className="hidden md:block flex-1 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 text-xs font-bold uppercase bg-slate-50">
                  <th scope="col" className="p-4">Fecha/Hora</th>
                  <th scope="col" className="p-4">Lote</th>
                  <th scope="col" className="p-4">Temp/Hum</th>
                  <th scope="col" className="p-4">VPD</th>
                  <th scope="col" className="p-4">Riego (Entrada)</th>
                  <th scope="col" className="p-4">Runoff (Salida)</th>
                  <th scope="col" className="p-4">Foto</th>
                  <th scope="col" className="p-4">Regado Por</th>
                  <th scope="col" className="p-4 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {pageLogs.map(log => {
                  const vpdInfo = getVPDInfo(log.vpd);
                  return (
                    <tr key={log.id} className="hover:bg-slate-50/50 transition">
                      <td className="p-4 text-slate-600 font-semibold">
                        {formatDateTime(log.date)}
                      </td>
                      <td className="p-4 text-emerald-600 font-bold truncate max-w-[120px]">
                        {lotName(log.lot_id)}
                      </td>
                      <td className="p-4 text-slate-500">
                        <span className="text-slate-800 font-bold">{log.temp.toFixed(1)}°C</span>{' '}
                        / {log.humidity}%
                      </td>
                      <td className="p-4">
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${vpdInfo.statusClass}`}
                        >
                          {log.vpd.toFixed(2)} kPa
                        </span>
                      </td>
                      <td className="p-4 text-xs text-slate-500 leading-normal">
                        {log.water_amount || log.ph || log.ec ? (
                          <div>
                            {log.water_amount && (
                              <span className="block text-slate-800 font-bold">
                                {log.water_amount} L agua
                              </span>
                            )}
                            {(log.ph || log.ec) && (
                              <span>
                                pH: {showOptional(log.ph)} • EC: {showOptional(log.ec, 2)}
                              </span>
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
                            <span>
                              pH: {showOptional(log.ph_runoff)} • EC:{' '}
                              {showOptional(log.ec_runoff, 2)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Sin medir</span>
                        )}
                      </td>
                      <td className="p-4">
                        {log.image_url ? (
                          <button
                            type="button"
                            onClick={() => onViewPhoto(log.image_url!)}
                            aria-label="Ver foto del registro"
                            className="p-1.5 hover:bg-slate-100 text-emerald-600 hover:text-emerald-700 rounded-lg transition"
                          >
                            <ImageIcon size={18} />
                          </button>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                      <td className="p-4 text-slate-600 font-semibold truncate max-w-[100px]">
                        {log.watered_by ?? '–'}
                      </td>
                      <td className="p-4 text-center">
                        <button
                          type="button"
                          onClick={() => onDelete(log.id)}
                          aria-label="Eliminar registro"
                          className="p-1.5 hover:bg-red-50 text-slate-500 hover:text-red-500 rounded-lg border border-transparent transition"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {pagination}
          </div>

          {/* Móvil: tarjetas */}
          <div className="block md:hidden flex-1 p-4 space-y-4 overflow-y-auto max-h-[75vh]">
            {pageLogs.map(log => {
              const vpdInfo = getVPDInfo(log.vpd);
              return (
                <div
                  key={log.id}
                  className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3.5 shadow-sm"
                >
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-sm">
                        {lotName(log.lot_id)}
                      </h4>
                      <p className="text-[10px] text-slate-400 font-bold">
                        {formatDateTime(log.date)}
                      </p>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-200/60 text-slate-600 rounded-full border border-slate-300 shrink-0">
                      {log.watered_by ?? '–'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 py-2 border-t border-b border-slate-200/50 text-center text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">
                        Temp
                      </span>
                      <span className="font-black text-slate-800">{log.temp.toFixed(1)}°C</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">
                        Hum
                      </span>
                      <span className="font-black text-slate-800">{log.humidity}%</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">
                        VPD
                      </span>
                      <span
                        className={`inline-block text-[9px] font-black px-1.5 py-0.5 rounded mt-0.5 ${vpdInfo.statusClass}`}
                      >
                        {log.vpd.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">
                        Entrada (Riego)
                      </span>
                      {log.water_amount || log.ph || log.ec ? (
                        <div className="font-bold text-slate-700 mt-1 space-y-0.5 leading-snug">
                          {log.water_amount && <span className="block">💧 {log.water_amount} L</span>}
                          <span className="block text-slate-800">
                            pH: {showOptional(log.ph)} | EC: {showOptional(log.ec, 2)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[10px] block mt-1">
                          Sin riego
                        </span>
                      )}
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">
                        Retorno (Runoff)
                      </span>
                      {log.ph_runoff || log.ec_runoff ? (
                        <div className="font-bold text-emerald-700 mt-1 space-y-0.5 leading-snug">
                          <span className="block">🌱 Drenaje</span>
                          <span className="block text-emerald-800">
                            pH: {showOptional(log.ph_runoff)} | EC:{' '}
                            {showOptional(log.ec_runoff, 2)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[10px] block mt-1">
                          Sin medir
                        </span>
                      )}
                    </div>
                  </div>

                  {log.notes && (
                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed italic bg-white p-2 rounded-lg border border-slate-100">
                      {log.notes}
                    </p>
                  )}

                  <div className="flex justify-between items-center pt-2 border-t border-slate-200/50">
                    {log.image_url ? (
                      <button
                        type="button"
                        onClick={() => onViewPhoto(log.image_url!)}
                        className="flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700"
                      >
                        <ImageIcon size={14} />
                        Ver foto
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-400 italic font-semibold">
                        Sin foto
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => onDelete(log.id)}
                      className="text-xs text-red-600 font-bold flex items-center gap-1"
                    >
                      <Trash2 size={13} />
                      Eliminar
                    </button>
                  </div>
                </div>
              );
            })}
            {pagination}
          </div>
        </>
      )}
    </div>
  );
};
