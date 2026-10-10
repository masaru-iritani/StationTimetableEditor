import { useState, useEffect, useRef } from 'react';
import type { FC, KeyboardEvent } from 'react';
import { X, Trash2 } from 'lucide-react';
import type { TrainType, Destination } from '../utils/timetableState';
import { parseDeparture, formatDeparture } from '../utils/timetableState';

interface EditMinutesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  hour: number;
  routeName: string;
  /** The raw departure string being edited, or null when adding a new departure. */
  departure: string | null;
  trainTypes: TrainType[];
  destinations: Destination[];
  /** Called with the new departure string when adding or updating. */
  onAdd: (newDeparture: string) => void;
  /** Called with the original departure string to remove it (edit mode only). */
  onDelete: (departure: string) => void;
  /** Called with the old and new departure strings when updating (edit mode only). */
  onUpdate: (oldDeparture: string, newDeparture: string) => void;
}

export const EditMinutesDialog: FC<EditMinutesDialogProps> = ({
  isOpen,
  onClose,
  hour,
  routeName,
  departure,
  trainTypes,
  destinations,
  onAdd,
  onDelete,
  onUpdate,
}) => {
  const isEditMode = departure !== null;

  const [inputValue, setInputValue] = useState('');
  const [selectedTrainType, setSelectedTrainType] = useState<string>('');
  const [selectedDestination, setSelectedDestination] = useState<string>('');
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const id = setTimeout(() => {
      if (isEditMode && departure) {
        const parsed = parseDeparture(departure, trainTypes, destinations);
        setInputValue(parsed.minute);
        setSelectedTrainType(parsed.trainType);
        setSelectedDestination(parsed.destination);
      } else {
        setInputValue('');
        setSelectedTrainType('');
        setSelectedDestination('');
      }
      setError('');
      inputRef.current?.focus();
    }, 0);
    return () => clearTimeout(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, departure]);

  if (!isOpen) return null;

  const buildDeparture = (val: string): string | null => {
    const trimmed = val.trim();
    if (!trimmed) {
      setError('Please enter a minute (00 – 59).');
      return null;
    }

    const match = trimmed.match(/^(\d+)(.*)$/);
    if (!match) {
      setError('Must start with a minute number (e.g. 05 or 15).');
      return null;
    }

    const parsed = parseInt(match[1], 10);
    if (parsed < 0 || parsed > 59) {
      setError('Minute must be between 00 and 59.');
      return null;
    }

    const numStr = parsed.toString().padStart(2, '0');
    let tChar = selectedTrainType;
    let dChar = selectedDestination;

    // Allow inline suffix to override pickers when typed directly
    if (match[2]) {
      const inlineParsed = parseDeparture(trimmed, trainTypes, destinations);
      if (inlineParsed.trainType) tChar = inlineParsed.trainType;
      if (inlineParsed.destination) dChar = inlineParsed.destination;
    }

    setError('');
    return formatDeparture(numStr, tChar, dChar);
  };

  const handleAdd = () => {
    const dep = buildDeparture(inputValue);
    if (dep === null) return;
    onAdd(dep);
    onClose();
  };

  const handleUpdate = () => {
    if (!departure) return;
    const dep = buildDeparture(inputValue);
    if (dep === null) return;
    onUpdate(departure, dep);
    onClose();
  };

  const handleDelete = () => {
    if (!departure) return;
    onDelete(departure);
    onClose();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      isEditMode ? handleUpdate() : handleAdd();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 print:hidden">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Dialog container */}
      <div className="glass-panel relative w-full max-w-md overflow-hidden rounded-2xl p-6 shadow-2xl transition-all duration-300 scale-100">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-100">
              {isEditMode ? 'Edit Departure' : 'Add Departure'}
            </h3>
            <p className="text-xs text-indigo-400 mt-0.5">
              Hour {hour}:00 — {routeName || 'Unnamed Route'}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-slate-400 hover:text-slate-200 transition-colors p-1.5 rounded-lg hover:bg-slate-800/50 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Input form */}
        <div className="space-y-4 mt-6">
          {trainTypes.length > 0 && (
            <div>
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wider block mb-2">
                Train Type
              </label>
              <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Train Type">
                <button
                  type="button"
                  role="radio"
                  aria-checked={selectedTrainType === ''}
                  onClick={() => setSelectedTrainType('')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer flex items-center gap-1.5 ${
                    selectedTrainType === ''
                      ? 'bg-indigo-600/30 border-indigo-500 text-white shadow-sm shadow-indigo-500/20'
                      : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <span>None</span>
                </button>
                {trainTypes.map((t) => {
                  const isSelected = selectedTrainType === t.char;
                  return (
                    <button
                      key={t.char}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      onClick={() => setSelectedTrainType(t.char)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-indigo-600/30 border-indigo-500 text-white shadow-sm shadow-indigo-500/20'
                          : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                      }`}
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full inline-block shrink-0"
                        style={{ backgroundColor: t.color }}
                      />
                      <span className="font-bold text-sm" style={{ color: t.color }}>{t.char}</span>
                      {t.description && (
                        <span className="text-slate-400 text-xs truncate max-w-[120px]">
                          {t.description}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {destinations.length > 0 && (
            <div>
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wider block mb-2">
                Destination
              </label>
              <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Destination">
                <button
                  type="button"
                  role="radio"
                  aria-checked={selectedDestination === ''}
                  onClick={() => setSelectedDestination('')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer flex items-center gap-1.5 ${
                    selectedDestination === ''
                      ? 'bg-indigo-600/30 border-indigo-500 text-white shadow-sm shadow-indigo-500/20'
                      : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <span>None</span>
                </button>
                {destinations.map((d) => {
                  const isSelected = selectedDestination === d.char;
                  return (
                    <button
                      key={d.char}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      onClick={() => setSelectedDestination(d.char)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-indigo-600/30 border-indigo-500 text-white shadow-sm shadow-indigo-500/20'
                          : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                      }`}
                    >
                      <span className="font-bold text-sm text-slate-200">{d.char}</span>
                      {d.description && (
                        <span className="text-slate-400 text-xs truncate max-w-[120px]">
                          {d.description}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div>
            <label htmlFor="minute-input" className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Minute (00 - 59)
            </label>
            <div className="mt-2">
              <input
                ref={inputRef}
                id="minute-input"
                type="text"
                placeholder="e.g. 05 or 15"
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  setError('');
                }}
                onKeyDown={handleKeyDown}
                className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-2 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
              />
            </div>
            {error && (
              <p className="text-xs text-red-400 mt-1.5">{error}</p>
            )}
          </div>

          {/* Quick Set for touch devices */}
          <div className="pt-2">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest block mb-2">
              Quick Set
            </span>
            <div className="grid grid-cols-6 gap-1.5">
              {['00', '05', '10', '15', '20', '30', '40', '45', '50', '55'].map((quickVal) => (
                <button
                  key={quickVal}
                  type="button"
                  onClick={() => {
                    setInputValue(quickVal);
                    setError('');
                  }}
                  className="py-1 bg-slate-950/40 hover:bg-slate-800/80 active:bg-indigo-600 active:text-white text-xs font-medium border border-slate-800/60 rounded-lg text-slate-300 font-mono transition-all cursor-pointer"
                >
                  {quickVal}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="mt-8 flex gap-3 border-t border-slate-800/80 pt-4">
          {isEditMode && (
            <button
              onClick={handleDelete}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-red-400 hover:text-white hover:bg-red-500/80 rounded-xl transition-all cursor-pointer border border-red-500/30 hover:border-red-500"
            >
              <Trash2 size={15} />
              Delete
            </button>
          )}
          <div className="flex gap-3 ml-auto">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 rounded-xl transition-all cursor-pointer"
            >
              Cancel
            </button>
            {isEditMode ? (
              <button
                onClick={handleUpdate}
                className="px-5 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
              >
                Update
              </button>
            ) : (
              <button
                onClick={handleAdd}
                className="px-5 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
              >
                Add
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
