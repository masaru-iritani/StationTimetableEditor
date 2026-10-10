import { useState, useRef, useEffect } from 'react';
import type { FC } from 'react';
import { Plus, Trash2, HelpCircle } from 'lucide-react';
import type { TimetableRow, TrainType, Destination } from '../utils/timetableState';
import { parseDeparture } from '../utils/timetableState';
import { EditableHeader } from './EditableHeader';
import { EditMinutesDialog } from './EditMinutesDialog';

interface TimetableGridProps {
  headers: string[];
  rows: TimetableRow[];
  trainTypes: TrainType[];
  destinations: Destination[];
  onChange: (headers: string[], rows: TimetableRow[]) => void;
}

export const TimetableGrid: FC<TimetableGridProps> = ({
  headers,
  rows,
  trainTypes,
  destinations,
  onChange,
}) => {
  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeHour, setActiveHour] = useState<number | null>(null);
  const [activeColIndex, setActiveColIndex] = useState<number | null>(null);
  /** The raw departure string being edited, or null when adding a new departure. */
  const [activeDeparture, setActiveDeparture] = useState<string | null>(null);

  // Column management
  const handleAddColumn = () => {
    const nextColIndex = headers.length;
    const newHeaders = [...headers, `Route ${nextColIndex + 1}`];
    const newRows = rows.map(row => ({
      ...row,
      minutes: [...row.minutes, []]
    }));
    onChange(newHeaders, newRows);
  };

  const handleRemoveColumn = (colIndex: number) => {
    if (headers.length <= 1) return; // Keep at least one column
    
    const newHeaders = headers.filter((_, idx) => idx !== colIndex);
    const newRows = rows.map(row => ({
      ...row,
      minutes: row.minutes.filter((_, idx) => idx !== colIndex)
    }));
    onChange(newHeaders, newRows);
  };

  const handleUpdateHeader = (colIndex: number, newName: string) => {
    const newHeaders = [...headers];
    newHeaders[colIndex] = newName;
    onChange(newHeaders, rows);
  };

  // Row management
  const handleAddRowTop = () => {
    if (rows.length === 0) {
      const newRow: TimetableRow = { hour: 6, minutes: headers.map(() => []) };
      onChange(headers, [newRow]);
      return;
    }
    const firstHour = rows[0].hour;
    const newRow: TimetableRow = {
      hour: firstHour - 1,
      minutes: headers.map(() => [])
    };
    onChange(headers, [newRow, ...rows]);
  };

  const handleAddRowBottom = () => {
    if (rows.length === 0) {
      const newRow: TimetableRow = { hour: 6, minutes: headers.map(() => []) };
      onChange(headers, [newRow]);
      return;
    }
    const lastHour = rows[rows.length - 1].hour;
    const newRow: TimetableRow = {
      hour: lastHour + 1,
      minutes: headers.map(() => [])
    };
    onChange(headers, [...rows, newRow]);
  };

  const handleRemoveRow = (rowIndex: number) => {
    const newRows = rows.filter((_, idx) => idx !== rowIndex);
    onChange(headers, newRows);
  };

  // Check if a row is completely empty (no minutes in any column)
  const isRowEmpty = (row: TimetableRow) => {
    return row.minutes.every(mins => mins.length === 0);
  };

  // Cell editing helpers
  const updateCellMinutes = (hour: number, colIndex: number, updater: (prev: string[]) => string[]) => {
    const newRows = rows.map(row => {
      if (row.hour === hour) {
        const updatedMinutes = [...row.minutes];
        updatedMinutes[colIndex] = updater(updatedMinutes[colIndex] ?? []);
        return { ...row, minutes: updatedMinutes };
      }
      return row;
    });
    onChange(headers, newRows);
  };

  /** Open the dialog in add mode when clicking an empty cell area. */
  const handleEmptyCellClick = (hour: number, colIndex: number) => {
    setActiveHour(hour);
    setActiveColIndex(colIndex);
    setActiveDeparture(null);
    setDialogOpen(true);
  };

  /** Open the dialog in edit mode when clicking an existing departure chip. */
  const handleDepartureClick = (hour: number, colIndex: number, dep: string) => {
    setActiveHour(hour);
    setActiveColIndex(colIndex);
    setActiveDeparture(dep);
    setDialogOpen(true);
  };

  const handleAddDeparture = (newDep: string) => {
    if (activeHour === null || activeColIndex === null) return;
    updateCellMinutes(activeHour, activeColIndex, (prev) => {
      if (prev.includes(newDep)) return prev;
      return [...prev, newDep].sort((a, b) => parseInt(a, 10) - parseInt(b, 10) || a.localeCompare(b));
    });
  };

  const handleUpdateDeparture = (oldDep: string, newDep: string) => {
    if (activeHour === null || activeColIndex === null) return;
    updateCellMinutes(activeHour, activeColIndex, (prev) => {
      // Replace oldDep with newDep (no-op if they're the same), avoid duplicates
      const without = prev.filter(m => m !== oldDep);
      if (without.includes(newDep)) return without;
      return [...without, newDep].sort((a, b) => parseInt(a, 10) - parseInt(b, 10) || a.localeCompare(b));
    });
  };

  const handleDeleteDeparture = (dep: string) => {
    if (activeHour === null || activeColIndex === null) return;
    updateCellMinutes(activeHour, activeColIndex, (prev) => prev.filter(m => m !== dep));
  };

  // Maintain stable per-column IDs so EditableHeader components don't accidentally retain other column state
  const [headerIds, setHeaderIds] = useState<string[]>([]);
  const prevHeadersRef = useRef<string[]>([]);

  // Reconcile header IDs when headers change. Run in effect to avoid impure work during render.
  useEffect(() => {
    const prev = prevHeadersRef.current;
    const prevIds = headerIds;

    // Fast-path: nothing changed
    if (prev.length === headers.length && headers.every((h, i) => h === prev[i])) {
      prevHeadersRef.current = headers.slice();
      return;
    }

    const usedPrev = new Array(prevIds.length).fill(false);
    const newIds: string[] = [];
    const genId = () => `route-${Math.random().toString(36).slice(2,9)}`;

    for (let i = 0; i < headers.length; i++) {
      const name = headers[i];
      let found = -1;
      for (let j = 0; j < prev.length; j++) {
        if (!usedPrev[j] && prev[j] === name) {
          found = j;
          break;
        }
      }
      if (found !== -1) {
        newIds.push(prevIds[found]);
        usedPrev[found] = true;
      } else {
        newIds.push(genId());
      }
    }

    setHeaderIds(newIds);
    prevHeadersRef.current = headers.slice();
  }, [headers, headerIds]);


  const activeRouteName =
    activeColIndex !== null ? headers[activeColIndex] : '';


  return (
    <div className="w-full">
      {/* Scrollable table container */}
      <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/30 backdrop-blur-md shadow-xl print:overflow-visible print:rounded-none print:border-none print:bg-transparent print:shadow-none print:backdrop-blur-none">
        <table className="w-full border-collapse text-left print:border print:border-slate-400">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/50 print:bg-slate-100 print:border-b-2 print:border-slate-400">
              {/* Hour column */}
              <th className="w-20 px-4 py-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-400 border-r border-slate-800 print:text-slate-900 print:font-bold print:border-slate-400 print:w-16 print:py-2">
                Hour
              </th>
              {/* Route columns */}
              {headers.map((headerText, idx) => (
                <th 
                  key={headerIds[idx] || `route-${idx}`} 
                  className="min-w-[160px] px-4 py-2 border-r border-slate-800 text-center relative group print:min-w-0 print:border-slate-400 print:py-2"
                >
                  <div className="flex flex-col items-center justify-center">
                    <EditableHeader
                      value={headerText}
                      onSave={(newName) => handleUpdateHeader(idx, newName)}
                      placeholder={`Route ${idx + 1}`}
                    />
                    {headers.length > 1 && (
                      <button
                        onClick={() => handleRemoveColumn(idx)}
                        aria-label="Delete route column"
                        className="text-slate-500 hover:text-red-400 text-[10px] font-medium absolute top-2 right-2 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity p-1 rounded hover:bg-slate-800/40 focus:outline-none print:hidden"
                        title="Delete route column"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </th>
              ))}
              {/* Add column header */}
              <th className="w-16 px-4 py-2 text-center align-middle print:hidden">
                <button
                  onClick={handleAddColumn}
                  aria-label="Add route column"
                  className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600/20 hover:bg-indigo-600/35 text-indigo-400 hover:text-indigo-300 border border-indigo-500/20 transition-all cursor-pointer"
                  title="Add route column"
                >
                  <Plus size={20} />
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {/* Top row insert button (if rows exist) */}
            {rows.length > 0 && (
              <tr className="print:hidden">
                <td colSpan={headers.length + 2} className="p-0">
                  <button
                    onClick={handleAddRowTop}
                    className="w-full py-2.5 text-xs text-center text-slate-500 hover:text-indigo-400 hover:bg-indigo-950/15 border-b border-dashed border-slate-800 transition-all font-medium flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Plus size={14} /> Add Hour at Top ({rows[0].hour - 1}:00)
                  </button>
                </td>
              </tr>
            )}

            {/* Empty state rows */}
            {rows.length === 0 ? (
              <tr className="print:hidden">
                <td colSpan={headers.length + 2} className="py-16 text-center text-slate-500">
                  <p className="text-sm italic">No hours added yet</p>
                  <button
                    onClick={handleAddRowBottom}
                    className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-all"
                  >
                    Add Default Hour (6:00)
                  </button>
                </td>
              </tr>
            ) : (
              rows.map((row, rowIndex) => {
                const isFirst = rowIndex === 0;
                const isLast = rowIndex === rows.length - 1;
                const isEmpty = isRowEmpty(row);
                // Can delete if it's the first or last row AND it's empty
                const canDelete = (isFirst || isLast) && isEmpty;

                return (
                  <tr 
                    key={`${row.hour}-${rowIndex}`} 
                    className="border-b border-slate-800/60 hover:bg-slate-900/10 transition-colors print:border-b print:border-slate-300 print:hover:bg-transparent"
                  >
                    {/* Hour cell */}
                    <td className="px-4 py-3 text-center text-sm font-semibold text-slate-300 bg-slate-900/20 border-r border-slate-800 font-mono print:text-slate-900 print:font-bold print:bg-slate-50 print:border-r print:border-slate-400 print:py-2 print:px-2">
                      {row.hour}
                    </td>

                    {/* Departure list cells */}
                    {row.minutes.map((mins, colIdx) => (
                      <td
                        key={colIdx}
                        className="px-4 py-3 border-r border-slate-800 group min-h-[48px] cursor-pointer print:cursor-default print:border-r print:border-slate-300 print:py-2 print:px-3"
                        onClick={() => handleEmptyCellClick(row.hour, colIdx)}
                        title="Click to add a departure"
                      >
                        {mins.length === 0 ? (
                          <div className="text-slate-700 group-hover:text-slate-500 text-xs italic text-center font-mono py-1.5 opacity-0 group-hover:opacity-100 transition-opacity print:hidden">
                            Click to add
                          </div>
                        ) : (
                          <div className="flex flex-wrap justify-center gap-1.5 print:gap-x-2 print:gap-y-1">
                            {mins.map((min) => {
                              const { minute: numStr, trainType: tChar, destination: dChar } = parseDeparture(
                                min,
                                trainTypes,
                                destinations
                              );
                              const trainType = trainTypes.find((t) => t.char === tChar);
                              const destination = destinations.find((d) => d.char === dChar);

                              return (
                                <button
                                  key={min}
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDepartureClick(row.hour, colIdx, min);
                                  }}
                                  title="Click to edit this departure"
                                  className="inline-flex items-center gap-0.5 px-2.5 py-1 bg-slate-800 hover:bg-indigo-700/40 border border-slate-700/80 hover:border-indigo-500/60 text-slate-300 hover:text-indigo-200 rounded-md font-mono font-medium transition-all cursor-pointer print:bg-transparent print:border-none print:p-0 print:cursor-default print:shadow-none"
                                >
                                  <span
                                    className="text-2xl font-bold font-mono print:text-xl print:text-slate-900"
                                    style={{ color: trainType ? trainType.color : undefined }}
                                  >
                                    {numStr}
                                  </span>
                                  {(dChar || tChar) && (
                                    <div className="flex flex-col items-start leading-none ml-0.5">
                                      <span
                                        className="text-[10px] font-sans font-medium text-slate-300 select-none print:text-slate-900 print:text-[9px]"
                                        title={destination?.description || dChar || ''}
                                      >
                                        {dChar ?? '\u00A0'}
                                      </span>
                                      <span
                                        className="text-[10px] font-sans font-medium select-none print:text-[9px]"
                                        style={{ color: trainType ? trainType.color : undefined }}
                                        title={trainType?.description || tChar || ''}
                                      >
                                        {tChar ?? '\u00A0'}
                                      </span>
                                    </div>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </td>
                    ))}

                    {/* Trailing cell — delete button for first/last empty rows, otherwise blank */}
                    <td className="w-16 px-3 py-3 text-center align-middle bg-slate-950/10 print:hidden">
                      {canDelete && (
                        <button
                          onClick={() => handleRemoveRow(rowIndex)}
                          aria-label="Remove empty hour row"
                          className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white transition-all cursor-pointer border border-red-500/20"
                          title="Remove empty hour row"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}

            {/* Bottom row insert button (if rows exist) */}
            {rows.length > 0 && (
              <tr className="print:hidden">
                <td colSpan={headers.length + 2} className="p-0">
                  <button
                    onClick={handleAddRowBottom}
                    className="w-full py-2.5 text-xs text-center text-slate-500 hover:text-indigo-400 hover:bg-indigo-950/15 transition-all font-medium flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Plus size={14} /> Add Hour at Bottom ({rows[rows.length - 1].hour + 1}:00)
                  </button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footnotes */}
      {(trainTypes.length > 0 || destinations.length > 0) && (
        <div className="mt-4 px-2 space-y-2 print:mt-4 print:px-0 print:space-y-1.5 print:text-slate-900">
          {/* Train Types Footnote */}
          {trainTypes.length > 0 && (
            <div className="flex flex-wrap gap-4 items-center">
              {trainTypes.map((t) => (
                <div key={t.char} className="flex items-center gap-1.5 text-sm print:text-xs">
                  <span className="font-bold text-base print:text-sm" style={{ color: t.color }}>
                    {t.char}
                  </span>
                  {t.description && (
                    <span className="text-slate-400 print:text-slate-700">
                      ... {t.description}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Destinations Footnote */}
          {destinations.length > 0 && (
            <div className="flex flex-wrap gap-4 items-center">
              {destinations.map((d) => (
                <div key={d.char} className="flex items-center gap-1.5 text-sm print:text-xs">
                  <span className="font-bold text-base text-slate-200 print:text-slate-900 print:text-sm">
                    {d.char}
                  </span>
                  {d.description && (
                    <span className="text-slate-400 print:text-slate-700">
                      ... {d.description}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Guide/Help Legend */}
      <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-500 px-2 justify-center sm:justify-start print:hidden">
        <HelpCircle size={14} className="text-indigo-500/80" />
        <span>Click a departure to edit or delete it; click an empty cell area to add a new departure.</span>
      </div>

      {/* Per-departure dialog */}
      <EditMinutesDialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        hour={activeHour || 0}
        routeName={activeRouteName}
        departure={activeDeparture}
        trainTypes={trainTypes}
        destinations={destinations}
        onAdd={handleAddDeparture}
        onUpdate={handleUpdateDeparture}
        onDelete={handleDeleteDeparture}
      />
    </div>
  );
};
