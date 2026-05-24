import { useState } from 'react';
import { Plus, Trash2, HelpCircle } from 'lucide-react';
import type { TimetableRow } from '../utils/timetableState';
import { EditableHeader } from './EditableHeader';
import { EditMinutesDialog } from './EditMinutesDialog';

interface TimetableGridProps {
  headers: string[];
  rows: TimetableRow[];
  onChange: (headers: string[], rows: TimetableRow[]) => void;
}

export const TimetableGrid: React.FC<TimetableGridProps> = ({
  headers,
  rows,
  onChange,
}) => {
  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeHour, setActiveHour] = useState<number | null>(null);
  const [activeColIndex, setActiveColIndex] = useState<number | null>(null);

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

  // Cell editing
  const handleCellClick = (hour: number, colIndex: number) => {
    setActiveHour(hour);
    setActiveColIndex(colIndex);
    setDialogOpen(true);
  };

  const handleSaveCellMinutes = (newMinutes: string[]) => {
    if (activeHour === null || activeColIndex === null) return;
    
    const newRows = rows.map(row => {
      if (row.hour === activeHour) {
        const updatedMinutes = [...row.minutes];
        updatedMinutes[activeColIndex] = newMinutes;
        return { ...row, minutes: updatedMinutes };
      }
      return row;
    });
    
    onChange(headers, newRows);
  };

  const activeMinutes = 
    activeHour !== null && activeColIndex !== null
      ? rows.find(r => r.hour === activeHour)?.minutes[activeColIndex] || []
      : [];

  const activeRouteName = 
    activeColIndex !== null ? headers[activeColIndex] : '';

  return (
    <div className="w-full">
      {/* Scrollable table container */}
      <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/30 backdrop-blur-md shadow-xl">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/50">
              {/* Row actions spacer */}
              <th className="w-16 px-4 py-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                Actions
              </th>
              {/* Hour column */}
              <th className="w-20 px-4 py-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-400 border-r border-slate-800">
                Hour
              </th>
              {/* Route columns */}
              {headers.map((headerText, idx) => (
                <th 
                  key={idx} 
                  className="min-w-[160px] px-4 py-2 border-r border-slate-800 text-center relative group"
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
                        className="text-slate-500 hover:text-red-400 text-[10px] font-medium absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-slate-800/40"
                        title="Delete route column"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </th>
              ))}
              {/* Add column header */}
              <th className="w-16 px-4 py-2 text-center align-middle">
                <button
                  onClick={handleAddColumn}
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
              <tr>
                <td colSpan={headers.length + 3} className="p-0">
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
              <tr>
                <td colSpan={headers.length + 3} className="py-16 text-center text-slate-500">
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
                // Can delete if it's the first or last row AND it's empty (preserves vanilla behavior)
                const canDelete = (isFirst || isLast) && isEmpty;

                return (
                  <tr 
                    key={row.hour} 
                    className="border-b border-slate-800/60 hover:bg-slate-900/10 transition-colors"
                  >
                    {/* Row delete action */}
                    <td className="px-4 py-3 text-center align-middle">
                      {canDelete ? (
                        <button
                          onClick={() => handleRemoveRow(rowIndex)}
                          className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white transition-all cursor-pointer border border-red-500/20"
                          title="Remove empty hour row"
                        >
                          <Trash2 size={15} />
                        </button>
                      ) : (
                        <span className="text-slate-700 text-xs">—</span>
                      )}
                    </td>

                    {/* Hour cell */}
                    <td className="px-4 py-3 text-center text-sm font-semibold text-slate-300 bg-slate-900/20 border-r border-slate-800 font-mono">
                      {row.hour}
                    </td>

                    {/* Departure list cells */}
                    {row.minutes.map((mins, colIdx) => (
                      <td
                        key={colIdx}
                        onClick={() => handleCellClick(row.hour, colIdx)}
                        className="px-4 py-3 border-r border-slate-800 cursor-pointer hover:bg-slate-800/20 transition-all group min-h-[48px]"
                      >
                        {mins.length === 0 ? (
                          <div className="text-slate-700 group-hover:text-slate-500 text-xs italic text-center font-mono py-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            tap to add
                          </div>
                        ) : (
                          <div className="flex flex-wrap justify-center gap-1.5">
                            {mins.map((min) => (
                              <span
                                key={min}
                                className="inline-block px-2.5 py-0.5 bg-slate-800 group-hover:bg-slate-700 border border-slate-700/80 group-hover:border-indigo-500/30 text-slate-300 group-hover:text-indigo-200 rounded-md text-xs font-mono font-medium transition-all"
                              >
                                {min}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                    ))}

                    {/* Empty cell at the end (corresponding to add column header) */}
                    <td className="px-4 py-3 bg-slate-950/10" />
                  </tr>
                );
              })
            )}

            {/* Bottom row insert button (if rows exist) */}
            {rows.length > 0 && (
              <tr>
                <td colSpan={headers.length + 3} className="p-0">
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

      {/* Guide/Help Legend */}
      <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-500 px-2 justify-center sm:justify-start">
        <HelpCircle size={14} className="text-indigo-500/80" />
        <span>Single-tap route names to rename them; tap cells to add or schedule departure minutes.</span>
      </div>

      {/* Minutes edit dialog */}
      <EditMinutesDialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        hour={activeHour || 0}
        routeName={activeRouteName}
        minutes={activeMinutes}
        onSave={handleSaveCellMinutes}
      />
    </div>
  );
};
